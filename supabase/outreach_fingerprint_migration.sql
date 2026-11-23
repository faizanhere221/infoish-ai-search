-- ============================================================================
-- Outreach fingerprints v3 (schema version 10)
-- Run in the Supabase SQL Editor after outreach_retention_v2_migration.sql.
--
-- Fingerprints = the SHA-256 key hashes in outreach_key_hashes that block
-- re-import / manual add ("Previously contacted, removed from the CRM").
--
-- 1. No do-not-contact exception: every fingerprint is deleted 12 months
--    after removal. The DNC list itself (outreach_dnc) is untouched and keeps
--    blocking on its own.
-- 2. Only contacted leads get fingerprinted. A lead or brand contact the
--    team never contacted (no contacted / followed-up / replied date, no
--    contact activity) leaves no fingerprint when retention deletes it or
--    clears its YouTube data, so a re-found creator imports fresh. For a
--    brand: brand-level keys (domain, legacy email) when the brand or any of
--    its contacts was contacted; a contact's email only when that contact
--    was contacted.
-- 3. outreach_schema_version() = 10.
--
-- Adds: outreach_fingerprint_keys(). Replaces (copied from its latest
-- version): outreach_retention() (outreach_retention_v2_migration.sql).
-- Fingerprints written before this migration are left as they are and
-- expire on their own date.
-- ============================================================================

CREATE OR REPLACE FUNCTION outreach_schema_version() RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$ SELECT 10 $$;

COMMENT ON COLUMN outreach_key_hashes.expires_at IS 'removed_at + 12 months; deleted then, DNC or not';

-- ── 1. Which keys of these leads get fingerprinted ───────────────────────────
-- Read-only. Returns [{key_type, key_value, lead_type}] for the leads (and,
-- for brands, the contacts) the team contacted, ready for
-- outreach_remember_key_hashes(). "Contacted" matches retention's
-- last_contact: a contact date, or a not-undone contact action.
CREATE OR REPLACE FUNCTION outreach_fingerprint_keys(p_lead_type VARCHAR, p_lead_ids TEXT[]) RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH acts AS (
    SELECT ARRAY['contacted', 'followed_up', 'replied', 'call_booked', 'won',
                 'signed_up', 'not_interested', 'opted_out', 'bounced']::text[] AS a
  ), contacted_contacts AS (
    SELECT bc.id, bc.lead_id FROM outreach_brand_contacts bc, acts
    WHERE p_lead_type = 'brand' AND bc.lead_id = ANY(p_lead_ids)
      AND (bc.date_contacted IS NOT NULL OR bc.followed_up_date IS NOT NULL OR bc.replied_at IS NOT NULL
           OR EXISTS (SELECT 1 FROM outreach_activity x
                      WHERE x.lead_type = 'brand' AND x.contact_id = bc.id
                        AND x.undone_at IS NULL AND x.action = ANY(acts.a)))
  ), contacted_leads AS (
    SELECT c.lead_id FROM outreach_creators c, acts
    WHERE p_lead_type = 'creator' AND c.lead_id = ANY(p_lead_ids)
      AND (c.date_contacted IS NOT NULL OR c.followed_up_date IS NOT NULL OR c.replied_at IS NOT NULL
           OR EXISTS (SELECT 1 FROM outreach_activity x
                      WHERE x.lead_type = 'creator' AND x.lead_id = c.lead_id
                        AND x.undone_at IS NULL AND x.action = ANY(acts.a)))
    UNION
    SELECT b.lead_id FROM outreach_brands b, acts
    WHERE p_lead_type = 'brand' AND b.lead_id = ANY(p_lead_ids)
      AND (b.date_contacted IS NOT NULL OR b.followed_up_date IS NOT NULL OR b.replied_at IS NOT NULL
           OR EXISTS (SELECT 1 FROM outreach_activity x
                      WHERE x.lead_type = 'brand' AND x.lead_id = b.lead_id
                        AND x.undone_at IS NULL AND x.action = ANY(acts.a))
           OR EXISTS (SELECT 1 FROM contacted_contacts cc WHERE cc.lead_id = b.lead_id))
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object('key_type', k.key_type, 'key_value', k.key_value,
                                               'lead_type', p_lead_type)), '[]'::jsonb)
  FROM outreach_keys k
  WHERE k.lead_type = p_lead_type AND k.lead_id IN (SELECT lead_id FROM contacted_leads)
    AND (k.contact_id IS NULL OR k.contact_id IN (SELECT id FROM contacted_contacts))
$$;

-- ── 2. Retention ──────────────────────────────────────────────────────────────
-- Replaced. Same rules as v2, except: keys are fingerprinted only for leads
-- and contacts the team contacted, and every fingerprint is dropped 12
-- months after removal (no do-not-contact exception).
CREATE OR REPLACE FUNCTION outreach_retention(p_dry_run BOOLEAN DEFAULT true) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_yt_cutoff      CONSTANT TIMESTAMPTZ := now() - interval '28 days';
  v_stale_cutoff   CONSTANT TIMESTAMPTZ := now() - interval '12 months';
  v_deleted_cutoff CONSTANT TIMESTAMPTZ := now() - interval '30 days';
  -- Actions where we contacted the person, or they answered.
  c_contact CONSTANT TEXT[] := ARRAY['contacted', 'followed_up', 'replied', 'call_booked', 'won',
                                     'signed_up', 'not_interested', 'opted_out', 'bounced'];
  -- Creator fields the finder filled from the API.
  c_creator_api CONSTANT TEXT[] := ARRAY['name', 'profile_url', 'country', 'subscribers', 'avg_views',
                                         'engagement_pct', 'does_sponsorships', 'sponsor_brands', 'email',
                                         'instagram', 'x', 'linkedin', 'tiktok', 'website'];
  -- A creator lead with one of these typed by a person is kept (cleared, not deleted).
  c_creator_identity CONSTANT TEXT[] := ARRAY['name', 'profile_url', 'email', 'instagram', 'x', 'linkedin',
                                              'tiktok', 'website'];
  c_creator_extra CONSTANT TEXT[] := ARRAY['views_to_subs_pct', 'recent_video_titles', 'uploads_last_30_days',
                                           'days_since_last_upload', 'avg_views_last10', 'fetched_at'];
  c_brand_extra CONSTANT TEXT[] := ARRAY['creators', 'creators_count', 'example_video_url', 'example_video_title',
                                         'evidence', 'sponsor_link', 'first_seen', 'fetched_at'];
  v_result   JSONB;
  v_ids      TEXT[];
  v_r        JSONB;
  v_unlinked INTEGER := 0;
  v_hashed   INTEGER := 0;
  v_expired  INTEGER := 0;
  v_n        INTEGER;
BEGIN
  -- One run at a time (a manual dry run next to the cron is fine: it waits).
  PERFORM pg_advisory_xact_lock(hashtext('outreach_retention'));

  DROP TABLE IF EXISTS _ret_c, _ret_b, _ret_bc, _ret_c_purge, _ret_c_clear, _ret_b_purge, _ret_b_clear, _ret_bc_purge, _ret_keys_before;

  -- Creators: last contact and the fields a person typed.
  CREATE TEMP TABLE _ret_c ON COMMIT DROP AS
  SELECT c.lead_id, c.status, c.channel, c.created_at, c.deleted_at, c.yt_fetched_at,
         GREATEST(c.date_contacted::timestamptz, c.followed_up_date::timestamptz, c.replied_at,
                  (SELECT max(a.created_at) FROM outreach_activity a
                   WHERE a.lead_type = 'creator' AND a.lead_id = c.lead_id
                     AND a.undone_at IS NULL AND a.action = ANY(c_contact))) AS last_contact,
         coalesce((SELECT array_agg(DISTINCT k) FROM outreach_activity a, jsonb_object_keys(a.changes) k
                   WHERE a.lead_type = 'creator' AND a.lead_id = c.lead_id AND a.action = 'edited'
                     AND a.undone_at IS NULL AND jsonb_typeof(a.changes) = 'object'), '{}') AS typed,
         EXISTS (SELECT 1 FROM outreach_creator_db d WHERE d.lead_id = c.lead_id AND d.removed_at IS NULL) AS in_db
  FROM outreach_creators c;

  CREATE TEMP TABLE _ret_c_purge ON COMMIT DROP AS
  SELECT lead_id, 'deleted'::text AS reason FROM _ret_c WHERE deleted_at < v_deleted_cutoff
  UNION
  SELECT lead_id, 'stale' FROM _ret_c
  WHERE (deleted_at IS NULL OR deleted_at >= v_deleted_cutoff)
    AND status <> 'signed_up' AND coalesce(last_contact, created_at) < v_stale_cutoff
  UNION
  SELECT lead_id, 'youtube' FROM _ret_c
  WHERE (deleted_at IS NULL OR deleted_at >= v_deleted_cutoff)
    AND NOT (status <> 'signed_up' AND coalesce(last_contact, created_at) < v_stale_cutoff)
    AND yt_fetched_at < v_yt_cutoff AND last_contact IS NULL AND status = 'found'
    AND NOT in_db AND NOT (typed && c_creator_identity);

  CREATE TEMP TABLE _ret_c_clear ON COMMIT DROP AS
  SELECT r.* FROM _ret_c r
  WHERE r.yt_fetched_at < v_yt_cutoff AND NOT EXISTS (SELECT 1 FROM _ret_c_purge p WHERE p.lead_id = r.lead_id);

  -- Brands: last contact over the brand and all its contacts.
  CREATE TEMP TABLE _ret_bc ON COMMIT DROP AS
  SELECT bc.id, bc.lead_id, bc.created_at, bc.deleted_at,
         GREATEST(bc.date_contacted::timestamptz, bc.followed_up_date::timestamptz, bc.replied_at,
                  (SELECT max(a.created_at) FROM outreach_activity a
                   WHERE a.lead_type = 'brand' AND a.contact_id = bc.id
                     AND a.undone_at IS NULL AND a.action = ANY(c_contact))) AS last_contact
  FROM outreach_brand_contacts bc;

  CREATE TEMP TABLE _ret_b ON COMMIT DROP AS
  SELECT b.lead_id, b.status, b.created_at, b.deleted_at, b.yt_fetched_at,
         GREATEST(b.date_contacted::timestamptz, b.followed_up_date::timestamptz, b.replied_at,
                  (SELECT max(a.created_at) FROM outreach_activity a
                   WHERE a.lead_type = 'brand' AND a.lead_id = b.lead_id
                     AND a.undone_at IS NULL AND a.action = ANY(c_contact)),
                  (SELECT max(x.last_contact) FROM _ret_bc x WHERE x.lead_id = b.lead_id)) AS last_contact,
         coalesce((SELECT array_agg(DISTINCT k) FROM outreach_activity a, jsonb_object_keys(a.changes) k
                   WHERE a.lead_type = 'brand' AND a.lead_id = b.lead_id AND a.action = 'edited'
                     AND a.undone_at IS NULL AND jsonb_typeof(a.changes) = 'object'), '{}') AS typed
  FROM outreach_brands b;

  CREATE TEMP TABLE _ret_b_purge ON COMMIT DROP AS
  SELECT lead_id, 'deleted'::text AS reason FROM _ret_b WHERE deleted_at < v_deleted_cutoff
  UNION
  SELECT lead_id, 'stale' FROM _ret_b
  WHERE (deleted_at IS NULL OR deleted_at >= v_deleted_cutoff)
    AND status <> 'won' AND coalesce(last_contact, created_at) < v_stale_cutoff;

  CREATE TEMP TABLE _ret_b_clear ON COMMIT DROP AS
  SELECT r.* FROM _ret_b r
  WHERE r.yt_fetched_at < v_yt_cutoff AND NOT EXISTS (SELECT 1 FROM _ret_b_purge p WHERE p.lead_id = r.lead_id);

  -- Contacts of brands that stay: removed 30+ days ago, or no contact for 12 months.
  CREATE TEMP TABLE _ret_bc_purge ON COMMIT DROP AS
  SELECT x.id, x.lead_id, CASE WHEN x.deleted_at < v_deleted_cutoff THEN 'removed' ELSE 'stale' END AS reason
  FROM _ret_bc x JOIN _ret_b b ON b.lead_id = x.lead_id
  WHERE NOT EXISTS (SELECT 1 FROM _ret_b_purge p WHERE p.lead_id = x.lead_id)
    AND (x.deleted_at < v_deleted_cutoff
         OR (b.status <> 'won' AND coalesce(x.last_contact, x.created_at) < v_stale_cutoff));

  v_result := jsonb_build_object(
    'dry_run', p_dry_run,
    'creators', jsonb_build_object(
      'youtube_cleared', (SELECT count(*) FROM _ret_c_clear),
      'youtube_deleted', (SELECT count(*) FROM _ret_c_purge WHERE reason = 'youtube'),
      'stale_deleted',   (SELECT count(*) FROM _ret_c_purge WHERE reason = 'stale'),
      'soft_deleted_deleted', (SELECT count(*) FROM _ret_c_purge WHERE reason = 'deleted')),
    'brands', jsonb_build_object(
      'youtube_cleared', (SELECT count(*) FROM _ret_b_clear),
      'stale_deleted',   (SELECT count(*) FROM _ret_b_purge WHERE reason = 'stale'),
      'soft_deleted_deleted', (SELECT count(*) FROM _ret_b_purge WHERE reason = 'deleted'),
      'contacts_stale_deleted',   (SELECT count(*) FROM _ret_bc_purge WHERE reason = 'stale'),
      'contacts_removed_deleted', (SELECT count(*) FROM _ret_bc_purge WHERE reason = 'removed')),
    'activity_unlinked', (SELECT count(*) FROM outreach_activity a
                          WHERE (a.lead_type = 'creator' AND a.lead_id IN (SELECT lead_id FROM _ret_c_purge))
                             OR (a.lead_type = 'brand' AND a.lead_id IN (SELECT lead_id FROM _ret_b_purge))
                             OR (a.lead_type = 'brand' AND a.contact_id IN (SELECT id FROM _ret_bc_purge))),
    'key_hashes_expired', (SELECT count(*) FROM outreach_key_hashes h WHERE h.expires_at <= now()),
    'dnc_entries_kept', (SELECT count(*) FROM outreach_dnc));

  IF p_dry_run THEN
    RETURN v_result;
  END IF;

  -- This transaction only: lets the job touch soft-deleted leads.
  PERFORM set_config('outreach.allow_deleted_write', 'on', true);

  -- A. Clear YouTube API fields. Never-contacted leads also lose description
  --    emails and socials; contacted leads keep every contact detail.
  --    Keys the clear removes from a CONTACTED lead (its channel URL) are
  --    fingerprinted, so the same channel isn't imported and contacted
  --    again. A never-contacted lead leaves no fingerprint.
  CREATE TEMP TABLE _ret_keys_before ON COMMIT DROP AS
  SELECT k.key_type, k.key_value, k.lead_id FROM outreach_keys k
  WHERE k.lead_type = 'creator' AND k.contact_id IS NULL
    AND k.lead_id IN (SELECT lead_id FROM _ret_c_clear WHERE last_contact IS NOT NULL);

  UPDATE outreach_creators c SET
    name              = CASE WHEN 'name' = ANY(r.typed) THEN c.name END,
    profile_url       = CASE WHEN 'profile_url' = ANY(r.typed) THEN c.profile_url END,
    country           = CASE WHEN 'country' = ANY(r.typed) THEN c.country END,
    subscribers       = CASE WHEN 'subscribers' = ANY(r.typed) THEN c.subscribers END,
    avg_views         = CASE WHEN 'avg_views' = ANY(r.typed) THEN c.avg_views END,
    engagement_pct    = CASE WHEN 'engagement_pct' = ANY(r.typed) THEN c.engagement_pct END,
    does_sponsorships = CASE WHEN 'does_sponsorships' = ANY(r.typed) THEN c.does_sponsorships END,
    sponsor_brands    = CASE WHEN 'sponsor_brands' = ANY(r.typed) THEN c.sponsor_brands END,
    email     = CASE WHEN r.last_contact IS NOT NULL OR 'email' = ANY(r.typed) THEN c.email END,
    instagram = CASE WHEN r.last_contact IS NOT NULL OR 'instagram' = ANY(r.typed) THEN c.instagram END,
    x         = CASE WHEN r.last_contact IS NOT NULL OR 'x' = ANY(r.typed) THEN c.x END,
    linkedin  = CASE WHEN r.last_contact IS NOT NULL OR 'linkedin' = ANY(r.typed) THEN c.linkedin END,
    tiktok    = CASE WHEN r.last_contact IS NOT NULL OR 'tiktok' = ANY(r.typed) THEN c.tiktok END,
    website   = CASE WHEN r.last_contact IS NOT NULL OR 'website' = ANY(r.typed) THEN c.website END,
    extra = coalesce(c.extra, '{}'::jsonb) - c_creator_extra,
    yt_fetched_at = NULL,
    yt_cleared_at = now()
  FROM _ret_c_clear r
  WHERE r.lead_id = c.lead_id;

  v_hashed := v_hashed + outreach_remember_key_hashes((
    SELECT jsonb_agg(jsonb_build_object('key_type', b.key_type, 'key_value', b.key_value, 'lead_type', 'creator'))
    FROM _ret_keys_before b
    WHERE NOT EXISTS (SELECT 1 FROM outreach_keys k WHERE k.key_type = b.key_type AND k.key_value = b.key_value)));

  UPDATE outreach_activity a SET changes = (
    SELECT jsonb_object_agg(e.k, CASE WHEN e.k = ANY(c_creator_api) AND jsonb_typeof(e.v) = 'object' THEN e.v - 'old' ELSE e.v END)
    FROM jsonb_each(a.changes) e(k, v))
  WHERE a.lead_type = 'creator' AND a.action = 'edited' AND jsonb_typeof(a.changes) = 'object'
    AND a.lead_id IN (SELECT lead_id FROM _ret_c_clear);

  UPDATE outreach_brands b SET
    why_them = CASE WHEN 'why_them' = ANY(r.typed) THEN b.why_them END,
    extra = coalesce(b.extra, '{}'::jsonb) - c_brand_extra,
    yt_fetched_at = NULL,
    yt_cleared_at = now()
  FROM _ret_b_clear r
  WHERE r.lead_id = b.lead_id;

  UPDATE outreach_activity a SET changes = (
    SELECT jsonb_object_agg(e.k, CASE WHEN e.k = 'why_them' AND jsonb_typeof(e.v) = 'object' THEN e.v - 'old' ELSE e.v END)
    FROM jsonb_each(a.changes) e(k, v))
  WHERE a.lead_type = 'brand' AND a.action = 'edited' AND jsonb_typeof(a.changes) = 'object'
    AND a.lead_id IN (SELECT lead_id FROM _ret_b_clear);

  -- B + C. Contacts of brands that stay: fingerprint the emails of the ones
  --    we contacted, unlink their activity from the contact (the brand link
  --    stays), delete them.
  v_hashed := v_hashed + outreach_remember_key_hashes((
    SELECT jsonb_agg(jsonb_build_object('key_type', k.key_type, 'key_value', k.key_value, 'lead_type', 'brand'))
    FROM outreach_keys k
    WHERE k.contact_id IN (SELECT p.id FROM _ret_bc_purge p JOIN _ret_bc x ON x.id = p.id
                           WHERE x.last_contact IS NOT NULL)));
  UPDATE outreach_activity
  SET contact_id = NULL, changes = NULL, prev_state = NULL, subject = NULL
  WHERE lead_type = 'brand' AND contact_id IN (SELECT id FROM _ret_bc_purge);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_unlinked := v_unlinked + v_n;
  DELETE FROM outreach_brand_contacts WHERE id IN (SELECT id FROM _ret_bc_purge);
  DELETE FROM outreach_keys WHERE contact_id IN (SELECT id FROM _ret_bc_purge);

  -- Leads deleted for good: tombstone, unlinked activity. Keys are
  -- fingerprinted first (contacted leads / contacts only), then the purge
  -- runs without remembering keys itself.
  SELECT coalesce(array_agg(lead_id), '{}') INTO v_ids FROM _ret_c_purge;
  v_hashed := v_hashed + outreach_remember_key_hashes(outreach_fingerprint_keys('creator', v_ids));
  v_r := outreach_purge_leads('creator', v_ids, 'retention', false);
  v_unlinked := v_unlinked + (v_r->>'activity_unlinked')::int;

  SELECT coalesce(array_agg(lead_id), '{}') INTO v_ids FROM _ret_b_purge;
  v_hashed := v_hashed + outreach_remember_key_hashes(outreach_fingerprint_keys('brand', v_ids));
  v_r := outreach_purge_leads('brand', v_ids, 'retention', false);
  v_unlinked := v_unlinked + (v_r->>'activity_unlinked')::int;

  -- Every fingerprint goes 12 months after removal, DNC or not.
  DELETE FROM outreach_key_hashes h WHERE h.expires_at <= now();
  GET DIAGNOSTICS v_expired = ROW_COUNT;

  PERFORM set_config('outreach.allow_deleted_write', 'off', true);
  RETURN v_result || jsonb_build_object('activity_unlinked', v_unlinked, 'key_hashes_written', v_hashed,
                                        'key_hashes_expired', v_expired);
END;
$$;

-- ── 3. Function grants (service_role only) ────────────────────────────────────
REVOKE ALL ON FUNCTION outreach_fingerprint_keys(VARCHAR, TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION outreach_retention(BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION outreach_fingerprint_keys(VARCHAR, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION outreach_retention(BOOLEAN) TO service_role;
