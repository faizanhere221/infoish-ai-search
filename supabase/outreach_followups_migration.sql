-- ============================================================================
-- Outreach: follow-ups easy to find (webmail links, subject line)
-- ============================================================================
-- Run AFTER supabase/outreach_contact_soft_delete_migration.sql. Idempotent:
-- safe to run more than once. Run in the Supabase SQL Editor.
--
-- What it does:
--   1. outreach_mailboxes.webmail_url (optional, admin editable): where the
--      "Open webmail" button on a follow-up row goes (Hostinger mailboxes).
--   2. outreach_activity.subject (optional): the subject or first line of a
--      first email, typed on "Mark contacted", shown on the follow-up row so
--      the thread is easy to find.
--   3. outreach_log_action() takes p_subject and stores it on the activity
--      row. Copied from outreach_contact_soft_delete_migration.sql; the only
--      changes are the new argument and the subject column in the INSERT.
--      The 7-argument version is dropped so PostgREST has one function.
--   4. outreach_schema_version() = 4.
--
-- No backfill: "contacted on / by / via" comes from each lead's latest
-- contacted activity row, which already stores user, mailbox and channel.
-- ============================================================================

-- ── 0. Version ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION outreach_schema_version() RETURNS INTEGER
LANGUAGE sql IMMUTABLE AS $$ SELECT 4 $$;

-- ── 1. Columns ────────────────────────────────────────────────────────────────
ALTER TABLE outreach_mailboxes ADD COLUMN IF NOT EXISTS webmail_url TEXT;
ALTER TABLE outreach_mailboxes DROP CONSTRAINT IF EXISTS outreach_mailboxes_webmail_url_check;
ALTER TABLE outreach_mailboxes ADD CONSTRAINT outreach_mailboxes_webmail_url_check
  CHECK (webmail_url IS NULL OR (webmail_url ~* '^https?://' AND length(webmail_url) <= 2000));

ALTER TABLE outreach_activity ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE outreach_activity DROP CONSTRAINT IF EXISTS outreach_activity_subject_check;
ALTER TABLE outreach_activity ADD CONSTRAINT outreach_activity_subject_check
  CHECK (subject IS NULL OR length(subject) <= 300);

-- Follow-up rows read the latest contacted activity per lead.
CREATE INDEX IF NOT EXISTS outreach_activity_contacted_idx
  ON outreach_activity (lead_id, created_at DESC) WHERE action = 'contacted' AND undone_at IS NULL;

-- ── 2. outreach_log_action (replaced: + p_subject) ────────────────────────────
DROP FUNCTION IF EXISTS outreach_log_action(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION outreach_log_action(
  p_lead_type  VARCHAR,
  p_lead_id    VARCHAR,
  p_user_id    VARCHAR,
  p_action     VARCHAR,
  p_mailbox_id VARCHAR DEFAULT NULL,
  p_channel    VARCHAR DEFAULT NULL,
  p_contact_id VARCHAR DEFAULT NULL,
  p_subject    TEXT DEFAULT NULL
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

  INSERT INTO outreach_activity (lead_type, lead_id, user_id, action, mailbox_id, channel, prev_state, contact_id, subject)
  VALUES (p_lead_type, p_lead_id, p_user_id, p_action, v_mailbox, v_channel, v_prev, v_cid,
          CASE WHEN p_action = 'contacted' THEN nullif(left(btrim(p_subject), 300), '') END)
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


-- ── 3. Function grants (service_role only) ────────────────────────────────────
REVOKE ALL ON FUNCTION
  outreach_schema_version(),
  outreach_log_action(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT)
FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION
  outreach_schema_version(),
  outreach_log_action(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT)
TO service_role;
