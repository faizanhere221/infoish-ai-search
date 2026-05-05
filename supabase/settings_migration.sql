-- ============================================================================
-- PLATFORM SETTINGS MIGRATION
-- ============================================================================
-- Run this in your Supabase SQL Editor after activity_migration.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Seed defaults
INSERT INTO platform_settings (key, value) VALUES
  ('site_name',           '"Infoishai"'),
  ('site_description',    '"Influencer Marketing Platform"'),
  ('default_page_size',   '20'),
  ('enable_messaging',    'true'),
  ('enable_reviews',      'true'),
  ('enable_deals',        'true'),
  ('maintenance_mode',    'false'),
  ('session_timeout_min', '240'),
  ('max_login_attempts',  '5'),
  ('ip_whitelist',        '[]'),
  ('ip_blacklist',        '[]')
ON CONFLICT (key) DO NOTHING;
