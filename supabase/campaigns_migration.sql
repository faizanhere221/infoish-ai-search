-- ============================================================================
-- CAMPAIGN MARKETPLACE - DATABASE SCHEMA
-- ============================================================================
-- Brands create campaigns to find creators. Creators discover and apply.
-- Brands review applications and message creators. No payments in this
-- phase (handled externally, matches the existing `deals` flow later).
--
-- NOTE ON DEVIATION FROM THE ORIGINAL SPEC HANDED TO THIS MIGRATION:
-- The live users/creators/brands/deals/conversations tables all use
-- VARCHAR(255) ids (uuid text via uuid_generate_v4()::text), not the
-- native Postgres `uuid` type — and deals/conversations reference
-- creators(id) / brands(id) (the profile row), never users(id) directly.
-- This migration mirrors that exact live convention (confirmed via direct
-- information_schema introspection) so the new foreign keys are
-- type-compatible and consistent with the rest of the schema.
-- ============================================================================

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  brand_id VARCHAR(255) NOT NULL REFERENCES brands(id) ON DELETE CASCADE,

  -- Basic Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  objective VARCHAR(100), -- 'brand_awareness' | 'product_review' | 'sponsored_content' | 'tutorial' | 'product_launch' | 'other'
  category VARCHAR(100), -- 'ai' | 'saas' | 'devtools' | 'cloud' | 'devops' | 'startup' | 'fintech' | 'cybersecurity' | 'productivity' | 'marketing' | 'ecommerce' | 'other'

  -- Budget (smallest currency unit, e.g. cents — matches deals.amount convention)
  budget_min INTEGER,
  budget_max INTEGER,
  budget_type VARCHAR(50) NOT NULL DEFAULT 'range', -- 'fixed' | 'range' | 'negotiable'
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',

  -- Requirements
  platforms TEXT[] DEFAULT '{}', -- ['youtube','twitter','linkedin','instagram','tiktok','newsletter','podcast','blog','github']
  creator_categories TEXT[] DEFAULT '{}',
  min_followers INTEGER DEFAULT 0,
  target_countries TEXT[] DEFAULT '{}',

  -- Timeline
  application_deadline TIMESTAMPTZ,
  campaign_start_date TIMESTAMPTZ,
  campaign_end_date TIMESTAMPTZ,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft' | 'published' | 'closed' | 'completed' | 'cancelled'
  visibility VARCHAR(50) NOT NULL DEFAULT 'public', -- 'public' | 'private'

  -- Counts (denormalized for performance; kept in sync by triggers below)
  applications_count INTEGER NOT NULL DEFAULT 0,
  hired_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_application_deadline ON campaigns(application_deadline);
CREATE INDEX IF NOT EXISTS idx_campaigns_platforms ON campaigns USING GIN(platforms);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_categories ON campaigns USING GIN(creator_categories);

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- CAMPAIGN DELIVERABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_deliverables (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  platform VARCHAR(50) NOT NULL, -- 'youtube' | 'twitter' | etc.
  deliverable_type VARCHAR(100) NOT NULL, -- 'dedicated_video' | 'integration' | 'post' | 'story' | 'thread' | 'review' | 'mention' | 'tutorial' | 'other'
  quantity INTEGER DEFAULT 1,
  description TEXT,
  deadline TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_deliverables_campaign_id ON campaign_deliverables(campaign_id);

-- ============================================================================
-- CAMPAIGN APPLICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_applications (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id VARCHAR(255) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,

  -- Application details
  proposed_rate INTEGER, -- smallest currency unit
  cover_message TEXT,
  pitch TEXT, -- how they'd approach the campaign

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- 'submitted' | 'viewed' | 'shortlisted' | 'rejected' | 'hired'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate applications
  UNIQUE(campaign_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_applications_campaign_id ON campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_creator_id ON campaign_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status ON campaign_applications(status);

DROP TRIGGER IF EXISTS update_campaign_applications_updated_at ON campaign_applications;
CREATE TRIGGER update_campaign_applications_updated_at BEFORE UPDATE ON campaign_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- DENORMALIZED COUNTER TRIGGERS
-- ============================================================================
-- Mirrors the trigger-based denormalized-counter approach already used in
-- this project's schema (see on_deal_completed / update_conversation_last_message
-- in supabase/schema.sql) rather than incrementing counts from application code.

CREATE OR REPLACE FUNCTION campaign_applications_count_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE campaigns SET applications_count = applications_count + 1 WHERE id = NEW.campaign_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- If the deleted application was already 'hired', hired_count needs
    -- decrementing too — it will not go through campaign_hired_count_sync
    -- since that trigger only fires on UPDATE.
    IF OLD.status = 'hired' THEN
      UPDATE campaigns
      SET applications_count = GREATEST(applications_count - 1, 0),
          hired_count = GREATEST(hired_count - 1, 0)
      WHERE id = OLD.campaign_id;
    ELSE
      UPDATE campaigns SET applications_count = GREATEST(applications_count - 1, 0) WHERE id = OLD.campaign_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaign_applications_count_insert ON campaign_applications;
CREATE TRIGGER campaign_applications_count_insert
  AFTER INSERT ON campaign_applications
  FOR EACH ROW EXECUTE FUNCTION campaign_applications_count_sync();

DROP TRIGGER IF EXISTS campaign_applications_count_delete ON campaign_applications;
CREATE TRIGGER campaign_applications_count_delete
  AFTER DELETE ON campaign_applications
  FOR EACH ROW EXECUTE FUNCTION campaign_applications_count_sync();

CREATE OR REPLACE FUNCTION campaign_hired_count_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'hired' AND OLD.status IS DISTINCT FROM 'hired' THEN
    UPDATE campaigns SET hired_count = hired_count + 1 WHERE id = NEW.campaign_id;
  ELSIF OLD.status = 'hired' AND NEW.status IS DISTINCT FROM 'hired' THEN
    UPDATE campaigns SET hired_count = GREATEST(hired_count - 1, 0) WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaign_hired_count_trigger ON campaign_applications;
CREATE TRIGGER campaign_hired_count_trigger
  AFTER UPDATE ON campaign_applications
  FOR EACH ROW EXECUTE FUNCTION campaign_hired_count_sync();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Matches the live convention on deals/conversations/creators/brands/messages:
-- RLS is enabled but the active policy is permissive (USING true). This app
-- does not use Supabase Auth (no auth.uid()) — authorization is enforced in
-- the Next.js API layer via middleware.ts (JWT verification) plus per-route
-- ownership checks against x-profile-id/x-user-type. Server routes call
-- Supabase with the service-role key, which bypasses RLS regardless of
-- policy. Enabling RLS with a permissive policy here keeps these new tables
-- configured identically to every existing table rather than introducing a
-- policy shape (auth.uid()-based) that would not match anything.

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS campaigns_all_access ON campaigns;
CREATE POLICY campaigns_all_access ON campaigns FOR ALL USING (true);

DROP POLICY IF EXISTS campaign_deliverables_all_access ON campaign_deliverables;
CREATE POLICY campaign_deliverables_all_access ON campaign_deliverables FOR ALL USING (true);

DROP POLICY IF EXISTS campaign_applications_all_access ON campaign_applications;
CREATE POLICY campaign_applications_all_access ON campaign_applications FOR ALL USING (true);

-- ============================================================================
-- DONE
-- ============================================================================
-- Tables created: campaigns, campaign_deliverables, campaign_applications
-- ============================================================================
