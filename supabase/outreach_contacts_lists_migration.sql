-- ============================================================================
-- Outreach: rolling mailbox window, brand contacts, Apollo import, lists
-- ============================================================================
-- Run AFTER supabase/outreach_migration.sql, outreach_extra_migration.sql,
-- outreach_delete_migration.sql and outreach_database_migration.sql.
-- Idempotent: safe to run more than once. Run in the Supabase SQL Editor.
--
-- The app checks outreach_schema_version() and keeps using the old paths
-- (calendar-day mailbox limit, no contacts, no lists) until this has run.
--
-- What it does:
--   1. outreach_settings + outreach_mailbox_window_hours(): a send counts
--      against its mailbox for N hours (default 15, 12 to 24)
--   2. outreach_brand_contacts reshaped: several people per brand, each
--      with their own status and dates. Emails are claimed in outreach_keys
--      (new contact_id column), so one email exists once across every lead
--      and contact; DNC applies. Each brand's contact_name / role / email /
--      linkedin becomes its primary contact. Those brand columns stay as a
--      read-only copy of the primary contact.
--   3. outreach_log_action() takes p_contact_id; the brand status follows
--      the furthest-along contact. Undo and the no-reply rule work per
--      contact.
--   4. Lists on both lead tables (set from the import file name), with a
--      backfill, admin edits through outreach_set_list() and
--      outreach_list_stats() for the dashboard
--   5. outreach_import_contacts(): Apollo contacts import (preview + commit)
--   6. Replaced: outreach_log_action, outreach_undo_action,
--      outreach_mark_no_reply, outreach_brands_sync_keys, outreach_erase_lead,
--      outreach_db_item (no 'contact' kind: contacts have their own
--      functions). Dropped: outreach_db_make_primary.
-- ============================================================================

-- ── 0. Version ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION outreach_schema_version() RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$ SELECT 2 $$;

-- ── 1. Settings + rolling mailbox window ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE outreach_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON outreach_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_settings TO service_role;

INSERT INTO outreach_settings (key, value) VALUES ('mailbox_window_hours', '15'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Hours a send counts against its mailbox. Anything unreadable or out of
-- range falls back to 15.
CREATE OR REPLACE FUNCTION outreach_mailbox_window_hours() RETURNS INTEGER
LANGUAGE sql STABLE AS $$
  SELECT coalesce((
    SELECT CASE WHEN jsonb_typeof(value) = 'number' AND (value::text)::numeric BETWEEN 12 AND 24
                THEN (value::text)::numeric::integer END
    FROM outreach_settings WHERE key = 'mailbox_window_hours'), 15)
$$;

-- Per mailbox: sends inside the window, today's limit (warm-up still counts
-- in Karachi days) and, when full, when the next slot frees up.
CREATE OR REPLACE FUNCTION outreach_mailbox_usage()
RETURNS TABLE (mailbox_id VARCHAR, sent BIGINT, daily_limit INTEGER, window_hours INTEGER, next_free_at TIMESTAMPTZ)
LANGUAGE sql STABLE AS $$
  WITH w AS (
    SELECT outreach_mailbox_window_hours() AS h,
           (now() AT TIME ZONE 'Asia/Karachi')::date AS today
  ), m AS (
    SELECT mb.id,
           outreach_mailbox_limit(mb.start_date, mb.is_personal, mb.custom_limit, w.today) AS lim,
           w.h,
           (SELECT count(*) FROM outreach_activity a
             WHERE a.mailbox_id = mb.id AND a.action IN ('contacted', 'followed_up') AND a.undone_at IS NULL
               AND a.created_at > now() - make_interval(hours => w.h)) AS cnt
    FROM outreach_mailboxes mb, w
  )
  SELECT m.id, m.cnt, m.lim, m.h,
         CASE WHEN m.cnt >= m.lim THEN (
           SELECT x.created_at + make_interval(hours => m.h) FROM (
             SELECT a.created_at, row_number() OVER (ORDER BY a.created_at, a.id) AS rn
             FROM outreach_activity a
             WHERE a.mailbox_id = m.id AND a.action IN ('contacted', 'followed_up') AND a.undone_at IS NULL
               AND a.created_at > now() - make_interval(hours => m.h)
           ) x WHERE x.rn = m.cnt - m.lim + 1)
         END
  FROM m
$$;

-- ── 2. Keys and activity know about contacts ──────────────────────────────────
ALTER TABLE outreach_keys ADD COLUMN IF NOT EXISTS contact_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS outreach_keys_contact_idx ON outreach_keys (contact_id) WHERE contact_id IS NOT NULL;

ALTER TABLE outreach_activity ADD COLUMN IF NOT EXISTS contact_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS outreach_activity_contact_idx ON outreach_activity (contact_id) WHERE contact_id IS NOT NULL;

ALTER TABLE outreach_activity DROP CONSTRAINT IF EXISTS outreach_activity_action_check;
ALTER TABLE outreach_activity ADD CONSTRAINT outreach_activity_action_check CHECK (action IN (
  'contacted', 'followed_up', 'replied', 'signed_up', 'call_booked', 'won',
  'not_interested', 'bounced', 'opted_out', 'no_reply',
  'status_changed', 'owner_changed', 'erased', 'edited', 'deleted', 'restored',
  'db_added', 'db_removed', 'db_edited',
  'contact_added', 'contact_edited', 'contact_removed'));

-- ── 3. Brand contacts ─────────────────────────────────────────────────────────
-- outreach_database_migration.sql created this table with name / role and a
-- foreign key to outreach_brand_db. Reshape it in place (it may hold rows).
CREATE TABLE IF NOT EXISTS outreach_brand_contacts (
  id         VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_id    VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  linkedin   TEXT,
  created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS first_name       VARCHAR(255);
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS last_name        VARCHAR(255);
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS title            VARCHAR(255);
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS email_norm       TEXT;
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS is_primary       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS status           VARCHAR(30) NOT NULL DEFAULT 'found';
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS date_contacted   DATE;
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS follow_up_date   DATE;
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS followed_up_date DATE;
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS replied_at       TIMESTAMPTZ;
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS mailbox_id       VARCHAR(255) REFERENCES outreach_mailboxes(id) ON DELETE SET NULL;
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS channel          VARCHAR(20);
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS notes            TEXT;
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS source           VARCHAR(255);

-- Old name / role columns → first / last name and title, then dropped.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'outreach_brand_contacts' AND column_name = 'name') THEN
    PERFORM set_config('outreach.allow_deleted_write', 'on', true);
    UPDATE outreach_brand_contacts SET
      first_name = coalesce(first_name, nullif(split_part(btrim(name), ' ', 1), '')),
      last_name  = coalesce(last_name, nullif(btrim(substr(btrim(name), length(split_part(btrim(name), ' ', 1)) + 1)), ''))
    WHERE name IS NOT NULL;
    PERFORM set_config('outreach.allow_deleted_write', 'off', true);
    ALTER TABLE outreach_brand_contacts DROP CONSTRAINT IF EXISTS outreach_brand_contacts_not_empty;
    ALTER TABLE outreach_brand_contacts DROP COLUMN name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'outreach_brand_contacts' AND column_name = 'role') THEN
    PERFORM set_config('outreach.allow_deleted_write', 'on', true);
    UPDATE outreach_brand_contacts SET title = coalesce(title, role) WHERE role IS NOT NULL;
    PERFORM set_config('outreach.allow_deleted_write', 'off', true);
    ALTER TABLE outreach_brand_contacts DROP COLUMN role;
  END IF;
END $$;

-- Contacts belong to the brand lead now, not to its Database entry.
ALTER TABLE outreach_brand_contacts DROP CONSTRAINT IF EXISTS outreach_brand_contacts_lead_id_fkey;
ALTER TABLE outreach_brand_contacts ADD CONSTRAINT outreach_brand_contacts_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES outreach_brands(lead_id) ON DELETE CASCADE;

ALTER TABLE outreach_brand_contacts DROP CONSTRAINT IF EXISTS outreach_brand_contacts_status_check;
ALTER TABLE outreach_brand_contacts ADD CONSTRAINT outreach_brand_contacts_status_check CHECK (status IN (
  'found', 'contacted', 'followed_up', 'replied', 'bounced', 'opted_out', 'not_interested', 'no_reply'));
ALTER TABLE outreach_brand_contacts DROP CONSTRAINT IF EXISTS outreach_brand_contacts_channel_check;
ALTER TABLE outreach_brand_contacts ADD CONSTRAINT outreach_brand_contacts_channel_check
  CHECK (channel IS NULL OR channel IN ('email', 'linkedin', 'x', 'instagram', 'tiktok'));
ALTER TABLE outreach_brand_contacts DROP CONSTRAINT IF EXISTS outreach_brand_contacts_has_identity;
ALTER TABLE outreach_brand_contacts ADD CONSTRAINT outreach_brand_contacts_has_identity
  CHECK (coalesce(first_name, last_name, email, linkedin) IS NOT NULL);

CREATE INDEX IF NOT EXISTS outreach_brand_contacts_lead_idx ON outreach_brand_contacts (lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS outreach_brand_contacts_one_primary ON outreach_brand_contacts (lead_id) WHERE is_primary;
CREATE UNIQUE INDEX IF NOT EXISTS outreach_brand_contacts_email_norm_key ON outreach_brand_contacts (email_norm) WHERE email_norm IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_brand_contacts_follow_up_idx ON outreach_brand_contacts (follow_up_date) WHERE follow_up_date IS NOT NULL;

ALTER TABLE outreach_brand_contacts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON outreach_brand_contacts FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_brand_contacts TO service_role;

-- Deleted brands: no contact changes (same guard as the Database tables).
DROP TRIGGER IF EXISTS outreach_brand_contacts_guard ON outreach_brand_contacts;
CREATE TRIGGER outreach_brand_contacts_guard BEFORE INSERT OR UPDATE OR DELETE ON outreach_brand_contacts
  FOR EACH ROW EXECUTE FUNCTION outreach_db_guard_deleted('brand');

-- Normalise, then check a new or changed email against the DNC list.
-- outreach.contact_seed = 'on' skips the DNC check: used when a brand's own
-- contact (already checked on the brand, or opted out later) becomes a row.
CREATE OR REPLACE FUNCTION outreach_contacts_before_write() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_hit RECORD;
BEGIN
  NEW.email_norm := outreach_norm_email(NEW.email);
  NEW.updated_at := now();
  IF NEW.email_norm IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.email_norm IS DISTINCT FROM OLD.email_norm)
     AND coalesce(current_setting('outreach.contact_seed', true), '') <> 'on' THEN
    SELECT d.key_type, d.key_value INTO v_hit FROM outreach_dnc d
    WHERE (d.key_type = 'email' AND d.key_value = NEW.email_norm)
       OR (d.key_type = 'domain' AND d.key_value = split_part(NEW.email_norm, '@', 2))
    LIMIT 1;
    IF FOUND THEN RAISE EXCEPTION 'outreach_dnc' USING DETAIL = v_hit.key_type || ':' || v_hit.key_value; END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- A contact's email key. The brand may already hold the same email as its
-- own key (its old contact column): the contact takes it over. Any other
-- holder (another lead, or another contact) raises outreach_duplicate.
CREATE OR REPLACE FUNCTION outreach_claim_contact_key(p_email_norm TEXT, p_lead_id VARCHAR, p_contact_id VARCHAR)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_owner RECORD;
BEGIN
  IF p_email_norm IS NULL THEN RETURN; END IF;
  INSERT INTO outreach_keys (key_type, key_value, lead_type, lead_id, contact_id)
  VALUES ('email', p_email_norm, 'brand', p_lead_id, p_contact_id)
  ON CONFLICT (key_type, key_value) DO UPDATE SET contact_id = EXCLUDED.contact_id
    WHERE outreach_keys.lead_type = 'brand' AND outreach_keys.lead_id = EXCLUDED.lead_id
      AND outreach_keys.contact_id IS NULL;
  SELECT lead_type, lead_id, contact_id INTO v_owner FROM outreach_keys
  WHERE key_type = 'email' AND key_value = p_email_norm;
  IF v_owner.lead_type <> 'brand' OR v_owner.lead_id <> p_lead_id OR v_owner.contact_id IS DISTINCT FROM p_contact_id THEN
    RAISE EXCEPTION 'outreach_duplicate' USING ERRCODE = '23505', DETAIL = v_owner.lead_id || ':email';
  END IF;
END;
$$;

-- The brand's contact_name / role / email / linkedin = its primary contact
-- (or its first contact, or empty). Read-only copy for older screens,
-- search and exports.
CREATE OR REPLACE FUNCTION outreach_brand_mirror_contact(p_lead_id VARCHAR) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  c RECORD;
  v_name TEXT;
BEGIN
  SELECT first_name, last_name, title, email, linkedin INTO c FROM outreach_brand_contacts
  WHERE lead_id = p_lead_id ORDER BY is_primary DESC, created_at, id LIMIT 1;
  v_name := nullif(btrim(concat_ws(' ', c.first_name, c.last_name)), '');
  -- The contact passed (or was let through) its own DNC check already.
  PERFORM set_config('outreach.brand_mirror', 'on', true);
  UPDATE outreach_brands SET contact_name = v_name, role = c.title, email = c.email, linkedin = c.linkedin
  WHERE lead_id = p_lead_id
    AND (contact_name, role, email, linkedin) IS DISTINCT FROM (v_name, c.title, c.email, c.linkedin);
  PERFORM set_config('outreach.brand_mirror', 'off', true);
END;
$$;

CREATE OR REPLACE FUNCTION outreach_contacts_after_write() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM outreach_keys WHERE contact_id = OLD.id;
    PERFORM outreach_brand_mirror_contact(OLD.lead_id);
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM outreach_keys WHERE contact_id = NEW.id AND key_value IS DISTINCT FROM NEW.email_norm;
  END IF;
  PERFORM outreach_claim_contact_key(NEW.email_norm, NEW.lead_id, NEW.id);
  IF TG_OP = 'INSERT' OR (NEW.first_name, NEW.last_name, NEW.title, NEW.email, NEW.linkedin, NEW.is_primary)
       IS DISTINCT FROM (OLD.first_name, OLD.last_name, OLD.title, OLD.email, OLD.linkedin, OLD.is_primary) THEN
    PERFORM outreach_brand_mirror_contact(NEW.lead_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS outreach_brand_contacts_before_write ON outreach_brand_contacts;
CREATE TRIGGER outreach_brand_contacts_before_write BEFORE INSERT OR UPDATE ON outreach_brand_contacts
  FOR EACH ROW EXECUTE FUNCTION outreach_contacts_before_write();
DROP TRIGGER IF EXISTS outreach_brand_contacts_after_write ON outreach_brand_contacts;
CREATE TRIGGER outreach_brand_contacts_after_write AFTER INSERT OR UPDATE OR DELETE ON outreach_brand_contacts
  FOR EACH ROW EXECUTE FUNCTION outreach_contacts_after_write();

-- Replaced (same as outreach_migration.sql): the email DNC check is skipped
-- while outreach_brand_mirror_contact() copies a contact onto the brand.
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

  v_email_changed := (TG_OP = 'INSERT' OR NEW.email_norm IS DISTINCT FROM OLD.email_norm)
    AND coalesce(current_setting('outreach.brand_mirror', true), '') <> 'on';
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

-- Replaced: a brand's own email key never removes a contact's key.
CREATE OR REPLACE FUNCTION outreach_brands_sync_keys() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM outreach_keys WHERE lead_type = 'brand' AND lead_id = OLD.lead_id;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM outreach_keys
    WHERE lead_type = 'brand' AND lead_id = NEW.lead_id AND contact_id IS NULL
      AND ((key_type = 'email' AND key_value IS DISTINCT FROM NEW.email_norm)
        OR (key_type = 'domain' AND key_value IS DISTINCT FROM NEW.domain_norm));
  END IF;
  PERFORM outreach_claim_key('email', NEW.email_norm, 'brand', NEW.lead_id);
  PERFORM outreach_claim_key('domain', NEW.domain_norm, 'brand', NEW.lead_id);
  RETURN NEW;
END;
$$;

-- A new brand with a contact (manual add, CSV import) gets it as its
-- primary contact row.
CREATE OR REPLACE FUNCTION outreach_brands_seed_contact() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF coalesce(NEW.contact_name, NEW.email, NEW.linkedin) IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM outreach_brand_contacts WHERE lead_id = NEW.lead_id) THEN
    PERFORM set_config('outreach.contact_seed', 'on', true);
    INSERT INTO outreach_brand_contacts (lead_id, first_name, last_name, title, email, linkedin, is_primary, source)
    VALUES (NEW.lead_id,
            nullif(split_part(btrim(coalesce(NEW.contact_name, '')), ' ', 1), ''),
            nullif(btrim(substr(btrim(coalesce(NEW.contact_name, '')), length(split_part(btrim(coalesce(NEW.contact_name, '')), ' ', 1)) + 1)), ''),
            NEW.role, NEW.email, NEW.linkedin, true, NEW.source);
    PERFORM set_config('outreach.contact_seed', 'off', true);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS outreach_brands_seed_contact ON outreach_brands;
CREATE TRIGGER outreach_brands_seed_contact AFTER INSERT ON outreach_brands
  FOR EACH ROW EXECUTE FUNCTION outreach_brands_seed_contact();

-- Existing brands: contact columns → primary contact rows. Their status
-- and dates come along, so follow-ups already scheduled keep their date.
DO $$
BEGIN
  PERFORM set_config('outreach.allow_deleted_write', 'on', true);
  PERFORM set_config('outreach.contact_seed', 'on', true);
  INSERT INTO outreach_brand_contacts (
    lead_id, first_name, last_name, title, email, linkedin, is_primary, status,
    date_contacted, follow_up_date, followed_up_date, replied_at, mailbox_id, channel, source)
  SELECT b.lead_id,
         nullif(split_part(btrim(coalesce(b.contact_name, '')), ' ', 1), ''),
         nullif(btrim(substr(btrim(coalesce(b.contact_name, '')), length(split_part(btrim(coalesce(b.contact_name, '')), ' ', 1)) + 1)), ''),
         b.role, b.email, b.linkedin,
         NOT EXISTS (SELECT 1 FROM outreach_brand_contacts p WHERE p.lead_id = b.lead_id AND p.is_primary),
         CASE WHEN b.status IN ('call_booked', 'won') THEN 'replied' ELSE b.status END,
         b.date_contacted, b.follow_up_date, b.followed_up_date, b.replied_at, b.mailbox_id, b.channel, b.source
  FROM outreach_brands b
  WHERE coalesce(b.contact_name, b.email, b.linkedin) IS NOT NULL
    -- not already a contact (re-run, or an extra contact with the same email)
    AND NOT EXISTS (
      SELECT 1 FROM outreach_brand_contacts c
      WHERE c.lead_id = b.lead_id
        AND (c.is_primary OR (c.email_norm IS NOT NULL AND c.email_norm = b.email_norm)));
  PERFORM set_config('outreach.contact_seed', 'off', true);
  PERFORM set_config('outreach.allow_deleted_write', 'off', true);
END $$;

-- Contacts from the earlier Database schema had no key: claim one. On a
-- clash the email moves into the notes, so the migration never fails.
DO $$
DECLARE
  r RECORD;
BEGIN
  PERFORM set_config('outreach.allow_deleted_write', 'on', true);
  PERFORM set_config('outreach.contact_seed', 'on', true);
  FOR r IN SELECT c.id, c.lead_id, c.email FROM outreach_brand_contacts c
           WHERE c.email IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM outreach_keys k WHERE k.contact_id = c.id) LOOP
    BEGIN
      UPDATE outreach_brand_contacts SET email_norm = NULL WHERE id = r.id; -- re-runs both triggers
    EXCEPTION WHEN unique_violation THEN
      UPDATE outreach_brand_contacts
      SET email = NULL, notes = concat_ws(E'\n', notes, 'Email ' || r.email || ' was already used by another lead.')
      WHERE id = r.id;
    END;
  END LOOP;
  -- Every brand with contacts: one primary, mirrored onto the brand.
  UPDATE outreach_brand_contacts c SET is_primary = true
  WHERE c.id IN (
    SELECT DISTINCT ON (x.lead_id) x.id FROM outreach_brand_contacts x
    WHERE NOT EXISTS (SELECT 1 FROM outreach_brand_contacts p WHERE p.lead_id = x.lead_id AND p.is_primary)
    ORDER BY x.lead_id, x.created_at, x.id);
  PERFORM set_config('outreach.contact_seed', 'off', true);
  PERFORM set_config('outreach.allow_deleted_write', 'off', true);
END $$;

-- ── 4. Brand status from its contacts ─────────────────────────────────────────
-- Furthest along wins: replied > followed_up > contacted. When no contact
-- got that far, an end state beats "found" (not_interested > opted_out >
-- bounced > no_reply). call_booked / won are brand-level and never drop.
-- Dates: first contact, earliest pending follow-up, last follow-up, first reply.
CREATE OR REPLACE FUNCTION outreach_brand_rollup(p_lead_id VARCHAR) RETURNS VARCHAR
LANGUAGE plpgsql AS $$
DECLARE
  v_cur VARCHAR;
  v_new VARCHAR;
  v     RECORD;
BEGIN
  SELECT status INTO v_cur FROM outreach_brands WHERE lead_id = p_lead_id;
  SELECT count(*) AS n,
         bool_or(status = 'replied') AS r, bool_or(status = 'followed_up') AS fu, bool_or(status = 'contacted') AS c,
         bool_or(status = 'not_interested') AS ni, bool_or(status = 'opted_out') AS oo,
         bool_or(status = 'bounced') AS bo, bool_or(status = 'no_reply') AS nr,
         min(date_contacted) AS dc, min(follow_up_date) FILTER (WHERE status = 'contacted') AS fud,
         max(followed_up_date) AS fd, min(replied_at) AS ra
    INTO v FROM outreach_brand_contacts WHERE lead_id = p_lead_id;
  IF v.n = 0 THEN RETURN v_cur; END IF;
  v_new := CASE WHEN v.r THEN 'replied' WHEN v.fu THEN 'followed_up' WHEN v.c THEN 'contacted'
                WHEN v.ni THEN 'not_interested' WHEN v.oo THEN 'opted_out' WHEN v.bo THEN 'bounced'
                WHEN v.nr THEN 'no_reply' ELSE 'found' END;
  IF v_cur IN ('call_booked', 'won') THEN v_new := v_cur; END IF;
  UPDATE outreach_brands SET status = v_new, date_contacted = v.dc, follow_up_date = v.fud,
    followed_up_date = v.fd, replied_at = v.ra
  WHERE lead_id = p_lead_id;
  RETURN v_new;
END;
$$;

-- ── 5. outreach_log_action (replaced) ─────────────────────────────────────────
-- Same as outreach_migration.sql, plus:
--   - the mailbox limit counts sends in the last N hours
--     (outreach_mailbox_window_hours()), not since Karachi midnight;
--     outreach_mailbox_full's DETAIL is "sent/limit/next_free_at"
--   - brands with contacts: contacted / followed_up / replied / bounced /
--     opted_out / not_interested apply to one contact (p_contact_id, or the
--     obvious one: the primary for a first contact, the contact due for a
--     follow-up, ...; outreach_contact_required when there is none). The
--     brand status then follows its contacts (outreach_brand_rollup).
DROP FUNCTION IF EXISTS outreach_log_action(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION outreach_log_action(
  p_lead_type  VARCHAR,
  p_lead_id    VARCHAR,
  p_user_id    VARCHAR,
  p_action     VARCHAR,
  p_mailbox_id VARCHAR DEFAULT NULL,
  p_channel    VARCHAR DEFAULT NULL,
  p_contact_id VARCHAR DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_today     DATE := (now() AT TIME ZONE 'Asia/Karachi')::date;
  v_hours     INTEGER := outreach_mailbox_window_hours();
  v_win_start TIMESTAMPTZ := now() - make_interval(hours => outreach_mailbox_window_hours());
  v_table     TEXT;
  v_is_send   BOOLEAN := p_action IN ('contacted', 'followed_up');
  v_lead      RECORD;
  v_c         RECORD;
  v_use_c     BOOLEAN := false;
  v_cid       VARCHAR;
  v_mb        RECORD;
  v_channel   VARCHAR;
  v_mailbox   VARCHAR;
  v_count     INTEGER;
  v_limit     INTEGER;
  v_next_free TIMESTAMPTZ;
  v_prev      JSONB;
  v_activity  VARCHAR;
  v_status    VARCHAR;
  v_email     TEXT;
  s_status VARCHAR; s_contacted DATE; s_follow DATE; s_followed DATE; s_replied TIMESTAMPTZ; s_mailbox VARCHAR; s_channel VARCHAR;
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

  -- Which contact this is about.
  IF p_lead_type = 'brand' AND p_action NOT IN ('call_booked', 'won')
     AND EXISTS (SELECT 1 FROM outreach_brand_contacts WHERE lead_id = p_lead_id) THEN
    v_use_c := true;
    IF p_contact_id IS NOT NULL THEN
      SELECT * INTO v_c FROM outreach_brand_contacts WHERE id = p_contact_id AND lead_id = p_lead_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'outreach_contact_not_found'; END IF;
    ELSE
      SELECT * INTO v_c FROM outreach_brand_contacts
      WHERE lead_id = p_lead_id AND CASE p_action
        WHEN 'contacted' THEN status = 'found'
        WHEN 'followed_up' THEN status = 'contacted'
        WHEN 'replied' THEN status IN ('contacted', 'followed_up', 'no_reply')
        ELSE status NOT IN ('bounced', 'opted_out', 'not_interested') END
      ORDER BY is_primary DESC, follow_up_date NULLS LAST, created_at, id
      LIMIT 1 FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'outreach_contact_required'; END IF;
    END IF;
    v_cid := v_c.id;
    s_status := v_c.status; s_contacted := v_c.date_contacted; s_follow := v_c.follow_up_date;
    s_followed := v_c.followed_up_date; s_replied := v_c.replied_at; s_mailbox := v_c.mailbox_id; s_channel := v_c.channel;
    v_email := v_c.email_norm;
  ELSE
    IF p_contact_id IS NOT NULL THEN RAISE EXCEPTION 'outreach_bad_action'; END IF;
    s_status := v_lead.status; s_contacted := v_lead.date_contacted; s_follow := v_lead.follow_up_date;
    s_followed := v_lead.followed_up_date; s_replied := v_lead.replied_at; s_mailbox := v_lead.mailbox_id; s_channel := v_lead.channel;
    v_email := v_lead.email_norm;
  END IF;

  v_channel := coalesce(p_channel, s_channel, v_lead.channel, 'email');
  IF v_channel NOT IN ('email', 'linkedin', 'x', 'instagram', 'tiktok') THEN
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;

  IF v_is_send THEN
    IF EXISTS (
      SELECT 1 FROM outreach_dnc d
      WHERE (d.key_type = 'email' AND d.key_value = v_email)
         OR (d.key_type = 'domain' AND d.key_value IN (split_part(v_email, '@', 2), v_lead.domain_norm))
         OR (d.key_type = 'profile_url' AND d.key_value = v_lead.profile_url_norm)
    ) THEN
      RAISE EXCEPTION 'outreach_dnc';
    END IF;
    IF p_action = 'followed_up' AND s_contacted IS NULL THEN
      RAISE EXCEPTION 'outreach_not_contacted';
    END IF;

    IF v_channel = 'email' THEN
      v_mailbox := coalesce(p_mailbox_id, s_mailbox, v_lead.mailbox_id);
      IF v_mailbox IS NULL THEN RAISE EXCEPTION 'outreach_mailbox_required'; END IF;
      SELECT id, start_date, is_personal, is_active, custom_limit
        INTO v_mb FROM outreach_mailboxes WHERE id = v_mailbox FOR UPDATE;
      IF NOT FOUND OR NOT v_mb.is_active THEN RAISE EXCEPTION 'outreach_mailbox_inactive'; END IF;
      v_limit := outreach_mailbox_limit(v_mb.start_date, v_mb.is_personal, v_mb.custom_limit, v_today);
      SELECT count(*) INTO v_count FROM outreach_activity
      WHERE mailbox_id = v_mailbox AND action IN ('contacted', 'followed_up')
        AND undone_at IS NULL AND created_at > v_win_start;
      IF v_count >= v_limit THEN
        SELECT created_at + make_interval(hours => v_hours) INTO v_next_free FROM outreach_activity
        WHERE mailbox_id = v_mailbox AND action IN ('contacted', 'followed_up')
          AND undone_at IS NULL AND created_at > v_win_start
        ORDER BY created_at, id OFFSET v_count - v_limit LIMIT 1;
        RAISE EXCEPTION 'outreach_mailbox_full' USING DETAIL = v_count || '/' || v_limit || '/' || coalesce(v_next_free::text, '');
      END IF;
      v_count := v_count + 1;
    ELSE
      v_mailbox := NULL; -- DMs don't use a mailbox
    END IF;
  ELSE
    -- Outcome actions inherit the mailbox/channel of the send they answer.
    v_mailbox := coalesce(s_mailbox, v_lead.mailbox_id);
    v_channel := coalesce(s_channel, v_lead.channel);
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
  IF v_use_c THEN
    v_prev := v_prev || jsonb_build_object('contact', jsonb_build_object(
      'id', v_cid, 'status', s_status, 'date_contacted', s_contacted, 'follow_up_date', s_follow,
      'followed_up_date', s_followed, 'replied_at', s_replied, 'mailbox_id', s_mailbox, 'channel', s_channel));
  END IF;

  n_date_contacted := CASE WHEN p_action = 'contacted' THEN v_today ELSE s_contacted END;
  -- One follow-up, 4 days after first contact. Any later action clears it.
  n_follow_up_date := CASE WHEN p_action = 'contacted' THEN v_today + 4 ELSE NULL END;
  n_followed_up_date := CASE WHEN p_action = 'followed_up' THEN v_today ELSE s_followed END;
  n_replied_at := CASE WHEN p_action = 'replied' THEN coalesce(s_replied, now()) ELSE s_replied END;

  IF v_use_c THEN
    UPDATE outreach_brand_contacts SET status = p_action, date_contacted = n_date_contacted,
      follow_up_date = n_follow_up_date, followed_up_date = n_followed_up_date, replied_at = n_replied_at,
      mailbox_id = CASE WHEN v_is_send THEN v_mailbox ELSE mailbox_id END,
      channel = CASE WHEN v_is_send THEN v_channel ELSE channel END
    WHERE id = v_cid;
    IF v_is_send THEN
      UPDATE outreach_brands SET mailbox_id = v_mailbox, channel = v_channel WHERE lead_id = p_lead_id;
    END IF;
    v_status := outreach_brand_rollup(p_lead_id);
  ELSE
    EXECUTE format(
      'UPDATE %I SET status = $1, date_contacted = $2, follow_up_date = $3, followed_up_date = $4,
         replied_at = $5, mailbox_id = $6, channel = $7 WHERE lead_id = $8', v_table)
    USING p_action, n_date_contacted, n_follow_up_date, n_followed_up_date, n_replied_at,
          CASE WHEN v_is_send THEN v_mailbox ELSE v_lead.mailbox_id END,
          CASE WHEN v_is_send THEN v_channel ELSE v_lead.channel END,
          p_lead_id;
    v_status := p_action;
  END IF;

  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, mailbox_id, channel, prev_state, contact_id)
  VALUES (p_lead_type, p_lead_id, p_user_id, p_action, v_mailbox, v_channel, v_prev, v_cid)
  RETURNING id INTO v_activity;

  -- Opt-out blocks every key of the lead (of the contact, for a contact).
  -- A bounce blocks the email only.
  IF p_action = 'opted_out' THEN
    INSERT INTO outreach_dnc (key_type, key_value, reason, lead_id, activity_id, created_by)
    SELECT k.t, k.v, 'opted_out', p_lead_id, v_activity, p_user_id
    FROM (VALUES ('email', v_email), ('profile_url', CASE WHEN v_use_c THEN NULL ELSE v_lead.profile_url_norm END)) AS k(t, v)
    WHERE k.v IS NOT NULL
    ON CONFLICT (key_type, key_value) DO NOTHING;
  ELSIF p_action = 'bounced' AND v_email IS NOT NULL THEN
    INSERT INTO outreach_dnc (key_type, key_value, reason, lead_id, activity_id, created_by)
    VALUES ('email', v_email, 'bounced', p_lead_id, v_activity, p_user_id)
    ON CONFLICT (key_type, key_value) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'activity_id', v_activity,
    'status', v_status,
    'contact_id', v_cid,
    'contact_status', CASE WHEN v_use_c THEN p_action END,
    'mailbox_id', v_mailbox,
    'mailbox_sent_today', v_count,
    'mailbox_limit', v_limit,
    'mailbox_window_hours', v_hours
  );
END;
$$;

-- ── 6. outreach_undo_action (replaced) ────────────────────────────────────────
-- Same as outreach_migration.sql, plus the contact's fields come back too.
CREATE OR REPLACE FUNCTION outreach_undo_action(p_activity_id VARCHAR, p_user_id VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_act    RECORD;
  v_latest VARCHAR;
  v_table  TEXT;
  v_prev   JSONB;
  v_c      JSONB;
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
    AND action NOT IN ('edited', 'db_edited', 'db_added', 'db_removed', 'contact_added', 'contact_edited', 'contact_removed')
  ORDER BY created_at DESC, id DESC LIMIT 1;
  IF v_latest IS DISTINCT FROM p_activity_id THEN RAISE EXCEPTION 'outreach_undo_not_latest'; END IF;

  v_prev := v_act.prev_state;
  EXECUTE format(
    'UPDATE %I SET status = $1, date_contacted = $2, follow_up_date = $3, followed_up_date = $4,
       replied_at = $5, mailbox_id = $6, channel = $7 WHERE lead_id = $8', v_table)
  USING v_prev->>'status', (v_prev->>'date_contacted')::date, (v_prev->>'follow_up_date')::date,
        (v_prev->>'followed_up_date')::date, (v_prev->>'replied_at')::timestamptz,
        v_prev->>'mailbox_id', v_prev->>'channel', v_act.lead_id;

  v_c := v_prev->'contact';
  IF v_c IS NOT NULL AND jsonb_typeof(v_c) = 'object' THEN
    UPDATE outreach_brand_contacts SET status = v_c->>'status', date_contacted = (v_c->>'date_contacted')::date,
      follow_up_date = (v_c->>'follow_up_date')::date, followed_up_date = (v_c->>'followed_up_date')::date,
      replied_at = (v_c->>'replied_at')::timestamptz, mailbox_id = v_c->>'mailbox_id', channel = v_c->>'channel'
    WHERE id = v_c->>'id';
  END IF;

  UPDATE outreach_activity SET undone_at = now() WHERE id = p_activity_id;
  DELETE FROM outreach_dnc WHERE activity_id = p_activity_id;

  RETURN jsonb_build_object('lead_id', v_act.lead_id, 'status', v_prev->>'status');
END;
$$;

-- ── 7. outreach_mark_no_reply (replaced) ──────────────────────────────────────
-- Same as outreach_delete_migration.sql, plus the rule runs per contact for
-- brands that have contacts; their brand status then follows the contacts.
CREATE OR REPLACE FUNCTION outreach_mark_no_reply() RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Karachi')::date;
  v_total INTEGER := 0;
  v_n     INTEGER;
  v_lead  VARCHAR;
BEGIN
  WITH upd AS (
    UPDATE outreach_creators SET status = 'no_reply'
    WHERE status = 'followed_up' AND replied_at IS NULL AND followed_up_date <= v_today - 7
      AND deleted_at IS NULL
    RETURNING lead_id, mailbox_id, channel
  )
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, mailbox_id, channel)
  SELECT 'creator', lead_id, NULL, 'no_reply', mailbox_id, channel FROM upd;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  -- Brands without contacts: the brand itself.
  WITH upd AS (
    UPDATE outreach_brands b SET status = 'no_reply'
    WHERE b.status = 'followed_up' AND b.replied_at IS NULL AND b.followed_up_date <= v_today - 7
      AND b.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM outreach_brand_contacts c WHERE c.lead_id = b.lead_id)
    RETURNING lead_id, mailbox_id, channel
  )
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, mailbox_id, channel)
  SELECT 'brand', lead_id, NULL, 'no_reply', mailbox_id, channel FROM upd;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  -- Brands with contacts: each contact.
  WITH upd AS (
    UPDATE outreach_brand_contacts c SET status = 'no_reply'
    FROM outreach_brands b
    WHERE b.lead_id = c.lead_id AND b.deleted_at IS NULL
      AND c.status = 'followed_up' AND c.replied_at IS NULL AND c.followed_up_date <= v_today - 7
    RETURNING c.id, c.lead_id, c.mailbox_id, c.channel
  )
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, mailbox_id, channel, contact_id)
  SELECT 'brand', lead_id, NULL, 'no_reply', mailbox_id, channel, id FROM upd;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  -- now() is fixed for the transaction, so these are exactly the rows above.
  FOR v_lead IN SELECT DISTINCT lead_id FROM outreach_activity
                WHERE action = 'no_reply' AND contact_id IS NOT NULL AND created_at = now() LOOP
    PERFORM outreach_brand_rollup(v_lead);
  END LOOP;

  RETURN v_total;
END;
$$;

-- ── 8. Contact edits ──────────────────────────────────────────────────────────
-- Status and dates move through outreach_log_action, never here.

CREATE OR REPLACE FUNCTION outreach_contact_check_brand(p_lead_id VARCHAR) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_deleted TIMESTAMPTZ;
BEGIN
  SELECT deleted_at INTO v_deleted FROM outreach_brands WHERE lead_id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'outreach_not_found'; END IF;
  IF v_deleted IS NOT NULL THEN RAISE EXCEPTION 'outreach_deleted' USING DETAIL = p_lead_id; END IF;
END;
$$;

-- Adds (p_contact_id NULL) or edits one contact. p_fields keys:
-- first_name, last_name, title, email, linkedin, notes, source, is_primary.
-- The first contact of a brand is its primary. Logged as contact_added /
-- contact_edited with changes = {field: {old, new}}. Returns the row.
CREATE OR REPLACE FUNCTION outreach_contact_save(
  p_lead_id VARCHAR, p_contact_id VARCHAR, p_user_id VARCHAR, p_fields JSONB
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_allowed TEXT[] := ARRAY['first_name', 'last_name', 'title', 'email', 'linkedin', 'notes', 'source', 'is_primary'];
  v_old     JSONB;
  v_new     JSONB;
  v_changes JSONB := '{}'::jsonb;
  v_id      VARCHAR;
  v_primary BOOLEAN;
  k         TEXT;
BEGIN
  IF jsonb_typeof(p_fields) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'outreach_bad_field'; END IF;
  FOR k IN SELECT jsonb_object_keys(p_fields) LOOP
    IF NOT k = ANY (v_allowed) THEN RAISE EXCEPTION 'outreach_bad_field' USING DETAIL = k; END IF;
  END LOOP;
  PERFORM outreach_contact_check_brand(p_lead_id);

  IF p_contact_id IS NULL THEN
    v_primary := coalesce((p_fields->>'is_primary')::boolean, false)
                 OR NOT EXISTS (SELECT 1 FROM outreach_brand_contacts WHERE lead_id = p_lead_id);
    IF v_primary THEN
      UPDATE outreach_brand_contacts SET is_primary = false WHERE lead_id = p_lead_id AND is_primary;
    END IF;
    INSERT INTO outreach_brand_contacts (lead_id, first_name, last_name, title, email, linkedin, notes, source, is_primary, created_by)
    VALUES (p_lead_id, p_fields->>'first_name', p_fields->>'last_name', p_fields->>'title', p_fields->>'email',
            p_fields->>'linkedin', p_fields->>'notes', coalesce(p_fields->>'source', 'manual'), v_primary, p_user_id)
    RETURNING id, to_jsonb(outreach_brand_contacts.*) INTO v_id, v_new;
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, contact_id, changes)
    VALUES ('brand', p_lead_id, p_user_id, 'contact_added', v_id,
            jsonb_build_object('contact', jsonb_build_object('old', NULL,
              'new', v_new - ARRAY['email_norm', 'created_at', 'updated_at', 'created_by'])));
    RETURN v_new;
  END IF;

  SELECT to_jsonb(c) INTO v_old FROM outreach_brand_contacts c WHERE id = p_contact_id AND lead_id = p_lead_id FOR UPDATE;
  IF v_old IS NULL THEN RAISE EXCEPTION 'outreach_contact_not_found'; END IF;
  FOR k IN SELECT jsonb_object_keys(p_fields) LOOP
    IF coalesce(v_old -> k, 'null'::jsonb) IS DISTINCT FROM coalesce(p_fields -> k, 'null'::jsonb) THEN
      v_changes := v_changes || jsonb_build_object(k, jsonb_build_object('old', v_old -> k, 'new', p_fields -> k));
    END IF;
  END LOOP;
  IF v_changes = '{}'::jsonb THEN RETURN v_old; END IF;

  IF (p_fields->>'is_primary')::boolean IS TRUE AND NOT (v_old->>'is_primary')::boolean THEN
    UPDATE outreach_brand_contacts SET is_primary = false WHERE lead_id = p_lead_id AND is_primary;
  END IF;
  UPDATE outreach_brand_contacts c SET
    first_name = CASE WHEN p_fields ? 'first_name' THEN p_fields->>'first_name' ELSE c.first_name END,
    last_name  = CASE WHEN p_fields ? 'last_name' THEN p_fields->>'last_name' ELSE c.last_name END,
    title      = CASE WHEN p_fields ? 'title' THEN p_fields->>'title' ELSE c.title END,
    email      = CASE WHEN p_fields ? 'email' THEN p_fields->>'email' ELSE c.email END,
    linkedin   = CASE WHEN p_fields ? 'linkedin' THEN p_fields->>'linkedin' ELSE c.linkedin END,
    notes      = CASE WHEN p_fields ? 'notes' THEN p_fields->>'notes' ELSE c.notes END,
    source     = CASE WHEN p_fields ? 'source' THEN p_fields->>'source' ELSE c.source END,
    -- A primary contact stops being primary only when another one takes over.
    is_primary = CASE WHEN p_fields ? 'is_primary' AND (p_fields->>'is_primary')::boolean THEN true ELSE c.is_primary END
  WHERE id = p_contact_id
  RETURNING to_jsonb(c.*) INTO v_new;

  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, contact_id, changes)
  VALUES ('brand', p_lead_id, p_user_id, 'contact_edited', p_contact_id, v_changes);
  RETURN v_new;
END;
$$;

-- Removes a contact. When it was the primary, the oldest other contact
-- takes over. Logged with the removed row.
CREATE OR REPLACE FUNCTION outreach_contact_delete(p_lead_id VARCHAR, p_contact_id VARCHAR, p_user_id VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_old JSONB;
BEGIN
  PERFORM outreach_contact_check_brand(p_lead_id);
  DELETE FROM outreach_brand_contacts c WHERE id = p_contact_id AND lead_id = p_lead_id RETURNING to_jsonb(c.*) INTO v_old;
  IF v_old IS NULL THEN RAISE EXCEPTION 'outreach_contact_not_found'; END IF;
  IF (v_old->>'is_primary')::boolean THEN
    UPDATE outreach_brand_contacts SET is_primary = true
    WHERE id = (SELECT id FROM outreach_brand_contacts WHERE lead_id = p_lead_id ORDER BY created_at, id LIMIT 1);
  END IF;
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, contact_id, changes)
  VALUES ('brand', p_lead_id, p_user_id, 'contact_removed', p_contact_id,
          jsonb_build_object('contact', jsonb_build_object(
            'old', v_old - ARRAY['email_norm', 'created_at', 'updated_at', 'created_by'], 'new', NULL)));
  PERFORM outreach_brand_rollup(p_lead_id);
  RETURN v_old;
END;
$$;

-- ── 9. Lists ──────────────────────────────────────────────────────────────────
-- Which list a lead came from, to compare results. Set from the import
-- file name when a lead is inserted with no list (outreach_import() passes
-- the file name as source), so every insert path gets one.
ALTER TABLE outreach_creators ADD COLUMN IF NOT EXISTS list VARCHAR(30);
ALTER TABLE outreach_brands   ADD COLUMN IF NOT EXISTS list VARCHAR(30);

-- Mirrored by listFromSource() in src/lib/outreach/rules.ts.
CREATE OR REPLACE FUNCTION outreach_list_from_source(p_lead_type TEXT, p_source TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_lead_type = 'brand' AND s LIKE 'yc_brands%' THEN 'yc'
    WHEN p_lead_type = 'brand' AND s LIKE 'sponsor_brands%' THEN 'sponsor'
    WHEN p_lead_type = 'brand' AND s LIKE 'apollo%' THEN 'apollo'
    WHEN p_lead_type = 'creator' AND s LIKE 'creators_review%' THEN 'creators_review'
    WHEN p_lead_type = 'creator' AND s LIKE 'creators%' THEN 'creators_new'
    ELSE 'manual'
  END
  FROM (SELECT lower(btrim(coalesce(p_source, ''))) AS s) x
$$;

CREATE OR REPLACE FUNCTION outreach_set_list_on_insert() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.list IS NULL THEN NEW.list := outreach_list_from_source(TG_ARGV[0], NEW.source); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS outreach_creators_set_list ON outreach_creators;
CREATE TRIGGER outreach_creators_set_list BEFORE INSERT ON outreach_creators
  FOR EACH ROW EXECUTE FUNCTION outreach_set_list_on_insert('creator');
DROP TRIGGER IF EXISTS outreach_brands_set_list ON outreach_brands;
CREATE TRIGGER outreach_brands_set_list BEFORE INSERT ON outreach_brands
  FOR EACH ROW EXECUTE FUNCTION outreach_set_list_on_insert('brand');

-- Backfill (deleted leads too: their stats still count).
DO $$
BEGIN
  PERFORM set_config('outreach.allow_deleted_write', 'on', true);
  UPDATE outreach_creators SET list = outreach_list_from_source('creator', source) WHERE list IS NULL;
  UPDATE outreach_brands   SET list = outreach_list_from_source('brand', source) WHERE list IS NULL;
  PERFORM set_config('outreach.allow_deleted_write', 'off', true);
END $$;

ALTER TABLE outreach_creators ALTER COLUMN list SET NOT NULL;
ALTER TABLE outreach_brands   ALTER COLUMN list SET NOT NULL;
ALTER TABLE outreach_creators DROP CONSTRAINT IF EXISTS outreach_creators_list_check;
ALTER TABLE outreach_creators ADD CONSTRAINT outreach_creators_list_check CHECK (list IN ('creators_new', 'creators_review', 'manual'));
ALTER TABLE outreach_brands DROP CONSTRAINT IF EXISTS outreach_brands_list_check;
ALTER TABLE outreach_brands ADD CONSTRAINT outreach_brands_list_check CHECK (list IN ('yc', 'sponsor', 'apollo', 'manual'));
CREATE INDEX IF NOT EXISTS outreach_creators_list_idx ON outreach_creators (list);
CREATE INDEX IF NOT EXISTS outreach_brands_list_idx ON outreach_brands (list);

-- Admin list change for up to 1,000 leads, one 'edited' row per lead that
-- changed. Returns the number changed.
CREATE OR REPLACE FUNCTION outreach_set_list(p_lead_type VARCHAR, p_lead_ids TEXT[], p_list VARCHAR, p_user_id VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_n INTEGER;
BEGIN
  IF coalesce(array_length(p_lead_ids, 1), 0) > 1000 THEN RAISE EXCEPTION 'outreach_too_many'; END IF;
  IF p_lead_type = 'creator' THEN
    IF p_list NOT IN ('creators_new', 'creators_review', 'manual') THEN RAISE EXCEPTION 'outreach_bad_field'; END IF;
    WITH prev AS (
      SELECT lead_id, list FROM outreach_creators WHERE lead_id = ANY (p_lead_ids) AND list <> p_list FOR UPDATE
    ), upd AS (
      UPDATE outreach_creators c SET list = p_list FROM prev WHERE c.lead_id = prev.lead_id RETURNING c.lead_id, prev.list AS old_list
    )
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, changes)
    SELECT 'creator', lead_id, p_user_id, 'edited', jsonb_build_object('list', jsonb_build_object('old', old_list, 'new', p_list)) FROM upd;
  ELSIF p_lead_type = 'brand' THEN
    IF p_list NOT IN ('yc', 'sponsor', 'apollo', 'manual') THEN RAISE EXCEPTION 'outreach_bad_field'; END IF;
    WITH prev AS (
      SELECT lead_id, list FROM outreach_brands WHERE lead_id = ANY (p_lead_ids) AND list <> p_list FOR UPDATE
    ), upd AS (
      UPDATE outreach_brands b SET list = p_list FROM prev WHERE b.lead_id = prev.lead_id RETURNING b.lead_id, prev.list AS old_list
    )
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, changes)
    SELECT 'brand', lead_id, p_user_id, 'edited', jsonb_build_object('list', jsonb_build_object('old', old_list, 'new', p_list)) FROM upd;
  ELSE
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

-- Results per list (is_total) and per list per person (user_id NULL there = unassigned),
-- for today / this week / this month (Karachi day boundaries, passed in).
-- leads = new leads (by owner); the rest = distinct leads with that action
-- (by who logged it), so several contacts at one brand count once.
CREATE OR REPLACE FUNCTION outreach_list_stats(
  p_today_start TIMESTAMPTZ, p_week_start TIMESTAMPTZ, p_month_start TIMESTAMPTZ
) RETURNS TABLE (lead_type VARCHAR, list VARCHAR, user_id VARCHAR, is_total BOOLEAN, metric VARCHAR, today BIGINT, week BIGINT, month BIGINT)
LANGUAGE sql STABLE AS $$
  WITH leads AS (
    SELECT 'creator'::varchar AS lead_type, lead_id, list, owner_user_id, created_at FROM outreach_creators
    UNION ALL
    SELECT 'brand', lead_id, list, owner_user_id, created_at FROM outreach_brands
  ), ev AS (
    SELECT l.lead_type, l.list, l.owner_user_id AS user_id, 'leads'::varchar AS metric, l.lead_id, l.created_at
    FROM leads l WHERE l.created_at >= LEAST(p_week_start, p_month_start)
    UNION ALL
    SELECT a.lead_type, l.list, a.user_id, a.action, a.lead_id, a.created_at
    FROM outreach_activity a
    JOIN leads l ON l.lead_type = a.lead_type AND l.lead_id = a.lead_id
    WHERE a.undone_at IS NULL AND a.created_at >= LEAST(p_week_start, p_month_start)
      AND a.action IN ('contacted', 'replied', 'call_booked', 'won', 'signed_up')
  )
  SELECT ev.lead_type, ev.list, ev.user_id, GROUPING(ev.user_id) = 1, ev.metric,
         count(DISTINCT ev.lead_id) FILTER (WHERE ev.created_at >= p_today_start),
         count(DISTINCT ev.lead_id) FILTER (WHERE ev.created_at >= p_week_start),
         count(DISTINCT ev.lead_id) FILTER (WHERE ev.created_at >= p_month_start)
  FROM ev
  GROUP BY GROUPING SETS ((ev.lead_type, ev.list, ev.metric, ev.user_id), (ev.lead_type, ev.list, ev.metric))
$$;

-- ── 10. Apollo contacts import ────────────────────────────────────────────────
-- p_rows: [{_row, company, website, domain, team_size, first_name, last_name,
-- title, email, linkedin, owner_user_id}], validated by the API.
-- Each row finds its brand by normalised domain, then website, then exact
-- company name (case-insensitive). Found: the person is added as a contact
-- and only EMPTY brand fields are filled (company, website, domain,
-- team_size); the brand's list never changes. Not found: a new brand with
-- list 'apollo'. A contact whose email already exists anywhere (or earlier
-- in the file) is skipped as a duplicate; DNC hits are skipped.
-- p_commit = false is the preview: nothing is written, same report.
CREATE OR REPLACE FUNCTION outreach_import_contacts(
  p_rows JSONB, p_source VARCHAR, p_user_id VARCHAR, p_commit BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  r          JSONB;
  v_row      JSONB;
  v_domain   TEXT;
  v_web      TEXT;
  v_company  TEXT;
  v_email    TEXT;
  v_lead     VARCHAR;
  v_deleted  TIMESTAMPTZ;
  v_is_new   BOOLEAN;
  v_key      TEXT;
  v_new_n    INTEGER := 0;
  v_seen     JSONB := '{}'::jsonb;  -- emails earlier in this file
  v_newmap   JSONB := '{}'::jsonb;  -- "d:domain" / "w:url" / "c:company" → pseudo id of a brand created by this file
  v_existing JSONB := '{}'::jsonb;  -- lead_id → {lead_id, company, contacts}
  v_created  JSONB := '{}'::jsonb;  -- pseudo id → {lead_id, company, contacts}
  v_dup      JSONB := '[]'::jsonb;
  v_dnc      JSONB := '[]'::jsonb;
  v_err      JSONB := '[]'::jsonb;
  v_hit      RECORD;
  s_created  JSONB;
  s_newmap   JSONB;
  s_new_n    INTEGER;
BEGIN
  IF jsonb_array_length(p_rows) > 5000 THEN RAISE EXCEPTION 'outreach_import_too_large'; END IF;

  FOR r IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_row := r->'_row';
    v_domain := outreach_norm_domain(coalesce(nullif(btrim(r->>'domain'), ''), r->>'website'));
    v_web := outreach_norm_url(r->>'website');
    v_company := nullif(lower(btrim(coalesce(r->>'company', ''))), '');
    v_email := outreach_norm_email(r->>'email');

    -- 1. Contact duplicates: anywhere in outreach_keys, or earlier in the file.
    IF v_email IS NOT NULL THEN
      SELECT k.lead_id INTO v_hit FROM outreach_keys k WHERE k.key_type = 'email' AND k.key_value = v_email;
      IF FOUND THEN
        v_dup := v_dup || jsonb_build_object('row', v_row, 'email', v_email, 'lead_id', v_hit.lead_id);
        CONTINUE;
      END IF;
      IF v_seen ? v_email THEN
        v_dup := v_dup || jsonb_build_object('row', v_row, 'email', v_email, 'same_as_row', v_seen->v_email);
        CONTINUE;
      END IF;
      SELECT d.key_type, d.key_value INTO v_hit FROM outreach_dnc d
      WHERE (d.key_type = 'email' AND d.key_value = v_email)
         OR (d.key_type = 'domain' AND d.key_value = split_part(v_email, '@', 2))
      LIMIT 1;
      IF FOUND THEN
        v_dnc := v_dnc || jsonb_build_object('row', v_row, 'key', v_hit.key_type || ':' || v_hit.key_value);
        CONTINUE;
      END IF;
    END IF;

    -- 2. The brand: one created earlier in this file, else an existing one.
    v_lead := NULL; v_deleted := NULL; v_is_new := false;
    v_key := coalesce(v_newmap->>('d:' || v_domain), v_newmap->>('w:' || v_web), v_newmap->>('c:' || v_company));
    IF v_key IS NOT NULL THEN
      v_lead := v_created->v_key->>'lead_id';
      v_is_new := true;
    END IF;
    IF v_lead IS NULL AND v_domain IS NOT NULL THEN
      SELECT lead_id, deleted_at INTO v_lead, v_deleted FROM outreach_brands WHERE domain_norm = v_domain LIMIT 1;
    END IF;
    IF v_lead IS NULL AND v_web IS NOT NULL THEN
      SELECT lead_id, deleted_at INTO v_lead, v_deleted FROM outreach_brands
      WHERE outreach_norm_url(website) = v_web ORDER BY deleted_at NULLS FIRST, created_at LIMIT 1;
    END IF;
    IF v_lead IS NULL AND v_company IS NOT NULL THEN
      SELECT lead_id, deleted_at INTO v_lead, v_deleted FROM outreach_brands
      WHERE lower(btrim(company)) = v_company ORDER BY deleted_at NULLS FIRST, created_at LIMIT 1;
    END IF;
    IF v_deleted IS NOT NULL THEN
      v_err := v_err || jsonb_build_object('row', v_row, 'reason', 'Matches deleted brand ' || v_lead || '. An admin restores it first.');
      CONTINUE;
    END IF;
    IF v_lead IS NULL AND v_domain IS NOT NULL AND EXISTS (
      SELECT 1 FROM outreach_dnc d WHERE d.key_type = 'domain' AND d.key_value = v_domain) THEN
      v_dnc := v_dnc || jsonb_build_object('row', v_row, 'key', 'domain:' || v_domain);
      CONTINUE;
    END IF;

    -- 3. Write (commit) or simulate (preview). On a failure the
    -- savepoint undoes the writes; s_* puts the report state back too.
    s_created := v_created; s_newmap := v_newmap; s_new_n := v_new_n;
    BEGIN
      IF v_lead IS NULL THEN
        v_new_n := v_new_n + 1;
        IF p_commit THEN
          INSERT INTO outreach_brands (company, website, domain, team_size, owner_user_id, source, list)
          VALUES (r->>'company', r->>'website', nullif(r->>'domain', ''), r->>'team_size',
                  nullif(r->>'owner_user_id', ''), p_source, 'apollo')
          RETURNING lead_id INTO v_lead;
        ELSE
          v_lead := 'new-' || v_new_n;
        END IF;
        v_key := 'n' || v_new_n;
        v_created := v_created || jsonb_build_object(v_key, jsonb_build_object('lead_id', v_lead, 'company', r->>'company', 'contacts', 0));
        IF v_domain IS NOT NULL THEN v_newmap := v_newmap || jsonb_build_object('d:' || v_domain, v_key); END IF;
        IF v_web IS NOT NULL THEN v_newmap := v_newmap || jsonb_build_object('w:' || v_web, v_key); END IF;
        IF v_company IS NOT NULL THEN v_newmap := v_newmap || jsonb_build_object('c:' || v_company, v_key); END IF;
        v_is_new := true;
      ELSIF p_commit AND NOT v_is_new THEN
        -- Fill empty fields only. A domain another brand holds is left out.
        BEGIN
          UPDATE outreach_brands SET
            company = coalesce(nullif(btrim(company), ''), r->>'company'),
            website = coalesce(nullif(btrim(website), ''), r->>'website'),
            domain = coalesce(nullif(btrim(domain), ''), nullif(r->>'domain', '')),
            team_size = coalesce(nullif(btrim(team_size), ''), r->>'team_size')
          WHERE lead_id = v_lead
            AND (coalesce(btrim(company), '') = '' OR coalesce(btrim(website), '') = ''
                 OR coalesce(btrim(domain), '') = '' OR coalesce(btrim(team_size), '') = '');
        EXCEPTION WHEN unique_violation THEN
          UPDATE outreach_brands SET
            company = coalesce(nullif(btrim(company), ''), r->>'company'),
            team_size = coalesce(nullif(btrim(team_size), ''), r->>'team_size')
          WHERE lead_id = v_lead;
        END;
      END IF;

      IF p_commit THEN
        INSERT INTO outreach_brand_contacts (lead_id, first_name, last_name, title, email, linkedin, source, is_primary, created_by)
        VALUES (v_lead, r->>'first_name', r->>'last_name', r->>'title', r->>'email', r->>'linkedin', p_source,
                NOT EXISTS (SELECT 1 FROM outreach_brand_contacts WHERE lead_id = v_lead), p_user_id);
      END IF;
    EXCEPTION
      WHEN unique_violation THEN
        v_created := s_created; v_newmap := s_newmap; v_new_n := s_new_n;
        v_dup := v_dup || jsonb_build_object('row', v_row, 'email', v_email, 'lead_id', NULL);
        CONTINUE;
      WHEN raise_exception THEN
        v_created := s_created; v_newmap := s_newmap; v_new_n := s_new_n;
        IF SQLERRM = 'outreach_dnc' THEN
          v_dnc := v_dnc || jsonb_build_object('row', v_row, 'key', 'domain:' || coalesce(v_domain, ''));
          CONTINUE;
        END IF;
        RAISE;
    END;

    IF v_email IS NOT NULL THEN v_seen := v_seen || jsonb_build_object(v_email, v_row); END IF;
    IF v_is_new THEN
      v_key := coalesce(v_newmap->>('d:' || v_domain), v_newmap->>('w:' || v_web), v_newmap->>('c:' || v_company));
      v_created := jsonb_set(v_created, ARRAY[v_key, 'contacts'], to_jsonb((v_created->v_key->>'contacts')::int + 1));
    ELSE
      v_existing := v_existing || jsonb_build_object(v_lead, jsonb_build_object(
        'lead_id', v_lead,
        'company', coalesce(v_existing->v_lead->>'company', (SELECT company FROM outreach_brands WHERE lead_id = v_lead)),
        'contacts', coalesce((v_existing->v_lead->>'contacts')::int, 0) + 1));
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'existing', coalesce((SELECT jsonb_agg(value ORDER BY value->>'company') FROM jsonb_each(v_existing)), '[]'::jsonb),
    'created', coalesce((SELECT jsonb_agg(value ORDER BY value->>'company') FROM jsonb_each(v_created)), '[]'::jsonb),
    'duplicates', v_dup,
    'dnc', v_dnc,
    'errors', v_err
  );
END;
$$;

-- ── 11. Replaced: outreach_erase_lead ─────────────────────────────────────────
-- Same as outreach_database_migration.sql, plus every contact's email goes
-- on the DNC list and the contacts are deleted.
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

  -- true = this transaction only
  PERFORM set_config('outreach.allow_deleted_write', 'on', true);

  INSERT INTO outreach_dnc (key_type, key_value, reason, lead_id, created_by)
  SELECT k.t, k.v, 'removal_request', p_lead_id, p_user_id
  FROM (VALUES ('email', v_email), ('profile_url', v_url)) AS k(t, v)
  WHERE k.v IS NOT NULL
  ON CONFLICT (key_type, key_value) DO NOTHING;

  IF p_lead_type = 'creator' THEN
    UPDATE outreach_creators SET
      name = NULL, profile_url = NULL, email = NULL, instagram = NULL, x = NULL,
      linkedin = NULL, tiktok = NULL, website = NULL, sponsor_brands = NULL, notes = NULL,
      extra = '{}'::jsonb, follow_up_date = NULL,
      status = CASE WHEN status IN ('not_interested', 'no_reply', 'bounced', 'opted_out') THEN status ELSE 'opted_out' END
    WHERE lead_id = p_lead_id;
    DELETE FROM outreach_creator_db WHERE lead_id = p_lead_id; -- rates go with it (cascade)
  ELSE
    INSERT INTO outreach_dnc (key_type, key_value, reason, lead_id, created_by)
    SELECT 'email', c.email_norm, 'removal_request', p_lead_id, p_user_id
    FROM outreach_brand_contacts c WHERE c.lead_id = p_lead_id AND c.email_norm IS NOT NULL
    ON CONFLICT (key_type, key_value) DO NOTHING;
    DELETE FROM outreach_brand_contacts WHERE lead_id = p_lead_id;
    -- Brand extra holds company facts (batch, tags, yc_url), not personal data.
    UPDATE outreach_brands SET
      contact_name = NULL, role = NULL, email = NULL, linkedin = NULL, notes = NULL,
      follow_up_date = NULL,
      status = CASE WHEN status IN ('not_interested', 'no_reply', 'bounced', 'opted_out') THEN status ELSE 'opted_out' END
    WHERE lead_id = p_lead_id;
    UPDATE outreach_brand_db SET notes = NULL, updated_at = now() WHERE lead_id = p_lead_id;
  END IF;

  PERFORM set_config('outreach.allow_deleted_write', 'off', true);

  -- Edit history holds old values (e.g. a previous email): clear those too.
  UPDATE outreach_activity SET changes = NULL
  WHERE lead_type = p_lead_type AND lead_id = p_lead_id AND changes IS NOT NULL;

  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action)
  VALUES (p_lead_type, p_lead_id, p_user_id, 'erased');
END;
$$;

-- ── 12. Replaced: outreach_db_item (no 'contact' kind any more) ───────────────
-- Same as outreach_database_migration.sql without the contact branch:
-- contacts go through outreach_contact_save() / outreach_contact_delete().
CREATE OR REPLACE FUNCTION outreach_db_item(
  p_lead_type VARCHAR, p_lead_id VARCHAR, p_user_id VARCHAR, p_kind VARCHAR, p_item_id VARCHAR, p_row JSONB
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_parent  TEXT;
  v_table   TEXT;
  v_allowed TEXT[];
  v_meta    TEXT[] := ARRAY['lead_id', 'created_by', 'created_at', 'updated_at'];
  v_old     JSONB;
  v_new     JSONB;
  v_found   BOOLEAN;
  k         TEXT;
BEGIN
  IF p_lead_type = 'creator' AND p_kind = 'rate' THEN
    v_parent := 'outreach_creator_db'; v_table := 'outreach_creator_rates';
    v_allowed := ARRAY['platform', 'format', 'price', 'currency', 'usage_rights', 'usage_note', 'quoted_at'];
  ELSIF p_lead_type = 'brand' AND p_kind = 'campaign' THEN
    v_parent := 'outreach_brand_db'; v_table := 'outreach_brand_campaigns';
    v_allowed := ARRAY['title', 'run_date', 'creators_used', 'total_budget', 'currency', 'result_notes'];
  ELSE
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;

  IF p_row IS NOT NULL THEN
    IF jsonb_typeof(p_row) <> 'object' THEN RAISE EXCEPTION 'outreach_bad_field'; END IF;
    FOR k IN SELECT jsonb_object_keys(p_row) LOOP
      IF NOT k = ANY (v_allowed) THEN RAISE EXCEPTION 'outreach_bad_field' USING DETAIL = k; END IF;
    END LOOP;
  END IF;

  EXECUTE format('SELECT true FROM %I WHERE lead_id = $1 AND removed_at IS NULL FOR UPDATE', v_parent)
    INTO v_found USING p_lead_id;
  IF v_found IS NULL THEN RAISE EXCEPTION 'outreach_db_not_found'; END IF;

  IF p_item_id IS NULL THEN
    IF p_row IS NULL THEN RAISE EXCEPTION 'outreach_bad_field'; END IF;
    v_new := p_row || jsonb_build_object('id', gen_random_uuid()::text, 'lead_id', p_lead_id, 'created_by', p_user_id,
                                         'created_at', now(), 'updated_at', now());
    EXECUTE format(
      'INSERT INTO %1$I (%2$s) SELECT %2$s FROM jsonb_populate_record(NULL::%1$I, $1) RETURNING to_jsonb(%1$I.*)',
      v_table,
      (SELECT string_agg(quote_ident(c), ', ') FROM jsonb_object_keys(v_new) AS c)
    ) INTO v_new USING v_new;
  ELSE
    EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE id = $1 AND lead_id = $2 FOR UPDATE', v_table)
      INTO v_old USING p_item_id, p_lead_id;
    IF v_old IS NULL THEN RAISE EXCEPTION 'outreach_db_item_not_found'; END IF;

    IF p_row IS NULL THEN
      EXECUTE format('DELETE FROM %I WHERE id = $1', v_table) USING p_item_id;
    ELSE
      EXECUTE format(
        'UPDATE %1$I SET (%2$s, updated_at) = (SELECT %3$s, now() FROM jsonb_populate_record(NULL::%1$I, $1) r) WHERE id = $2 RETURNING to_jsonb(%1$I.*)',
        v_table,
        (SELECT string_agg(quote_ident(c), ', ') FROM unnest(v_allowed) AS c),
        (SELECT string_agg('r.' || quote_ident(c), ', ') FROM unnest(v_allowed) AS c)
      ) INTO v_new USING v_old || p_row, p_item_id;
      IF (v_new - v_meta) = (v_old - v_meta) THEN RETURN v_new; END IF;
    END IF;
  END IF;

  EXECUTE format('UPDATE %I SET updated_at = now() WHERE lead_id = $1', v_parent) USING p_lead_id;
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, changes)
  VALUES (p_lead_type, p_lead_id, p_user_id, 'db_edited',
          jsonb_build_object(p_kind, jsonb_build_object('old', v_old - v_meta, 'new', v_new - v_meta)));
  RETURN coalesce(v_new, v_old);
END;
$$;

-- Contacts have their own primary flag now.
DROP FUNCTION IF EXISTS outreach_db_make_primary(VARCHAR, VARCHAR, VARCHAR);

-- ── 13. Function grants (service_role only) ───────────────────────────────────
REVOKE ALL ON FUNCTION
  outreach_schema_version(),
  outreach_mailbox_window_hours(),
  outreach_mailbox_usage(),
  outreach_contacts_before_write(),
  outreach_claim_contact_key(TEXT, VARCHAR, VARCHAR),
  outreach_brand_mirror_contact(VARCHAR),
  outreach_contacts_after_write(),
  outreach_brands_before_write(),
  outreach_brands_sync_keys(),
  outreach_brands_seed_contact(),
  outreach_brand_rollup(VARCHAR),
  outreach_log_action(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR),
  outreach_undo_action(VARCHAR, VARCHAR),
  outreach_mark_no_reply(),
  outreach_contact_check_brand(VARCHAR),
  outreach_contact_save(VARCHAR, VARCHAR, VARCHAR, JSONB),
  outreach_contact_delete(VARCHAR, VARCHAR, VARCHAR),
  outreach_list_from_source(TEXT, TEXT),
  outreach_set_list_on_insert(),
  outreach_set_list(VARCHAR, TEXT[], VARCHAR, VARCHAR),
  outreach_list_stats(TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ),
  outreach_import_contacts(JSONB, VARCHAR, VARCHAR, BOOLEAN),
  outreach_erase_lead(VARCHAR, VARCHAR, VARCHAR),
  outreach_db_item(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB)
FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION
  outreach_schema_version(),
  outreach_mailbox_window_hours(),
  outreach_mailbox_usage(),
  outreach_contacts_before_write(),
  outreach_claim_contact_key(TEXT, VARCHAR, VARCHAR),
  outreach_brand_mirror_contact(VARCHAR),
  outreach_contacts_after_write(),
  outreach_brands_before_write(),
  outreach_brands_sync_keys(),
  outreach_brands_seed_contact(),
  outreach_brand_rollup(VARCHAR),
  outreach_log_action(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR),
  outreach_undo_action(VARCHAR, VARCHAR),
  outreach_mark_no_reply(),
  outreach_contact_check_brand(VARCHAR),
  outreach_contact_save(VARCHAR, VARCHAR, VARCHAR, JSONB),
  outreach_contact_delete(VARCHAR, VARCHAR, VARCHAR),
  outreach_list_from_source(TEXT, TEXT),
  outreach_set_list_on_insert(),
  outreach_set_list(VARCHAR, TEXT[], VARCHAR, VARCHAR),
  outreach_list_stats(TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ),
  outreach_import_contacts(JSONB, VARCHAR, VARCHAR, BOOLEAN),
  outreach_erase_lead(VARCHAR, VARCHAR, VARCHAR),
  outreach_db_item(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB)
TO service_role;
