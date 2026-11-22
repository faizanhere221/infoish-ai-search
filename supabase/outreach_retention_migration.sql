-- ============================================================================
-- Outreach data retention (schema version 7)
-- Run in the Supabase SQL Editor after outreach_claim_migration.sql.
--
-- What the Privacy Policy promises, enforced by one daily job
-- (outreach_retention(), called from /api/cron/daily-summary):
--
--   A. YouTube API data: cleared 28 days after it was fetched (2 days of
--      margin before YouTube's 30-day rule; the cron runs daily).
--      Which rows hold API data: the finder's lists (creators_new,
--      creators_review, sponsor). Which values a person typed: any field
--      named in an `edited` activity row for that lead. Those stay.
--        - Creator never contacted, nothing typed by a person: the whole lead
--          is deleted (only API data is left on it).
--        - Otherwise the API fields are cleared: name, profile_url, country,
--          subscribers, avg_views, engagement_pct, does_sponsorships,
--          sponsor_brands, website, social links, and the API keys in
--          `extra`. A contacted lead keeps the email (and the DM profile)
--          we used to contact them.
--        - Sponsor brands: why_them (a line from a video description) and
--          the API keys in `extra`. Company, website and domain stay.
--   B. No contact for 12 months: the lead is deleted with its keys, contacts,
--      Database entry and activity, unless the creator signed up or the brand
--      is won. Brand contacts with no contact for 12 months go the same way.
--   C. Soft-deleted leads and removed brand contacts: deleted for good 30
--      days after the delete.
--   The do-not-contact list (outreach_dnc) is never touched.
--
-- 1. yt_fetched_at / yt_cleared_at on both lead tables; backfill; insert trigger.
-- 2. outreach_retention(p_dry_run): counts with p_dry_run = true (no writes),
--    does the work with false.
-- 3. outreach_schema_version() = 7.
-- ============================================================================

-- ── 0. Version ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION outreach_schema_version() RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$ SELECT 7 $$;

-- ── 1. When the YouTube API data on a row was fetched ─────────────────────────
ALTER TABLE outreach_creators ADD COLUMN IF NOT EXISTS yt_fetched_at TIMESTAMPTZ;
ALTER TABLE outreach_creators ADD COLUMN IF NOT EXISTS yt_cleared_at TIMESTAMPTZ;
ALTER TABLE outreach_brands   ADD COLUMN IF NOT EXISTS yt_fetched_at TIMESTAMPTZ;
ALTER TABLE outreach_brands   ADD COLUMN IF NOT EXISTS yt_cleared_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS outreach_creators_yt_fetched_idx ON outreach_creators (yt_fetched_at) WHERE yt_fetched_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_brands_yt_fetched_idx   ON outreach_brands (yt_fetched_at) WHERE yt_fetched_at IS NOT NULL;

-- The finder's lists: every row on them came from the YouTube API.
CREATE OR REPLACE FUNCTION outreach_is_youtube_list(p_lead_type TEXT, p_list TEXT) RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE AS $$
  SELECT (p_lead_type = 'creator' AND p_list IN ('creators_new', 'creators_review'))
      OR (p_lead_type = 'brand' AND p_list = 'sponsor')
$$;

-- The earliest date among the given `extra` keys (the finder's date_found,
-- first_seen, fetched_at), or NULL.
CREATE OR REPLACE FUNCTION outreach_extra_time(p_extra JSONB, p_keys TEXT[]) RETURNS TIMESTAMPTZ
LANGUAGE plpgsql STABLE AS $$
DECLARE
  k TEXT;
  v TEXT;
  t TIMESTAMPTZ;
  r TIMESTAMPTZ;
BEGIN
  FOREACH k IN ARRAY p_keys LOOP
    v := btrim(coalesce(p_extra ->> k, ''));
    IF v ~ '^\d{4}-\d{2}-\d{2}' THEN
      BEGIN
        t := v::timestamptz;
      EXCEPTION WHEN OTHERS THEN
        t := NULL;
      END;
      IF t IS NOT NULL AND (r IS NULL OR t < r) THEN r := t; END IF;
    END IF;
  END LOOP;
  RETURN r;
END;
$$;

-- New finder rows: fetched no later than now, earlier if the file says so.
-- Named so it runs after outreach_*_set_list (triggers fire in name order).
CREATE OR REPLACE FUNCTION outreach_stamp_youtube() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.yt_fetched_at IS NULL AND NEW.yt_cleared_at IS NULL
     AND outreach_is_youtube_list(TG_ARGV[0], NEW.list) THEN
    NEW.yt_fetched_at := LEAST(now(), outreach_extra_time(NEW.extra, ARRAY['fetched_at', 'date_found', 'first_seen']));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS outreach_creators_stamp_youtube ON outreach_creators;
CREATE TRIGGER outreach_creators_stamp_youtube BEFORE INSERT ON outreach_creators
  FOR EACH ROW EXECUTE FUNCTION outreach_stamp_youtube('creator');
DROP TRIGGER IF EXISTS outreach_brands_stamp_youtube ON outreach_brands;
CREATE TRIGGER outreach_brands_stamp_youtube BEFORE INSERT ON outreach_brands
  FOR EACH ROW EXECUTE FUNCTION outreach_stamp_youtube('brand');

-- Backfill: the import time, or the finder's own date if earlier. User
-- triggers off so updated_at and the key/DNC/guard triggers don't fire.
DO $$
BEGIN
  ALTER TABLE outreach_creators DISABLE TRIGGER USER;
  UPDATE outreach_creators
  SET yt_fetched_at = LEAST(created_at, outreach_extra_time(extra, ARRAY['fetched_at', 'date_found', 'first_seen']))
  WHERE yt_fetched_at IS NULL AND yt_cleared_at IS NULL AND outreach_is_youtube_list('creator', list);
  ALTER TABLE outreach_creators ENABLE TRIGGER USER;

  ALTER TABLE outreach_brands DISABLE TRIGGER USER;
  UPDATE outreach_brands
  SET yt_fetched_at = LEAST(created_at, outreach_extra_time(extra, ARRAY['fetched_at', 'date_found', 'first_seen']))
  WHERE yt_fetched_at IS NULL AND yt_cleared_at IS NULL AND outreach_is_youtube_list('brand', list);
  ALTER TABLE outreach_brands ENABLE TRIGGER USER;
END $$;

-- ── 2. The daily job ──────────────────────────────────────────────────────────
-- Mirrored by the constants in src/lib/outreach/retention.ts (for the docs
-- and the cron's log line): change both.
CREATE OR REPLACE FUNCTION outreach_retention(p_dry_run BOOLEAN DEFAULT true) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_yt_cutoff      CONSTANT TIMESTAMPTZ := now() - interval '28 days';
  v_stale_cutoff   CONSTANT TIMESTAMPTZ := now() - interval '12 months';
  v_deleted_cutoff CONSTANT TIMESTAMPTZ := now() - interval '30 days';
  -- Actions where we contacted the person, or they answered.
  c_contact CONSTANT TEXT[] := ARRAY['contacted', 'followed_up', 'replied', 'call_booked', 'won',
                                     'signed_up', 'not_interested', 'opted_out', 'bounced'];
  -- Creator fields the finder fills from the API.
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
  v_result JSONB;
BEGIN
  -- One run at a time (a manual dry run next to the cron is fine: it waits).
  PERFORM pg_advisory_xact_lock(hashtext('outreach_retention'));

  DROP TABLE IF EXISTS _ret_c, _ret_b, _ret_bc, _ret_c_purge, _ret_c_clear, _ret_b_purge, _ret_b_clear, _ret_bc_purge;

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
  SELECT x.id, CASE WHEN x.deleted_at < v_deleted_cutoff THEN 'removed' ELSE 'stale' END AS reason
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
    'dnc_entries_kept', (SELECT count(*) FROM outreach_dnc));

  IF p_dry_run THEN
    RETURN v_result;
  END IF;

  -- This transaction only: lets the job touch soft-deleted leads.
  PERFORM set_config('outreach.allow_deleted_write', 'on', true);

  -- A. Clear YouTube API fields. Edit history keeps which field changed, not
  --    the old API value.
  UPDATE outreach_creators c SET
    name              = CASE WHEN 'name' = ANY(r.typed) THEN c.name END,
    profile_url       = CASE WHEN 'profile_url' = ANY(r.typed) THEN c.profile_url END,
    country           = CASE WHEN 'country' = ANY(r.typed) THEN c.country END,
    subscribers       = CASE WHEN 'subscribers' = ANY(r.typed) THEN c.subscribers END,
    avg_views         = CASE WHEN 'avg_views' = ANY(r.typed) THEN c.avg_views END,
    engagement_pct    = CASE WHEN 'engagement_pct' = ANY(r.typed) THEN c.engagement_pct END,
    does_sponsorships = CASE WHEN 'does_sponsorships' = ANY(r.typed) THEN c.does_sponsorships END,
    sponsor_brands    = CASE WHEN 'sponsor_brands' = ANY(r.typed) THEN c.sponsor_brands END,
    website           = CASE WHEN 'website' = ANY(r.typed) THEN c.website END,
    email     = CASE WHEN 'email' = ANY(r.typed) OR r.last_contact IS NOT NULL THEN c.email END,
    instagram = CASE WHEN 'instagram' = ANY(r.typed) OR (r.last_contact IS NOT NULL AND c.channel = 'instagram') THEN c.instagram END,
    x         = CASE WHEN 'x' = ANY(r.typed) OR (r.last_contact IS NOT NULL AND c.channel = 'x') THEN c.x END,
    linkedin  = CASE WHEN 'linkedin' = ANY(r.typed) OR (r.last_contact IS NOT NULL AND c.channel = 'linkedin') THEN c.linkedin END,
    tiktok    = CASE WHEN 'tiktok' = ANY(r.typed) OR (r.last_contact IS NOT NULL AND c.channel = 'tiktok') THEN c.tiktok END,
    extra = coalesce(c.extra, '{}'::jsonb) - c_creator_extra,
    yt_fetched_at = NULL,
    yt_cleared_at = now()
  FROM _ret_c_clear r
  WHERE r.lead_id = c.lead_id;

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

  -- B + C. Delete for good. Keys go with the row (sync triggers), Database
  -- entries and rates by cascade. outreach_dnc is not touched.
  DELETE FROM outreach_brand_contacts WHERE id IN (SELECT id FROM _ret_bc_purge);
  DELETE FROM outreach_activity WHERE lead_type = 'brand' AND contact_id IN (SELECT id FROM _ret_bc_purge);

  DELETE FROM outreach_activity WHERE lead_type = 'creator' AND lead_id IN (SELECT lead_id FROM _ret_c_purge);
  DELETE FROM outreach_creators WHERE lead_id IN (SELECT lead_id FROM _ret_c_purge);

  DELETE FROM outreach_brand_contacts WHERE lead_id IN (SELECT lead_id FROM _ret_b_purge);
  DELETE FROM outreach_activity WHERE lead_type = 'brand' AND lead_id IN (SELECT lead_id FROM _ret_b_purge);
  DELETE FROM outreach_brands WHERE lead_id IN (SELECT lead_id FROM _ret_b_purge);

  -- Belt and braces: no key may outlive its lead or contact.
  DELETE FROM outreach_keys
  WHERE (lead_type = 'creator' AND lead_id IN (SELECT lead_id FROM _ret_c_purge))
     OR (lead_type = 'brand' AND lead_id IN (SELECT lead_id FROM _ret_b_purge))
     OR contact_id IN (SELECT id FROM _ret_bc_purge);

  PERFORM set_config('outreach.allow_deleted_write', 'off', true);
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION outreach_retention(BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION outreach_retention(BOOLEAN) TO service_role;
