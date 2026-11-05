-- ============================================================================
-- Outreach: manual creator + brand outreach tracking (/admin/outreach)
-- ============================================================================
-- Tracks outreach done by hand from team mailboxes and DM accounts. The app
-- never sends anything. These tables are deliberately separate from
-- users/creators/brands: leads never appear on marketplace or public pages,
-- the sitemap, or any email.
--
-- Idempotent: safe to run more than once. Run in the Supabase SQL Editor.
--
-- What it adds:
--   1. users.role 'outreach' + users.must_change_password
--   2. Normalisation functions (mirrored in src/lib/outreach/rules.ts)
--   3. outreach_mailboxes, outreach_team, outreach_creators, outreach_brands,
--      outreach_keys, outreach_dnc, outreach_activity
--   4. Triggers: keep normalised columns, block DNC inserts, keep
--      outreach_keys in sync (email is unique across BOTH lead tables)
--   5. Functions: outreach_log_action, outreach_undo_action, outreach_import,
--      outreach_mark_no_reply, outreach_erase_lead, stats helpers
--   6. RLS on every table, service_role grants only
-- ============================================================================

-- ── 1. Role + forced password change ──────────────────────────────────────────
-- The live table carries two copies of the same role CHECK (check_role and
-- check_user_role). Replace both with one that allows 'outreach'.
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users ADD CONSTRAINT check_user_role
  CHECK (role IN ('user', 'admin', 'super_admin', 'outreach'));

-- Set for team accounts created with a temporary password. The admin login
-- puts it in the JWT and middleware allows nothing but the change-password
-- page/route until it is cleared.
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Normalisation ──────────────────────────────────────────────────────────
-- Keep these byte-for-byte equivalent to normalizeEmail/normalizeUrl/
-- normalizeDomain in src/lib/outreach/rules.ts (scripts/outreach-check.mjs
-- tests the TS side; the import preview relies on both agreeing).

CREATE OR REPLACE FUNCTION outreach_norm_email(v TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(
    regexp_replace(lower(regexp_replace(coalesce(v, ''), '^\s+|\s+$', '', 'g')), '^mailto:', ''),
    '')
$$;

-- lowercase, trim, no protocol, no www., no query/fragment, no trailing slash
CREATE OR REPLACE FUNCTION outreach_norm_url(v TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            lower(regexp_replace(coalesce(v, ''), '^\s+|\s+$', '', 'g')),
            '^[a-z][a-z0-9+.-]*://', ''),
          '^www\.', ''),
        '[?#].*$', ''),
      '/+$', ''),
    '')
$$;

-- host part of the normalised URL, port removed
CREATE OR REPLACE FUNCTION outreach_norm_domain(v TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(regexp_replace(split_part(coalesce(outreach_norm_url(v), ''), '/', 1), ':[0-9]+$', ''), '')
$$;

-- C-0001 … C-9999, then C-10000 (lpad alone would truncate past 9999)
CREATE OR REPLACE FUNCTION outreach_format_lead_id(p_prefix TEXT, p_n BIGINT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT p_prefix || '-' || CASE WHEN p_n < 10000 THEN lpad(p_n::text, 4, '0') ELSE p_n::text END
$$;

-- Daily send limit. Mirrored by mailboxDailyLimit() in rules.ts.
-- Personal mailboxes: admin-set limit (default 30), no warm-up.
-- Team mailboxes: custom limit if set, otherwise the warm-up schedule.
CREATE OR REPLACE FUNCTION outreach_mailbox_limit(
  p_start DATE, p_personal BOOLEAN, p_custom INTEGER, p_today DATE
) RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_custom IS NOT NULL THEN LEAST(p_custom, 40)
    WHEN p_personal THEN 30
    WHEN p_today - p_start < 7  THEN 10
    WHEN p_today - p_start < 14 THEN 15
    WHEN p_today - p_start < 21 THEN 25
    ELSE 30
  END
$$;

-- ── 3. Tables ─────────────────────────────────────────────────────────────────
-- users.id is VARCHAR(255) on the live database, so every user FK is too.

CREATE TABLE IF NOT EXISTS outreach_mailboxes (
  id            VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  address       VARCHAR(255) NOT NULL,
  owner_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  start_date    DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Karachi')::date),
  is_personal   BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  custom_limit  INTEGER CHECK (custom_limit IS NULL OR custom_limit BETWEEN 1 AND 40),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS outreach_mailboxes_address_key ON outreach_mailboxes (lower(address));

-- One row per person who does outreach (outreach role or an admin).
CREATE TABLE IF NOT EXISTS outreach_team (
  user_id                 VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name            VARCHAR(255) NOT NULL,
  works_saturday          BOOLEAN NOT NULL DEFAULT false,
  creators_monthly_target INTEGER NOT NULL DEFAULT 0 CHECK (creators_monthly_target >= 0),
  brands_monthly_target   INTEGER NOT NULL DEFAULT 0 CHECK (brands_monthly_target >= 0),
  dm_daily_warning        INTEGER NOT NULL DEFAULT 25 CHECK (dm_daily_warning BETWEEN 1 AND 500),
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS outreach_creator_lead_seq;
CREATE SEQUENCE IF NOT EXISTS outreach_brand_lead_seq;

CREATE TABLE IF NOT EXISTS outreach_creators (
  lead_id           VARCHAR(255) PRIMARY KEY DEFAULT outreach_format_lead_id('C', nextval('outreach_creator_lead_seq')),
  name              VARCHAR(255),
  platform          VARCHAR(50),
  profile_url       TEXT,
  country           VARCHAR(100),
  niche             VARCHAR(100),
  subscribers       BIGINT,
  avg_views         BIGINT,
  engagement_pct    NUMERIC(7, 2),
  does_sponsorships BOOLEAN,
  sponsor_brands    TEXT,
  email             VARCHAR(255),
  instagram         TEXT,
  x                 TEXT,
  linkedin          TEXT,
  tiktok            TEXT,
  website           TEXT,
  owner_user_id     VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  mailbox_id        VARCHAR(255) REFERENCES outreach_mailboxes(id) ON DELETE SET NULL,
  channel           VARCHAR(20) CHECK (channel IN ('email', 'linkedin', 'x', 'instagram', 'tiktok')),
  status            VARCHAR(30) NOT NULL DEFAULT 'found' CHECK (status IN (
                      'found', 'contacted', 'followed_up', 'replied', 'signed_up',
                      'not_interested', 'no_reply', 'bounced', 'opted_out')),
  date_contacted    DATE,
  follow_up_date    DATE,
  followed_up_date  DATE,
  replied_at        TIMESTAMPTZ,
  notes             TEXT,
  source            VARCHAR(255),
  email_norm        TEXT,
  profile_url_norm  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER SEQUENCE outreach_creator_lead_seq OWNED BY outreach_creators.lead_id;

CREATE TABLE IF NOT EXISTS outreach_brands (
  lead_id          VARCHAR(255) PRIMARY KEY DEFAULT outreach_format_lead_id('B', nextval('outreach_brand_lead_seq')),
  company          VARCHAR(255),
  website          TEXT,
  domain           VARCHAR(255),
  country          VARCHAR(100),
  product          TEXT,
  team_size        VARCHAR(50),
  why_them         TEXT,
  score            NUMERIC(7, 2),
  contact_name     VARCHAR(255),
  role             VARCHAR(255),
  email            VARCHAR(255),
  linkedin         TEXT,
  owner_user_id    VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  mailbox_id       VARCHAR(255) REFERENCES outreach_mailboxes(id) ON DELETE SET NULL,
  channel          VARCHAR(20) CHECK (channel IN ('email', 'linkedin', 'x', 'instagram', 'tiktok')),
  status           VARCHAR(30) NOT NULL DEFAULT 'found' CHECK (status IN (
                     'found', 'contacted', 'followed_up', 'replied', 'call_booked', 'won',
                     'not_interested', 'no_reply', 'bounced', 'opted_out')),
  date_contacted   DATE,
  follow_up_date   DATE,
  followed_up_date DATE,
  replied_at       TIMESTAMPTZ,
  notes            TEXT,
  source           VARCHAR(255),
  email_norm       TEXT,
  domain_norm      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER SEQUENCE outreach_brand_lead_seq OWNED BY outreach_brands.lead_id;

-- Per-table uniqueness on the normalised columns.
CREATE UNIQUE INDEX IF NOT EXISTS outreach_creators_email_norm_key ON outreach_creators (email_norm) WHERE email_norm IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS outreach_creators_profile_url_norm_key ON outreach_creators (profile_url_norm) WHERE profile_url_norm IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS outreach_brands_email_norm_key ON outreach_brands (email_norm) WHERE email_norm IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS outreach_brands_domain_norm_key ON outreach_brands (domain_norm) WHERE domain_norm IS NOT NULL;

CREATE INDEX IF NOT EXISTS outreach_creators_owner_status_idx ON outreach_creators (owner_user_id, status);
CREATE INDEX IF NOT EXISTS outreach_creators_status_idx ON outreach_creators (status);
CREATE INDEX IF NOT EXISTS outreach_creators_follow_up_idx ON outreach_creators (follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_creators_created_idx ON outreach_creators (created_at);
CREATE INDEX IF NOT EXISTS outreach_brands_owner_status_idx ON outreach_brands (owner_user_id, status);
CREATE INDEX IF NOT EXISTS outreach_brands_status_idx ON outreach_brands (status);
CREATE INDEX IF NOT EXISTS outreach_brands_follow_up_idx ON outreach_brands (follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_brands_created_idx ON outreach_brands (created_at);

-- Every normalised email / profile URL / domain in use, across BOTH lead
-- tables. The primary key is what makes an email unique across creators
-- and brands (a unique index can't span two tables). Kept by triggers only.
CREATE TABLE IF NOT EXISTS outreach_keys (
  key_type  VARCHAR(20) NOT NULL CHECK (key_type IN ('email', 'profile_url', 'domain')),
  key_value TEXT NOT NULL,
  lead_type VARCHAR(10) NOT NULL CHECK (lead_type IN ('creator', 'brand')),
  lead_id   VARCHAR(255) NOT NULL,
  PRIMARY KEY (key_type, key_value)
);
CREATE INDEX IF NOT EXISTS outreach_keys_lead_idx ON outreach_keys (lead_type, lead_id);

CREATE TABLE IF NOT EXISTS outreach_activity (
  id         VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_type  VARCHAR(10) NOT NULL CHECK (lead_type IN ('creator', 'brand')),
  lead_id    VARCHAR(255) NOT NULL,
  user_id    VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL, -- NULL = daily cron
  action     VARCHAR(30) NOT NULL CHECK (action IN (
               'contacted', 'followed_up', 'replied', 'signed_up', 'call_booked', 'won',
               'not_interested', 'bounced', 'opted_out', 'no_reply',
               'status_changed', 'owner_changed', 'erased')),
  mailbox_id VARCHAR(255) REFERENCES outreach_mailboxes(id) ON DELETE SET NULL,
  channel    VARCHAR(20),
  prev_state JSONB,          -- lead fields before this action, for undo
  undone_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_activity_lead_idx ON outreach_activity (lead_type, lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS outreach_activity_mailbox_idx ON outreach_activity (mailbox_id, created_at);
CREATE INDEX IF NOT EXISTS outreach_activity_user_idx ON outreach_activity (user_id, created_at);
CREATE INDEX IF NOT EXISTS outreach_activity_created_idx ON outreach_activity (created_at);

-- Do-not-contact list. key_value is always normalised. A 'domain' entry also
-- blocks every email address at that domain.
CREATE TABLE IF NOT EXISTS outreach_dnc (
  id          VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key_type    VARCHAR(20) NOT NULL CHECK (key_type IN ('email', 'profile_url', 'domain')),
  key_value   TEXT NOT NULL,
  reason      VARCHAR(30) NOT NULL CHECK (reason IN ('opted_out', 'bounced', 'removal_request', 'competitor', 'other')),
  note        TEXT,
  lead_id     VARCHAR(255),
  activity_id VARCHAR(255), -- set when an action added it, so undo can remove it
  created_by  VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key_type, key_value)
);
CREATE INDEX IF NOT EXISTS outreach_dnc_activity_idx ON outreach_dnc (activity_id) WHERE activity_id IS NOT NULL;

-- ── 4. Triggers ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION outreach_creators_before_write() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_email_changed BOOLEAN;
  v_url_changed   BOOLEAN;
  v_hit           RECORD;
BEGIN
  NEW.email_norm := outreach_norm_email(NEW.email);
  NEW.profile_url_norm := outreach_norm_url(NEW.profile_url);
  NEW.updated_at := now();

  -- Only keys that are new or changed are checked against the DNC list, so
  -- an opted-out lead can still have its status or notes edited.
  v_email_changed := TG_OP = 'INSERT' OR NEW.email_norm IS DISTINCT FROM OLD.email_norm;
  v_url_changed := TG_OP = 'INSERT' OR NEW.profile_url_norm IS DISTINCT FROM OLD.profile_url_norm;

  SELECT d.key_type, d.key_value INTO v_hit
  FROM outreach_dnc d
  WHERE (v_email_changed AND d.key_type = 'email' AND d.key_value = NEW.email_norm)
     OR (v_email_changed AND d.key_type = 'domain' AND d.key_value = split_part(NEW.email_norm, '@', 2))
     OR (v_url_changed AND d.key_type = 'profile_url' AND d.key_value = NEW.profile_url_norm)
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'outreach_dnc' USING DETAIL = v_hit.key_type || ':' || v_hit.key_value;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION outreach_brands_before_write() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_email_changed  BOOLEAN;
  v_domain_changed BOOLEAN;
  v_hit            RECORD;
BEGIN
  NEW.email_norm := outreach_norm_email(NEW.email);
  NEW.domain_norm := outreach_norm_domain(coalesce(NULLIF(btrim(NEW.domain), ''), NEW.website));
  NEW.updated_at := now();

  v_email_changed := TG_OP = 'INSERT' OR NEW.email_norm IS DISTINCT FROM OLD.email_norm;
  v_domain_changed := TG_OP = 'INSERT' OR NEW.domain_norm IS DISTINCT FROM OLD.domain_norm;

  SELECT d.key_type, d.key_value INTO v_hit
  FROM outreach_dnc d
  WHERE (v_email_changed AND d.key_type = 'email' AND d.key_value = NEW.email_norm)
     OR (v_email_changed AND d.key_type = 'domain' AND d.key_value = split_part(NEW.email_norm, '@', 2))
     OR (v_domain_changed AND d.key_type = 'domain' AND d.key_value = NEW.domain_norm)
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'outreach_dnc' USING DETAIL = v_hit.key_type || ':' || v_hit.key_value;
  END IF;

  RETURN NEW;
END;
$$;

-- Claims one key for a lead in outreach_keys. ON CONFLICT DO NOTHING then a
-- re-read (instead of a bare INSERT) so a clash raises a readable error with
-- the existing lead id. Still race-safe: a concurrent insert of the same key
-- waits on the first, then sees it committed and raises.
CREATE OR REPLACE FUNCTION outreach_claim_key(
  p_key_type TEXT, p_key_value TEXT, p_lead_type TEXT, p_lead_id TEXT
) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_owner RECORD;
BEGIN
  IF p_key_value IS NULL THEN RETURN; END IF;
  INSERT INTO outreach_keys (key_type, key_value, lead_type, lead_id)
  VALUES (p_key_type, p_key_value, p_lead_type, p_lead_id)
  ON CONFLICT (key_type, key_value) DO NOTHING;

  SELECT lead_type, lead_id INTO v_owner
  FROM outreach_keys WHERE key_type = p_key_type AND key_value = p_key_value;
  IF v_owner.lead_id <> p_lead_id OR v_owner.lead_type <> p_lead_type THEN
    RAISE EXCEPTION 'outreach_duplicate'
      USING ERRCODE = '23505', DETAIL = v_owner.lead_id || ':' || p_key_type;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION outreach_creators_sync_keys() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM outreach_keys WHERE lead_type = 'creator' AND lead_id = OLD.lead_id;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM outreach_keys
    WHERE lead_type = 'creator' AND lead_id = NEW.lead_id
      AND ((key_type = 'email' AND key_value IS DISTINCT FROM NEW.email_norm)
        OR (key_type = 'profile_url' AND key_value IS DISTINCT FROM NEW.profile_url_norm));
  END IF;
  PERFORM outreach_claim_key('email', NEW.email_norm, 'creator', NEW.lead_id);
  PERFORM outreach_claim_key('profile_url', NEW.profile_url_norm, 'creator', NEW.lead_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION outreach_brands_sync_keys() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM outreach_keys WHERE lead_type = 'brand' AND lead_id = OLD.lead_id;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM outreach_keys
    WHERE lead_type = 'brand' AND lead_id = NEW.lead_id
      AND ((key_type = 'email' AND key_value IS DISTINCT FROM NEW.email_norm)
        OR (key_type = 'domain' AND key_value IS DISTINCT FROM NEW.domain_norm));
  END IF;
  PERFORM outreach_claim_key('email', NEW.email_norm, 'brand', NEW.lead_id);
  PERFORM outreach_claim_key('domain', NEW.domain_norm, 'brand', NEW.lead_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS outreach_creators_before_write ON outreach_creators;
CREATE TRIGGER outreach_creators_before_write
  BEFORE INSERT OR UPDATE ON outreach_creators
  FOR EACH ROW EXECUTE FUNCTION outreach_creators_before_write();

DROP TRIGGER IF EXISTS outreach_creators_sync_keys ON outreach_creators;
CREATE TRIGGER outreach_creators_sync_keys
  AFTER INSERT OR UPDATE OR DELETE ON outreach_creators
  FOR EACH ROW EXECUTE FUNCTION outreach_creators_sync_keys();

DROP TRIGGER IF EXISTS outreach_brands_before_write ON outreach_brands;
CREATE TRIGGER outreach_brands_before_write
  BEFORE INSERT OR UPDATE ON outreach_brands
  FOR EACH ROW EXECUTE FUNCTION outreach_brands_before_write();

DROP TRIGGER IF EXISTS outreach_brands_sync_keys ON outreach_brands;
CREATE TRIGGER outreach_brands_sync_keys
  AFTER INSERT OR UPDATE OR DELETE ON outreach_brands
  FOR EACH ROW EXECUTE FUNCTION outreach_brands_sync_keys();

-- ── 5. Functions ──────────────────────────────────────────────────────────────

-- One-click action: checks the mailbox limit, updates the lead and writes the
-- activity row in one transaction. The mailbox row is locked FOR UPDATE, so
-- two people sending from the same mailbox at once can't pass the limit
-- (same pattern as accept_campaign_offer / split_payment).
-- Errors are raised as short codes the API maps to messages:
--   outreach_bad_action, outreach_not_found, outreach_dnc, outreach_not_contacted,
--   outreach_mailbox_required, outreach_mailbox_inactive, outreach_mailbox_full
CREATE OR REPLACE FUNCTION outreach_log_action(
  p_lead_type  VARCHAR,
  p_lead_id    VARCHAR,
  p_user_id    VARCHAR,
  p_action     VARCHAR,
  p_mailbox_id VARCHAR DEFAULT NULL,
  p_channel    VARCHAR DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_today     DATE := (now() AT TIME ZONE 'Asia/Karachi')::date;
  v_day_start TIMESTAMPTZ := (v_today::timestamp AT TIME ZONE 'Asia/Karachi');
  v_table     TEXT;
  v_is_send   BOOLEAN := p_action IN ('contacted', 'followed_up');
  v_lead      RECORD;
  v_mb        RECORD;
  v_channel   VARCHAR;
  v_mailbox   VARCHAR;
  v_count     INTEGER;
  v_limit     INTEGER;
  v_prev      JSONB;
  v_activity  VARCHAR;
  n_date_contacted   DATE;
  n_follow_up_date   DATE;
  n_followed_up_date DATE;
  n_replied_at       TIMESTAMPTZ;
BEGIN
  IF p_lead_type = 'creator' THEN
    IF p_action NOT IN ('contacted', 'followed_up', 'replied', 'signed_up',
                        'not_interested', 'bounced', 'opted_out') THEN
      RAISE EXCEPTION 'outreach_bad_action';
    END IF;
    v_table := 'outreach_creators';
    SELECT lead_id, status, date_contacted, follow_up_date, followed_up_date, replied_at,
           mailbox_id, channel, email_norm, profile_url_norm, NULL::text AS domain_norm
      INTO v_lead FROM outreach_creators WHERE lead_id = p_lead_id FOR UPDATE;
  ELSIF p_lead_type = 'brand' THEN
    IF p_action NOT IN ('contacted', 'followed_up', 'replied', 'call_booked', 'won',
                        'not_interested', 'bounced', 'opted_out') THEN
      RAISE EXCEPTION 'outreach_bad_action';
    END IF;
    v_table := 'outreach_brands';
    SELECT lead_id, status, date_contacted, follow_up_date, followed_up_date, replied_at,
           mailbox_id, channel, email_norm, NULL::text AS profile_url_norm, domain_norm
      INTO v_lead FROM outreach_brands WHERE lead_id = p_lead_id FOR UPDATE;
  ELSE
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'outreach_not_found'; END IF;

  v_channel := coalesce(p_channel, v_lead.channel, 'email');
  IF v_channel NOT IN ('email', 'linkedin', 'x', 'instagram', 'tiktok') THEN
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;

  IF v_is_send THEN
    IF EXISTS (
      SELECT 1 FROM outreach_dnc d
      WHERE (d.key_type = 'email' AND d.key_value = v_lead.email_norm)
         OR (d.key_type = 'domain' AND d.key_value IN (split_part(v_lead.email_norm, '@', 2), v_lead.domain_norm))
         OR (d.key_type = 'profile_url' AND d.key_value = v_lead.profile_url_norm)
    ) THEN
      RAISE EXCEPTION 'outreach_dnc';
    END IF;
    IF p_action = 'followed_up' AND v_lead.date_contacted IS NULL THEN
      RAISE EXCEPTION 'outreach_not_contacted';
    END IF;

    IF v_channel = 'email' THEN
      v_mailbox := coalesce(p_mailbox_id, v_lead.mailbox_id);
      IF v_mailbox IS NULL THEN RAISE EXCEPTION 'outreach_mailbox_required'; END IF;
      SELECT id, start_date, is_personal, is_active, custom_limit
        INTO v_mb FROM outreach_mailboxes WHERE id = v_mailbox FOR UPDATE;
      IF NOT FOUND OR NOT v_mb.is_active THEN RAISE EXCEPTION 'outreach_mailbox_inactive'; END IF;
      v_limit := outreach_mailbox_limit(v_mb.start_date, v_mb.is_personal, v_mb.custom_limit, v_today);
      SELECT count(*) INTO v_count FROM outreach_activity
      WHERE mailbox_id = v_mailbox AND action IN ('contacted', 'followed_up')
        AND undone_at IS NULL AND created_at >= v_day_start;
      IF v_count >= v_limit THEN
        RAISE EXCEPTION 'outreach_mailbox_full' USING DETAIL = v_count || '/' || v_limit;
      END IF;
      v_count := v_count + 1;
    ELSE
      v_mailbox := NULL; -- DMs don't use a mailbox
    END IF;
  ELSE
    -- Outcome actions inherit the lead's mailbox/channel so reply and
    -- bounce rates can be grouped by mailbox.
    v_mailbox := v_lead.mailbox_id;
    v_channel := v_lead.channel;
  END IF;

  v_prev := jsonb_build_object(
    'status', v_lead.status,
    'date_contacted', v_lead.date_contacted,
    'follow_up_date', v_lead.follow_up_date,
    'followed_up_date', v_lead.followed_up_date,
    'replied_at', v_lead.replied_at,
    'mailbox_id', v_lead.mailbox_id,
    'channel', v_lead.channel
  );

  n_date_contacted := CASE WHEN p_action = 'contacted' THEN v_today ELSE v_lead.date_contacted END;
  -- One follow-up, 4 days after first contact. Any later action clears it.
  n_follow_up_date := CASE WHEN p_action = 'contacted' THEN v_today + 4 ELSE NULL END;
  n_followed_up_date := CASE WHEN p_action = 'followed_up' THEN v_today ELSE v_lead.followed_up_date END;
  n_replied_at := CASE WHEN p_action = 'replied' THEN coalesce(v_lead.replied_at, now()) ELSE v_lead.replied_at END;

  EXECUTE format(
    'UPDATE %I SET status = $1, date_contacted = $2, follow_up_date = $3, followed_up_date = $4,
       replied_at = $5, mailbox_id = $6, channel = $7 WHERE lead_id = $8', v_table)
  USING p_action, n_date_contacted, n_follow_up_date, n_followed_up_date, n_replied_at,
        CASE WHEN v_is_send THEN v_mailbox ELSE v_lead.mailbox_id END,
        CASE WHEN v_is_send THEN v_channel ELSE v_lead.channel END,
        p_lead_id;

  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, mailbox_id, channel, prev_state)
  VALUES (p_lead_type, p_lead_id, p_user_id, p_action, v_mailbox, v_channel, v_prev)
  RETURNING id INTO v_activity;

  -- Opt-out blocks every key of the lead. A bounce blocks the email only.
  IF p_action = 'opted_out' THEN
    INSERT INTO outreach_dnc (key_type, key_value, reason, lead_id, activity_id, created_by)
    SELECT k.t, k.v, 'opted_out', p_lead_id, v_activity, p_user_id
    FROM (VALUES ('email', v_lead.email_norm), ('profile_url', v_lead.profile_url_norm)) AS k(t, v)
    WHERE k.v IS NOT NULL
    ON CONFLICT (key_type, key_value) DO NOTHING;
  ELSIF p_action = 'bounced' AND v_lead.email_norm IS NOT NULL THEN
    INSERT INTO outreach_dnc (key_type, key_value, reason, lead_id, activity_id, created_by)
    VALUES ('email', v_lead.email_norm, 'bounced', p_lead_id, v_activity, p_user_id)
    ON CONFLICT (key_type, key_value) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'activity_id', v_activity,
    'status', p_action,
    'mailbox_id', v_mailbox,
    'mailbox_sent_today', v_count,
    'mailbox_limit', v_limit
  );
END;
$$;

-- Undo: only the lead's latest action, only by the person who logged it,
-- only within 10 minutes. Restores the saved fields and removes any DNC
-- entry that action added.
CREATE OR REPLACE FUNCTION outreach_undo_action(p_activity_id VARCHAR, p_user_id VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_act    RECORD;
  v_latest VARCHAR;
  v_table  TEXT;
  v_prev   JSONB;
BEGIN
  SELECT * INTO v_act FROM outreach_activity WHERE id = p_activity_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'outreach_not_found'; END IF;
  IF v_act.user_id IS DISTINCT FROM p_user_id THEN RAISE EXCEPTION 'outreach_undo_not_yours'; END IF;
  IF v_act.undone_at IS NOT NULL THEN RAISE EXCEPTION 'outreach_undo_done'; END IF;
  IF v_act.created_at < now() - interval '10 minutes' THEN RAISE EXCEPTION 'outreach_undo_expired'; END IF;
  IF v_act.prev_state IS NULL THEN RAISE EXCEPTION 'outreach_undo_unsupported'; END IF;

  v_table := CASE v_act.lead_type WHEN 'creator' THEN 'outreach_creators' ELSE 'outreach_brands' END;
  EXECUTE format('SELECT 1 FROM %I WHERE lead_id = $1 FOR UPDATE', v_table) USING v_act.lead_id;

  SELECT id INTO v_latest FROM outreach_activity
  WHERE lead_type = v_act.lead_type AND lead_id = v_act.lead_id AND undone_at IS NULL
  ORDER BY created_at DESC, id DESC LIMIT 1;
  IF v_latest IS DISTINCT FROM p_activity_id THEN RAISE EXCEPTION 'outreach_undo_not_latest'; END IF;

  v_prev := v_act.prev_state;
  EXECUTE format(
    'UPDATE %I SET status = $1, date_contacted = $2, follow_up_date = $3, followed_up_date = $4,
       replied_at = $5, mailbox_id = $6, channel = $7 WHERE lead_id = $8', v_table)
  USING v_prev->>'status', (v_prev->>'date_contacted')::date, (v_prev->>'follow_up_date')::date,
        (v_prev->>'followed_up_date')::date, (v_prev->>'replied_at')::timestamptz,
        v_prev->>'mailbox_id', v_prev->>'channel', v_act.lead_id;

  UPDATE outreach_activity SET undone_at = now() WHERE id = p_activity_id;
  DELETE FROM outreach_dnc WHERE activity_id = p_activity_id;

  RETURN jsonb_build_object('lead_id', v_act.lead_id, 'status', v_prev->>'status');
END;
$$;

-- CSV import. Rows that duplicate an existing lead (or an earlier row in the
-- same file) or hit the DNC list are skipped and reported. Everything else
-- is inserted in this one transaction; any other error rolls back the whole
-- import. Rows arrive already mapped and typed by the API.
CREATE OR REPLACE FUNCTION outreach_import(p_lead_type VARCHAR, p_rows JSONB, p_source VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  r          JSONB;
  v_inserted INTEGER := 0;
  v_skipped  JSONB := '[]'::jsonb;
  v_email    TEXT;
  v_url      TEXT;
  v_domain   TEXT;
  v_hit      RECORD;
  v_lead_id  VARCHAR;
BEGIN
  IF p_lead_type NOT IN ('creator', 'brand') THEN RAISE EXCEPTION 'outreach_bad_action'; END IF;
  IF jsonb_array_length(p_rows) > 5000 THEN RAISE EXCEPTION 'outreach_import_too_large'; END IF;

  FOR r IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_email := outreach_norm_email(r->>'email');
    IF p_lead_type = 'creator' THEN
      v_url := outreach_norm_url(r->>'profile_url');
      v_domain := NULL;
    ELSE
      v_url := NULL;
      v_domain := outreach_norm_domain(coalesce(NULLIF(btrim(r->>'domain'), ''), r->>'website'));
    END IF;

    SELECT k.lead_id, k.key_type INTO v_hit FROM outreach_keys k
    WHERE (k.key_type = 'email' AND k.key_value = v_email)
       OR (k.key_type = 'profile_url' AND k.key_value = v_url)
       OR (k.key_type = 'domain' AND k.key_value = v_domain)
    LIMIT 1;
    IF FOUND THEN
      v_skipped := v_skipped || jsonb_build_object(
        'row', r->'_row', 'reason', 'duplicate', 'lead_id', v_hit.lead_id, 'key', v_hit.key_type);
      CONTINUE;
    END IF;

    SELECT d.key_type, d.key_value INTO v_hit FROM outreach_dnc d
    WHERE (d.key_type = 'email' AND d.key_value = v_email)
       OR (d.key_type = 'domain' AND d.key_value IN (split_part(v_email, '@', 2), v_domain))
       OR (d.key_type = 'profile_url' AND d.key_value = v_url)
    LIMIT 1;
    IF FOUND THEN
      v_skipped := v_skipped || jsonb_build_object(
        'row', r->'_row', 'reason', 'dnc', 'key', v_hit.key_type || ':' || v_hit.key_value);
      CONTINUE;
    END IF;

    BEGIN
      IF p_lead_type = 'creator' THEN
        INSERT INTO outreach_creators (
          name, platform, profile_url, country, niche, subscribers, avg_views, engagement_pct,
          does_sponsorships, sponsor_brands, email, instagram, x, linkedin, tiktok, website,
          owner_user_id, notes, source
        ) VALUES (
          r->>'name', r->>'platform', r->>'profile_url', r->>'country', r->>'niche',
          round((r->>'subscribers')::numeric)::bigint, round((r->>'avg_views')::numeric)::bigint,
          (r->>'engagement_pct')::numeric,
          (r->>'does_sponsorships')::boolean, r->>'sponsor_brands', r->>'email', r->>'instagram',
          r->>'x', r->>'linkedin', r->>'tiktok', r->>'website',
          NULLIF(r->>'owner_user_id', ''), r->>'notes', p_source
        ) RETURNING lead_id INTO v_lead_id;
      ELSE
        INSERT INTO outreach_brands (
          company, website, domain, country, product, team_size, why_them, score,
          contact_name, role, email, linkedin, owner_user_id, notes, source
        ) VALUES (
          r->>'company', r->>'website', r->>'domain', r->>'country', r->>'product', r->>'team_size',
          r->>'why_them', (r->>'score')::numeric, r->>'contact_name', r->>'role', r->>'email',
          r->>'linkedin', NULLIF(r->>'owner_user_id', ''), r->>'notes', p_source
        ) RETURNING lead_id INTO v_lead_id;
      END IF;
      v_inserted := v_inserted + 1;
    EXCEPTION WHEN unique_violation THEN
      -- A lead with this key was added by someone else mid-import.
      v_skipped := v_skipped || jsonb_build_object('row', r->'_row', 'reason', 'duplicate', 'lead_id', NULL);
    END;
  END LOOP;

  RETURN jsonb_build_object('inserted', v_inserted, 'skipped', v_skipped);
END;
$$;

-- Daily cron: followed up 7+ days ago with no reply → no_reply.
CREATE OR REPLACE FUNCTION outreach_mark_no_reply() RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Karachi')::date;
  v_total INTEGER := 0;
  v_n     INTEGER;
BEGIN
  WITH upd AS (
    UPDATE outreach_creators SET status = 'no_reply'
    WHERE status = 'followed_up' AND replied_at IS NULL AND followed_up_date <= v_today - 7
    RETURNING lead_id, mailbox_id, channel
  )
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, mailbox_id, channel)
  SELECT 'creator', lead_id, NULL, 'no_reply', mailbox_id, channel FROM upd;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  WITH upd AS (
    UPDATE outreach_brands SET status = 'no_reply'
    WHERE status = 'followed_up' AND replied_at IS NULL AND followed_up_date <= v_today - 7
    RETURNING lead_id, mailbox_id, channel
  )
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, mailbox_id, channel)
  SELECT 'brand', lead_id, NULL, 'no_reply', mailbox_id, channel FROM upd;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  RETURN v_total;
END;
$$;

-- Admin "Delete personal data": first makes sure the lead's email/profile
-- URL is on the DNC list, then clears the personal fields. The lead row,
-- its id and status history stay (stats keep working).
CREATE OR REPLACE FUNCTION outreach_erase_lead(p_lead_type VARCHAR, p_lead_id VARCHAR, p_user_id VARCHAR)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_email TEXT;
  v_url   TEXT;
BEGIN
  IF p_lead_type = 'creator' THEN
    SELECT email_norm, profile_url_norm INTO v_email, v_url
    FROM outreach_creators WHERE lead_id = p_lead_id FOR UPDATE;
  ELSIF p_lead_type = 'brand' THEN
    SELECT email_norm, NULL INTO v_email, v_url
    FROM outreach_brands WHERE lead_id = p_lead_id FOR UPDATE;
  ELSE
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'outreach_not_found'; END IF;

  INSERT INTO outreach_dnc (key_type, key_value, reason, lead_id, created_by)
  SELECT k.t, k.v, 'removal_request', p_lead_id, p_user_id
  FROM (VALUES ('email', v_email), ('profile_url', v_url)) AS k(t, v)
  WHERE k.v IS NOT NULL
  ON CONFLICT (key_type, key_value) DO NOTHING;

  IF p_lead_type = 'creator' THEN
    UPDATE outreach_creators SET
      name = NULL, profile_url = NULL, email = NULL, instagram = NULL, x = NULL,
      linkedin = NULL, tiktok = NULL, website = NULL, sponsor_brands = NULL, notes = NULL,
      follow_up_date = NULL,
      status = CASE WHEN status IN ('not_interested', 'no_reply', 'bounced', 'opted_out') THEN status ELSE 'opted_out' END
    WHERE lead_id = p_lead_id;
  ELSE
    UPDATE outreach_brands SET
      contact_name = NULL, role = NULL, email = NULL, linkedin = NULL, notes = NULL,
      follow_up_date = NULL,
      status = CASE WHEN status IN ('not_interested', 'no_reply', 'bounced', 'opted_out') THEN status ELSE 'opted_out' END
    WHERE lead_id = p_lead_id;
  END IF;

  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action)
  VALUES (p_lead_type, p_lead_id, p_user_id, 'erased');
END;
$$;

-- Stats helpers. Aggregated in SQL so the API never pages through raw
-- activity rows (PostgREST caps a response at 1,000 rows).
CREATE OR REPLACE FUNCTION outreach_user_stats(
  p_today_start TIMESTAMPTZ, p_week_start TIMESTAMPTZ, p_month_start TIMESTAMPTZ
) RETURNS TABLE (user_id VARCHAR, lead_type VARCHAR, action VARCHAR, today BIGINT, week BIGINT, month BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT a.user_id, a.lead_type, a.action,
         count(*) FILTER (WHERE a.created_at >= p_today_start),
         count(*) FILTER (WHERE a.created_at >= p_week_start),
         count(*) FILTER (WHERE a.created_at >= p_month_start)
  FROM outreach_activity a
  WHERE a.undone_at IS NULL AND a.created_at >= LEAST(p_week_start, p_month_start)
  GROUP BY a.user_id, a.lead_type, a.action
$$;

CREATE OR REPLACE FUNCTION outreach_channel_stats(p_from TIMESTAMPTZ)
RETURNS TABLE (mailbox_id VARCHAR, channel VARCHAR, contacted BIGINT, followed_up BIGINT, replied BIGINT, bounced BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT a.mailbox_id, a.channel,
         count(*) FILTER (WHERE a.action = 'contacted'),
         count(*) FILTER (WHERE a.action = 'followed_up'),
         count(*) FILTER (WHERE a.action = 'replied'),
         count(*) FILTER (WHERE a.action = 'bounced')
  FROM outreach_activity a
  WHERE a.undone_at IS NULL AND a.created_at >= p_from
    AND a.action IN ('contacted', 'followed_up', 'replied', 'bounced')
  GROUP BY a.mailbox_id, a.channel
$$;

-- Sends (contacted + followed up) since p_day_start, by person/mailbox/channel.
CREATE OR REPLACE FUNCTION outreach_today_usage(p_day_start TIMESTAMPTZ)
RETURNS TABLE (user_id VARCHAR, mailbox_id VARCHAR, channel VARCHAR, sent BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT a.user_id, a.mailbox_id, a.channel, count(*)
  FROM outreach_activity a
  WHERE a.undone_at IS NULL AND a.created_at >= p_day_start
    AND a.action IN ('contacted', 'followed_up')
  GROUP BY a.user_id, a.mailbox_id, a.channel
$$;

-- already_in_sheet.txt: every normalised key from leads and the DNC list.
-- Returned as one text value so the 1,000-row response cap doesn't apply.
CREATE OR REPLACE FUNCTION outreach_all_keys() RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT coalesce(string_agg(v, E'\n' ORDER BY v), '')
  FROM (
    SELECT key_value AS v FROM outreach_keys
    UNION
    SELECT key_value FROM outreach_dnc
  ) s
$$;

-- Duplicate + DNC lookup for many normalised keys in one call (import
-- preview, add-lead form). JSONB scalar, so the 1,000-row cap doesn't apply.
CREATE OR REPLACE FUNCTION outreach_match_keys(p_values TEXT[]) RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'leads', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'key_type', k.key_type, 'key_value', k.key_value, 'lead_type', k.lead_type, 'lead_id', k.lead_id,
        'owner_user_id', coalesce(c.owner_user_id, b.owner_user_id), 'status', coalesce(c.status, b.status)))
      FROM outreach_keys k
      LEFT JOIN outreach_creators c ON k.lead_type = 'creator' AND c.lead_id = k.lead_id
      LEFT JOIN outreach_brands b ON k.lead_type = 'brand' AND b.lead_id = k.lead_id
      WHERE k.key_value = ANY(p_values)), '[]'::jsonb),
    'dnc', coalesce((
      SELECT jsonb_agg(jsonb_build_object('key_type', d.key_type, 'key_value', d.key_value, 'reason', d.reason))
      FROM outreach_dnc d WHERE d.key_value = ANY(p_values)), '[]'::jsonb)
  )
$$;

-- Distinct values for the table filter dropdowns.
CREATE OR REPLACE FUNCTION outreach_filter_values() RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'creator_countries', (SELECT coalesce(jsonb_agg(DISTINCT country ORDER BY country), '[]'::jsonb)
                          FROM outreach_creators WHERE coalesce(btrim(country), '') <> ''),
    'creator_niches',    (SELECT coalesce(jsonb_agg(DISTINCT niche ORDER BY niche), '[]'::jsonb)
                          FROM outreach_creators WHERE coalesce(btrim(niche), '') <> ''),
    'creator_platforms', (SELECT coalesce(jsonb_agg(DISTINCT platform ORDER BY platform), '[]'::jsonb)
                          FROM outreach_creators WHERE coalesce(btrim(platform), '') <> ''),
    'brand_countries',   (SELECT coalesce(jsonb_agg(DISTINCT country ORDER BY country), '[]'::jsonb)
                          FROM outreach_brands WHERE coalesce(btrim(country), '') <> '')
  )
$$;

-- ── 6. RLS + grants (service_role only) ───────────────────────────────────────
-- RLS on with zero policies = deny-all for anon/authenticated. Never add a
-- policy or a grant to anon/authenticated here (CLAUDE.md, Known Limitations #1).

ALTER TABLE outreach_mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_team      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_creators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_brands    ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_keys      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_activity  ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_dnc       ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.outreach_mailboxes, public.outreach_team, public.outreach_creators,
  public.outreach_brands, public.outreach_keys, public.outreach_activity, public.outreach_dnc
  FROM anon, authenticated, public;
REVOKE ALL ON SEQUENCE public.outreach_creator_lead_seq, public.outreach_brand_lead_seq
  FROM anon, authenticated, public;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_mailboxes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_team      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_creators  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_brands    TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_keys      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_activity  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_dnc       TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.outreach_creator_lead_seq, public.outreach_brand_lead_seq TO service_role;

-- Functions get EXECUTE for PUBLIC by default; take it away explicitly.
REVOKE ALL ON FUNCTION
  outreach_norm_email(TEXT), outreach_norm_url(TEXT), outreach_norm_domain(TEXT),
  outreach_format_lead_id(TEXT, BIGINT), outreach_mailbox_limit(DATE, BOOLEAN, INTEGER, DATE),
  outreach_creators_before_write(), outreach_brands_before_write(),
  outreach_claim_key(TEXT, TEXT, TEXT, TEXT),
  outreach_creators_sync_keys(), outreach_brands_sync_keys(),
  outreach_log_action(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR),
  outreach_undo_action(VARCHAR, VARCHAR),
  outreach_import(VARCHAR, JSONB, VARCHAR),
  outreach_mark_no_reply(),
  outreach_erase_lead(VARCHAR, VARCHAR, VARCHAR),
  outreach_user_stats(TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ),
  outreach_channel_stats(TIMESTAMPTZ),
  outreach_today_usage(TIMESTAMPTZ),
  outreach_all_keys(),
  outreach_match_keys(TEXT[]),
  outreach_filter_values()
FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION
  outreach_norm_email(TEXT), outreach_norm_url(TEXT), outreach_norm_domain(TEXT),
  outreach_format_lead_id(TEXT, BIGINT), outreach_mailbox_limit(DATE, BOOLEAN, INTEGER, DATE),
  outreach_creators_before_write(), outreach_brands_before_write(),
  outreach_claim_key(TEXT, TEXT, TEXT, TEXT),
  outreach_creators_sync_keys(), outreach_brands_sync_keys(),
  outreach_log_action(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR),
  outreach_undo_action(VARCHAR, VARCHAR),
  outreach_import(VARCHAR, JSONB, VARCHAR),
  outreach_mark_no_reply(),
  outreach_erase_lead(VARCHAR, VARCHAR, VARCHAR),
  outreach_user_stats(TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ),
  outreach_channel_stats(TIMESTAMPTZ),
  outreach_today_usage(TIMESTAMPTZ),
  outreach_all_keys(),
  outreach_match_keys(TEXT[]),
  outreach_filter_values()
TO service_role;
