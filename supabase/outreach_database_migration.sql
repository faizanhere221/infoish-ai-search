-- ============================================================================
-- Outreach: Creator Database and Client Database
-- ============================================================================
-- Run AFTER supabase/outreach_migration.sql, supabase/outreach_extra_migration.sql
-- and supabase/outreach_delete_migration.sql. Idempotent: safe to run more
-- than once. Run in the Supabase SQL Editor.
--
-- One record per person / company. A Database entry is an outreach lead
-- promoted with extra data, never a copy: name, email, links, subscribers,
-- niche, country and the brand's primary contact stay on the lead (so the
-- duplicate and DNC rules keep working unchanged). These tables only hold
-- what the lead doesn't have.
--
-- What it adds:
--   1. outreach_creator_db (+ outreach_creator_rates): rate card,
--      availability, payment, audience, collaborations, rating, tags, notes
--   2. outreach_brand_db (+ outreach_brand_contacts, outreach_brand_campaigns):
--      what they promote, targets, budget, stage, campaigns run, terms, notes.
--      outreach_brand_contacts holds EXTRA contacts only; the lead's own
--      contact_name / role / email / linkedin is the primary contact.
--   3. activity actions 'db_added', 'db_removed', 'db_edited'
--   4. A guard trigger: Database data of a deleted lead can't change
--      (raises outreach_deleted), same rule as the lead itself
--   5. Functions, each one transaction and each logging to outreach_activity:
--        outreach_db_add, outreach_db_remove, outreach_db_update,
--        outreach_db_item, outreach_db_make_primary,
--        outreach_db_creator_search, outreach_db_brand_search
--   6. Replaced: outreach_erase_lead (also wipes creator Database data and
--      brand contacts, and clears brand Database notes)
--
-- Rates and budgets are internal. Nothing outside /api/admin/outreach/*
-- reads these tables.
-- ============================================================================

-- ── 0. Helpers ────────────────────────────────────────────────────────────────

-- Free-text lead platform ("YouTube", "X (Twitter)", "x") → PLATFORMS id
-- (src/utils/constants.ts). Mirrored by platformId() in
-- src/lib/outreach/database.ts.
CREATE OR REPLACE FUNCTION outreach_platform_id(p TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN v IN ('youtube', 'yt') THEN 'youtube'
    WHEN v IN ('linkedin') THEN 'linkedin'
    WHEN v IN ('x', 'twitter', 'x (twitter)', 'x/twitter', 'twitter/x') THEN 'twitter'
    WHEN v IN ('tiktok') THEN 'tiktok'
    WHEN v IN ('instagram', 'ig') THEN 'instagram'
    ELSE NULL
  END
  FROM (SELECT lower(btrim(coalesce(p, ''))) AS v) s
$$;

-- JSON array of strings → TEXT[] (empty strings dropped). NULL → '{}'.
CREATE OR REPLACE FUNCTION outreach_jsonb_texts(p JSONB) RETURNS TEXT[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(array_agg(btrim(x)) FILTER (WHERE btrim(x) <> ''), '{}')
  FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(p) = 'array' THEN p ELSE '[]'::jsonb END) AS t(x)
$$;

-- ── 1. Creator Database ───────────────────────────────────────────────────────
-- lead_id / users ids are VARCHAR(255) on the live database.
CREATE TABLE IF NOT EXISTS outreach_creator_db (
  lead_id             VARCHAR(255) PRIMARY KEY REFERENCES outreach_creators(lead_id) ON DELETE CASCADE,
  availability        VARCHAR(20) CHECK (availability IN ('available', 'limited', 'booked')),
  next_available_date DATE,
  min_lead_days       INTEGER CHECK (min_lead_days BETWEEN 0 AND 365),
  payment_methods     TEXT[] NOT NULL DEFAULT '{}'
                        CHECK (payment_methods <@ ARRAY['wise', 'payoneer', 'bank', 'paypal', 'crypto']::TEXT[]),
  upfront_pct         INTEGER CHECK (upfront_pct BETWEEN 0 AND 100),
  audience_countries  TEXT[] NOT NULL DEFAULT '{}',
  audience_languages  TEXT[] NOT NULL DEFAULT '{}',
  past_collabs        TEXT[] NOT NULL DEFAULT '{}',
  -- Followers per PLATFORMS id, e.g. {"youtube": 120000, "instagram": 8000}.
  -- The lead's own platform + subscribers count when its platform isn't here.
  followers           JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(followers) = 'object'),
  quality_rating      SMALLINT CHECK (quality_rating BETWEEN 1 AND 5), -- internal, admins only
  tags                TEXT[] NOT NULL DEFAULT '{}',
  notes               TEXT,
  added_by            VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  added_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at          TIMESTAMPTZ, -- removed from the Database (admin); data kept, re-adding restores it
  removed_by          VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_creator_db_active_idx ON outreach_creator_db (added_at) WHERE removed_at IS NULL;

CREATE TABLE IF NOT EXISTS outreach_creator_rates (
  id           VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_id      VARCHAR(255) NOT NULL REFERENCES outreach_creator_db(lead_id) ON DELETE CASCADE,
  platform     VARCHAR(20) NOT NULL CHECK (platform IN ('youtube', 'linkedin', 'twitter', 'tiktok', 'instagram')),
  format       VARCHAR(30) NOT NULL CHECK (format IN (
                 'dedicated_video', 'integration', 'short', 'post', 'thread', 'story', 'live', 'newsletter', 'other')),
  price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  currency     CHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  usage_rights BOOLEAN NOT NULL DEFAULT false,
  usage_note   TEXT,
  quoted_at    DATE,
  created_by   VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_creator_rates_lead_idx ON outreach_creator_rates (lead_id);
CREATE INDEX IF NOT EXISTS outreach_creator_rates_price_idx ON outreach_creator_rates (currency, price);

-- ── 2. Client Database ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_brand_db (
  lead_id          VARCHAR(255) PRIMARY KEY REFERENCES outreach_brands(lead_id) ON DELETE CASCADE,
  promotes         TEXT,
  target_countries TEXT[] NOT NULL DEFAULT '{}',
  niches           TEXT[] NOT NULL DEFAULT '{}',
  platforms        TEXT[] NOT NULL DEFAULT '{}'
                     CHECK (platforms <@ ARRAY['youtube', 'linkedin', 'twitter', 'tiktok', 'instagram']::TEXT[]),
  budget_min       NUMERIC(12, 2) CHECK (budget_min >= 0),
  budget_max       NUMERIC(12, 2) CHECK (budget_max >= 0),
  budget_currency  CHAR(3) NOT NULL DEFAULT 'USD' CHECK (budget_currency ~ '^[A-Z]{3}$'),
  creator_sizes    TEXT[] NOT NULL DEFAULT '{}'
                     CHECK (creator_sizes <@ ARRAY['nano', 'micro', 'mid', 'macro', 'mega']::TEXT[]),
  stage            VARCHAR(20) NOT NULL DEFAULT 'prospect' CHECK (stage IN ('prospect', 'active', 'paused', 'past')),
  start_date       DATE,
  payment_terms    TEXT,
  notes            TEXT,
  added_by         VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  added_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at       TIMESTAMPTZ,
  removed_by       VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT outreach_brand_db_budget_order CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)
);
CREATE INDEX IF NOT EXISTS outreach_brand_db_active_idx ON outreach_brand_db (added_at) WHERE removed_at IS NULL;

CREATE TABLE IF NOT EXISTS outreach_brand_contacts (
  id         VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_id    VARCHAR(255) NOT NULL REFERENCES outreach_brand_db(lead_id) ON DELETE CASCADE,
  name       VARCHAR(255),
  role       VARCHAR(255),
  email      VARCHAR(255),
  linkedin   TEXT,
  created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT outreach_brand_contacts_not_empty CHECK (coalesce(name, email, linkedin) IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS outreach_brand_contacts_lead_idx ON outreach_brand_contacts (lead_id);

CREATE TABLE IF NOT EXISTS outreach_brand_campaigns (
  id            VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_id       VARCHAR(255) NOT NULL REFERENCES outreach_brand_db(lead_id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  run_date      DATE,
  creators_used TEXT,
  total_budget  NUMERIC(12, 2) CHECK (total_budget >= 0),
  currency      CHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  result_notes  TEXT,
  created_by    VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_brand_campaigns_lead_idx ON outreach_brand_campaigns (lead_id, run_date DESC);

-- ── RLS + grants (service_role only, see CLAUDE.md) ───────────────────────────
ALTER TABLE outreach_creator_db      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_creator_rates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_brand_db        ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_brand_contacts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_brand_campaigns ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON outreach_creator_db, outreach_creator_rates, outreach_brand_db,
  outreach_brand_contacts, outreach_brand_campaigns FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_creator_db      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_creator_rates   TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_brand_db        TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_brand_contacts  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_brand_campaigns TO service_role;

-- ── 3. Activity actions ───────────────────────────────────────────────────────
ALTER TABLE outreach_activity DROP CONSTRAINT IF EXISTS outreach_activity_action_check;
ALTER TABLE outreach_activity ADD CONSTRAINT outreach_activity_action_check CHECK (action IN (
  'contacted', 'followed_up', 'replied', 'signed_up', 'call_booked', 'won',
  'not_interested', 'bounced', 'opted_out', 'no_reply',
  'status_changed', 'owner_changed', 'erased', 'edited', 'deleted', 'restored',
  'db_added', 'db_removed', 'db_edited'));

-- ── 4. Guard: Database data of a deleted lead doesn't change ──────────────────
-- TG_ARGV[0] is the lead type. outreach_erase_lead() sets
-- outreach.allow_deleted_write for its own transaction, as for leads.
CREATE OR REPLACE FUNCTION outreach_db_guard_deleted() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_lead    VARCHAR := CASE WHEN TG_OP = 'DELETE' THEN OLD.lead_id ELSE NEW.lead_id END;
  v_deleted BOOLEAN;
BEGIN
  IF coalesce(current_setting('outreach.allow_deleted_write', true), '') <> 'on' THEN
    IF TG_ARGV[0] = 'creator' THEN
      SELECT deleted_at IS NOT NULL INTO v_deleted FROM outreach_creators WHERE lead_id = v_lead;
    ELSE
      SELECT deleted_at IS NOT NULL INTO v_deleted FROM outreach_brands WHERE lead_id = v_lead;
    END IF;
    IF v_deleted THEN RAISE EXCEPTION 'outreach_deleted' USING DETAIL = v_lead; END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS outreach_creator_db_guard ON outreach_creator_db;
CREATE TRIGGER outreach_creator_db_guard BEFORE INSERT OR UPDATE OR DELETE ON outreach_creator_db
  FOR EACH ROW EXECUTE FUNCTION outreach_db_guard_deleted('creator');
DROP TRIGGER IF EXISTS outreach_creator_rates_guard ON outreach_creator_rates;
CREATE TRIGGER outreach_creator_rates_guard BEFORE INSERT OR UPDATE OR DELETE ON outreach_creator_rates
  FOR EACH ROW EXECUTE FUNCTION outreach_db_guard_deleted('creator');
DROP TRIGGER IF EXISTS outreach_brand_db_guard ON outreach_brand_db;
CREATE TRIGGER outreach_brand_db_guard BEFORE INSERT OR UPDATE OR DELETE ON outreach_brand_db
  FOR EACH ROW EXECUTE FUNCTION outreach_db_guard_deleted('brand');
DROP TRIGGER IF EXISTS outreach_brand_contacts_guard ON outreach_brand_contacts;
CREATE TRIGGER outreach_brand_contacts_guard BEFORE INSERT OR UPDATE OR DELETE ON outreach_brand_contacts
  FOR EACH ROW EXECUTE FUNCTION outreach_db_guard_deleted('brand');
DROP TRIGGER IF EXISTS outreach_brand_campaigns_guard ON outreach_brand_campaigns;
CREATE TRIGGER outreach_brand_campaigns_guard BEFORE INSERT OR UPDATE OR DELETE ON outreach_brand_campaigns
  FOR EACH ROW EXECUTE FUNCTION outreach_db_guard_deleted('brand');

-- ── 5. Functions ──────────────────────────────────────────────────────────────

-- Adds a lead to its Database (or restores a removed entry, data intact).
-- p_status (optional): set the lead's status too, for "add directly", which
-- creates the lead first. Logged as 'status_changed' with prev_state.
-- Returns {added, restored, already}. A repeated call changes nothing.
CREATE OR REPLACE FUNCTION outreach_db_add(
  p_lead_type VARCHAR, p_lead_id VARCHAR, p_user_id VARCHAR, p_status VARCHAR DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_status  VARCHAR;
  v_deleted TIMESTAMPTZ;
  v_removed TIMESTAMPTZ;
  v_exists  BOOLEAN;
BEGIN
  IF p_lead_type = 'creator' THEN
    SELECT status, deleted_at INTO v_status, v_deleted FROM outreach_creators WHERE lead_id = p_lead_id FOR UPDATE;
  ELSIF p_lead_type = 'brand' THEN
    SELECT status, deleted_at INTO v_status, v_deleted FROM outreach_brands WHERE lead_id = p_lead_id FOR UPDATE;
  ELSE
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'outreach_not_found'; END IF;
  IF v_deleted IS NOT NULL THEN RAISE EXCEPTION 'outreach_deleted' USING DETAIL = p_lead_id; END IF;

  IF p_status IS NOT NULL AND p_status <> v_status THEN
    IF p_lead_type = 'creator' THEN
      UPDATE outreach_creators SET status = p_status,
        replied_at = CASE WHEN p_status = 'replied' THEN coalesce(replied_at, now()) ELSE replied_at END
      WHERE lead_id = p_lead_id;
    ELSE
      UPDATE outreach_brands SET status = p_status,
        replied_at = CASE WHEN p_status IN ('replied', 'call_booked', 'won') THEN coalesce(replied_at, now()) ELSE replied_at END
      WHERE lead_id = p_lead_id;
    END IF;
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, prev_state)
    VALUES (p_lead_type, p_lead_id, p_user_id, 'status_changed', jsonb_build_object('status', v_status));
  END IF;

  IF p_lead_type = 'creator' THEN
    SELECT true, removed_at INTO v_exists, v_removed FROM outreach_creator_db WHERE lead_id = p_lead_id FOR UPDATE;
  ELSE
    SELECT true, removed_at INTO v_exists, v_removed FROM outreach_brand_db WHERE lead_id = p_lead_id FOR UPDATE;
  END IF;

  IF v_exists AND v_removed IS NULL THEN
    RETURN jsonb_build_object('added', false, 'restored', false, 'already', true);
  END IF;

  IF v_exists THEN
    IF p_lead_type = 'creator' THEN
      UPDATE outreach_creator_db SET removed_at = NULL, removed_by = NULL, updated_at = now() WHERE lead_id = p_lead_id;
    ELSE
      UPDATE outreach_brand_db SET removed_at = NULL, removed_by = NULL, updated_at = now() WHERE lead_id = p_lead_id;
    END IF;
  ELSIF p_lead_type = 'creator' THEN
    INSERT INTO outreach_creator_db (lead_id, added_by) VALUES (p_lead_id, p_user_id);
  ELSE
    INSERT INTO outreach_brand_db (lead_id, added_by) VALUES (p_lead_id, p_user_id);
  END IF;

  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, changes)
  VALUES (p_lead_type, p_lead_id, p_user_id, 'db_added',
          CASE WHEN v_exists THEN jsonb_build_object('database', jsonb_build_object('old', 'removed', 'new', 'restored')) END);

  RETURN jsonb_build_object('added', NOT coalesce(v_exists, false), 'restored', coalesce(v_exists, false), 'already', false);
END;
$$;

-- Removes entries from the Database (admins). The lead stays; the data
-- stays too, so re-adding restores it. Returns the number removed.
CREATE OR REPLACE FUNCTION outreach_db_remove(p_lead_type VARCHAR, p_lead_ids TEXT[], p_user_id VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_n INTEGER;
BEGIN
  IF coalesce(array_length(p_lead_ids, 1), 0) > 1000 THEN RAISE EXCEPTION 'outreach_too_many'; END IF;
  IF p_lead_type = 'creator' THEN
    WITH upd AS (
      UPDATE outreach_creator_db SET removed_at = now(), removed_by = p_user_id, updated_at = now()
      WHERE lead_id = ANY (p_lead_ids) AND removed_at IS NULL
      RETURNING lead_id
    )
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action)
    SELECT 'creator', lead_id, p_user_id, 'db_removed' FROM upd;
  ELSIF p_lead_type = 'brand' THEN
    WITH upd AS (
      UPDATE outreach_brand_db SET removed_at = now(), removed_by = p_user_id, updated_at = now()
      WHERE lead_id = ANY (p_lead_ids) AND removed_at IS NULL
      RETURNING lead_id
    )
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action)
    SELECT 'brand', lead_id, p_user_id, 'db_removed' FROM upd;
  ELSE
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

-- Database fields of one entry. Only fields that changed are written,
-- logged as one 'db_edited' row with changes = {field: {old, new}}.
-- Values arrive validated by the API; the table's CHECKs back that up.
-- Returns the changes ('{}' when nothing changed).
CREATE OR REPLACE FUNCTION outreach_db_update(
  p_lead_type VARCHAR, p_lead_id VARCHAR, p_user_id VARCHAR, p_fields JSONB
) RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_table   TEXT;
  v_allowed TEXT[];
  v_old     JSONB;
  v_new     JSONB;
  v_changes JSONB := '{}'::jsonb;
  k         TEXT;
BEGIN
  IF p_lead_type = 'creator' THEN
    v_table := 'outreach_creator_db';
    v_allowed := ARRAY['availability', 'next_available_date', 'min_lead_days', 'payment_methods', 'upfront_pct',
      'audience_countries', 'audience_languages', 'past_collabs', 'followers', 'quality_rating', 'tags', 'notes'];
  ELSIF p_lead_type = 'brand' THEN
    v_table := 'outreach_brand_db';
    v_allowed := ARRAY['promotes', 'target_countries', 'niches', 'platforms', 'budget_min', 'budget_max',
      'budget_currency', 'creator_sizes', 'stage', 'start_date', 'payment_terms', 'notes'];
  ELSE
    RAISE EXCEPTION 'outreach_bad_action';
  END IF;
  IF jsonb_typeof(p_fields) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'outreach_bad_field'; END IF;
  FOR k IN SELECT jsonb_object_keys(p_fields) LOOP
    IF NOT k = ANY (v_allowed) THEN RAISE EXCEPTION 'outreach_bad_field' USING DETAIL = k; END IF;
  END LOOP;

  EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE lead_id = $1 AND removed_at IS NULL FOR UPDATE', v_table)
    INTO v_old USING p_lead_id;
  IF v_old IS NULL THEN RAISE EXCEPTION 'outreach_db_not_found'; END IF;

  -- Round-trip through the row type so "new" is compared in stored form.
  EXECUTE format('SELECT to_jsonb(jsonb_populate_record(NULL::%I, $1))', v_table) INTO v_new USING v_old || p_fields;

  FOR k IN SELECT jsonb_object_keys(p_fields) LOOP
    IF (v_new -> k) IS DISTINCT FROM (v_old -> k) THEN
      v_changes := v_changes || jsonb_build_object(k, jsonb_build_object('old', v_old -> k, 'new', v_new -> k));
      EXECUTE format('UPDATE %I SET %I = (jsonb_populate_record(NULL::%I, $1)).%I WHERE lead_id = $2', v_table, k, v_table, k)
        USING v_new, p_lead_id;
    END IF;
  END LOOP;

  IF v_changes <> '{}'::jsonb THEN
    EXECUTE format('UPDATE %I SET updated_at = now() WHERE lead_id = $1', v_table) USING p_lead_id;
    INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, changes)
    VALUES (p_lead_type, p_lead_id, p_user_id, 'db_edited', v_changes);
  END IF;
  RETURN v_changes;
END;
$$;

-- Adds, edits or deletes one rate / contact / campaign row.
--   p_item_id NULL           → insert p_row
--   p_item_id + p_row        → update (keys in p_row only)
--   p_item_id + p_row NULL   → delete
-- Logged as 'db_edited' with changes = {<kind>: {old, new}} (old NULL on
-- insert, new NULL on delete). Returns the row as stored (the old row on
-- delete).
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
  ELSIF p_lead_type = 'brand' AND p_kind = 'contact' THEN
    v_parent := 'outreach_brand_db'; v_table := 'outreach_brand_contacts';
    v_allowed := ARRAY['name', 'role', 'email', 'linkedin'];
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

  -- Lock the entry: serialises item writes per entry, and checks it is in the Database.
  EXECUTE format('SELECT true FROM %I WHERE lead_id = $1 AND removed_at IS NULL FOR UPDATE', v_parent)
    INTO v_found USING p_lead_id;
  IF v_found IS NULL THEN RAISE EXCEPTION 'outreach_db_not_found'; END IF;

  IF p_item_id IS NULL THEN
    IF p_row IS NULL THEN RAISE EXCEPTION 'outreach_bad_field'; END IF;
    v_new := p_row || jsonb_build_object('id', gen_random_uuid()::text, 'lead_id', p_lead_id, 'created_by', p_user_id,
                                         'created_at', now(), 'updated_at', now());
    -- Columns left out get their defaults, not NULL.
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
      IF (v_new - v_meta) = (v_old - v_meta) THEN RETURN v_new; END IF; -- nothing changed, nothing logged
    END IF;
  END IF;

  EXECUTE format('UPDATE %I SET updated_at = now() WHERE lead_id = $1', v_parent) USING p_lead_id;
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, changes)
  VALUES (p_lead_type, p_lead_id, p_user_id, 'db_edited',
          jsonb_build_object(p_kind, jsonb_build_object('old', v_old - v_meta, 'new', v_new - v_meta)));
  RETURN coalesce(v_new, v_old);
END;
$$;

-- Makes an extra contact the brand's primary contact: its name / role /
-- email / linkedin move onto the lead, and the lead's old contact takes its
-- place in outreach_brand_contacts (or the row goes, if the lead had none).
-- The lead's triggers re-claim keys, so an email already used by another
-- lead raises outreach_duplicate and nothing changes.
CREATE OR REPLACE FUNCTION outreach_db_make_primary(p_lead_id VARCHAR, p_contact_id VARCHAR, p_user_id VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_lead outreach_brands%ROWTYPE;
  v_c    outreach_brand_contacts%ROWTYPE;
  v_old  JSONB;
  v_new  JSONB;
BEGIN
  SELECT * INTO v_lead FROM outreach_brands WHERE lead_id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'outreach_not_found'; END IF;
  IF v_lead.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'outreach_deleted' USING DETAIL = p_lead_id; END IF;
  PERFORM 1 FROM outreach_brand_db WHERE lead_id = p_lead_id AND removed_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'outreach_db_not_found'; END IF;
  SELECT * INTO v_c FROM outreach_brand_contacts WHERE id = p_contact_id AND lead_id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'outreach_db_item_not_found'; END IF;

  v_old := jsonb_build_object('name', v_lead.contact_name, 'role', v_lead.role, 'email', v_lead.email, 'linkedin', v_lead.linkedin);
  v_new := jsonb_build_object('name', v_c.name, 'role', v_c.role, 'email', v_c.email, 'linkedin', v_c.linkedin);

  IF coalesce(v_lead.contact_name, v_lead.email, v_lead.linkedin) IS NULL THEN
    DELETE FROM outreach_brand_contacts WHERE id = p_contact_id;
  ELSE
    UPDATE outreach_brand_contacts SET name = v_lead.contact_name, role = v_lead.role, email = v_lead.email,
      linkedin = v_lead.linkedin, updated_at = now()
    WHERE id = p_contact_id;
  END IF;

  UPDATE outreach_brands SET contact_name = v_c.name, role = v_c.role, email = v_c.email, linkedin = v_c.linkedin
  WHERE lead_id = p_lead_id;

  UPDATE outreach_brand_db SET updated_at = now() WHERE lead_id = p_lead_id;
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, changes)
  VALUES ('brand', p_lead_id, p_user_id, 'db_edited',
          jsonb_build_object('primary_contact', jsonb_build_object('old', v_old, 'new', v_new)));
  RETURN v_new;
END;
$$;

-- ── Search (tables, CSV export, "Find matching creators") ─────────────────────
-- In SQL because PostgREST can't filter on rate rows or sort by computed
-- prices, and caps responses at 1,000 rows. Returns {total, rows}. Deleted
-- leads and removed entries never appear.
--
-- Creator filters (p): q, niches[] (contains match, see below), countries[] (lead country or audience
-- countries), platforms[] (lead platform, followers keys or rate platforms),
-- formats[], max_price + currency (a rate in that currency, matching the
-- platform/format filters, priced <= max_price), availability[],
-- min_rating, tags[] (any), owner (user id | 'none').
-- Sort: added | name | price | followers | rating | rate_date; dir asc|desc.
--
-- cheapest / typical (median) come from the creator's rates that match the
-- platform/format filters, in the filtered currency, else the currency
-- most of those rates use (USD wins a tie). rate_currency says which.
CREATE OR REPLACE FUNCTION outreach_db_creator_search(p JSONB, p_limit INTEGER, p_offset INTEGER)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_q         TEXT    := nullif(btrim(p ->> 'q'), '');
  v_niches    TEXT[]  := outreach_jsonb_texts(p -> 'niches');
  v_countries TEXT[]  := (SELECT coalesce(array_agg(lower(x)), '{}') FROM unnest(outreach_jsonb_texts(p -> 'countries')) x);
  v_platforms TEXT[]  := outreach_jsonb_texts(p -> 'platforms');
  v_formats   TEXT[]  := outreach_jsonb_texts(p -> 'formats');
  v_avail     TEXT[]  := outreach_jsonb_texts(p -> 'availability');
  v_tags      TEXT[]  := (SELECT coalesce(array_agg(lower(x)), '{}') FROM unnest(outreach_jsonb_texts(p -> 'tags')) x);
  v_max_price NUMERIC := nullif(p ->> 'max_price', '')::numeric;
  v_currency  TEXT    := upper(nullif(btrim(p ->> 'currency'), ''));
  v_rating    INTEGER := nullif(p ->> 'min_rating', '')::integer;
  v_owner     TEXT    := nullif(p ->> 'owner', '');
  v_sort      TEXT    := coalesce(p ->> 'sort', 'added');
  v_asc       BOOLEAN := (p ->> 'dir') = 'asc';
  v_limit     INTEGER := least(greatest(coalesce(p_limit, 50), 1), 10000);
  v_offset    INTEGER := greatest(coalesce(p_offset, 0), 0);
  v_result    JSONB;
BEGIN
  IF v_max_price IS NOT NULL AND v_currency IS NULL THEN v_currency := 'USD'; END IF;

  WITH c AS (
    SELECT
      l.lead_id, l.name, l.platform, outreach_platform_id(l.platform) AS platform_id, l.profile_url, l.country,
      l.niche, l.subscribers, l.email, l.email_norm, l.linkedin, l.instagram, l.x, l.tiktok, l.website, l.extra,
      l.status, l.owner_user_id,
      d.availability, d.next_available_date, d.min_lead_days, d.payment_methods, d.upfront_pct,
      d.audience_countries, d.audience_languages, d.past_collabs, d.followers, d.quality_rating, d.tags,
      d.notes AS db_notes, d.added_at, d.added_by, d.updated_at AS db_updated_at,
      (SELECT coalesce(sum(CASE WHEN f.value ~ '^[0-9]+$' THEN f.value::bigint ELSE 0 END), 0)
         FROM jsonb_each_text(d.followers) f)
        + CASE WHEN d.followers ? coalesce(outreach_platform_id(l.platform), '~') THEN 0 ELSE coalesce(l.subscribers, 0) END
        AS total_followers,
      ARRAY(
        SELECT DISTINCT x FROM (
          SELECT outreach_platform_id(l.platform) AS x
          UNION ALL SELECT jsonb_object_keys(d.followers)
          UNION ALL SELECT r.platform FROM outreach_creator_rates r WHERE r.lead_id = d.lead_id
        ) s WHERE x IS NOT NULL ORDER BY x
      ) AS all_platforms,
      (SELECT coalesce(jsonb_agg(to_jsonb(r) - 'lead_id' - 'created_by' ORDER BY r.platform, r.format, r.price), '[]'::jsonb)
         FROM outreach_creator_rates r WHERE r.lead_id = d.lead_id) AS rates,
      (SELECT max(r.quoted_at) FROM outreach_creator_rates r WHERE r.lead_id = d.lead_id) AS last_quoted_at,
      pr.rate_currency, pr.cheapest, pr.typical
    FROM outreach_creator_db d
    JOIN outreach_creators l ON l.lead_id = d.lead_id AND l.deleted_at IS NULL
    LEFT JOIN LATERAL (
      WITH m AS (
        SELECT r.currency, r.price FROM outreach_creator_rates r
        WHERE r.lead_id = d.lead_id
          AND (cardinality(v_formats) = 0 OR r.format = ANY (v_formats))
          AND (cardinality(v_platforms) = 0 OR r.platform = ANY (v_platforms))
      ), cur AS (
        SELECT coalesce(v_currency, (
          SELECT m.currency FROM m GROUP BY m.currency ORDER BY count(*) DESC, (m.currency = 'USD') DESC, m.currency LIMIT 1
        )) AS currency
      )
      SELECT cur.currency AS rate_currency, min(m.price) AS cheapest,
             (percentile_cont(0.5) WITHIN GROUP (ORDER BY m.price))::numeric(12, 2) AS typical
      FROM cur LEFT JOIN m ON m.currency = cur.currency
      GROUP BY cur.currency
    ) pr ON true
    WHERE d.removed_at IS NULL
  ), f AS (
    SELECT c.*, row_number() OVER (ORDER BY
      CASE WHEN v_sort = 'price' AND v_asc THEN c.cheapest END ASC NULLS LAST,
      CASE WHEN v_sort = 'price' AND NOT v_asc THEN c.cheapest END DESC NULLS LAST,
      CASE WHEN v_sort = 'followers' AND v_asc THEN c.total_followers END ASC NULLS LAST,
      CASE WHEN v_sort = 'followers' AND NOT v_asc THEN c.total_followers END DESC NULLS LAST,
      CASE WHEN v_sort = 'rating' AND v_asc THEN c.quality_rating END ASC NULLS LAST,
      CASE WHEN v_sort = 'rating' AND NOT v_asc THEN c.quality_rating END DESC NULLS LAST,
      CASE WHEN v_sort = 'rate_date' AND v_asc THEN c.last_quoted_at END ASC NULLS LAST,
      CASE WHEN v_sort = 'rate_date' AND NOT v_asc THEN c.last_quoted_at END DESC NULLS LAST,
      CASE WHEN v_sort = 'name' AND v_asc THEN lower(c.name) END ASC NULLS LAST,
      CASE WHEN v_sort = 'name' AND NOT v_asc THEN lower(c.name) END DESC NULLS LAST,
      CASE WHEN v_asc THEN c.added_at END ASC,
      c.added_at DESC,
      c.lead_id
    ) AS ord
    FROM c
    WHERE (v_q IS NULL OR concat_ws(' ', c.lead_id, c.name, c.email, c.profile_url, c.niche, c.country, c.db_notes,
             array_to_string(c.tags, ' '), array_to_string(c.past_collabs, ' ')) ILIKE '%' || v_q || '%')
      -- Lead niches are free text ("AI", "SaaS"), client niches come from
      -- NICHES ("AI & Machine Learning"): either one containing the other matches.
      AND (cardinality(v_niches) = 0 OR (coalesce(btrim(c.niche), '') <> '' AND EXISTS (
            SELECT 1 FROM unnest(v_niches) n
            WHERE c.niche ILIKE '%' || n || '%' OR n ILIKE '%' || btrim(c.niche) || '%')))
      AND (cardinality(v_countries) = 0 OR lower(c.country) = ANY (v_countries)
           OR EXISTS (SELECT 1 FROM unnest(c.audience_countries) a WHERE lower(a) = ANY (v_countries)))
      AND (cardinality(v_platforms) = 0 OR c.all_platforms && v_platforms)
      AND ((cardinality(v_formats) = 0 AND v_max_price IS NULL) OR EXISTS (
            SELECT 1 FROM outreach_creator_rates r
            WHERE r.lead_id = c.lead_id
              AND (cardinality(v_formats) = 0 OR r.format = ANY (v_formats))
              AND (cardinality(v_platforms) = 0 OR r.platform = ANY (v_platforms))
              AND (v_max_price IS NULL OR (r.currency = v_currency AND r.price <= v_max_price))))
      AND (cardinality(v_avail) = 0 OR c.availability = ANY (v_avail))
      AND (v_rating IS NULL OR c.quality_rating >= v_rating)
      AND (cardinality(v_tags) = 0 OR EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE lower(t) = ANY (v_tags)))
      AND (v_owner IS NULL OR (v_owner = 'none' AND c.owner_user_id IS NULL) OR c.owner_user_id = v_owner)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM f),
    'rows', coalesce((SELECT jsonb_agg(to_jsonb(f) - 'ord' ORDER BY f.ord) FROM f
                      WHERE f.ord > v_offset AND f.ord <= v_offset + v_limit), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- Client filters (p): q, stages[], countries[] (lead country or target
-- countries), niches[] (any), platforms[] (any), min_budget (+ currency:
-- clients whose budget_max reaches it), owner. Sort: added | company |
-- budget | start_date; dir asc|desc.
CREATE OR REPLACE FUNCTION outreach_db_brand_search(p JSONB, p_limit INTEGER, p_offset INTEGER)
RETURNS JSONB
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_q          TEXT    := nullif(btrim(p ->> 'q'), '');
  v_stages     TEXT[]  := outreach_jsonb_texts(p -> 'stages');
  v_countries  TEXT[]  := (SELECT coalesce(array_agg(lower(x)), '{}') FROM unnest(outreach_jsonb_texts(p -> 'countries')) x);
  v_niches     TEXT[]  := outreach_jsonb_texts(p -> 'niches');
  v_platforms  TEXT[]  := outreach_jsonb_texts(p -> 'platforms');
  v_min_budget NUMERIC := nullif(p ->> 'min_budget', '')::numeric;
  v_currency   TEXT    := upper(coalesce(nullif(btrim(p ->> 'currency'), ''), 'USD'));
  v_owner      TEXT    := nullif(p ->> 'owner', '');
  v_sort       TEXT    := coalesce(p ->> 'sort', 'added');
  v_asc        BOOLEAN := (p ->> 'dir') = 'asc';
  v_limit      INTEGER := least(greatest(coalesce(p_limit, 50), 1), 10000);
  v_offset     INTEGER := greatest(coalesce(p_offset, 0), 0);
  v_result     JSONB;
BEGIN
  WITH c AS (
    SELECT
      l.lead_id, l.company, l.website, l.domain, l.country, l.product, l.contact_name, l.role, l.email, l.linkedin,
      l.status, l.owner_user_id, l.extra,
      d.promotes, d.target_countries, d.niches, d.platforms, d.budget_min, d.budget_max, d.budget_currency,
      d.creator_sizes, d.stage, d.start_date, d.payment_terms, d.notes AS db_notes, d.added_at, d.added_by,
      d.updated_at AS db_updated_at,
      (SELECT count(*) FROM outreach_brand_contacts x WHERE x.lead_id = d.lead_id) AS extra_contacts,
      (SELECT count(*) FROM outreach_brand_campaigns x WHERE x.lead_id = d.lead_id) AS campaigns_count,
      (SELECT max(x.run_date) FROM outreach_brand_campaigns x WHERE x.lead_id = d.lead_id) AS last_campaign_date
    FROM outreach_brand_db d
    JOIN outreach_brands l ON l.lead_id = d.lead_id AND l.deleted_at IS NULL
    WHERE d.removed_at IS NULL
  ), f AS (
    SELECT c.*, row_number() OVER (ORDER BY
      CASE WHEN v_sort = 'company' AND v_asc THEN lower(c.company) END ASC NULLS LAST,
      CASE WHEN v_sort = 'company' AND NOT v_asc THEN lower(c.company) END DESC NULLS LAST,
      CASE WHEN v_sort = 'budget' AND v_asc THEN coalesce(c.budget_max, c.budget_min) END ASC NULLS LAST,
      CASE WHEN v_sort = 'budget' AND NOT v_asc THEN coalesce(c.budget_max, c.budget_min) END DESC NULLS LAST,
      CASE WHEN v_sort = 'start_date' AND v_asc THEN c.start_date END ASC NULLS LAST,
      CASE WHEN v_sort = 'start_date' AND NOT v_asc THEN c.start_date END DESC NULLS LAST,
      CASE WHEN v_asc THEN c.added_at END ASC,
      c.added_at DESC,
      c.lead_id
    ) AS ord
    FROM c
    WHERE (v_q IS NULL OR concat_ws(' ', c.lead_id, c.company, c.domain, c.website, c.contact_name, c.email, c.product,
             c.promotes, c.db_notes, c.payment_terms) ILIKE '%' || v_q || '%')
      AND (cardinality(v_stages) = 0 OR c.stage = ANY (v_stages))
      AND (cardinality(v_countries) = 0 OR lower(c.country) = ANY (v_countries)
           OR EXISTS (SELECT 1 FROM unnest(c.target_countries) a WHERE lower(a) = ANY (v_countries)))
      AND (cardinality(v_niches) = 0 OR c.niches && v_niches)
      AND (cardinality(v_platforms) = 0 OR c.platforms && v_platforms)
      AND (v_min_budget IS NULL OR (c.budget_currency = v_currency AND coalesce(c.budget_max, c.budget_min) >= v_min_budget))
      AND (v_owner IS NULL OR (v_owner = 'none' AND c.owner_user_id IS NULL) OR c.owner_user_id = v_owner)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM f),
    'rows', coalesce((SELECT jsonb_agg(to_jsonb(f) - 'ord' ORDER BY f.ord) FROM f
                      WHERE f.ord > v_offset AND f.ord <= v_offset + v_limit), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- ── 6. Replaced: outreach_erase_lead ──────────────────────────────────────────
-- Same as outreach_delete_migration.sql, plus: a creator's Database entry
-- (rates included) is deleted, a brand's extra contacts are deleted and its
-- Database notes cleared. The 'db_*' activity rows stay, with their
-- `changes` cleared like every other row of the lead.
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
    -- Brand extra holds company facts (batch, tags, yc_url), not personal data.
    UPDATE outreach_brands SET
      contact_name = NULL, role = NULL, email = NULL, linkedin = NULL, notes = NULL,
      follow_up_date = NULL,
      status = CASE WHEN status IN ('not_interested', 'no_reply', 'bounced', 'opted_out') THEN status ELSE 'opted_out' END
    WHERE lead_id = p_lead_id;
    DELETE FROM outreach_brand_contacts WHERE lead_id = p_lead_id;
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

-- ── 7. Function grants (service_role only) ────────────────────────────────────
REVOKE ALL ON FUNCTION
  outreach_platform_id(TEXT),
  outreach_jsonb_texts(JSONB),
  outreach_db_guard_deleted(),
  outreach_db_add(VARCHAR, VARCHAR, VARCHAR, VARCHAR),
  outreach_db_remove(VARCHAR, TEXT[], VARCHAR),
  outreach_db_update(VARCHAR, VARCHAR, VARCHAR, JSONB),
  outreach_db_item(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB),
  outreach_db_make_primary(VARCHAR, VARCHAR, VARCHAR),
  outreach_db_creator_search(JSONB, INTEGER, INTEGER),
  outreach_db_brand_search(JSONB, INTEGER, INTEGER),
  outreach_erase_lead(VARCHAR, VARCHAR, VARCHAR)
FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION
  outreach_platform_id(TEXT),
  outreach_jsonb_texts(JSONB),
  outreach_db_guard_deleted(),
  outreach_db_add(VARCHAR, VARCHAR, VARCHAR, VARCHAR),
  outreach_db_remove(VARCHAR, TEXT[], VARCHAR),
  outreach_db_update(VARCHAR, VARCHAR, VARCHAR, JSONB),
  outreach_db_item(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB),
  outreach_db_make_primary(VARCHAR, VARCHAR, VARCHAR),
  outreach_db_creator_search(JSONB, INTEGER, INTEGER),
  outreach_db_brand_search(JSONB, INTEGER, INTEGER),
  outreach_erase_lead(VARCHAR, VARCHAR, VARCHAR)
TO service_role;
