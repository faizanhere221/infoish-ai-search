-- Creator marketplace visibility — fixes a production bug where
-- soft-deleted and suspended creators kept showing up on every public
-- surface (marketplace listing/search, profile pages, sitemap, roster,
-- campaign discovery) with their real location/niche/platforms still
-- attached, and made their anonymization on delete incomplete. Idempotent,
-- safe to re-run.
--
-- Two independent things:
--   STEP 1 — a new creators.hidden_from_marketplace column (admin-only
--     toggle, for internal test accounts — never set by anything else).
--   STEP 2 — a one-time data cleanup applying the now-expanded delete
--     anonymization (see DELETE /api/admin/users/[id]) to every account
--     that was already soft-deleted before this fix shipped. This only
--     touches rows where users.deleted_at IS NOT NULL — never a live
--     account.
--
-- Does NOT touch payout_methods (already deleted by the original DELETE
-- handler for every past deletion, nothing to clean up there) or avatar
-- files in Storage (not reachable from SQL — cleaned up separately via
-- the Supabase Storage API for the same already-deleted accounts this
-- migration's STEP 2 covers).

-- ============================================================================
-- STEP 1 — creators.hidden_from_marketplace
-- ============================================================================

ALTER TABLE creators ADD COLUMN IF NOT EXISTS hidden_from_marketplace BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index: only ever queried as `= TRUE` (to exclude) or as part of
-- the public-surface `= FALSE` filter already narrowed by other
-- conditions first — a full index on an almost-always-false boolean buys
-- nothing there, so only the rare TRUE rows are indexed.
CREATE INDEX IF NOT EXISTS idx_creators_hidden_from_marketplace
  ON creators(hidden_from_marketplace) WHERE hidden_from_marketplace = TRUE;

-- ============================================================================
-- STEP 2 — retroactive cleanup for accounts already soft-deleted before
-- this fix. Scoped strictly to creators whose owning user has
-- deleted_at IS NOT NULL; never touches an active or merely-suspended
-- account.
-- ============================================================================

-- Clear location/niche/language fields the original DELETE handler never
-- touched (it only cleared display_name/username/profile_photo_url/bio).
UPDATE creators c
SET country = NULL, city = NULL, niches = '{}', languages = '{}'
WHERE c.user_id IN (SELECT id FROM users WHERE deleted_at IS NOT NULL);

-- Platform handles/URLs, portfolio items, and services/rates are not
-- financial or contract records — remove them entirely, same as the
-- (now-expanded) DELETE handler does for every deletion going forward.
DELETE FROM creator_platforms
WHERE creator_id IN (
  SELECT c.id FROM creators c
  JOIN users u ON u.id = c.user_id
  WHERE u.deleted_at IS NOT NULL
);

DELETE FROM creator_portfolio
WHERE creator_id IN (
  SELECT c.id FROM creators c
  JOIN users u ON u.id = c.user_id
  WHERE u.deleted_at IS NOT NULL
);

DELETE FROM creator_services
WHERE creator_id IN (
  SELECT c.id FROM creators c
  JOIN users u ON u.id = c.user_id
  WHERE u.deleted_at IS NOT NULL
);

-- payout_methods: belt-and-suspenders only — the original DELETE handler
-- already deleted these for every past deletion, so this should affect
-- zero rows. Kept here so this migration is a complete, standalone
-- cleanup if it's ever re-run against a differently-seeded database.
DELETE FROM payout_methods
WHERE creator_id IN (
  SELECT c.id FROM creators c
  JOIN users u ON u.id = c.user_id
  WHERE u.deleted_at IS NOT NULL
);
