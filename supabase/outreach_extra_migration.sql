-- ============================================================================
-- Outreach: extra source fields + logged edits
-- ============================================================================
-- Run AFTER supabase/outreach_migration.sql. Idempotent: safe to run more
-- than once. Run in the Supabase SQL Editor.
--
-- What it adds:
--   1. outreach_creators.extra / outreach_brands.extra (JSONB): useful CSV
--      fields with no column of their own (batch, tags, yc_url, ...), plus
--      extra_text, a generated text copy so table search covers them.
--   2. outreach_activity: action 'edited' and a `changes` column holding
--      {field: {old, new}} for every edit.
--   3. outreach_edit_lead(): one transaction that locks the lead, applies
--      only the fields that changed (triggers re-run normalisation, the
--      duplicate check and the DNC check) and logs an 'edited' row.
--   4. outreach_import() and outreach_erase_lead() replaced so they write
--      and clear `extra`.
-- ============================================================================

-- ── 1. extra ─────────────────────────────────────────────────────────────────
ALTER TABLE outreach_creators ADD COLUMN IF NOT EXISTS extra JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE outreach_brands   ADD COLUMN IF NOT EXISTS extra JSONB NOT NULL DEFAULT '{}'::jsonb;

-- PostgREST filters can't cast, so search reads this generated copy.
ALTER TABLE outreach_creators ADD COLUMN IF NOT EXISTS extra_text TEXT GENERATED ALWAYS AS (extra::text) STORED;
ALTER TABLE outreach_brands   ADD COLUMN IF NOT EXISTS extra_text TEXT GENERATED ALWAYS AS (extra::text) STORED;

-- ── 2. Logged edits ───────────────────────────────────────────────────────────
ALTER TABLE outreach_activity ADD COLUMN IF NOT EXISTS changes JSONB;

ALTER TABLE outreach_activity DROP CONSTRAINT IF EXISTS outreach_activity_action_check;
ALTER TABLE outreach_activity ADD CONSTRAINT outreach_activity_action_check CHECK (action IN (
  'contacted', 'followed_up', 'replied', 'signed_up', 'call_booked', 'won',
  'not_interested', 'bounced', 'opted_out', 'no_reply',
  'status_changed', 'owner_changed', 'erased', 'edited'));

-- ── 3. outreach_edit_lead ─────────────────────────────────────────────────────
-- p_updates: {column: new value} with values already validated by the API
-- (src/lib/outreach/rules.ts validateLeadField). Only whitelisted columns
-- are accepted; status, lead_id and the *_norm columns never change here.
-- Unchanged fields are dropped, so a form that sends everything logs only
-- what really changed. Raises outreach_not_found / outreach_bad_field, and
-- lets the triggers' outreach_dnc / outreach_duplicate (23505) through.
CREATE OR REPLACE FUNCTION outreach_edit_lead(
  p_lead_type VARCHAR, p_lead_id VARCHAR, p_user_id VARCHAR, p_updates JSONB
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_table   TEXT;
  v_allowed TEXT[];
  v_old     JSONB;
  v_new     JSONB;
  v_changes JSONB := '{}'::jsonb;
  v_key     TEXT;
  v_set     TEXT;
BEGIN
  IF p_lead_type = 'creator' THEN
    v_table := 'outreach_creators';
    v_allowed := ARRAY['name', 'platform', 'profile_url', 'country', 'niche', 'subscribers', 'avg_views',
      'engagement_pct', 'does_sponsorships', 'sponsor_brands', 'email', 'instagram', 'x', 'linkedin',
      'tiktok', 'website', 'owner_user_id', 'mailbox_id', 'channel', 'notes', 'source', 'extra'];
  ELSIF p_lead_type = 'brand' THEN
    v_table := 'outreach_brands';
    v_allowed := ARRAY['company', 'website', 'domain', 'country', 'product', 'team_size', 'why_them', 'score',
      'contact_name', 'role', 'email', 'linkedin', 'owner_user_id', 'mailbox_id', 'channel', 'notes',
      'source', 'extra'];
  ELSE
    RAISE EXCEPTION 'outreach_bad_field';
  END IF;

  EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE t.lead_id = $1 FOR UPDATE', v_table)
    INTO v_old USING p_lead_id;
  IF v_old IS NULL THEN RAISE EXCEPTION 'outreach_not_found'; END IF;

  FOR v_key IN SELECT jsonb_object_keys(p_updates) LOOP
    IF NOT (v_key = ANY (v_allowed)) THEN
      RAISE EXCEPTION 'outreach_bad_field' USING DETAIL = v_key;
    END IF;
    -- JSON null and a missing key both mean "empty"
    IF coalesce(v_old -> v_key, 'null'::jsonb) IS DISTINCT FROM coalesce(p_updates -> v_key, 'null'::jsonb) THEN
      v_changes := v_changes || jsonb_build_object(v_key, jsonb_build_object('old', v_old -> v_key, 'new', p_updates -> v_key));
    END IF;
  END LOOP;

  IF v_changes = '{}'::jsonb THEN
    RETURN jsonb_build_object('changed', false, 'lead', v_old, 'changes', v_changes);
  END IF;

  SELECT string_agg(format('%I = r.%I', k, k), ', ') INTO v_set FROM jsonb_object_keys(v_changes) AS k;
  EXECUTE format(
    'UPDATE %I t SET %s FROM jsonb_populate_record(NULL::%I, $1) r WHERE t.lead_id = $2 RETURNING to_jsonb(t)',
    v_table, v_set, v_table)
    INTO v_new USING p_updates, p_lead_id;

  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, changes)
  VALUES (p_lead_type, p_lead_id, p_user_id, 'edited', v_changes);

  RETURN jsonb_build_object('changed', true, 'lead', v_new, 'changes', v_changes);
END;
$$;

-- ── 4. Import + erase with extra ──────────────────────────────────────────────
-- Same as in outreach_migration.sql, plus `extra`.
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
  v_extra    JSONB;
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
    v_extra := CASE WHEN jsonb_typeof(r->'extra') = 'object' THEN r->'extra' ELSE '{}'::jsonb END;

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
          owner_user_id, notes, source, extra
        ) VALUES (
          r->>'name', r->>'platform', r->>'profile_url', r->>'country', r->>'niche',
          round((r->>'subscribers')::numeric)::bigint, round((r->>'avg_views')::numeric)::bigint,
          (r->>'engagement_pct')::numeric,
          (r->>'does_sponsorships')::boolean, r->>'sponsor_brands', r->>'email', r->>'instagram',
          r->>'x', r->>'linkedin', r->>'tiktok', r->>'website',
          NULLIF(r->>'owner_user_id', ''), r->>'notes', p_source, v_extra
        ) RETURNING lead_id INTO v_lead_id;
      ELSE
        INSERT INTO outreach_brands (
          company, website, domain, country, product, team_size, why_them, score,
          contact_name, role, email, linkedin, owner_user_id, notes, source, extra
        ) VALUES (
          r->>'company', r->>'website', r->>'domain', r->>'country', r->>'product', r->>'team_size',
          r->>'why_them', (r->>'score')::numeric, r->>'contact_name', r->>'role', r->>'email',
          r->>'linkedin', NULLIF(r->>'owner_user_id', ''), r->>'notes', p_source, v_extra
        ) RETURNING lead_id INTO v_lead_id;
      END IF;
      v_inserted := v_inserted + 1;
    EXCEPTION WHEN unique_violation THEN
      v_skipped := v_skipped || jsonb_build_object('row', r->'_row', 'reason', 'duplicate', 'lead_id', NULL);
    END;
  END LOOP;

  RETURN jsonb_build_object('inserted', v_inserted, 'skipped', v_skipped);
END;
$$;

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

  -- Edit history holds old values (e.g. a previous email): clear those too.
  UPDATE outreach_activity SET changes = NULL
  WHERE lead_type = p_lead_type AND lead_id = p_lead_id AND changes IS NOT NULL;

  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action)
  VALUES (p_lead_type, p_lead_id, p_user_id, 'erased');
END;
$$;

-- ── 5. Grants (service_role only) ─────────────────────────────────────────────
REVOKE ALL ON FUNCTION
  outreach_edit_lead(VARCHAR, VARCHAR, VARCHAR, JSONB),
  outreach_import(VARCHAR, JSONB, VARCHAR),
  outreach_erase_lead(VARCHAR, VARCHAR, VARCHAR)
FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION
  outreach_edit_lead(VARCHAR, VARCHAR, VARCHAR, JSONB),
  outreach_import(VARCHAR, JSONB, VARCHAR),
  outreach_erase_lead(VARCHAR, VARCHAR, VARCHAR)
TO service_role;
