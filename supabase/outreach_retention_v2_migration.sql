-- ============================================================================
-- Outreach retention v2 (schema version 9)
-- Run in the Supabase SQL Editor after outreach_purge_migration.sql.
--
-- 1. Activity is unlinked, never deleted. When a lead is deleted for good
--    (retention or "Permanently delete (allow re-import)") its activity rows
--    stay: lead_id / contact_id / changes / prev_state / subject are nulled
--    and purged_ref points at a tombstone in outreach_purged_leads (lead
--    type, list, owner, created_at: no personal data). outreach_list_stats()
--    reads the tombstones, so dashboard counts don't change after a purge.
-- 2. Hashed keys (outreach_key_hashes): when the RETENTION job deletes a
--    lead or contact, or clears a key off a lead, the normalised key (email,
--    channel/profile URL, domain) is kept as a SHA-256 hash only. Lead and
--    contact inserts (imports, manual adds, Apollo) are refused when a key's
--    hash matches ("previously contacted, removed"); outreach_match_keys()
--    reports the match so previews show it. Hashes expire 12 months after
--    removal unless the key is on the do-not-contact list. The "allow
--    re-import" purge writes NO hashes.
-- 3. Contacted leads keep every contact detail at the 28-day YouTube clear
--    (email and socials, replied or not); only never-contacted leads lose
--    description emails and socials.
-- 4. outreach_schema_version() = 9.
--
-- Replaces (copied from their latest versions): outreach_match_keys()
-- (outreach_contact_soft_delete_migration.sql), outreach_list_stats()
-- (outreach_contacts_lists_migration.sql), outreach_retention()
-- (outreach_retention_migration.sql), outreach_purge_deleted_brands()
-- (outreach_purge_migration.sql).
-- ============================================================================

CREATE OR REPLACE FUNCTION outreach_schema_version() RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$ SELECT 9 $$;

-- ── 1. Tombstones + unlinked activity ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_purged_leads (
  ref           VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_type     VARCHAR(10) NOT NULL CHECK (lead_type IN ('creator', 'brand')),
  list          VARCHAR(30),
  owner_user_id VARCHAR(255), -- a team member, kept for per-person stats
  created_at    TIMESTAMPTZ NOT NULL, -- the lead's, for "leads added" stats
  purged_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason        VARCHAR(20) NOT NULL CHECK (reason IN ('retention', 'reimport'))
);
ALTER TABLE outreach_purged_leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON outreach_purged_leads FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_purged_leads TO service_role;

ALTER TABLE outreach_activity ADD COLUMN IF NOT EXISTS purged_ref VARCHAR(255);
CREATE INDEX IF NOT EXISTS outreach_activity_purged_ref_idx ON outreach_activity (purged_ref) WHERE purged_ref IS NOT NULL;

-- ── 2. Hashed keys ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_key_hashes (
  key_type   VARCHAR(20) NOT NULL CHECK (key_type IN ('email', 'profile_url', 'domain')),
  key_hash   CHAR(64) NOT NULL, -- hex SHA-256 of the normalised key value
  lead_type  VARCHAR(10) NOT NULL CHECK (lead_type IN ('creator', 'brand')),
  removed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL, -- removed_at + 12 months; kept past it while the key is on the DNC list
  PRIMARY KEY (key_type, key_hash)
);
CREATE INDEX IF NOT EXISTS outreach_key_hashes_hash_idx ON outreach_key_hashes (key_hash);
ALTER TABLE outreach_key_hashes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON outreach_key_hashes FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_key_hashes TO service_role;

-- Hex SHA-256 of a normalised key (keys are normalised before they get here).
CREATE OR REPLACE FUNCTION outreach_key_hash(p_value TEXT) RETURNS CHAR(64)
LANGUAGE sql IMMUTABLE AS $$ SELECT encode(sha256(convert_to(p_value, 'UTF8')), 'hex') $$;

-- Remembers keys as hashes for 12 months (a later removal renews it).
CREATE OR REPLACE FUNCTION outreach_remember_key_hashes(p_keys JSONB) RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO outreach_key_hashes (key_type, key_hash, lead_type, removed_at, expires_at)
  SELECT DISTINCT ON (k->>'key_type', outreach_key_hash(k->>'key_value'))
         k->>'key_type', outreach_key_hash(k->>'key_value'), k->>'lead_type', now(), now() + interval '12 months'
  FROM jsonb_array_elements(coalesce(p_keys, '[]'::jsonb)) k
  WHERE coalesce(k->>'key_value', '') <> ''
  ON CONFLICT (key_type, key_hash) DO UPDATE SET removed_at = now(), expires_at = now() + interval '12 months';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Inserts of leads and brand contacts: a key whose hash is remembered is a
-- duplicate. Raised as unique_violation so outreach_import() and
-- outreach_import_contacts() skip the row like any other duplicate. Named
-- to run after the *_before_write triggers that set the *_norm columns.
CREATE OR REPLACE FUNCTION outreach_guard_removed_keys() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_hit TEXT;
BEGIN
  SELECT h.key_type INTO v_hit
  FROM (VALUES
    ('email', NEW.email_norm),
    ('profile_url', CASE WHEN TG_ARGV[0] = 'creator' THEN to_jsonb(NEW)->>'profile_url_norm' END),
    ('domain', CASE WHEN TG_ARGV[0] = 'brand' THEN to_jsonb(NEW)->>'domain_norm' END)
  ) AS k(key_type, key_value)
  JOIN outreach_key_hashes h ON h.key_type = k.key_type AND h.key_hash = outreach_key_hash(k.key_value)
  WHERE k.key_value IS NOT NULL AND h.expires_at > now()
  LIMIT 1;
  IF v_hit IS NOT NULL THEN
    RAISE EXCEPTION 'outreach_previously_removed' USING ERRCODE = 'unique_violation', DETAIL = v_hit;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS outreach_creators_zz_guard_removed ON outreach_creators;
CREATE TRIGGER outreach_creators_zz_guard_removed BEFORE INSERT ON outreach_creators
  FOR EACH ROW EXECUTE FUNCTION outreach_guard_removed_keys('creator');
DROP TRIGGER IF EXISTS outreach_brands_zz_guard_removed ON outreach_brands;
CREATE TRIGGER outreach_brands_zz_guard_removed BEFORE INSERT ON outreach_brands
  FOR EACH ROW EXECUTE FUNCTION outreach_guard_removed_keys('brand');
DROP TRIGGER IF EXISTS outreach_brand_contacts_zz_guard_removed ON outreach_brand_contacts;
CREATE TRIGGER outreach_brand_contacts_zz_guard_removed BEFORE INSERT ON outreach_brand_contacts
  FOR EACH ROW EXECUTE FUNCTION outreach_guard_removed_keys('contact');

-- Replaced: also reports remembered (hashed) keys as 'removed'.
CREATE OR REPLACE FUNCTION outreach_match_keys(p_values TEXT[]) RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'leads', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'key_type', k.key_type, 'key_value', k.key_value, 'lead_type', k.lead_type, 'lead_id', k.lead_id,
        'owner_user_id', coalesce(c.owner_user_id, b.owner_user_id), 'status', coalesce(c.status, b.status),
        'deleted', coalesce(c.deleted_at, b.deleted_at) IS NOT NULL,
        'contact_id', k.contact_id, 'contact_removed', bc.deleted_at IS NOT NULL))
      FROM outreach_keys k
      LEFT JOIN outreach_creators c ON k.lead_type = 'creator' AND c.lead_id = k.lead_id
      LEFT JOIN outreach_brands b ON k.lead_type = 'brand' AND b.lead_id = k.lead_id
      LEFT JOIN outreach_brand_contacts bc ON bc.id = k.contact_id
      WHERE k.key_value = ANY(p_values)), '[]'::jsonb),
    'dnc', coalesce((
      SELECT jsonb_agg(jsonb_build_object('key_type', d.key_type, 'key_value', d.key_value, 'reason', d.reason))
      FROM outreach_dnc d WHERE d.key_value = ANY(p_values)), '[]'::jsonb),
    'removed', coalesce((
      SELECT jsonb_agg(jsonb_build_object('key_type', h.key_type, 'key_value', v.val, 'lead_type', h.lead_type))
      FROM unnest(p_values) AS v(val)
      JOIN outreach_key_hashes h ON h.key_hash = outreach_key_hash(v.val)
      WHERE v.val IS NOT NULL AND h.expires_at > now()), '[]'::jsonb)
  )
$$;

-- ── 3. List stats read the tombstones ─────────────────────────────────────────
-- Replaced: purged leads still count (as 'purged:<ref>'), so "leads added",
-- "contacted", "replied"... per list don't change after a purge.
CREATE OR REPLACE FUNCTION outreach_list_stats(
  p_today_start TIMESTAMPTZ, p_week_start TIMESTAMPTZ, p_month_start TIMESTAMPTZ
) RETURNS TABLE (lead_type VARCHAR, list VARCHAR, user_id VARCHAR, is_total BOOLEAN, metric VARCHAR, today BIGINT, week BIGINT, month BIGINT)
LANGUAGE sql STABLE AS $$
  WITH leads AS (
    SELECT 'creator'::varchar AS lead_type, lead_id, list, owner_user_id, created_at FROM outreach_creators
    UNION ALL
    SELECT 'brand', lead_id, list, owner_user_id, created_at FROM outreach_brands
    UNION ALL
    SELECT p.lead_type, ('purged:' || p.ref)::varchar, p.list, p.owner_user_id, p.created_at FROM outreach_purged_leads p
  ), ev AS (
    SELECT l.lead_type, l.list, l.owner_user_id AS user_id, 'leads'::varchar AS metric, l.lead_id, l.created_at
    FROM leads l WHERE l.created_at >= LEAST(p_week_start, p_month_start)
    UNION ALL
    SELECT a.lead_type, l.list, a.user_id, a.action, l.lead_id, a.created_at
    FROM outreach_activity a
    JOIN leads l ON l.lead_type = a.lead_type AND l.lead_id = coalesce(a.lead_id, 'purged:' || a.purged_ref)
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

-- ── 4. Shared: delete leads for good, keeping a tombstone ────────────────────
-- Tombstones each lead, unlinks its activity, removes contacts (brands) and
-- the lead (keys go by trigger, Database rows by cascade). p_remember_keys:
-- retention keeps the keys as hashes; the re-import purge does not.
-- Returns {activity_unlinked, key_hashes_written}. Callers set
-- outreach.allow_deleted_write for their transaction.
CREATE OR REPLACE FUNCTION outreach_purge_leads(
  p_lead_type VARCHAR, p_lead_ids TEXT[], p_reason VARCHAR, p_remember_keys BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_unlinked INTEGER := 0;
  v_hashed   INTEGER := 0;
  v_n        INTEGER;
BEGIN
  IF p_lead_ids IS NULL OR cardinality(p_lead_ids) = 0 THEN
    RETURN jsonb_build_object('activity_unlinked', 0, 'key_hashes_written', 0);
  END IF;

  DROP TABLE IF EXISTS _purge_refs;
  CREATE TEMP TABLE _purge_refs (lead_id VARCHAR(255) PRIMARY KEY, ref VARCHAR(255) NOT NULL) ON COMMIT DROP;
  IF p_lead_type = 'creator' THEN
    INSERT INTO _purge_refs SELECT lead_id, gen_random_uuid()::text FROM outreach_creators WHERE lead_id = ANY(p_lead_ids);
    INSERT INTO outreach_purged_leads (ref, lead_type, list, owner_user_id, created_at, reason)
    SELECT r.ref, 'creator', c.list, c.owner_user_id, c.created_at, p_reason
    FROM _purge_refs r JOIN outreach_creators c ON c.lead_id = r.lead_id;
  ELSE
    INSERT INTO _purge_refs SELECT lead_id, gen_random_uuid()::text FROM outreach_brands WHERE lead_id = ANY(p_lead_ids);
    INSERT INTO outreach_purged_leads (ref, lead_type, list, owner_user_id, created_at, reason)
    SELECT r.ref, 'brand', b.list, b.owner_user_id, b.created_at, p_reason
    FROM _purge_refs r JOIN outreach_brands b ON b.lead_id = r.lead_id;
  END IF;

  IF p_remember_keys THEN
    v_hashed := outreach_remember_key_hashes((
      SELECT jsonb_agg(jsonb_build_object('key_type', k.key_type, 'key_value', k.key_value, 'lead_type', p_lead_type))
      FROM outreach_keys k
      WHERE k.lead_type = p_lead_type AND k.lead_id IN (SELECT lead_id FROM _purge_refs)));
  END IF;

  UPDATE outreach_activity a
  SET purged_ref = r.ref, lead_id = NULL, contact_id = NULL, changes = NULL, prev_state = NULL, subject = NULL
  FROM _purge_refs r
  WHERE a.lead_type = p_lead_type AND a.lead_id = r.lead_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_unlinked := v_n;

  IF p_lead_type = 'creator' THEN
    DELETE FROM outreach_creators WHERE lead_id IN (SELECT lead_id FROM _purge_refs);
  ELSE
    DELETE FROM outreach_brand_contacts WHERE lead_id IN (SELECT lead_id FROM _purge_refs);
    DELETE FROM outreach_brands WHERE lead_id IN (SELECT lead_id FROM _purge_refs);
  END IF;
  DELETE FROM outreach_keys WHERE lead_type = p_lead_type AND lead_id IN (SELECT lead_id FROM _purge_refs);

  RETURN jsonb_build_object('activity_unlinked', v_unlinked, 'key_hashes_written', v_hashed);
END;
$$;

-- ── 5. Retention ──────────────────────────────────────────────────────────────
-- Replaced. Same rules as before, plus: contacted creators keep every
-- contact detail at the YouTube clear; activity is unlinked, not deleted;
-- keys of deleted leads / contacts and keys the clear removes are kept as
-- hashes; expired hashes are dropped (kept while the key is on the DNC list).
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
    'key_hashes_expired', (SELECT count(*) FROM outreach_key_hashes h
                           WHERE h.expires_at <= now()
                             AND NOT EXISTS (SELECT 1 FROM outreach_dnc d
                                             WHERE d.key_type = h.key_type AND outreach_key_hash(d.key_value) = h.key_hash)),
    'dnc_entries_kept', (SELECT count(*) FROM outreach_dnc));

  IF p_dry_run THEN
    RETURN v_result;
  END IF;

  -- This transaction only: lets the job touch soft-deleted leads.
  PERFORM set_config('outreach.allow_deleted_write', 'on', true);

  -- A. Clear YouTube API fields. Never-contacted leads also lose description
  --    emails and socials; contacted leads keep every contact detail.
  --    Keys the clear removes (channel URL, an uncontacted email) are kept
  --    as hashes, so the same channel isn't imported and contacted again.
  CREATE TEMP TABLE _ret_keys_before ON COMMIT DROP AS
  SELECT k.key_type, k.key_value, k.lead_id FROM outreach_keys k
  WHERE k.lead_type = 'creator' AND k.lead_id IN (SELECT lead_id FROM _ret_c_clear) AND k.contact_id IS NULL;

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

  -- B + C. Contacts of brands that stay: hash their email keys, unlink
  --    their activity from the contact (the brand link stays), delete them.
  v_hashed := v_hashed + outreach_remember_key_hashes((
    SELECT jsonb_agg(jsonb_build_object('key_type', k.key_type, 'key_value', k.key_value, 'lead_type', 'brand'))
    FROM outreach_keys k WHERE k.contact_id IN (SELECT id FROM _ret_bc_purge)));
  UPDATE outreach_activity
  SET contact_id = NULL, changes = NULL, prev_state = NULL, subject = NULL
  WHERE lead_type = 'brand' AND contact_id IN (SELECT id FROM _ret_bc_purge);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_unlinked := v_unlinked + v_n;
  DELETE FROM outreach_brand_contacts WHERE id IN (SELECT id FROM _ret_bc_purge);
  DELETE FROM outreach_keys WHERE contact_id IN (SELECT id FROM _ret_bc_purge);

  -- Leads deleted for good: tombstone, unlinked activity, keys as hashes.
  SELECT coalesce(array_agg(lead_id), '{}') INTO v_ids FROM _ret_c_purge;
  v_r := outreach_purge_leads('creator', v_ids, 'retention', true);
  v_unlinked := v_unlinked + (v_r->>'activity_unlinked')::int;
  v_hashed := v_hashed + (v_r->>'key_hashes_written')::int;

  SELECT coalesce(array_agg(lead_id), '{}') INTO v_ids FROM _ret_b_purge;
  v_r := outreach_purge_leads('brand', v_ids, 'retention', true);
  v_unlinked := v_unlinked + (v_r->>'activity_unlinked')::int;
  v_hashed := v_hashed + (v_r->>'key_hashes_written')::int;

  -- Hashes older than 12 months go, unless the key is on the DNC list.
  DELETE FROM outreach_key_hashes h
  WHERE h.expires_at <= now()
    AND NOT EXISTS (SELECT 1 FROM outreach_dnc d
                    WHERE d.key_type = h.key_type AND outreach_key_hash(d.key_value) = h.key_hash);
  GET DIAGNOSTICS v_expired = ROW_COUNT;

  PERFORM set_config('outreach.allow_deleted_write', 'off', true);
  RETURN v_result || jsonb_build_object('activity_unlinked', v_unlinked, 'key_hashes_written', v_hashed,
                                        'key_hashes_expired', v_expired);
END;
$$;

-- ── 6. "Permanently delete (allow re-import)" ────────────────────────────────
-- Replaced: tombstones and unlinks through outreach_purge_leads(), so
-- dashboard counts don't change. Still writes NO key hashes.
CREATE OR REPLACE FUNCTION outreach_purge_deleted_brands(p_lead_ids TEXT[], p_dry_run BOOLEAN DEFAULT true)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_ids      TEXT[];
  v_contacts TEXT[];
  v_result   JSONB;
BEGIN
  IF p_lead_ids IS NULL OR cardinality(p_lead_ids) = 0 THEN
    RETURN jsonb_build_object('dry_run', p_dry_run, 'brands', 0, 'skipped_not_deleted', 0, 'contacts', 0,
                              'database_entries', 0, 'keys', 0, 'activity_unlinked', 0, 'dnc_blocked', 0);
  END IF;
  IF cardinality(p_lead_ids) > 1000 THEN RAISE EXCEPTION 'outreach_too_many'; END IF;

  -- Soft-deleted brands only, locked so a restore can't run in between.
  SELECT coalesce(array_agg(lead_id ORDER BY lead_id), '{}') INTO v_ids
  FROM (
    SELECT lead_id FROM outreach_brands
    WHERE lead_id = ANY(p_lead_ids) AND deleted_at IS NOT NULL
    FOR UPDATE
  ) b;
  SELECT coalesce(array_agg(id), '{}') INTO v_contacts FROM outreach_brand_contacts WHERE lead_id = ANY(v_ids);

  v_result := jsonb_build_object(
    'dry_run', p_dry_run,
    'brands', cardinality(v_ids),
    'skipped_not_deleted', (SELECT count(DISTINCT x) FROM unnest(p_lead_ids) x) - cardinality(v_ids),
    'contacts', cardinality(v_contacts),
    'database_entries', (SELECT count(*) FROM outreach_brand_db WHERE lead_id = ANY(v_ids)),
    'keys', (SELECT count(*) FROM outreach_keys
             WHERE (lead_type = 'brand' AND lead_id = ANY(v_ids)) OR contact_id = ANY(v_contacts)),
    'activity_unlinked', (SELECT count(*) FROM outreach_activity WHERE lead_type = 'brand' AND lead_id = ANY(v_ids)),
    -- Brands the do-not-contact list will keep blocking on re-import.
    'dnc_blocked', (
      SELECT count(*) FROM outreach_brands b
      WHERE b.lead_id = ANY(v_ids) AND EXISTS (
        SELECT 1 FROM outreach_dnc d
        WHERE (d.key_type = 'domain' AND (d.key_value = b.domain_norm OR d.key_value = split_part(b.email_norm, '@', 2)))
           OR (d.key_type = 'email' AND d.key_value = b.email_norm)
           OR EXISTS (SELECT 1 FROM outreach_brand_contacts c WHERE c.lead_id = b.lead_id AND (
                (d.key_type = 'email' AND d.key_value = c.email_norm)
                OR (d.key_type = 'domain' AND d.key_value = split_part(c.email_norm, '@', 2))))))
  );

  IF p_dry_run OR cardinality(v_ids) = 0 THEN
    RETURN v_result;
  END IF;

  PERFORM set_config('outreach.allow_deleted_write', 'on', true);
  PERFORM outreach_purge_leads('brand', v_ids, 'reimport', false);
  DELETE FROM outreach_keys WHERE contact_id = ANY(v_contacts);
  PERFORM set_config('outreach.allow_deleted_write', 'off', true);
  RETURN v_result;
END;
$$;

-- ── 7. Function grants (service_role only) ────────────────────────────────────
REVOKE ALL ON FUNCTION outreach_key_hash(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION outreach_remember_key_hashes(JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION outreach_purge_leads(VARCHAR, TEXT[], VARCHAR, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION outreach_retention(BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION outreach_purge_deleted_brands(TEXT[], BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION outreach_match_keys(TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION outreach_list_stats(TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION outreach_key_hash(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION outreach_remember_key_hashes(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION outreach_purge_leads(VARCHAR, TEXT[], VARCHAR, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION outreach_retention(BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION outreach_purge_deleted_brands(TEXT[], BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION outreach_match_keys(TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION outreach_list_stats(TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
