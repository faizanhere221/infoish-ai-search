-- ============================================================================
-- INFOISHAI MARKETPLACE - COMPATIBLE MIGRATION
-- ============================================================================
-- Compatible with existing users table that has VARCHAR id
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DROP AND RECREATE TYPES
-- ============================================================================
DROP TYPE IF EXISTS user_type CASCADE;
DROP TYPE IF EXISTS deal_status CASCADE;
DROP TYPE IF EXISTS platform_type CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;

CREATE TYPE user_type AS ENUM ('creator', 'brand', 'admin');
CREATE TYPE deal_status AS ENUM (
  'pending', 'accepted', 'paid', 'in_progress', 'delivered',
  'revision', 'completed', 'cancelled', 'disputed'
);
CREATE TYPE platform_type AS ENUM (
  'youtube', 'twitter', 'linkedin', 'instagram', 'tiktok',
  'newsletter', 'podcast', 'github', 'blog', 'other'
);
CREATE TYPE content_type AS ENUM (
  'video_integration', 'dedicated_video', 'twitter_thread', 'tweet',
  'linkedin_post', 'newsletter_feature', 'newsletter_dedicated',
  'podcast_mention', 'podcast_episode', 'blog_post', 'github_readme',
  'instagram_post', 'instagram_story', 'tiktok_video', 'other'
);
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- ============================================================================
-- CREATORS TABLE (using VARCHAR for user_id to match existing users.id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS creators (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  profile_photo_url TEXT,
  banner_image_url TEXT,
  country VARCHAR(2),
  city VARCHAR(100),
  timezone VARCHAR(50),
  niches TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  years_of_experience INTEGER,
  verification_status verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  total_followers INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2),
  completed_deals INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  total_reviews INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  response_time VARCHAR(50),
  min_budget DECIMAL(10,2),
  stripe_account_id VARCHAR(255),
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATOR PLATFORMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS creator_platforms (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  creator_id VARCHAR(255) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  platform_username VARCHAR(100),
  platform_url TEXT,
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  avg_views INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, platform)
);

-- ============================================================================
-- CREATOR SERVICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS creator_services (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  creator_id VARCHAR(255) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  platform platform_type NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  delivery_days INTEGER DEFAULT 7,
  revisions_included INTEGER DEFAULT 1,
  includes TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATOR PORTFOLIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS creator_portfolio (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  creator_id VARCHAR(255) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content_type content_type,
  platform platform_type,
  thumbnail_url TEXT,
  content_url TEXT,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BRANDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS brands (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  company_website TEXT,
  logo_url TEXT,
  description TEXT,
  industry VARCHAR(100),
  company_size VARCHAR(50),
  country VARCHAR(2),
  contact_name VARCHAR(100),
  contact_role VARCHAR(100),
  verification_status verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  total_deals INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  avg_rating_given DECIMAL(3,2),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DEALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  creator_id VARCHAR(255) NOT NULL REFERENCES creators(id) ON DELETE RESTRICT,
  brand_id VARCHAR(255) NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  service_id VARCHAR(255) REFERENCES creator_services(id) ON DELETE SET NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  platform platform_type NOT NULL,
  requirements TEXT,
  deliverables TEXT[],
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2),
  creator_payout DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  deadline TIMESTAMPTZ,
  delivery_days INTEGER,
  revisions_allowed INTEGER DEFAULT 1,
  revisions_used INTEGER DEFAULT 0,
  status deal_status DEFAULT 'pending',
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_payment_intent_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_url TEXT,
  delivery_notes TEXT,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONVERSATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  creator_id VARCHAR(255) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  brand_id VARCHAR(255) NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  deal_id VARCHAR(255) REFERENCES deals(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  creator_unread INTEGER DEFAULT 0,
  brand_unread INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, brand_id)
);

-- ============================================================================
-- MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  conversation_id VARCHAR(255) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DEAL MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS deal_messages (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  deal_id VARCHAR(255) NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REVIEWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  deal_id VARCHAR(255) UNIQUE NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  reviewer_id VARCHAR(255) NOT NULL,
  reviewee_id VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  content TEXT,
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  response TEXT,
  response_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  related_type VARCHAR(50),
  related_id VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SAVED CREATORS
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_creators (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  brand_id VARCHAR(255) NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  creator_id VARCHAR(255) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, creator_id)
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  deal_id VARCHAR(255) NOT NULL REFERENCES deals(id) ON DELETE RESTRICT,
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2),
  creator_payout DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON creators(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_username ON creators(username);
CREATE INDEX IF NOT EXISTS idx_creators_available ON creators(is_available);
CREATE INDEX IF NOT EXISTS idx_creator_platforms_creator ON creator_platforms(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_services_creator ON creator_services(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_portfolio_creator ON creator_portfolio(creator_id);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_creator ON deals(creator_id);
CREATE INDEX IF NOT EXISTS idx_deals_brand ON deals(brand_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_conversations_creator ON conversations(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_brand ON conversations(brand_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_deal_messages_deal ON deal_messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_reviews_deal ON reviews(deal_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_deal ON payments(deal_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Allow all for now (customize later)
-- ============================================================================
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

CREATE POLICY creators_all ON creators FOR ALL USING (true);
CREATE POLICY creator_platforms_all ON creator_platforms FOR ALL USING (true);
CREATE POLICY creator_services_all ON creator_services FOR ALL USING (true);
CREATE POLICY creator_portfolio_all ON creator_portfolio FOR ALL USING (true);
CREATE POLICY brands_all ON brands FOR ALL USING (true);
CREATE POLICY deals_all ON deals FOR ALL USING (true);
CREATE POLICY conversations_all ON conversations FOR ALL USING (true);
CREATE POLICY messages_all ON messages FOR ALL USING (true);
CREATE POLICY deal_messages_all ON deal_messages FOR ALL USING (true);
CREATE POLICY reviews_all ON reviews FOR ALL USING (true);
CREATE POLICY notifications_all ON notifications FOR ALL USING (true);
CREATE POLICY saved_creators_all ON saved_creators FOR ALL USING (true);
CREATE POLICY payments_all ON payments FOR ALL USING (true);

-- ============================================================================
-- UPDATE TIMESTAMP FUNCTION & TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;

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

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT 'Migration completed successfully! All tables created.' as status;