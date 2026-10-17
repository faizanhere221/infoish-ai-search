-- Phase 6A — in-app notification center.
--
-- CRITICAL FINDING while building this: the live `notifications` table does
-- NOT match what src/lib/notifications.ts has been inserting into for a
-- long time. Confirmed live via psql: the table only has
-- (id, user_id, type, title, message, is_read, created_at) — no `content`,
-- no `related_type`/`related_id`, no `read_at`. createNotification() inserts
-- `content`/`related_type`/`related_id`, which Postgres rejects with
-- "column does not exist" (42703) on every call — caught by captureError()
-- and silently swallowed. `SELECT count(*) FROM notifications` is 0.
-- Notifications have never actually been written, on this table, ever.
--
-- Separately, `messages.related_type`/`related_id` (meant to be added by
-- workflow_ux_migration.sql, used by the actionable-chat-card feature) are
-- ALSO missing live — that migration was written but never run. Every
-- postDealSystemMessage() call that passes relatedType/relatedId has been
-- failing the same way and posting NO system message at all. Re-running
-- those two ADD COLUMN statements here (idempotent) alongside the rest of
-- this migration so it actually gets applied this time.
--
-- Safe to run more than once — every statement is idempotent
-- (IF NOT EXISTS / ON CONFLICT DO NOTHING / guarded backfill).

-- ============================================================================
-- STEP 0 — fix messages (workflow_ux_migration.sql, re-applied; confirmed
-- live it never landed)
-- ============================================================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS related_type VARCHAR(50);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS related_id VARCHAR(255);

-- ============================================================================
-- STEP 1 — bring notifications up to what the application code already
-- expects, then add the Phase 6A columns on top.
-- ============================================================================

-- `message` -> `content`: add the real column, backfill from the old one so
-- nothing already-written is lost (there is nothing — 0 rows live — but this
-- is correct regardless), then drop `message`. No app code reads `message`.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS content TEXT;
UPDATE notifications SET content = message WHERE content IS NULL AND message IS NOT NULL;
ALTER TABLE notifications DROP COLUMN IF EXISTS message;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Phase 6A additions.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(20);
-- 'messages' | 'offers' | 'contracts' | 'work' | 'payments' | 'account'
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'info';
-- 'action' | 'info'
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_status VARCHAR(20);
-- NULL today (no email sending capability — see CLAUDE.md). Reserved for
-- Phase 6B: 'pending' | 'sent' | 'failed'. Do not wire up email from this
-- column without explicit instruction.

-- Structured payload alongside the rendered title/content, for richer future
-- UI and so security-check.mjs can assert forbidden keys never appear in a
-- creator's notification data (see emitEvent in src/lib/events/emit.ts,
-- which never includes charge_amount/profit/brand_notes/client_name in any
-- creator-facing event's `data`).
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Index conventions match every other table in this app: one for the common
-- "my notifications, newest first" read, one partial index scoped to the
-- unread badge/list query (the common case — most notifications end up read
-- and archived, so keeping the unread index small keeps it fast and cheap).
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;

-- One notification per (user, conversation) for new-message pings, upserted
-- (not inserted fresh) on every new message so an active conversation
-- doesn't flood the list — see emitNewMessageNotification in
-- src/lib/events/emit.ts. Scoped to related_type='conversation' only; every
-- other notification type still gets one row per event as before.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_one_per_conversation
  ON notifications(user_id, related_id) WHERE related_type = 'conversation';

-- Backfill category/priority for the (zero, but just in case this runs
-- against a database where something already landed) pre-6A rows so no
-- existing notification is left with category=NULL.
UPDATE notifications SET category = 'account' WHERE category IS NULL;
