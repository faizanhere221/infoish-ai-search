-- Founder emails: one personal email per account, ever, sent in the
-- founder's name (src/lib/founder-emails/).
--   creator_welcome: a creator's profile becomes complete with
--                    total_followers >= founder_creator_min_followers.
--   brand_welcome:   a brand account is created.
--
-- Run in the Supabase SQL Editor. Idempotent, safe to re-run.
--
-- user_id is VARCHAR(255), not UUID: users.id is VARCHAR(255) on the live
-- database (schema.sql says UUID), and a foreign key must match exactly.

-- 1. The queue and the once-per-account guard in one table. A row is
--    created when an account qualifies (or an admin backfills it) and is
--    never deleted, so the primary key makes a second email impossible.
--    'pending' rows waiting on the daily email quota go out on the next
--    daily-summary cron run.
CREATE TABLE IF NOT EXISTS founder_emails (
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind VARCHAR(30) NOT NULL,
  -- 'creator_welcome' | 'brand_welcome'
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- 'pending' | 'sending' (claimed by one sender) | 'sent' | 'failed'
  -- (gave up after 3 attempts) | 'skipped' (opted out, contacted, hidden,
  -- suspended, deleted; reason in last_error)
  source VARCHAR(20) NOT NULL DEFAULT 'trigger',
  -- 'trigger' (signup/profile save) | 'backfill' (admin "send to existing")
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  -- The "new signup" notice to the founder, sent at most once per row.
  admin_notified_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_founder_emails_status ON founder_emails (status, queued_at);

ALTER TABLE founder_emails ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founder_emails TO service_role;

-- 2. Admin "contacted" flag: an account the founder already reached out to
--    personally gets no founder email.
ALTER TABLE users ADD COLUMN IF NOT EXISTS founder_contacted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founder_contacted_by VARCHAR(255);

-- 3. Follower threshold for the creator welcome, editable in /admin/settings.
INSERT INTO platform_settings (key, value) VALUES ('founder_creator_min_followers', '10000')
ON CONFLICT (key) DO NOTHING;
