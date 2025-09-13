-- =====================================================
-- SIMPLIFIED DATABASE MIGRATION FOR MVP
-- This will clean up your database to only essential columns
-- =====================================================

-- Step 1: Drop unnecessary tables (BE CAREFUL - This will delete data!)
DROP TABLE IF EXISTS ai_analysis CASCADE;
DROP TABLE IF EXISTS collaborations CASCADE;
DROP TABLE IF EXISTS content_posts CASCADE;
DROP TABLE IF EXISTS saved_searches CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS search_queries CASCADE;
DROP TABLE IF EXISTS influencer_categories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Step 2: Simplify the influencers table
-- First, let's create a new simplified influencers table
CREATE TABLE IF NOT EXISTS influencers_new (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    
    -- Basic Info
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'not_specified')),
    
    -- Location
    location_city TEXT DEFAULT 'Pakistan',
    
    -- Social Media Handles
    instagram_handle TEXT,
    youtube_channel TEXT,
    tiktok_handle TEXT,
    
    -- Follower Counts
    instagram_followers INTEGER DEFAULT 0,
    youtube_subscribers INTEGER DEFAULT 0,
    tiktok_followers INTEGER DEFAULT 0,
    total_followers INTEGER GENERATED ALWAYS AS (
        COALESCE(instagram_followers, 0) + 
        COALESCE(youtube_subscribers, 0) + 
        COALESCE(tiktok_followers, 0)
    ) STORED,
    
    -- Engagement & Category
    engagement_rate NUMERIC(5,2) DEFAULT 0.00,
    category TEXT,
    
    -- Profile Info
    bio TEXT,
    profile_image_url TEXT,
    verified BOOLEAN DEFAULT false,
    
    -- Vector Search Support
    embedding_vector JSON,
    content_hash VARCHAR(64),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Copy data from old influencers table (if exists)
INSERT INTO influencers_new (
    id, username, full_name, email, 
    location_city, bio, profile_image_url, 
    verified, embedding_vector, content_hash,
    created_at, updated_at
)
SELECT 
    id, 
    username, 
    display_name as full_name,
    email,
    location_city,
    bio,
    profile_image_url,
    verified,
    embedding_vector,
    content_hash,
    created_at,
    updated_at
FROM influencers
ON CONFLICT (username) DO NOTHING;

-- Step 4: Update social media data from influencer_social_accounts
-- Instagram
UPDATE influencers_new i
SET 
    instagram_followers = isa.followers_count::INTEGER,
    engagement_rate = COALESCE(isa.engagement_rate, 0)
FROM influencer_social_accounts isa
WHERE i.id = isa.influencer_id 
AND isa.platform_id = (SELECT id FROM platforms WHERE name = 'instagram' LIMIT 1);

-- YouTube
UPDATE influencers_new i
SET youtube_subscribers = isa.followers_count::INTEGER
FROM influencer_social_accounts isa
WHERE i.id = isa.influencer_id 
AND isa.platform_id = (SELECT id FROM platforms WHERE name = 'youtube' LIMIT 1);

-- TikTok
UPDATE influencers_new i
SET tiktok_followers = isa.followers_count::INTEGER
FROM influencer_social_accounts isa
WHERE i.id = isa.influencer_id 
AND isa.platform_id = (SELECT id FROM platforms WHERE name = 'tiktok' LIMIT 1);

-- Step 5: Drop old tables and rename new one
DROP TABLE IF EXISTS influencer_social_accounts CASCADE;
DROP TABLE IF EXISTS influencers CASCADE;
ALTER TABLE influencers_new RENAME TO influencers;

-- Step 6: Simplify platforms table (keep it minimal)
DROP TABLE IF EXISTS platforms CASCADE;
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL
);

INSERT INTO platforms (name, display_name) VALUES
('instagram', 'Instagram'),
('youtube', 'YouTube'),
('tiktok', 'TikTok');

-- Step 7: Simplify users table
ALTER TABLE users DROP COLUMN IF EXISTS subscription_plan;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS first_name;
ALTER TABLE users DROP COLUMN IF EXISTS last_name;

-- Step 8: Create simplified search_logs table
DROP TABLE IF EXISTS search_logs CASCADE;
CREATE TABLE search_logs (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    user_email TEXT,
    results_count INTEGER DEFAULT 0,
    filters_applied JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 9: Create simplified API keys table
DROP TABLE IF EXISTS api_keys CASCADE;
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email TEXT,
    plan_type VARCHAR(50) DEFAULT 'free',
    requests_per_day INTEGER DEFAULT 100,
    requests_used_today INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP
);

-- Step 10: Create indexes for better performance
CREATE INDEX idx_influencers_username ON influencers(username);
CREATE INDEX idx_influencers_category ON influencers(category);
CREATE INDEX idx_influencers_location ON influencers(location_city);
CREATE INDEX idx_influencers_total_followers ON influencers(total_followers);
CREATE INDEX idx_influencers_engagement ON influencers(engagement_rate);
CREATE INDEX idx_influencers_instagram ON influencers(instagram_handle);
CREATE INDEX idx_influencers_youtube ON influencers(youtube_channel);
CREATE INDEX idx_influencers_tiktok ON influencers(tiktok_handle);
CREATE INDEX idx_influencers_content_hash ON influencers(content_hash);

-- Full text search on bio
CREATE INDEX idx_influencers_bio_text ON influencers USING gin(to_tsvector('english', COALESCE(bio, '')));

-- Step 11: Add some sample Pakistani influencers for testing
INSERT INTO influencers (
    username, full_name, email, gender, location_city,
    instagram_handle, youtube_channel, tiktok_handle,
    instagram_followers, youtube_subscribers, tiktok_followers,
    engagement_rate, category, bio, verified
) VALUES 
(
    'duckybhai', 'Saad Ur Rehman', 'contact@duckybhai.com', 'male', 'Lahore',
    'duckybhai', 'duckybhai', 'duckybhai',
    890000, 7400000, 1200000,
    6.2, 'Technology', 'Tech reviewer and content creator', true
),
(
    'sistrology', 'Sistrology', 'info@sistrology.com', 'female', 'Karachi',
    'sistrology', 'sistrology', 'sistrology',
    1200000, 850000, 450000,
    4.8, 'Comedy', 'Comedy content creators - Sister duo', true
),
(
    'irfanjunejo', 'Irfan Junejo', NULL, 'male', 'Karachi',
    'irfanjunejo', 'irfanjunejo', NULL,
    752000, 1200000, 0,
    4.5, 'Travel', 'Travel vlogger and filmmaker', true
)
ON CONFLICT (username) DO NOTHING;

-- Step 12: Create a view for easy querying
CREATE OR REPLACE VIEW influencer_summary AS
SELECT 
    id,
    username,
    full_name,
    email,
    gender,
    location_city,
    instagram_handle,
    youtube_channel,
    tiktok_handle,
    instagram_followers,
    youtube_subscribers,
    tiktok_followers,
    total_followers,
    engagement_rate,
    category,
    verified,
    CASE 
        WHEN total_followers >= 1000000 THEN 'Mega'
        WHEN total_followers >= 100000 THEN 'Macro'
        WHEN total_followers >= 10000 THEN 'Mid-tier'
        WHEN total_followers >= 1000 THEN 'Micro'
        ELSE 'Nano'
    END as influencer_tier
FROM influencers
WHERE total_followers > 0;