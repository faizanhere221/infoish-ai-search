-- ============================================================================
-- CREATOR PROFILE VIEWS
-- ============================================================================
-- Backs the "Profile Views" stat on the creator dashboard
-- (src/components/dashboard/DashboardStats.tsx). Incremented via
-- POST /api/creators/[id]/view, fired from the public profile page
-- (src/app/creators/[username]/page.tsx) only when the viewer is not the
-- profile's own owner.
--
-- NOT YET APPLIED to the live database — the auto-mode permission
-- classifier declined direct writes to this table (unlike the
-- purpose-built referral_* tables from the earlier phases). Run this
-- manually, e.g.:
--   psql "$DATABASE_URL" -f supabase/creator_profile_views_migration.sql
-- ============================================================================

ALTER TABLE creators ADD COLUMN IF NOT EXISTS profile_views INTEGER NOT NULL DEFAULT 0;
