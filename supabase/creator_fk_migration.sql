-- ============================================================================
-- creator_services.creator_id → creators(id) foreign key
-- ============================================================================
-- schema.sql / migration.sql both declare
--   creator_id ... NOT NULL REFERENCES creators(id) ON DELETE CASCADE
-- on creator_services, but the live table has no such constraint (checked
-- 2026-10-26: PostgREST finds no creator_services → creators relationship,
-- and an insert with a nonexistent creator_id succeeded). As a result, 5
-- service rows belong to creators that no longer exist.
--
-- creator_platforms and creator_portfolio were checked the same way and
-- already have their creators(id) foreign key, so they are not touched here.
-- Column types match: creators.id and creator_services.creator_id are both
-- character varying on the live database.
--
-- Idempotent: the DELETE is a no-op once orphans are gone, and the
-- constraint is only added if it doesn't already exist.
-- ============================================================================

BEGIN;

-- STEP 1: remove orphan services (creator_id pointing at no creator).
-- Inspect first if you want to see them:
--   SELECT s.id, s.creator_id, s.title, s.created_at
--   FROM creator_services s
--   LEFT JOIN creators c ON c.id = s.creator_id
--   WHERE c.id IS NULL;
DELETE FROM creator_services s
WHERE NOT EXISTS (SELECT 1 FROM creators c WHERE c.id = s.creator_id);

-- STEP 2: add the foreign key, cascading deletes from creators.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.creator_services'::regclass
      AND contype = 'f'
      AND confrelid = 'public.creators'::regclass
  ) THEN
    ALTER TABLE public.creator_services
      ADD CONSTRAINT creator_services_creator_id_fkey
      FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE;
  END IF;
END $$;

-- The lookup index already exists (idx_creator_services_creator) — kept as
-- IF NOT EXISTS in case this database never got it.
CREATE INDEX IF NOT EXISTS idx_creator_services_creator ON public.creator_services(creator_id);

COMMIT;

-- Verify afterwards (expect one row, confdeltype = 'c' for CASCADE):
--   SELECT conname, confdeltype
--   FROM pg_constraint
--   WHERE conrelid = 'public.creator_services'::regclass AND contype = 'f';
