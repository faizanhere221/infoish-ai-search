-- "Find me on Infoishai" badge: one row per profile visit that arrived
-- through a creator's shared link (?ref=badge), so admin analytics can show
-- which creators send traffic. Written by POST /api/creators/[id]/view,
-- which is already rate limited per IP. The app keeps working without this
-- table (the insert is best-effort), it just records nothing until this
-- migration runs.
--
-- Run in the Supabase SQL Editor. Idempotent.
--
-- creator_id is VARCHAR(255), not UUID: creators.id is VARCHAR(255) on the
-- live database (schema.sql says UUID, but the live column differs), and a
-- foreign key must match the referenced column's type exactly.

CREATE TABLE IF NOT EXISTS creator_referral_visits (
  id BIGSERIAL PRIMARY KEY,
  creator_id VARCHAR(255) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  ref VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_referral_visits_ref_created
  ON creator_referral_visits (ref, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_referral_visits_creator
  ON creator_referral_visits (creator_id, created_at DESC);

-- Locked down like every other table (see lockdown_migration.sql): RLS on
-- with no policies, reachable only through the service-role key.
ALTER TABLE creator_referral_visits ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_referral_visits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.creator_referral_visits_id_seq TO service_role;
