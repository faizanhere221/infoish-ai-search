-- ============================================================================
-- PHASE 1 — MESSAGING: SECURITY, RELIABILITY, PERFORMANCE, ATTACHMENTS
-- Run this entire file once in the Supabase SQL Editor, top to bottom.
-- Every statement is idempotent (IF EXISTS / IF NOT EXISTS) so it is safe to
-- re-run if a prior attempt was interrupted partway through.
-- ============================================================================


-- ============================================================================
-- STEP 1a — Drop permissive "USING (true)" / "WITH CHECK (true)" RLS policies
--
-- These policies allow ANY request authenticated with the Supabase anon key
-- to read or write these tables directly, bypassing all application-layer
-- authorization. Our API routes exclusively use the service-role key (which
-- bypasses RLS entirely), and a repo-wide grep confirms the anon-key client
-- (src/lib/supabase.ts) is never imported anywhere in the frontend. So these
-- policies serve no real purpose today and only widen the attack surface for
-- anyone who obtains the public anon key. Dropping them changes no app
-- behavior. (RLS remains enabled on these tables; without a permissive
-- policy, anon/authenticated-role access simply has nothing granted to it.)
-- ============================================================================

-- From supabase/campaigns_migration.sql
DROP POLICY IF EXISTS campaigns_all_access ON campaigns;
DROP POLICY IF EXISTS campaign_deliverables_all_access ON campaign_deliverables;
DROP POLICY IF EXISTS campaign_applications_all_access ON campaign_applications;

-- From supabase/migration.sql
DROP POLICY IF EXISTS creators_all ON creators;
DROP POLICY IF EXISTS creator_platforms_all ON creator_platforms;
DROP POLICY IF EXISTS creator_services_all ON creator_services;
DROP POLICY IF EXISTS creator_portfolio_all ON creator_portfolio;
DROP POLICY IF EXISTS brands_all ON brands;
DROP POLICY IF EXISTS deals_all ON deals;
DROP POLICY IF EXISTS conversations_all ON conversations;
DROP POLICY IF EXISTS messages_all ON messages;
DROP POLICY IF EXISTS deal_messages_all ON deal_messages;
DROP POLICY IF EXISTS reviews_all ON reviews;
DROP POLICY IF EXISTS notifications_all ON notifications;
DROP POLICY IF EXISTS saved_creators_all ON saved_creators;
DROP POLICY IF EXISTS payments_all ON payments;

-- From supabase/referral_system_migration.sql
DROP POLICY IF EXISTS referral_partners_all_access ON referral_partners;
DROP POLICY IF EXISTS referral_signups_all_access ON referral_signups;
DROP POLICY IF EXISTS referral_commissions_all_access ON referral_commissions;
DROP POLICY IF EXISTS referral_payouts_all_access ON referral_payouts;

-- From supabase/schema.sql (public SELECT-only policies — lower risk than the
-- FOR ALL ones above, but still unused since nothing reads via the anon key,
-- so dropped for the same reason: no legitimate caller relies on them)
DROP POLICY IF EXISTS creators_select ON creators;
DROP POLICY IF EXISTS creator_platforms_select ON creator_platforms;
DROP POLICY IF EXISTS creator_services_select ON creator_services;
DROP POLICY IF EXISTS creator_portfolio_select ON creator_portfolio;
DROP POLICY IF EXISTS brands_select ON brands;


-- ============================================================================
-- STEP 2b — is_system column on messages
--
-- Lets deal-lifecycle system messages ("Deal accepted!", "Revision
-- requested", etc. — see src/lib/deal-messages.ts) render differently from
-- a normal chat message in the UI, instead of looking like something a
-- person typed.
-- ============================================================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;


-- ============================================================================
-- STEP 2c — add 'declined' to the deal_status enum
--
-- src/app/api/deals/[id]/decline/route.ts sets status = 'declined', but the
-- enum only ever had: pending, accepted, paid, in_progress, delivered,
-- revision, completed, cancelled, disputed. Without this, every decline
-- write either fails outright or was only working because the live
-- database already had an out-of-band value added outside the migrations
-- folder. ADD VALUE cannot run inside a multi-statement transaction block in
-- older Postgres — run this file as top-level statements (the default when
-- pasting into the Supabase SQL Editor), not wrapped in an explicit
-- BEGIN/COMMIT.
-- ============================================================================

ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'declined';


-- ============================================================================
-- STEP 3 — Performance: composite indexes + atomic send function
-- ============================================================================

-- Covers "messages in this conversation, newest/oldest first" — the shape of
-- every query the paginated GET /api/conversations/[id]/messages endpoint
-- runs (initial load, before-cursor, after-cursor).
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC);

-- Covers "my conversations, most recently active first" — what the
-- conversation list (GET /api/conversations) and the unread-badge polling
-- both query.
CREATE INDEX IF NOT EXISTS idx_conversations_brand_last_message
  ON conversations(brand_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_last_message
  ON conversations(creator_id, last_message_at DESC);

-- Sends a message and updates the conversation's preview/unread counter in
-- one atomic statement. The previous application code did a
-- read-then-write ("creator_unread: (conversation.creator_unread || 0) + 1")
-- with a race window: two messages arriving back-to-back from the same
-- sender could both read the same starting count and one increment would be
-- lost. Expressing the increment as "brand_unread = brand_unread + 1"
-- directly in the UPDATE is safe under Postgres's row-level locking even
-- with concurrent callers, because the second UPDATE blocks until the first
-- commits and then re-reads the now-current value — no lost update is
-- possible. Call via supabase.rpc('send_conversation_message', {...}).
CREATE OR REPLACE FUNCTION send_conversation_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_sender_type TEXT, -- 'creator' or 'brand' — whichever side is NOT the sender gets the unread bump
  p_attachments JSONB DEFAULT '[]'::jsonb
) RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  attachments JSONB,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ,
  is_system BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_message_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  INSERT INTO messages (conversation_id, sender_id, content, attachments, is_read, is_system)
  VALUES (p_conversation_id, p_sender_id, p_content, p_attachments, FALSE, FALSE)
  RETURNING messages.id, messages.created_at INTO v_message_id, v_created_at;

  IF p_sender_type = 'creator' THEN
    UPDATE conversations
    SET brand_unread = brand_unread + 1,
        last_message_at = v_created_at,
        last_message_preview = left(p_content, 100),
        updated_at = NOW()
    WHERE conversations.id = p_conversation_id;
  ELSE
    UPDATE conversations
    SET creator_unread = creator_unread + 1,
        last_message_at = v_created_at,
        last_message_preview = left(p_content, 100),
        updated_at = NOW()
    WHERE conversations.id = p_conversation_id;
  END IF;

  RETURN QUERY
    SELECT messages.id, messages.conversation_id, messages.sender_id, messages.content,
           messages.attachments, messages.is_read, messages.read_at, messages.is_system,
           messages.created_at
    FROM messages WHERE messages.id = v_message_id;
END;
$$ LANGUAGE plpgsql;
