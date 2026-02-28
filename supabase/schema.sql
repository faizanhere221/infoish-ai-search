-- ============================================================================
-- INFOISHAI MARKETPLACE - DATABASE SCHEMA
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor
-- https://app.supabase.com/project/YOUR_PROJECT/sql
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User types
CREATE TYPE user_type AS ENUM ('creator', 'brand', 'admin');

-- Deal status
CREATE TYPE deal_status AS ENUM (
  'pending',      -- Brand sent proposal, waiting for creator
  'accepted',     -- Creator accepted, waiting for payment
  'paid',         -- Brand paid, in escrow
  'in_progress',  -- Creator working on deliverables
  'delivered',    -- Creator submitted work
  'revision',     -- Brand requested changes
  'completed',    -- Brand approved, payment released
  'cancelled',    -- Deal cancelled
  'disputed'      -- In dispute resolution
);

-- Platform types
CREATE TYPE platform_type AS ENUM (
  'youtube',
  'twitter',
  'linkedin',
  'instagram',
  'tiktok',
  'newsletter',
  'podcast',
  'github',
  'blog',
  'other'
);

-- Content types
CREATE TYPE content_type AS ENUM (
  'video_integration',
  'dedicated_video',
  'twitter_thread',
  'tweet',
  'linkedin_post',
  'newsletter_feature',
  'newsletter_dedicated',
  'podcast_mention',
  'podcast_episode',
  'blog_post',
  'github_readme',
  'instagram_post',
  'instagram_story',
  'tiktok_video',
  'other'
);

-- Verification status
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- ============================================================================
-- USERS TABLE (Base table for auth)
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type user_type NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- ============================================================================
-- CREATORS TABLE
-- ============================================================================

CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  profile_photo_url TEXT,
  banner_image_url TEXT,
  
  -- Location
  country VARCHAR(2), -- ISO country code
  city VARCHAR(100),
  timezone VARCHAR(50),
  
  -- Professional Info
  niches TEXT[] DEFAULT '{}', -- Array of niche tags
  languages TEXT[] DEFAULT '{}',
  years_of_experience INTEGER,
  
  -- Verification
  verification_status verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  
  -- Stats (updated periodically)
  total_followers INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2),
  completed_deals INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  total_reviews INTEGER DEFAULT 0,
  
  -- Settings
  is_available BOOLEAN DEFAULT TRUE,
  response_time VARCHAR(50), -- e.g., "within 24 hours"
  min_budget DECIMAL(10,2),
  
  -- Stripe
  stripe_account_id VARCHAR(255),
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_username ON creators(username);
CREATE INDEX idx_creators_niches ON creators USING GIN(niches);
CREATE INDEX idx_creators_verification ON creators(verification_status);
CREATE INDEX idx_creators_available ON creators(is_available);

-- ============================================================================
-- CREATOR PLATFORMS (Social media accounts)
-- ============================================================================

CREATE TABLE creator_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  
  platform platform_type NOT NULL,
  platform_username VARCHAR(100),
  platform_url TEXT,
  
  -- Stats
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  avg_views INTEGER,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(creator_id, platform)
);

CREATE INDEX idx_creator_platforms_creator ON creator_platforms(creator_id);
CREATE INDEX idx_creator_platforms_platform ON creator_platforms(platform);

-- ============================================================================
-- CREATOR SERVICES (What creators offer)
-- ============================================================================

CREATE TABLE creator_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  platform platform_type NOT NULL,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Details
  delivery_days INTEGER DEFAULT 7,
  revisions_included INTEGER DEFAULT 1,
  
  -- What's included
  includes TEXT[], -- Array of included items
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_creator_services_creator ON creator_services(creator_id);
CREATE INDEX idx_creator_services_content_type ON creator_services(content_type);
CREATE INDEX idx_creator_services_platform ON creator_services(platform);

-- ============================================================================
-- CREATOR PORTFOLIO
-- ============================================================================

CREATE TABLE creator_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content_type content_type,
  platform platform_type,
  
  -- Media
  thumbnail_url TEXT,
  content_url TEXT, -- Link to the actual content
  
  -- Metrics (optional)
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  
  -- Order for display
  display_order INTEGER DEFAULT 0,
  
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_creator_portfolio_creator ON creator_portfolio(creator_id);

-- ============================================================================
-- BRANDS TABLE
-- ============================================================================

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Company Info
  company_name VARCHAR(200) NOT NULL,
  company_website TEXT,
  logo_url TEXT,
  description TEXT,
  
  -- Industry & Size
  industry VARCHAR(100),
  company_size VARCHAR(50), -- e.g., "1-10", "11-50", "51-200", etc.
  
  -- Location
  country VARCHAR(2),
  
  -- Contact Person
  contact_name VARCHAR(100),
  contact_role VARCHAR(100),
  
  -- Verification
  verification_status verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  
  -- Stats
  total_deals INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  avg_rating_given DECIMAL(3,2),
  
  -- Stripe
  stripe_customer_id VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brands_user_id ON brands(user_id);
CREATE INDEX idx_brands_industry ON brands(industry);

-- ============================================================================
-- DEALS TABLE
-- ============================================================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Parties
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE RESTRICT,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES creator_services(id) ON DELETE SET NULL,
  
  -- Deal Info
  title VARCHAR(300) NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  platform platform_type NOT NULL,
  
  -- Requirements
  requirements TEXT,
  deliverables TEXT[], -- Array of expected deliverables
  
  -- Pricing
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2), -- 10% of amount
  creator_payout DECIMAL(10,2), -- amount - platform_fee
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Timeline
  deadline TIMESTAMPTZ,
  delivery_days INTEGER,
  revisions_allowed INTEGER DEFAULT 1,
  revisions_used INTEGER DEFAULT 0,
  
  -- Status
  status deal_status DEFAULT 'pending',
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Payment
  stripe_payment_intent_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  
  -- Delivery
  delivered_at TIMESTAMPTZ,
  delivery_url TEXT,
  delivery_notes TEXT,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_creator ON deals(creator_id);
CREATE INDEX idx_deals_brand ON deals(brand_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_created ON deals(created_at DESC);

-- ============================================================================
-- DEAL MESSAGES (Communication within a deal)
-- ============================================================================

CREATE TABLE deal_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  -- Attachments
  attachments JSONB DEFAULT '[]', -- Array of {url, filename, type, size}
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_messages_deal ON deal_messages(deal_id);
CREATE INDEX idx_deal_messages_sender ON deal_messages(sender_id);
CREATE INDEX idx_deal_messages_created ON deal_messages(created_at);

-- ============================================================================
-- CONVERSATIONS (General messaging, not deal-specific)
-- ============================================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Optional link to deal
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  
  -- Unread counts
  creator_unread INTEGER DEFAULT 0,
  brand_unread INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(creator_id, brand_id)
);

CREATE INDEX idx_conversations_creator ON conversations(creator_id);
CREATE INDEX idx_conversations_brand ON conversations(brand_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- ============================================================================
-- MESSAGES
-- ============================================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ============================================================================
-- REVIEWS
-- ============================================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID UNIQUE NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  
  -- Reviewer (Brand reviews Creator)
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Rating
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- Review content
  title VARCHAR(200),
  content TEXT,
  
  -- Specific ratings (optional)
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  
  -- Response from reviewee
  response TEXT,
  response_at TIMESTAMPTZ,
  
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_deal ON reviews(deal_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- 'new_message', 'deal_update', 'payment', etc.
  title VARCHAR(200) NOT NULL,
  content TEXT,
  
  -- Link to related entity
  related_type VARCHAR(50), -- 'deal', 'message', 'review'
  related_id UUID,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- SAVED CREATORS (Brands can save/bookmark creators)
-- ============================================================================

CREATE TABLE saved_creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(brand_id, creator_id)
);

CREATE INDEX idx_saved_creators_brand ON saved_creators(brand_id);

-- ============================================================================
-- PAYMENTS (Transaction history)
-- ============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE RESTRICT,
  
  -- Stripe
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255), -- For creator payout
  
  -- Amounts
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2),
  creator_payout DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_deal ON payments(deal_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Users: Users can read/update their own data
CREATE POLICY users_select ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid() = id);

-- Creators: Public read, owner can update
CREATE POLICY creators_select ON creators FOR SELECT USING (true);
CREATE POLICY creators_update ON creators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY creators_insert ON creators FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Creator Platforms: Public read, owner can modify
CREATE POLICY creator_platforms_select ON creator_platforms FOR SELECT USING (true);
CREATE POLICY creator_platforms_modify ON creator_platforms FOR ALL 
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));

-- Creator Services: Public read, owner can modify
CREATE POLICY creator_services_select ON creator_services FOR SELECT USING (true);
CREATE POLICY creator_services_modify ON creator_services FOR ALL 
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));

-- Creator Portfolio: Public read, owner can modify
CREATE POLICY creator_portfolio_select ON creator_portfolio FOR SELECT USING (true);
CREATE POLICY creator_portfolio_modify ON creator_portfolio FOR ALL 
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()));

-- Brands: Public read, owner can update
CREATE POLICY brands_select ON brands FOR SELECT USING (true);
CREATE POLICY brands_update ON brands FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY brands_insert ON brands FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Deals: Participants can view and modify their deals
CREATE POLICY deals_select ON deals FOR SELECT 
  USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()) OR
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );
CREATE POLICY deals_insert ON deals FOR INSERT 
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));
CREATE POLICY deals_update ON deals FOR UPDATE 
  USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()) OR
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- Messages: Conversation participants can view/send
CREATE POLICY conversations_select ON conversations FOR SELECT 
  USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()) OR
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

CREATE POLICY messages_select ON messages FOR SELECT 
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE
        creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()) OR
        brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
    )
  );
CREATE POLICY messages_insert ON messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

-- Reviews: Public read, reviewer can create
CREATE POLICY reviews_select ON reviews FOR SELECT USING (is_public = true);
CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Notifications: Users see their own
CREATE POLICY notifications_select ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Saved Creators: Brand owners only
CREATE POLICY saved_creators_all ON saved_creators FOR ALL 
  USING (brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update creator stats
CREATE OR REPLACE FUNCTION update_creator_stats(p_creator_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE creators SET
    completed_deals = (
      SELECT COUNT(*) FROM deals 
      WHERE creator_id = p_creator_id AND status = 'completed'
    ),
    avg_rating = (
      SELECT AVG(rating)::DECIMAL(3,2) FROM reviews r
      JOIN deals d ON r.deal_id = d.id
      WHERE d.creator_id = p_creator_id
    ),
    total_reviews = (
      SELECT COUNT(*) FROM reviews r
      JOIN deals d ON r.deal_id = d.id
      WHERE d.creator_id = p_creator_id
    ),
    total_followers = (
      SELECT COALESCE(SUM(followers), 0) FROM creator_platforms
      WHERE creator_id = p_creator_id
    ),
    updated_at = NOW()
  WHERE id = p_creator_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update brand stats
CREATE OR REPLACE FUNCTION update_brand_stats(p_brand_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE brands SET
    total_deals = (
      SELECT COUNT(*) FROM deals 
      WHERE brand_id = p_brand_id AND status = 'completed'
    ),
    total_spent = (
      SELECT COALESCE(SUM(amount), 0) FROM deals 
      WHERE brand_id = p_brand_id AND status = 'completed'
    ),
    updated_at = NOW()
  WHERE id = p_brand_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats after deal completion
CREATE OR REPLACE FUNCTION on_deal_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM update_creator_stats(NEW.creator_id);
    PERFORM update_brand_stats(NEW.brand_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deal_completed_trigger
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION on_deal_completed();

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_insert_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- You can add seed data here for testing purposes
-- Example:
-- INSERT INTO users (email, password_hash, user_type) VALUES 
--   ('creator@test.com', 'hashed_password', 'creator'),
--   ('brand@test.com', 'hashed_password', 'brand');

-- ============================================================================
-- INDEXES FOR FULL-TEXT SEARCH (Optional)
-- ============================================================================

-- Add full-text search on creators
ALTER TABLE creators ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION creators_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.niches, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creators_search_update
  BEFORE INSERT OR UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION creators_search_vector_update();

CREATE INDEX idx_creators_search ON creators USING GIN(search_vector);

-- ============================================================================
-- DONE!
-- ============================================================================
-- Your database schema is ready.
-- 
-- Tables created:
-- - users (authentication)
-- - creators (creator profiles)
-- - creator_platforms (social accounts)
-- - creator_services (offerings)
-- - creator_portfolio (work samples)
-- - brands (company profiles)
-- - deals (sponsorship deals)
-- - deal_messages (deal communication)
-- - conversations (general messaging)
-- - messages (chat messages)
-- - reviews (ratings & feedback)
-- - notifications (alerts)
-- - saved_creators (bookmarks)
-- - payments (transactions)
--
-- Features included:
-- - Row Level Security (RLS)
-- - Auto-updating timestamps
-- - Stats aggregation triggers
-- - Full-text search on creators
-- ============================================================================