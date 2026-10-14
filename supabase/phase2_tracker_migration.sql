-- ============================================================================
-- PHASE 2 — CAMPAIGN TRACKER, CREATOR ROSTER, CLIENT SHARE LINKS
-- Run this entire file once in the Supabase SQL Editor, top to bottom.
-- Every statement is idempotent (IF EXISTS / IF NOT EXISTS) so it is safe to
-- re-run if a prior attempt was interrupted partway through.
--
-- Id convention: VARCHAR(255) with DEFAULT (uuid_generate_v4())::text,
-- matching the live convention already used by campaigns/campaign_applications
-- (see the note at the top of supabase/campaigns_migration.sql, confirmed via
-- information_schema introspection) rather than the native UUID type schema.sql
-- originally used for some tables.
-- ============================================================================


-- ============================================================================
-- STEP 1a — campaigns: client_name
--
-- Internal label only ("which client this campaign is really for," for
-- brands running campaigns on behalf of clients). NEVER returned by any
-- public-facing route (GET /api/campaigns, GET /api/campaigns/[id] for a
-- non-owner, GET /api/share/[token]) — enforced in the API layer, not here.
--
-- NOTE: `campaigns.visibility` ('public'/'private', default 'public') already
-- exists (added by supabase/campaigns_migration.sql) and is already enforced
-- in GET /api/campaigns and GET /api/campaigns/[id]. This migration does not
-- re-add it. It does close one real gap found while verifying this: the
-- creator application endpoint did not check visibility before this phase's
-- code changes (see POST /api/campaigns/[id]/applications).
-- ============================================================================

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS client_name TEXT;


-- ============================================================================
-- STEP 1b — campaign_creators
--
-- The per-creator row of a campaign's tracker: where a creator is in the
-- pipeline, when they're posting, what they're paid vs. what the client is
-- charged. payout/charge are intentionally two separate columns (never a
-- single "amount" + flag) so a server-side select() can trivially omit
-- charge_amount for creator-facing responses and payout_amount for
-- share-link responses without any risk of the wrong number leaking through.
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_creators (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id VARCHAR(255) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,

  status VARCHAR(50) NOT NULL DEFAULT 'shortlisted',
  -- 'shortlisted' | 'contacted' | 'negotiating' | 'confirmed' | 'drafting' |
  -- 'draft_review' | 'scheduled' | 'posted' | 'completed' | 'dropped'

  planned_date DATE,
  posted_at TIMESTAMPTZ,
  posted_url TEXT,

  payout_amount NUMERIC(12,2),  -- paid TO the creator — creator may see this
  charge_amount NUMERIC(12,2),  -- charged TO the client — creator must NEVER see this
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',

  brand_notes TEXT,  -- brand-only — never returned to the creator or the share link

  deal_id VARCHAR(255) REFERENCES deals(id) ON DELETE SET NULL,  -- wired up in Phase 3
  application_id VARCHAR(255) REFERENCES campaign_applications(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_creators_campaign ON campaign_creators(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creators_creator ON campaign_creators(creator_id);

DROP TRIGGER IF EXISTS update_campaign_creators_updated_at ON campaign_creators;
CREATE TRIGGER update_campaign_creators_updated_at BEFORE UPDATE ON campaign_creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS enabled but with NO permissive policy. Unlike the older
-- campaigns/campaign_applications tables (which still carry a legacy
-- `FOR ALL USING (true)` policy predating this project's security cleanup),
-- Phase 1 of this same messaging/tracker work removed every such policy
-- project-wide: the service-role key (used by every API route) bypasses RLS
-- regardless of policy, and nothing in the frontend uses the anon key, so a
-- permissive policy only widens the attack surface for anyone who obtains
-- the public anon key. This table is created directly in the secure state
-- rather than adding a policy Phase 1 would just have had to remove again.
ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 1c — saved_creators: extend into a roster (no parallel table)
--
-- `saved_creators` already exists (brand_id, creator_id, notes, UNIQUE
-- (brand_id, creator_id)) but is currently 100% unused — no API route, no UI
-- anywhere in the app reads or writes it. It already has exactly the shape a
-- roster needs (one row per brand-creator pair), so this extends it in place
-- rather than creating a second table that would just duplicate the
-- brand/creator pairing. `notes` already exists; only the rate/tag columns
-- below are new.
-- ============================================================================

ALTER TABLE saved_creators ADD COLUMN IF NOT EXISTS typical_payout NUMERIC(12,2);
ALTER TABLE saved_creators ADD COLUMN IF NOT EXISTS typical_charge NUMERIC(12,2);
ALTER TABLE saved_creators ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'USD';
ALTER TABLE saved_creators ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';


-- ============================================================================
-- STEP 1d — campaign_share_links
--
-- One campaign can have multiple links over time (e.g. revoke and reissue),
-- so this is its own table rather than columns on `campaigns`. `token` is
-- generated application-side (32 random bytes, base64url-encoded — see
-- POST /api/campaigns/[id]/share-links) and is the only credential: anyone
-- with the token can view the read-only client page for as long as the link
-- is not revoked.
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_share_links (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,

  show_charge BOOLEAN NOT NULL DEFAULT TRUE,
  revoked_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_share_links_campaign ON campaign_share_links(campaign_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_share_links_token ON campaign_share_links(token);

ALTER TABLE campaign_share_links ENABLE ROW LEVEL SECURITY;
-- No permissive policy — same reasoning as campaign_creators above. The
-- public share page never queries this table directly; it goes through
-- GET /api/share/[token], which uses the service-role key.
