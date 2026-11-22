-- ============================================================================
-- Outreach: members claim unassigned leads ("Claim next N")
-- ============================================================================
-- Run AFTER supabase/outreach_assignment_migration.sql. Idempotent: safe to
-- run more than once. Run in the Supabase SQL Editor. No new tables.
--
--   1. outreach_settings 'claim_daily_cap' (default 100): leads one member
--      claims per Asia/Karachi day. Admins change it on the Team page.
--   2. outreach_claim_leads(): gives the caller the next N (1..25)
--      unassigned, open, non-deleted leads, oldest first, in one
--      transaction:
--        - pg_advisory_xact_lock per member: two claims by the SAME member
--          run one after the other, so the daily cap can't be overshot
--        - FOR UPDATE SKIP LOCKED on the pool: two members claiming at the
--          same time never get the same lead (a row one claim holds is
--          skipped by the other; a row already claimed fails the
--          owner IS NULL re-check)
--        - one owner_changed activity row per lead, user_id and assigned_by
--          = the member, changes.rule = 'claim' (the cap counts these rows)
--   3. outreach_schema_version() = 6.
-- ============================================================================

-- ── 0. Version ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION outreach_schema_version() RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$ SELECT 6 $$;

-- ── 1. Setting ────────────────────────────────────────────────────────────────
INSERT INTO outreach_settings (key, value) VALUES ('claim_daily_cap', '100'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Anything unreadable or out of range falls back to 100. Mirrored by
-- claimDailyCap() in src/lib/outreach/rules.ts.
CREATE OR REPLACE FUNCTION outreach_claim_daily_cap() RETURNS INTEGER
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v JSONB;
  n INTEGER;
BEGIN
  SELECT value INTO v FROM outreach_settings WHERE key = 'claim_daily_cap';
  IF v IS NULL OR jsonb_typeof(v) <> 'number' THEN RETURN 100; END IF;
  n := (v #>> '{}')::numeric::integer;
  IF n < 1 OR n > 1000 THEN RETURN 100; END IF;
  RETURN n;
EXCEPTION WHEN OTHERS THEN
  RETURN 100;
END;
$$;

-- Leads this member claimed today (Karachi), not undone.
CREATE OR REPLACE FUNCTION outreach_claimed_today(p_user_id VARCHAR) RETURNS INTEGER
LANGUAGE sql STABLE AS $$
  SELECT count(*)::integer FROM outreach_activity
  WHERE user_id = p_user_id AND action = 'owner_changed' AND undone_at IS NULL
    AND changes->'rule'->>'new' = 'claim'
    AND created_at >= ((now() AT TIME ZONE 'Asia/Karachi')::date::timestamp AT TIME ZONE 'Asia/Karachi');
$$;

CREATE INDEX IF NOT EXISTS outreach_activity_claims_idx
  ON outreach_activity (user_id, created_at) WHERE action = 'owner_changed';

-- The pool: unassigned, open, not deleted, oldest first.
CREATE INDEX IF NOT EXISTS outreach_creators_claim_pool_idx
  ON outreach_creators (created_at, lead_id) WHERE owner_user_id IS NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS outreach_brands_claim_pool_idx
  ON outreach_brands (created_at, lead_id) WHERE owner_user_id IS NULL AND deleted_at IS NULL;

-- ── 2. outreach_claim_leads ───────────────────────────────────────────────────
-- Open = found, contacted, followed_up, replied, call_booked (STALE_STATUSES
-- in rules.ts). p_list NULL = any list. Raises outreach_claim_too_many
-- (count outside 1..25), outreach_bad_owner (not an active team member),
-- outreach_claim_cap (DETAIL 'used/cap'). Returns {claimed, lead_ids,
-- claimed_today, cap}; claimed can be less than asked (cap left, pool size).
CREATE OR REPLACE FUNCTION outreach_claim_leads(
  p_lead_type VARCHAR, p_user_id VARCHAR, p_count INTEGER, p_list VARCHAR DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_table TEXT;
  v_cap   INTEGER;
  v_used  INTEGER;
  v_take  INTEGER;
  v_ids   TEXT[] := '{}';
  r       RECORD;
BEGIN
  IF p_lead_type NOT IN ('creator', 'brand') THEN RAISE EXCEPTION 'outreach_bad_action'; END IF;
  IF p_count IS NULL OR p_count < 1 OR p_count > 25 THEN RAISE EXCEPTION 'outreach_claim_too_many'; END IF;
  IF NOT EXISTS (SELECT 1 FROM outreach_team WHERE user_id = p_user_id AND is_active) THEN
    RAISE EXCEPTION 'outreach_bad_owner';
  END IF;

  -- One claim at a time per member, for the cap.
  PERFORM pg_advisory_xact_lock(hashtext('outreach_claim:' || p_user_id));

  v_cap := outreach_claim_daily_cap();
  v_used := outreach_claimed_today(p_user_id);
  v_take := least(p_count, v_cap - v_used);
  IF v_take <= 0 THEN
    RAISE EXCEPTION 'outreach_claim_cap' USING DETAIL = v_used || '/' || v_cap;
  END IF;

  v_table := CASE p_lead_type WHEN 'creator' THEN 'outreach_creators' ELSE 'outreach_brands' END;
  PERFORM set_config('outreach.assigning', 'on', true);

  FOR r IN EXECUTE format(
    'SELECT lead_id FROM %I
     WHERE owner_user_id IS NULL AND deleted_at IS NULL
       AND status IN (''found'', ''contacted'', ''followed_up'', ''replied'', ''call_booked'')
       AND ($1 IS NULL OR list = $1)
     ORDER BY created_at, lead_id
     LIMIT $2
     FOR UPDATE SKIP LOCKED', v_table)
    USING p_list, v_take
  LOOP
    EXECUTE format(
      'UPDATE %I SET owner_user_id = $1, assigned_at = now(), assigned_by = $1 WHERE lead_id = $2', v_table)
      USING p_user_id, r.lead_id;

    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, changes)
    VALUES (p_lead_type, r.lead_id, p_user_id, 'owner_changed',
      jsonb_build_object(
        'owner_user_id', jsonb_build_object('old', NULL, 'new', p_user_id),
        'rule', jsonb_build_object('old', NULL, 'new', 'claim')));

    v_ids := v_ids || r.lead_id::TEXT;
  END LOOP;

  PERFORM set_config('outreach.assigning', '', true);

  RETURN jsonb_build_object(
    'claimed', coalesce(array_length(v_ids, 1), 0),
    'lead_ids', to_jsonb(v_ids),
    'claimed_today', v_used + coalesce(array_length(v_ids, 1), 0),
    'cap', v_cap);
END;
$$;

-- ── 3. Function grants (service_role only) ────────────────────────────────────
REVOKE ALL ON FUNCTION
  outreach_schema_version(),
  outreach_claim_daily_cap(),
  outreach_claimed_today(VARCHAR),
  outreach_claim_leads(VARCHAR, VARCHAR, INTEGER, VARCHAR)
FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION
  outreach_schema_version(),
  outreach_claim_daily_cap(),
  outreach_claimed_today(VARCHAR),
  outreach_claim_leads(VARCHAR, VARCHAR, INTEGER, VARCHAR)
TO service_role;
