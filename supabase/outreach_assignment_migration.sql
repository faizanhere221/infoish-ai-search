-- ============================================================================
-- Outreach: lead assignment (who works which lead), stale leads, owner stats
-- ============================================================================
-- Run AFTER supabase/outreach_followups_migration.sql. Idempotent: safe to
-- run more than once. Run in the Supabase SQL Editor.
--
-- The lead's owner stays owner_user_id (VARCHAR(255) -> users.id, already on
-- both lead tables, already indexed with status). This migration adds the
-- "when / by whom" around it and the tools to move leads in bulk:
--
--   1. outreach_creators / outreach_brands:
--        assigned_at       when the current owner got the lead
--        assigned_by       who gave it to them (VARCHAR(255) -> users.id;
--                          NULL = set at creation/import or before this migration)
--        last_activity_at  the latest outreach_activity row on the lead (or
--                          its creation time). Drives the "Stale" badge/filter.
--      Backfill: existing owners are KEPT. assigned_at = the latest
--      owner_changed activity, else created_at. last_activity_at = the latest
--      not-undone activity, else created_at. assigned_by stays NULL.
--   2. Triggers: a new activity row bumps last_activity_at; an owner change
--      that didn't go through outreach_assign_leads() still sets assigned_at.
--   3. outreach_assign_leads(): changes the owner of up to 1,000 leads in one
--      transaction, logging one owner_changed row per lead with
--      changes = {owner_user_id: {old, new}} (+ rule when a rule did it).
--   4. outreach_owner_stats(): per owner counts for the dashboard cards.
--   5. outreach_undo_action() replaced (copied from
--      outreach_contacts_lists_migration.sql): owner_changed rows no longer
--      count as "the latest action", so a member can still undo "Replied"
--      after the Interested rule handed the lead to someone else.
--   6. outreach_settings rows for the default owner rules (NULL until an
--      admin picks people on the Team page).
--   7. outreach_schema_version() = 5.
--
-- No new tables, so no new table grants. Functions: service_role only.
-- ============================================================================

-- ── 0. Version ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION outreach_schema_version() RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$ SELECT 5 $$;

-- ── 1. Columns ────────────────────────────────────────────────────────────────
ALTER TABLE outreach_creators
  ADD COLUMN IF NOT EXISTS assigned_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_by      VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

ALTER TABLE outreach_brands
  ADD COLUMN IF NOT EXISTS assigned_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_by      VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Backfill. Owners are not touched. The lead tables' own triggers (key
-- normalisation, DNC check, updated_at, deleted-lead guard) are switched off
-- while only these two new columns are filled, so no key is re-checked, no
-- updated_at moves and deleted leads get their values too. One DO block =
-- one transaction: if anything fails, the triggers are never left off.
DO $$
BEGIN
  ALTER TABLE outreach_creators DISABLE TRIGGER USER;
  ALTER TABLE outreach_brands DISABLE TRIGGER USER;

  UPDATE outreach_creators c SET
    last_activity_at = coalesce(
      (SELECT max(a.created_at) FROM outreach_activity a
        WHERE a.lead_type = 'creator' AND a.lead_id = c.lead_id AND a.undone_at IS NULL),
      c.created_at),
    assigned_at = CASE WHEN c.owner_user_id IS NULL THEN NULL ELSE coalesce(
      (SELECT max(a.created_at) FROM outreach_activity a
        WHERE a.lead_type = 'creator' AND a.lead_id = c.lead_id AND a.action = 'owner_changed'),
      c.created_at) END
  WHERE c.last_activity_at IS NULL;

  UPDATE outreach_brands b SET
    last_activity_at = coalesce(
      (SELECT max(a.created_at) FROM outreach_activity a
        WHERE a.lead_type = 'brand' AND a.lead_id = b.lead_id AND a.undone_at IS NULL),
      b.created_at),
    assigned_at = CASE WHEN b.owner_user_id IS NULL THEN NULL ELSE coalesce(
      (SELECT max(a.created_at) FROM outreach_activity a
        WHERE a.lead_type = 'brand' AND a.lead_id = b.lead_id AND a.action = 'owner_changed'),
      b.created_at) END
  WHERE b.last_activity_at IS NULL;

  ALTER TABLE outreach_creators ENABLE TRIGGER USER;
  ALTER TABLE outreach_brands ENABLE TRIGGER USER;
END;
$$;

-- Every lead has a last activity time from now on (new rows: their creation).
ALTER TABLE outreach_creators ALTER COLUMN last_activity_at SET DEFAULT now();
ALTER TABLE outreach_brands ALTER COLUMN last_activity_at SET DEFAULT now();
ALTER TABLE outreach_creators ALTER COLUMN last_activity_at SET NOT NULL;
ALTER TABLE outreach_brands ALTER COLUMN last_activity_at SET NOT NULL;

-- Stale filter: owner + open status + last activity; and "who assigned".
CREATE INDEX IF NOT EXISTS outreach_creators_owner_activity_idx ON outreach_creators (owner_user_id, last_activity_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS outreach_brands_owner_activity_idx ON outreach_brands (owner_user_id, last_activity_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS outreach_creators_assigned_by_idx ON outreach_creators (assigned_by);
CREATE INDEX IF NOT EXISTS outreach_brands_assigned_by_idx ON outreach_brands (assigned_by);
-- "Interested" rule / undo look up owner_changed rows per lead.
CREATE INDEX IF NOT EXISTS outreach_activity_owner_changed_idx
  ON outreach_activity (lead_type, lead_id, created_at DESC) WHERE action = 'owner_changed';

-- ── 2. Triggers ───────────────────────────────────────────────────────────────
-- A new activity row (any action, incl. edits and owner changes) is activity.
-- Deleted leads are skipped: the guard trigger would refuse the write, and
-- 'deleted' rows are written after deleted_at is set.
CREATE OR REPLACE FUNCTION outreach_activity_touch_lead() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.lead_type = 'creator' THEN
    UPDATE outreach_creators SET last_activity_at = NEW.created_at
    WHERE lead_id = NEW.lead_id AND deleted_at IS NULL AND last_activity_at < NEW.created_at;
  ELSIF NEW.lead_type = 'brand' THEN
    UPDATE outreach_brands SET last_activity_at = NEW.created_at
    WHERE lead_id = NEW.lead_id AND deleted_at IS NULL AND last_activity_at < NEW.created_at;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS outreach_activity_touch_lead ON outreach_activity;
CREATE TRIGGER outreach_activity_touch_lead AFTER INSERT ON outreach_activity
  FOR EACH ROW EXECUTE FUNCTION outreach_activity_touch_lead();

-- assigned_at follows owner_user_id on any write path (manual add, import,
-- an older code path). outreach_assign_leads() sets assigned_by itself; any
-- other owner change has no known actor, so assigned_by is cleared.
CREATE OR REPLACE FUNCTION outreach_leads_track_assignment() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.owner_user_id IS NOT NULL AND NEW.assigned_at IS NULL THEN NEW.assigned_at := now(); END IF;
  ELSIF coalesce(current_setting('outreach.assigning', true), '') = 'on' THEN
    NULL; -- outreach_assign_leads() sets assigned_at / assigned_by itself
  ELSIF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
    IF NEW.assigned_at IS NOT DISTINCT FROM OLD.assigned_at THEN NEW.assigned_at := now(); END IF;
    IF NEW.assigned_by IS NOT DISTINCT FROM OLD.assigned_by THEN NEW.assigned_by := NULL; END IF;
    IF NEW.owner_user_id IS NULL THEN NEW.assigned_at := NULL; NEW.assigned_by := NULL; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS outreach_creators_track_assignment ON outreach_creators;
CREATE TRIGGER outreach_creators_track_assignment BEFORE INSERT OR UPDATE OF owner_user_id ON outreach_creators
  FOR EACH ROW EXECUTE FUNCTION outreach_leads_track_assignment();

DROP TRIGGER IF EXISTS outreach_brands_track_assignment ON outreach_brands;
CREATE TRIGGER outreach_brands_track_assignment BEFORE INSERT OR UPDATE OF owner_user_id ON outreach_brands
  FOR EACH ROW EXECUTE FUNCTION outreach_leads_track_assignment();

-- ── 3. outreach_assign_leads ──────────────────────────────────────────────────
-- p_owner NULL = unassign. p_owner must be an ACTIVE team member. Deleted
-- leads and leads already owned by p_owner are skipped (so a retry or double
-- click changes nothing). p_rule: why a rule moved the lead ('interested',
-- 'member_removed'), shown in the activity history; NULL for a person's choice.
-- Returns {updated, lead_ids}.
CREATE OR REPLACE FUNCTION outreach_assign_leads(
  p_lead_type VARCHAR, p_lead_ids TEXT[], p_owner VARCHAR, p_user_id VARCHAR, p_rule TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_table TEXT;
  v_ids   TEXT[] := '{}';
  r       RECORD;
BEGIN
  IF p_lead_type NOT IN ('creator', 'brand') THEN RAISE EXCEPTION 'outreach_bad_action'; END IF;
  IF coalesce(array_length(p_lead_ids, 1), 0) > 1000 THEN RAISE EXCEPTION 'outreach_too_many'; END IF;
  IF p_owner IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM outreach_team WHERE user_id = p_owner AND is_active
  ) THEN
    RAISE EXCEPTION 'outreach_bad_owner';
  END IF;

  v_table := CASE p_lead_type WHEN 'creator' THEN 'outreach_creators' ELSE 'outreach_brands' END;
  PERFORM set_config('outreach.assigning', 'on', true);

  FOR r IN EXECUTE format(
    'SELECT lead_id, owner_user_id FROM %I
     WHERE lead_id = ANY ($1) AND deleted_at IS NULL AND owner_user_id IS DISTINCT FROM $2
     ORDER BY lead_id FOR UPDATE', v_table)
    USING p_lead_ids, p_owner
  LOOP
    EXECUTE format(
      'UPDATE %I SET owner_user_id = $1, assigned_at = CASE WHEN $1 IS NULL THEN NULL ELSE now() END,
         assigned_by = CASE WHEN $1 IS NULL THEN NULL ELSE $2 END WHERE lead_id = $3', v_table)
      USING p_owner, p_user_id, r.lead_id;

    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, changes)
    VALUES (p_lead_type, r.lead_id, p_user_id, 'owner_changed',
      jsonb_build_object('owner_user_id', jsonb_build_object('old', r.owner_user_id, 'new', p_owner))
      || CASE WHEN p_rule IS NULL THEN '{}'::jsonb
              ELSE jsonb_build_object('rule', jsonb_build_object('old', NULL, 'new', p_rule)) END);

    v_ids := v_ids || r.lead_id::TEXT;
  END LOOP;

  PERFORM set_config('outreach.assigning', '', true);
  RETURN jsonb_build_object('updated', coalesce(array_length(v_ids, 1), 0), 'lead_ids', to_jsonb(v_ids));
END;
$$;

-- ── 4. outreach_owner_stats ───────────────────────────────────────────────────
-- One row per owner (user_id NULL = unassigned leads) and per person with
-- activity this week. Days and weeks in Asia/Karachi (weeks start Monday).
-- Interested: creators 'replied'; brands 'replied' or 'call_booked'.
-- Stale: open status (found, contacted, followed_up, replied, call_booked)
-- and no activity for p_stale_days days.
CREATE OR REPLACE FUNCTION outreach_owner_stats(p_stale_days INTEGER DEFAULT 7)
RETURNS TABLE (
  user_id VARCHAR, creators BIGINT, brands BIGINT, interested BIGINT, stale BIGINT,
  contacted_today BIGINT, contacted_week BIGINT, replies_week BIGINT
)
LANGUAGE sql STABLE AS $$
  WITH k AS (
    SELECT (now() AT TIME ZONE 'Asia/Karachi')::date AS today,
           date_trunc('week', (now() AT TIME ZONE 'Asia/Karachi')::date)::date AS week_start,
           now() - make_interval(days => p_stale_days) AS stale_before
  ),
  leads AS (
    SELECT 'creator'::text AS lead_type, owner_user_id, status, last_activity_at
    FROM outreach_creators WHERE deleted_at IS NULL
    UNION ALL
    SELECT 'brand', owner_user_id, status, last_activity_at
    FROM outreach_brands WHERE deleted_at IS NULL
  ),
  owned AS (
    SELECT l.owner_user_id AS uid,
      count(*) FILTER (WHERE l.lead_type = 'creator') AS creators,
      count(*) FILTER (WHERE l.lead_type = 'brand') AS brands,
      count(*) FILTER (WHERE (l.lead_type = 'creator' AND l.status = 'replied')
                          OR (l.lead_type = 'brand' AND l.status IN ('replied', 'call_booked'))) AS interested,
      count(*) FILTER (WHERE l.status IN ('found', 'contacted', 'followed_up', 'replied', 'call_booked')
                         AND l.last_activity_at < k.stale_before) AS stale
    FROM leads l, k
    GROUP BY l.owner_user_id
  ),
  acts AS (
    SELECT a.user_id AS uid,
      count(*) FILTER (WHERE a.action = 'contacted' AND (a.created_at AT TIME ZONE 'Asia/Karachi')::date = k.today) AS contacted_today,
      count(*) FILTER (WHERE a.action = 'contacted') AS contacted_week,
      count(*) FILTER (WHERE a.action = 'replied') AS replies_week
    FROM outreach_activity a, k
    WHERE a.undone_at IS NULL AND a.user_id IS NOT NULL
      AND a.action IN ('contacted', 'replied')
      AND (a.created_at AT TIME ZONE 'Asia/Karachi')::date >= k.week_start
    GROUP BY a.user_id
  )
  SELECT coalesce(o.uid, a.uid)::VARCHAR,
    coalesce(o.creators, 0), coalesce(o.brands, 0), coalesce(o.interested, 0), coalesce(o.stale, 0),
    coalesce(a.contacted_today, 0), coalesce(a.contacted_week, 0), coalesce(a.replies_week, 0)
  FROM owned o
  FULL JOIN acts a ON a.uid = o.uid;
$$;

-- ── 5. outreach_undo_action (replaced) ────────────────────────────────────────
-- Same as outreach_contacts_lists_migration.sql; the only change is
-- 'owner_changed' in the list of rows that don't count as the latest action.
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
    AND action NOT IN ('edited', 'db_edited', 'db_added', 'db_removed', 'contact_added', 'contact_edited', 'contact_removed',
                       'owner_changed')
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

-- ── 6. Default owner rules ────────────────────────────────────────────────────
-- Values are a users.id string or JSON null. Set on the Team page.
INSERT INTO outreach_settings (key, value) VALUES
  ('assign_creator_owner', 'null'::jsonb),
  ('assign_brand_owner', 'null'::jsonb),
  ('assign_interested_owner', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── 7. Function grants (service_role only) ────────────────────────────────────
REVOKE ALL ON FUNCTION
  outreach_schema_version(),
  outreach_activity_touch_lead(),
  outreach_leads_track_assignment(),
  outreach_assign_leads(VARCHAR, TEXT[], VARCHAR, VARCHAR, TEXT),
  outreach_owner_stats(INTEGER),
  outreach_undo_action(VARCHAR, VARCHAR)
FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION
  outreach_schema_version(),
  outreach_assign_leads(VARCHAR, TEXT[], VARCHAR, VARCHAR, TEXT),
  outreach_owner_stats(INTEGER),
  outreach_undo_action(VARCHAR, VARCHAR)
TO service_role;
