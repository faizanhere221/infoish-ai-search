-- Drift fix — closes the gaps found by `npm run check:schema` (see
-- docs/MIGRATIONS.md's "Known drift" section). Idempotent, safe to re-run.
--
-- Each item below was checked against how the application code actually
-- uses it before deciding what to add — see the comment on each step for
-- which pages/routes were broken and how.

-- ============================================================================
-- STEP 1 — reviews: the 9 columns schema.sql declares but live never got,
-- plus 2 more the code needs that schema.sql never declared at all.
--
-- Live `reviews` has 0 rows (checked first, per instructions) — the
-- columns below are written with safe defaults regardless, in case this
-- ever runs against a database that does have rows.
--
-- BROKEN: POST /api/reviews (src/app/api/reviews/route.ts) inserts
-- `communication_rating`, `quality_rating`, `was_on_time`,
-- `would_work_again`, `is_public` — none of which exist live, so every
-- submission has been failing with "column does not exist" (42703). This
-- is the brand's "leave a review" flow at
-- /dashboard/deals/[id]/review, reached after marking a deal completed.
-- GET /api/reviews (the creator's public review list) filters
-- `.eq('is_public', true)` — same failure, so a creator's reviews tab has
-- never been able to load any review even if one existed.
--
-- was_on_time/would_work_again are NOT in schema.sql — found only by
-- reading the route's own Zod schema and insert. Added here because the
-- goal is a working reviews feature, not just a schema.sql-literal match.
-- ============================================================================

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS communication_rating INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS quality_rating INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS timeliness_rating INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- Backfill rather than leave NULL or default to NOW() retroactively — an
-- existing row's "last updated" should read as its creation time, not the
-- moment this migration happened to run.
UPDATE reviews SET updated_at = created_at WHERE updated_at IS NULL;

-- Not in schema.sql — required by CreateReviewSchema / the insert in
-- src/app/api/reviews/route.ts.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS was_on_time BOOLEAN;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS would_work_again BOOLEAN;

-- ============================================================================
-- STEP 2 — creator_services.includes (schema.sql: TEXT[], "Array of
-- included items").
--
-- NOT BROKEN: no route or component in the app references `includes` on a
-- service today (checked — zero matches). Adding it only for schema.sql
-- conformance; nothing currently depends on it existing.
-- ============================================================================

ALTER TABLE creator_services ADD COLUMN IF NOT EXISTS includes TEXT[];

-- ============================================================================
-- STEP 3 — admin_migration.sql, activity_migration.sql,
-- settings_migration.sql, in that documented order (each file's own header
-- says so for the first two; settings says "after activity"). Included in
-- full rather than cherry-picked, per instructions.
--
-- admin_migration.sql's Steps 1-4 (users.role, its CHECK constraint, the
-- index, backfilling admin user_types) are already live and already
-- idempotent — re-running them here is a safe no-op. Only Step 5
-- (creators.is_featured) was actually missing.
--
-- activity_logs and platform_settings themselves were NEVER CREATED —
-- not an idempotency problem, a correctness one: both files declare a UUID
-- column with `REFERENCES users(id)`, but users.id is VARCHAR(255) (the
-- convention every other table in this app already follows). Postgres
-- refuses to create a foreign key between incompatible types, so the
-- CREATE TABLE statement itself has been failing outright since whoever
-- first tried to run these. Retyped user_id/entity_id/updated_by/id to
-- VARCHAR(255) below — the one deviation from "exact SQL," because the
-- exact SQL cannot execute as written.
-- ============================================================================

-- --- admin_migration.sql, verbatim (already correct) -----------------------

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS check_user_role;

ALTER TABLE users
  ADD CONSTRAINT check_user_role
  CHECK (role IN ('user', 'admin', 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

UPDATE users SET role = 'admin' WHERE user_type = 'admin' AND role = 'user';

-- BROKEN: PATCH /api/admin/creators/[id] (when the body includes
-- is_featured) and POST /api/admin/creators/[id]/feature both fail —
-- the UPDATE itself errors on a nonexistent column, before either route's
-- trailing .select() even runs. Not a crash on every admin creators page
-- load, though: GET /api/admin/creators and GET /api/admin/creators/[id]
-- both use select('*'), so is_featured is just silently absent from the
-- response (no error) — every creator has looked "not featured" on
-- /admin/creators and on the public /creators marketplace
-- (CreatorCard.tsx's Featured badge) regardless of what an admin tried to
-- set, since it was never actually possible to set it.
ALTER TABLE creators ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_creators_featured ON creators(is_featured) WHERE is_featured = TRUE;

-- --- activity_migration.sql, id/user_id/entity_id retyped to VARCHAR(255) -

CREATE TABLE IF NOT EXISTS activity_logs (
  id            VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  user_id       VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50),
  entity_id     VARCHAR(255),
  details       JSONB DEFAULT '{}',
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action     ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity     ON activity_logs(entity_type, entity_id);

-- BROKEN: GET /api/admin/activity/export (the CSV export button on
-- /admin/activity) selects directly from activity_logs — 500 on every
-- click. GET /api/admin/analytics includes an activity_logs query in a
-- Promise.all; Supabase doesn't throw on a query error, so this degrades
-- rather than crashing the endpoint — whatever chart/stat reads that
-- result has just been empty. The main /admin/activity feed itself does
-- NOT use this table (it aggregates from users/deals/messages directly),
-- so it loads fine today; it just can't show the discrete admin actions
-- (admin login, feature/verify toggles, suspensions, etc.) that
-- logActivity() has been silently failing to record from 10 call sites
-- across login, register, and every admin action route — silently because
-- logActivity() wraps its insert in try/catch specifically so a logging
-- failure never breaks the action it's logging.

-- --- settings_migration.sql, updated_by retyped to VARCHAR(255) -----------

CREATE TABLE IF NOT EXISTS platform_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO platform_settings (key, value) VALUES
  ('site_name',           '"Infoishai"'),
  ('site_description',    '"Influencer Marketing Platform"'),
  ('default_page_size',   '20'),
  ('enable_messaging',    'true'),
  ('enable_reviews',      'true'),
  ('enable_deals',        'true'),
  ('maintenance_mode',    'false'),
  ('session_timeout_min', '240'),
  ('max_login_attempts',  '5'),
  ('ip_whitelist',        '[]'),
  ('ip_blacklist',        '[]')
ON CONFLICT (key) DO NOTHING;

-- NOT CRASHING, but non-functional: GET /api/admin/settings already
-- catches the missing-table error (code 42P01) and falls back to hardcoded
-- defaults, and PATCH already catches it and returns a clean 503 "Run
-- settings migration first" — so /admin/settings has always loaded, but
-- every save attempt has failed with that 503. No admin has ever been able
-- to persist a settings change (toggle maintenance_mode, change
-- site_name, etc.) — this migration is what actually fixes that.

-- ============================================================================
-- STEP 4 — creators.search_vector: schema.sql defines this as a plain
-- tsvector column kept in sync by a BEFORE INSERT OR UPDATE trigger
-- (weighted: display_name + username at 'A', bio + niches at 'B'), with a
-- GIN index for full-text search.
--
-- NOT BROKEN, because NOTHING uses it: checked every route and component
-- for search_vector, textSearch, to_tsquery, @@ — zero matches. The actual
-- creator search (src/app/api/creators/route.ts) filters with plain
-- `ilike` on display_name/username/bio directly, bypassing this
-- infrastructure entirely. Recreating it for schema.sql conformance and in
-- case full-text search is wired up later, not because anything today
-- needs it.
--
-- Backfill matters here even though nothing reads it yet: the trigger only
-- populates search_vector on INSERT OR UPDATE, so without this, every
-- creator row that existed before the trigger was (re)created would stay
-- permanently NULL and silently invisible to a future search query.
-- ============================================================================

ALTER TABLE creators ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION creators_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.niches, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS creators_search_update ON creators;
CREATE TRIGGER creators_search_update
  BEFORE INSERT OR UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION creators_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_creators_search ON creators USING GIN(search_vector);

-- Backfill every row the trigger hasn't touched yet. Safe to re-run: once
-- computed, search_vector is never NULL again, so this naturally becomes a
-- no-op.
UPDATE creators SET search_vector =
  setweight(to_tsvector('english', COALESCE(display_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(bio, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(niches, ' '), '')), 'B')
WHERE search_vector IS NULL;
