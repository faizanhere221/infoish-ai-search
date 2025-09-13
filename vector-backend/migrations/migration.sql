-- Migration that works with your actual influencers table schema
-- Add embedding columns to influencers
ALTER TABLE influencers 
ADD COLUMN IF NOT EXISTS embedding_vector JSON,
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS embedding_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP;

-- Indexes for embeddings
CREATE INDEX IF NOT EXISTS idx_influencers_content_hash ON influencers(content_hash);
CREATE INDEX IF NOT EXISTS idx_influencers_embedding_updated ON influencers(embedding_updated_at);

-- Create search_logs
CREATE TABLE IF NOT EXISTS search_logs (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    user_id TEXT,
    user_api_key VARCHAR(100) NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    vector_score_threshold FLOAT DEFAULT 0.0,
    filters_applied JSON,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for search_logs
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_key ON search_logs(user_api_key);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs USING gin(to_tsvector('english', query));

-- Indexes for your actual influencers columns
CREATE INDEX IF NOT EXISTS idx_influencers_username ON influencers(username);
CREATE INDEX IF NOT EXISTS idx_influencers_location_country ON influencers(location_country);
CREATE INDEX IF NOT EXISTS idx_influencers_location_city ON influencers(location_city);
CREATE INDEX IF NOT EXISTS idx_influencers_verified ON influencers(verified);
CREATE INDEX IF NOT EXISTS idx_influencers_status ON influencers(status);

-- Index for full-text search on bio
CREATE INDEX IF NOT EXISTS idx_influencers_bio_text ON influencers USING gin(to_tsvector('english', bio));

-- Index for JSON searching on languages
CREATE INDEX IF NOT EXISTS idx_influencers_languages_gin ON influencers USING gin(languages);

-- Initialize embedding state for existing records
UPDATE influencers 
SET embedding_created_at = NULL,
    embedding_updated_at = NULL,
    content_hash = NULL
WHERE embedding_created_at IS NULL;