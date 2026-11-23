-- ============================================================================
-- Permanently delete soft-deleted brands, so they can be imported again
-- (schema version 8). Run in the Supabase SQL Editor after
-- outreach_retention_migration.sql.
--
-- 1. outreach_activity.lead_id becomes nullable: a purged lead's activity
--    rows stay (dashboard and per-person stats keep their counts) but lose
--    the link to the lead and the personal data they carried (edit history,
--    undo snapshot, subject line, contact link).
-- 2. outreach_purge_deleted_brands(p_lead_ids, p_dry_run): super admins
--    only (enforced in the route). Only SOFT-DELETED brands are touched; any
--    other id is skipped and counted. The brand, its contacts, its keys and
--    its Client Database entry (with campaigns) are deleted for good, so the
--    same domain / emails import again. outreach_dnc is never touched: a
--    brand whose domain or email is on it stays blocked on re-import.
--    p_dry_run = true counts and changes nothing.
-- 3. outreach_schema_version() = 8.
-- ============================================================================

CREATE OR REPLACE FUNCTION outreach_schema_version() RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$ SELECT 8 $$;

ALTER TABLE outreach_activity ALTER COLUMN lead_id DROP NOT NULL;

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

  -- This transaction only: these leads are soft-deleted, so the guard
  -- triggers on the brand, its contacts and its Database rows need it.
  PERFORM set_config('outreach.allow_deleted_write', 'on', true);

  -- Activity stays for the stats, without the lead link or personal data.
  UPDATE outreach_activity
  SET lead_id = NULL, contact_id = NULL, changes = NULL, prev_state = NULL, subject = NULL
  WHERE lead_type = 'brand' AND lead_id = ANY(v_ids);

  -- Contact keys go with each contact (outreach_contacts_after_write), the
  -- brand's keys with the brand (outreach_brands_sync_keys), the Database
  -- entry and its campaigns by cascade.
  DELETE FROM outreach_brand_contacts WHERE lead_id = ANY(v_ids);
  DELETE FROM outreach_brands WHERE lead_id = ANY(v_ids);
  DELETE FROM outreach_keys
  WHERE (lead_type = 'brand' AND lead_id = ANY(v_ids)) OR contact_id = ANY(v_contacts);

  PERFORM set_config('outreach.allow_deleted_write', 'off', true);
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION outreach_purge_deleted_brands(TEXT[], BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION outreach_purge_deleted_brands(TEXT[], BOOLEAN) TO service_role;
