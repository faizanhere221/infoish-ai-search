-- ============================================================================
-- PHASE 4 — BUG FIXES FOUND IN LOCAL TESTING
-- Run this entire file once in the Supabase SQL Editor, top to bottom.
-- Every statement is idempotent where Postgres allows it; the one DROP
-- FUNCTION below is necessary because Postgres will not let CREATE OR
-- REPLACE change a function's parameter types in place.
-- ============================================================================


-- ============================================================================
-- BUG 1 — POST /api/conversations/[id]/messages returns 500
--
-- Root cause, confirmed by querying information_schema.columns directly
-- against the live database: messages.id, messages.conversation_id,
-- messages.sender_id, and conversations.id are all VARCHAR(255) (the
-- project-wide "uuid_generate_v4()::text" convention — see the note at the
-- top of supabase/campaigns_migration.sql). But the Phase 1 migration
-- declared send_conversation_message() with `p_conversation_id UUID` /
-- `p_sender_id UUID` parameters and a `UUID`-typed RETURNS TABLE, written
-- before that convention had been confirmed.
--
-- Reproduced directly against the live DB:
--   SELECT * FROM send_conversation_message(
--     '6f0e2c8d-00a8-4875-816e-c10fb1e84163', '<a real user id>',
--     'test', 'creator', '[]'::jsonb);
--   ERROR:  operator does not exist: character varying = uuid
--   LINE: WHERE conversations.id = p_conversation_id
-- Postgres has an implicit assignment cast from uuid -> text/varchar (so the
-- INSERT into messages silently "worked"), but no implicit comparison
-- operator between the two types — so every WHERE/equality check in the
-- function body against the live VARCHAR columns fails, and the whole call
-- (including the otherwise-successful insert) rolls back as one
-- transaction. This is not a missing migration — the function exists and
-- was created by the Phase 1 migration exactly as written; the types in
-- that migration were simply wrong for this database.
--
-- CREATE OR REPLACE cannot change a function's argument types, so the
-- original has to be dropped first.
-- ============================================================================

DROP FUNCTION IF EXISTS send_conversation_message(uuid, uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION send_conversation_message(
  p_conversation_id VARCHAR(255),
  p_sender_id VARCHAR(255),
  p_content TEXT,
  p_sender_type TEXT,
  p_attachments JSONB DEFAULT '[]'::jsonb
) RETURNS TABLE (
  id VARCHAR(255),
  conversation_id VARCHAR(255),
  sender_id VARCHAR(255),
  content TEXT,
  attachments JSONB,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ,
  is_system BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_message_id VARCHAR(255);
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
