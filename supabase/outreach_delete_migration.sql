-- ============================================================================
-- Outreach: soft delete + restore for leads
-- ============================================================================
-- Run AFTER supabase/outreach_migration.sql and
-- supabase/outreach_extra_migration.sql. Idempotent: safe to run more than
-- once. Run in the Supabase SQL Editor.
--
-- A deleted lead keeps its row, its outreach_keys entries and its activity:
--   - it still blocks duplicates (manual add, edit, import)
--   - it still appears in already_in_sheet.txt
--   - dashboard stats (built from outreach_activity) don't change
-- The API hides it from tables, Today, counts and exports. An admin
-- restores it from the "Deleted" filter.
--
-- What it adds:
--   1. deleted_at / deleted_by on outreach_creators and outreach_brands
--   2. activity actions 'deleted' and 'restored'
--   3. A guard trigger: a deleted lead can't be changed (actions, edits,
--      undo, bulk updates) until it is restored. Raises outreach_deleted.
--   4. outreach_delete_leads() / outreach_restore_leads(): up to 1,000 leads
--      per call, one activity row per lead
--   5. Replaced: outreach_mark_no_reply (skips deleted leads),
--      outreach_erase_lead (still works on a deleted lead),
--      outreach_match_keys (reports `deleted`), outreach_filter_values
--      (ignores deleted leads)
-- ============================================================================

-- ── 1. Columns ────────────────────────────────────────────────────────────────
-- users.id is VARCHAR(255) on the live database, so deleted_by is too.
ALTER TABLE outreach_creators ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE outreach_creators ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE outreach_brands   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE outreach_brands   ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS outreach_creators_deleted_idx ON outreach_creators (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_brands_deleted_idx   ON outreach_brands (deleted_at) WHERE deleted_at IS NOT NULL;

-- ── 2. Activity actions ───────────────────────────────────────────────────────
ALTER TABLE outreach_activity DROP CONSTRAINT IF EXISTS outreach_activity_action_check;
ALTER TABLE outreach_activity ADD CONSTRAINT outreach_activity_action_check CHECK (action IN (
  'contacted', 'followed_up', 'replied', 'signed_up', 'call_booked', 'won',
  'not_interested', 'bounced', 'opted_out', 'no_reply',
  'status_changed', 'owner_changed', 'erased', 'edited', 'deleted', 'restored'));

-- ── 3. Guard: no changes to a deleted lead ────────────────────────────────────
-- Allowed: the delete itself (OLD not deleted), a restore (NEW not deleted),
-- and outreach_erase_lead(), which sets outreach.allow_deleted_write for its
-- own transaction only.
CREATE OR REPLACE FUNCTION outreach_guard_deleted() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NOT NULL
     AND coalesce(current_setting('outreach.allow_deleted_write', true), '') <> 'on' THEN
    RAISE EXCEPTION 'outreach_deleted' USING DETAIL = OLD.lead_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS outreach_creators_guard_deleted ON outreach_creators;
CREATE TRIGGER outreach_creators_guard_deleted
  BEFORE UPDATE ON outreach_creators
  FOR EACH ROW EXECUTE FUNCTION outreach_guard_deleted();

DROP TRIGGER IF EXISTS outreach_brands_guard_deleted ON outreach_brands;
CREATE TRIGGER outreach_brands_guard_deleted
  BEFORE UPDATE ON outreach_brands
  FOR EACH ROW EXECUTE FUNCTION outreach_guard_deleted();

-- ── 4. Delete / restore ───────────────────────────────────────────────────────
-- Returns the number of leads changed. Leads already in the target state
-- are skipped, so a repeated call (double click, retry) changes nothing.
CREATE OR REPLACE FUNCTION outreach_delete_leads(p_lead_type VARCHAR, p_lead_ids TEXT[], p_user_id VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_n INTEGER;
BEGIN
  IF coalesce(array_length(p_lead_ids, 1), 0) > 1000 THEN RAISE EXCEPTION 'outreach_too_many'; END IF;

  IF p_lead_type = 'creator' THEN
    WITH upd AS (
      UPDATE outreach_creators SET deleted_at = now(), deleted_by = p_user_id
      WHERE lead_id = ANY (p_lead_ids) AND deleted_at IS NULL
      RETURNING lead_id
    )
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action)
    SELECT 'creator', lead_id, p_user_id, 'deleted' FROM upd;
  ELSIF p_lead_type = 'brand' THEN
    WITH upd AS (
      UPDATE outreach_brands SET deleted_at = now(), deleted_by = p_user_id
      WHERE lead_id = ANY (p_lead_ids) AND deleted_at IS NULL
      RETURNING lead_id
    )
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action)
    SELECT 'brand', lead_id, p_user_id, 'deleted' FROM upd;
  ELSE
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

CREATE OR REPLACE FUNCTION outreach_restore_leads(p_lead_type VARCHAR, p_lead_ids TEXT[], p_user_id VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_n INTEGER;
BEGIN
  IF coalesce(array_length(p_lead_ids, 1), 0) > 1000 THEN RAISE EXCEPTION 'outreach_too_many'; END IF;

  IF p_lead_type = 'creator' THEN
    WITH upd AS (
      UPDATE outreach_creators SET deleted_at = NULL, deleted_by = NULL
      WHERE lead_id = ANY (p_lead_ids) AND deleted_at IS NOT NULL
      RETURNING lead_id
    )
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action)
    SELECT 'creator', lead_id, p_user_id, 'restored' FROM upd;
  ELSIF p_lead_type = 'brand' THEN
    WITH upd AS (
      UPDATE outreach_brands SET deleted_at = NULL, deleted_by = NULL
      WHERE lead_id = ANY (p_lead_ids) AND deleted_at IS NOT NULL
      RETURNING lead_id
    )
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action)
    SELECT 'brand', lead_id, p_user_id, 'restored' FROM upd;
  ELSE
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

-- ── 5. Replaced functions ─────────────────────────────────────────────────────

-- Same as before, but deleted leads are left alone.
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
      AND deleted_at IS NULL
    RETURNING lead_id, mailbox_id, channel
  )
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, mailbox_id, channel)
  SELECT 'creator', lead_id, NULL, 'no_reply', mailbox_id, channel FROM upd;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  WITH upd AS (
    UPDATE outreach_brands SET status = 'no_reply'
    WHERE status = 'followed_up' AND replied_at IS NULL AND followed_up_date <= v_today - 7
      AND deleted_at IS NULL
    RETURNING lead_id, mailbox_id, channel
  )
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, mailbox_id, channel)
  SELECT 'brand', lead_id, NULL, 'no_reply', mailbox_id, channel FROM upd;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  RETURN v_total;
END;
$$;

-- Same as outreach_extra_migration.sql, plus the guard bypass: a removal
-- request still has to work on a lead someone deleted earlier.
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
  ELSE
    -- Brand extra holds company facts (batch, tags, yc_url), not personal data.
    UPDATE outreach_brands SET
      contact_name = NULL, role = NULL, email = NULL, linkedin = NULL, notes = NULL,
      follow_up_date = NULL,
      status = CASE WHEN status IN ('not_interested', 'no_reply', 'bounced', 'opted_out') THEN status ELSE 'opted_out' END
    WHERE lead_id = p_lead_id;
  END IF;

  PERFORM set_config('outreach.allow_deleted_write', 'off', true);

  -- Edit history holds old values (e.g. a previous email): clear those too.
  UPDATE outreach_activity SET changes = NULL
  WHERE lead_type = p_lead_type AND lead_id = p_lead_id AND changes IS NOT NULL;

  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action)
  VALUES (p_lead_type, p_lead_id, p_user_id, 'erased');
END;
$$;

-- Same as before, plus `deleted` on each lead hit, so the add form, edits
-- and imports say "Previously deleted: C-0123".
CREATE OR REPLACE FUNCTION outreach_match_keys(p_values TEXT[]) RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'leads', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'key_type', k.key_type, 'key_value', k.key_value, 'lead_type', k.lead_type, 'lead_id', k.lead_id,
        'owner_user_id', coalesce(c.owner_user_id, b.owner_user_id), 'status', coalesce(c.status, b.status),
        'deleted', coalesce(c.deleted_at, b.deleted_at) IS NOT NULL))
      FROM outreach_keys k
      LEFT JOIN outreach_creators c ON k.lead_type = 'creator' AND c.lead_id = k.lead_id
      LEFT JOIN outreach_brands b ON k.lead_type = 'brand' AND b.lead_id = k.lead_id
      WHERE k.key_value = ANY(p_values)), '[]'::jsonb),
    'dnc', coalesce((
      SELECT jsonb_agg(jsonb_build_object('key_type', d.key_type, 'key_value', d.key_value, 'reason', d.reason))
      FROM outreach_dnc d WHERE d.key_value = ANY(p_values)), '[]'::jsonb)
  )
$$;

-- Same as before, without deleted leads.
CREATE OR REPLACE FUNCTION outreach_filter_values() RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'creator_countries', (SELECT coalesce(jsonb_agg(DISTINCT country ORDER BY country), '[]'::jsonb)
                          FROM outreach_creators WHERE coalesce(btrim(country), '') <> '' AND deleted_at IS NULL),
    'creator_niches',    (SELECT coalesce(jsonb_agg(DISTINCT niche ORDER BY niche), '[]'::jsonb)
                          FROM outreach_creators WHERE coalesce(btrim(niche), '') <> '' AND deleted_at IS NULL),
    'creator_platforms', (SELECT coalesce(jsonb_agg(DISTINCT platform ORDER BY platform), '[]'::jsonb)
                          FROM outreach_creators WHERE coalesce(btrim(platform), '') <> '' AND deleted_at IS NULL),
    'brand_countries',   (SELECT coalesce(jsonb_agg(DISTINCT country ORDER BY country), '[]'::jsonb)
                          FROM outreach_brands WHERE coalesce(btrim(country), '') <> '' AND deleted_at IS NULL)
  )
$$;

-- ── 6. Grants (service_role only) ─────────────────────────────────────────────
REVOKE ALL ON FUNCTION
  outreach_guard_deleted(),
  outreach_delete_leads(VARCHAR, TEXT[], VARCHAR),
  outreach_restore_leads(VARCHAR, TEXT[], VARCHAR),
  outreach_mark_no_reply(),
  outreach_erase_lead(VARCHAR, VARCHAR, VARCHAR),
  outreach_match_keys(TEXT[]),
  outreach_filter_values()
FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION
  outreach_guard_deleted(),
  outreach_delete_leads(VARCHAR, TEXT[], VARCHAR),
  outreach_restore_leads(VARCHAR, TEXT[], VARCHAR),
  outreach_mark_no_reply(),
  outreach_erase_lead(VARCHAR, VARCHAR, VARCHAR),
  outreach_match_keys(TEXT[]),
  outreach_filter_values()
TO service_role;
