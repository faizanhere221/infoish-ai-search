-- ============================================================================
-- WORKFLOW UX — actionable system messages with deep links. Run this
-- entire file once in the Supabase SQL Editor. Idempotent.
-- ============================================================================

-- Mirrors notifications.related_type/related_id. Only ever set on system
-- messages (is_system = true) — real user messages leave these NULL, same
-- as every pre-existing message. related_type reuses the exact eventType
-- string already passed to recordCampaignCreatorAction() (e.g.
-- 'offer_sent', 'contract_signed_by_creator', 'payment_marked_paid') so one
-- lookup table (src/lib/campaign-creator-cta.ts) drives both which drawer
-- tab to open and the button label, for both this and notifications.
-- related_id is always the campaign_creators row id.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS related_type VARCHAR(50);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS related_id VARCHAR(255);
