-- ============================================================================
-- Outreach: brand contacts are soft deleted (removed, restorable by admins)
-- ============================================================================
-- Run AFTER supabase/outreach_contacts_lists_migration.sql. Idempotent: safe
-- to run more than once. Run in the Supabase SQL Editor.
--
-- Same pattern as soft-deleted leads (outreach_delete_migration.sql):
--   - outreach_brand_contacts.deleted_at / deleted_by. A removed contact is
--     hidden everywhere: contact lists, the brand's primary-contact copy,
--     the status rollup, actions, the no-reply rule, counts.
--   - Its normalised email stays in outreach_keys, so it still blocks
--     duplicates (manual add, edits, CSV and Apollo imports say "Previously
--     removed contact of B-0012", via contact_removed from
--     outreach_match_keys()) and stays in already_in_sheet.txt.
--   - Members remove (outreach_contact_delete, now a soft delete); admins
--     restore (outreach_contact_restore, checked by the API). Both logged.
--   - Delete personal data (outreach_erase_lead) still deletes every contact
--     for good, removed ones included, and puts their emails on the DNC
--     list. That is unchanged, so it isn't replaced here.
--
-- Replaced (copied from their latest versions, plus deleted_at filters):
--   outreach_schema_version (now 3), outreach_brand_mirror_contact,
--   outreach_contacts_after_write, outreach_brand_rollup, outreach_log_action,
--   outreach_mark_no_reply, outreach_contact_save, outreach_contact_delete,
--   outreach_import_contacts (all from outreach_contacts_lists_migration.sql),
--   outreach_match_keys (from outreach_delete_migration.sql),
--   outreach_db_brand_search (from outreach_database_migration.sql).
-- New: outreach_contact_restore.
-- ============================================================================

-- ── 0. Version ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION outreach_schema_version() RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$ SELECT 3 $$;

-- ── 1. Columns + activity action ──────────────────────────────────────────────
-- users.id is VARCHAR(255) on the live database, so deleted_by is too.
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE outreach_brand_contacts ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS outreach_brand_contacts_deleted_idx ON outreach_brand_contacts (lead_id) WHERE deleted_at IS NOT NULL;

ALTER TABLE outreach_activity DROP CONSTRAINT IF EXISTS outreach_activity_action_check;
ALTER TABLE outreach_activity ADD CONSTRAINT outreach_activity_action_check CHECK (action IN (
  'contacted', 'followed_up', 'replied', 'signed_up', 'call_booked', 'won',
  'not_interested', 'bounced', 'opted_out', 'no_reply',
  'status_changed', 'owner_changed', 'erased', 'edited', 'deleted', 'restored',
  'db_added', 'db_removed', 'db_edited',
  'contact_added', 'contact_edited', 'contact_removed', 'contact_restored'));

-- ── 2. Removed contacts drop out of the brand's copy and status ───────────────
-- Same as outreach_contacts_lists_migration.sql, active contacts only.
CREATE OR REPLACE FUNCTION outreach_brand_mirror_contact(p_lead_id VARCHAR) RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  c RECORD;
  v_name TEXT;
BEGIN
  SELECT first_name, last_name, title, email, linkedin INTO c FROM outreach_brand_contacts
  WHERE lead_id = p_lead_id AND deleted_at IS NULL ORDER BY is_primary DESC, created_at, id LIMIT 1;
  v_name := nullif(btrim(concat_ws(' ', c.first_name, c.last_name)), '');
  -- The contact passed (or was let through) its own DNC check already.
  PERFORM set_config('outreach.brand_mirror', 'on', true);
  UPDATE outreach_brands SET contact_name = v_name, role = c.title, email = c.email, linkedin = c.linkedin
  WHERE lead_id = p_lead_id
    AND (contact_name, role, email, linkedin) IS DISTINCT FROM (v_name, c.title, c.email, c.linkedin);
  PERFORM set_config('outreach.brand_mirror', 'off', true);
END;
$$;

-- Same, plus a remove / restore (deleted_at) re-copies the primary contact.
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
  IF TG_OP = 'INSERT' OR (NEW.first_name, NEW.last_name, NEW.title, NEW.email, NEW.linkedin, NEW.is_primary, NEW.deleted_at)
       IS DISTINCT FROM (OLD.first_name, OLD.last_name, OLD.title, OLD.email, OLD.linkedin, OLD.is_primary, OLD.deleted_at) THEN
    PERFORM outreach_brand_mirror_contact(NEW.lead_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Same, active contacts only.
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
    INTO v FROM outreach_brand_contacts WHERE lead_id = p_lead_id AND deleted_at IS NULL;
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

-- ── 3. Remove (soft) and restore ──────────────────────────────────────────────
-- Replaces the hard delete. The row and its email key stay; it stops being
-- primary and the oldest active contact takes over. Logged with the row.
-- Removing a removed contact changes nothing (idempotent).
CREATE OR REPLACE FUNCTION outreach_contact_delete(p_lead_id VARCHAR, p_contact_id VARCHAR, p_user_id VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_old         JSONB;
  v_was_primary BOOLEAN;
BEGIN
  PERFORM outreach_contact_check_brand(p_lead_id);
  SELECT to_jsonb(c) INTO v_old FROM outreach_brand_contacts c
  WHERE id = p_contact_id AND lead_id = p_lead_id FOR UPDATE;
  IF v_old IS NULL THEN RAISE EXCEPTION 'outreach_contact_not_found'; END IF;
  IF v_old->>'deleted_at' IS NOT NULL THEN RETURN v_old; END IF;

  v_was_primary := (v_old->>'is_primary')::boolean;
  UPDATE outreach_brand_contacts SET deleted_at = now(), deleted_by = p_user_id, is_primary = false
  WHERE id = p_contact_id;
  IF v_was_primary THEN
    UPDATE outreach_brand_contacts SET is_primary = true
    WHERE id = (SELECT id FROM outreach_brand_contacts
                WHERE lead_id = p_lead_id AND deleted_at IS NULL ORDER BY created_at, id LIMIT 1);
  END IF;
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, contact_id, changes)
  VALUES ('brand', p_lead_id, p_user_id, 'contact_removed', p_contact_id,
          jsonb_build_object('contact', jsonb_build_object(
            'old', v_old - ARRAY['email_norm', 'created_at', 'updated_at', 'created_by', 'deleted_at', 'deleted_by'], 'new', NULL)));
  PERFORM outreach_brand_rollup(p_lead_id);
  RETURN v_old;
END;
$$;

-- Brings a removed contact back with its status and dates. It becomes
-- primary when the brand has no active primary. Restoring an active
-- contact changes nothing.
CREATE OR REPLACE FUNCTION outreach_contact_restore(p_lead_id VARCHAR, p_contact_id VARCHAR, p_user_id VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_row JSONB;
BEGIN
  PERFORM outreach_contact_check_brand(p_lead_id);
  SELECT to_jsonb(c) INTO v_row FROM outreach_brand_contacts c
  WHERE id = p_contact_id AND lead_id = p_lead_id FOR UPDATE;
  IF v_row IS NULL THEN RAISE EXCEPTION 'outreach_contact_not_found'; END IF;
  IF v_row->>'deleted_at' IS NULL THEN RETURN v_row; END IF;

  UPDATE outreach_brand_contacts c SET deleted_at = NULL, deleted_by = NULL,
    is_primary = NOT EXISTS (SELECT 1 FROM outreach_brand_contacts p
                             WHERE p.lead_id = p_lead_id AND p.is_primary AND p.deleted_at IS NULL)
  WHERE id = p_contact_id
  RETURNING to_jsonb(c.*) INTO v_row;
  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, contact_id)
  VALUES ('brand', p_lead_id, p_user_id, 'contact_restored', p_contact_id);
  PERFORM outreach_brand_rollup(p_lead_id);
  RETURN v_row;
END;
$$;

-- ── 4. Everything else skips removed contacts ─────────────────────────────────
-- Same as outreach_contacts_lists_migration.sql: a removed contact is never
-- picked for an action (outreach_contact_not_found when named).
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
     AND EXISTS (SELECT 1 FROM outreach_brand_contacts WHERE lead_id = p_lead_id AND deleted_at IS NULL) THEN
    v_use_c := true;
    IF p_contact_id IS NOT NULL THEN
      SELECT * INTO v_c FROM outreach_brand_contacts WHERE id = p_contact_id AND lead_id = p_lead_id AND deleted_at IS NULL FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'outreach_contact_not_found'; END IF;
    ELSE
      SELECT * INTO v_c FROM outreach_brand_contacts
      WHERE lead_id = p_lead_id AND deleted_at IS NULL AND CASE p_action
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

-- Same as outreach_contacts_lists_migration.sql, active contacts only.
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
      AND NOT EXISTS (SELECT 1 FROM outreach_brand_contacts c WHERE c.lead_id = b.lead_id AND c.deleted_at IS NULL)
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
      AND c.deleted_at IS NULL AND c.status = 'followed_up' AND c.replied_at IS NULL AND c.followed_up_date <= v_today - 7
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

-- Same as outreach_contacts_lists_migration.sql: a removed contact can't be
-- edited (restore it first) and doesn't count as the brand's first contact.
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
                 OR NOT EXISTS (SELECT 1 FROM outreach_brand_contacts WHERE lead_id = p_lead_id AND deleted_at IS NULL);
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
              'new', v_new - ARRAY['email_norm', 'created_at', 'updated_at', 'created_by', 'deleted_at', 'deleted_by'])));
    RETURN v_new;
  END IF;

  SELECT to_jsonb(c) INTO v_old FROM outreach_brand_contacts c WHERE id = p_contact_id AND lead_id = p_lead_id AND deleted_at IS NULL FOR UPDATE;
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

-- Same as outreach_contacts_lists_migration.sql, plus a duplicate of a
-- removed contact says so ('removed').
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
      -- A removed contact keeps its key: still a duplicate, reported as removed.
      SELECT k.lead_id, (bc.deleted_at IS NOT NULL) AS removed INTO v_hit
      FROM outreach_keys k LEFT JOIN outreach_brand_contacts bc ON bc.id = k.contact_id
      WHERE k.key_type = 'email' AND k.key_value = v_email;
      IF FOUND THEN
        v_dup := v_dup || jsonb_build_object('row', v_row, 'email', v_email, 'lead_id', v_hit.lead_id, 'removed', v_hit.removed);
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
                NOT EXISTS (SELECT 1 FROM outreach_brand_contacts WHERE lead_id = v_lead AND deleted_at IS NULL), p_user_id);
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

-- Same as outreach_delete_migration.sql, plus contact_id / contact_removed,
-- so the add form, edits and imports say "Previously removed contact of B-0012".
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
      FROM outreach_dnc d WHERE d.key_value = ANY(p_values)), '[]'::jsonb)
  )
$$;

-- Same as outreach_database_migration.sql: extra_contacts counts active contacts.
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
      (SELECT count(*) FROM outreach_brand_contacts x WHERE x.lead_id = d.lead_id AND x.deleted_at IS NULL) AS extra_contacts,
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

-- ── 5. Function grants (service_role only) ────────────────────────────────────
REVOKE ALL ON FUNCTION
  outreach_schema_version(),
  outreach_brand_mirror_contact(VARCHAR),
  outreach_contacts_after_write(),
  outreach_brand_rollup(VARCHAR),
  outreach_contact_delete(VARCHAR, VARCHAR, VARCHAR),
  outreach_contact_restore(VARCHAR, VARCHAR, VARCHAR),
  outreach_log_action(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR),
  outreach_mark_no_reply(),
  outreach_contact_save(VARCHAR, VARCHAR, VARCHAR, JSONB),
  outreach_import_contacts(JSONB, VARCHAR, VARCHAR, BOOLEAN),
  outreach_match_keys(TEXT[]),
  outreach_db_brand_search(JSONB, INTEGER, INTEGER)
FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION
  outreach_schema_version(),
  outreach_brand_mirror_contact(VARCHAR),
  outreach_contacts_after_write(),
  outreach_brand_rollup(VARCHAR),
  outreach_contact_delete(VARCHAR, VARCHAR, VARCHAR),
  outreach_contact_restore(VARCHAR, VARCHAR, VARCHAR),
  outreach_log_action(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR),
  outreach_mark_no_reply(),
  outreach_contact_save(VARCHAR, VARCHAR, VARCHAR, JSONB),
  outreach_import_contacts(JSONB, VARCHAR, VARCHAR, BOOLEAN),
  outreach_match_keys(TEXT[]),
  outreach_db_brand_search(JSONB, INTEGER, INTEGER)
TO service_role;
