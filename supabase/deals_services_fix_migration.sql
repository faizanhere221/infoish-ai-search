-- ============================================================================
-- FIX DEALS & CREATOR SERVICES SCHEMA MISMATCHES
-- ============================================================================
-- 1. deliverables must accept objects ({id, description, is_completed}), not
--    plain strings — change from TEXT[] to JSONB.
-- 2. content_type on deals/creator_services is a strict enum that does not
--    contain the values the frontend actually sends (e.g. 'instagram_reel',
--    'thread', 'integration') — relax to free-form text.
-- 3. platform_type enum is missing 'twitch' and 'discord'.
-- ============================================================================

ALTER TABLE deals
  ALTER COLUMN deliverables DROP DEFAULT,
  ALTER COLUMN deliverables TYPE JSONB USING to_jsonb(deliverables),
  ALTER COLUMN deliverables SET DEFAULT '[]'::jsonb;

ALTER TABLE deals
  ALTER COLUMN content_type TYPE VARCHAR(50) USING content_type::text;

ALTER TABLE creator_services
  ALTER COLUMN content_type TYPE VARCHAR(50) USING content_type::text,
  ALTER COLUMN content_type DROP NOT NULL;

ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'twitch';
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'discord';
