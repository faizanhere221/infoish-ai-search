-- Phase 7B — admin visibility and control over phases 1-6. Idempotent, safe
-- to re-run.
--
-- Only one new table is needed (reports, step 5's moderation queue).
-- Everything else Phase 7B touches (creator_payments, campaign_contracts,
-- campaign_creators, email_log, etc.) already exists live. Admin "internal
-- notes" on a payment and admin dispute-resolution/void/cancel reasons are
-- NOT a new column anywhere — they're logged to activity_logs like every
-- other admin action, so there's nothing to add for those here.

-- ============================================================================
-- STEP 1 — reports (users reporting a message or another user; admin
-- moderation queue at /admin/reports). message_id/conversation_id are only
-- set for a message report — a profile report has neither.
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,

  reporter_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE SET NULL,
  message_id VARCHAR(255) REFERENCES messages(id) ON DELETE SET NULL,

  category VARCHAR(30) NOT NULL,
  -- 'spam' | 'harassment' | 'scam' | 'inappropriate' | 'impersonation' | 'other'
  note TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'open',
  -- 'open' | 'reviewing' | 'resolved' | 'dismissed'

  admin_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  resolution_action VARCHAR(20), -- 'warned' | 'suspended' | 'dismissed'
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (reporter_user_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_user ON reports(reporter_user_id);

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- No permissive policy — same reasoning as every table since the Phase 1
-- security cleanup: the service-role key bypasses RLS, nothing uses anon.
