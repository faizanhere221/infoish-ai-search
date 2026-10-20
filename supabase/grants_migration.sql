-- Explicit service_role grants — Supabase stopped auto-granting Data API
-- access to new tables in "public" as of their Oct 30 platform change.
-- Every table this app has ever created was relying on that automatic
-- grant; without it, the service-role key (the only key this app ever
-- uses server-side — see CLAUDE.md, "Auth — CRITICAL") loses access to
-- any table created after that change takes effect for this project.
--
-- service_role only. Never anon, never authenticated: this app's RLS
-- policies are decorative (auth.uid() never resolves — custom JWT, not
-- Supabase Auth, see CLAUDE.md "Known Limitations" #1), so a grant to
-- anon/authenticated would be real, unauthenticated, direct table access
-- with no application-layer check in front of it at all.
--
-- Idempotent: GRANT and ALTER DEFAULT PRIVILEGES both simply replace/
-- reapply the same grant on re-run, no error either way. Safe to run
-- again after adding new tables instead of writing a new migration for
-- grants specifically — though CLAUDE.md's new rule asks every future
-- table migration to grant itself explicitly too, so re-running this
-- file should become unnecessary going forward.

-- ============================================================================
-- STEP 1 — grant on every table/sequence/function that already exists
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- STEP 2 — default privileges, so a FUTURE CREATE TABLE/SEQUENCE/FUNCTION
-- in public is granted to service_role automatically again, same as
-- Supabase itself used to do before the Oct 30 change. This only applies
-- to objects created by whichever role runs this statement — if
-- migrations are ever run as a different Postgres role, re-run this
-- STEP 2 as that role too, or (better) follow the new per-migration rule
-- in CLAUDE.md and grant explicitly in the table's own migration file.
-- ============================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;
