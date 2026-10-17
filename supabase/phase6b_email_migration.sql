-- Phase 6B — transactional + digest email via Resend.
-- Idempotent — safe to run more than once.

-- ============================================================================
-- STEP 1 — email_log: every send attempt, successful or not. Doubles as the
-- idempotency guard (idempotency_key is UNIQUE) and the digest/summary "did
-- I already send this today" check — no separate tracking table needed for
-- either, since idempotency_key is deterministic for those (see
-- src/lib/email/send.ts).
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_log (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL,
  -- 'messages' | 'offers' | 'contracts' | 'work' | 'payments' | 'daily_summary' | 'security'
  template VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  -- 'sent' | 'skipped' | 'failed' | 'logged_dev' (RESEND_API_KEY missing — logged
  -- to the server console instead of actually sending, for local dev)
  provider_id VARCHAR(255),
  error TEXT,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id, created_at DESC);

-- ============================================================================
-- STEP 2 — verification + password reset tokens. Only the SHA-256 hash is
-- stored (same reasoning as any password: the raw token goes out in an
-- email, so the DB copy must be useless to whoever might read it there).
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- ============================================================================
-- STEP 3 — per-category email preferences. Account/security emails
-- (welcome, verification, password reset) are never gated by this — only
-- emitEvent-driven and digest/summary emails check it.
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_preferences JSONB NOT NULL DEFAULT
  '{"messages": true, "offers": true, "contracts": true, "work": true, "payments": true, "daily_summary": true}'::jsonb;

-- ============================================================================
-- STEP 4 — message digest throttle: at most one digest email per
-- conversation every 3 hours, tracked directly on the row rather than a
-- separate table since there's already exactly one conversation per
-- creator/brand pair.
-- ============================================================================

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ;

-- ============================================================================
-- STEP 5 — daily send counter, for Resend's free-plan 100/day cap.
-- increment_email_daily_count() is a single atomic RPC (INSERT ... ON
-- CONFLICT DO UPDATE ... RETURNING) so concurrent sends can't both read the
-- same pre-increment count and both decide they're under the limit.
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_daily_usage (
  day DATE PRIMARY KEY,
  sent_count INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION increment_email_daily_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO email_daily_usage (day, sent_count)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (day) DO UPDATE SET sent_count = email_daily_usage.sent_count + 1
  RETURNING sent_count INTO v_count;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
