-- Lockdown: public schema is service_role only, full stop.
--
-- Verified first (see chat, not reproduced here) that nothing in this
-- app's frontend uses the anon client (src/lib/supabase.ts) against a
-- table, an rpc, or storage — it's imported nowhere. Every real read/
-- write goes through an API route using createServerSupabase()
-- (service_role). That's what this migration locks the database down to
-- match: anon and authenticated lose every privilege they were
-- (wrongly) given, on every existing object and on every object created
-- from now on, and so does the bare `public` pseudo-role (grants to
-- `public` apply to anon/authenticated too, since every real role is a
-- member of it).
--
-- This replaces, rather than complements, every RLS policy that existed
-- before it — every one of them was either an unconditionally-permissive
-- "Allow all" (qual = true, applied to `public`) or a decorative
-- auth.uid()-based one that can never resolve (this app uses a custom
-- JWT, not Supabase Auth, so auth.uid() is always NULL server-side
-- anyway) — see CLAUDE.md "Known Limitations" #1. With RLS enabled, zero
-- policies, and zero grants to anon/authenticated, Postgres denies them
-- by default; service_role bypasses RLS entirely (it has the BYPASSRLS
-- role attribute), so the app itself is completely unaffected.
--
-- Idempotent: dropping a policy that's already gone, enabling RLS that's
-- already enabled, and re-running any GRANT/REVOKE are all no-ops, not
-- errors, on re-run.

-- ============================================================================
-- STEP 1 — drop every policy on every table in public, whatever it's
-- named. A static list would miss anything added after this file was
-- written; this doesn't.
-- ============================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2 — make sure RLS is enabled on every table in public (most
-- already are — see the Oct 2026 audit — this covers any that aren't).
-- With STEP 1's policies gone, "enabled" now means deny-all to anyone
-- without BYPASSRLS, which is exactly the point.
-- ============================================================================

DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3 — revoke everything anon/authenticated/public currently have on
-- every existing table, sequence, and function in public. (`public` here
-- is the pseudo-role every role is a member of — revoking from it closes
-- any grant made to "public" directly, not just to anon/authenticated by
-- name.) This is the actual fix: STEP 1/2 remove the one permissive
-- policy some tables had, but plenty of tables had zero policies and
-- were already being protected by RLS's own deny-by-default — the real,
-- live exposure on every table was these grants existing at all.
-- ============================================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, public;

-- ============================================================================
-- STEP 4 — service_role keeps (or regains, if STEP 3 somehow touched it
-- too — REVOKE ... FROM a role list only affects roles named in that
-- list, but this is cheap insurance) full access. Same grants as
-- supabase/grants_migration.sql; repeated here so this file is a
-- complete, standalone lockdown on its own.
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- STEP 5 — default privileges: revoke from anon/authenticated/public so
-- a FUTURE table/sequence/function in public starts locked down the same
-- way, and reassert service_role's default grant (already set by
-- grants_migration.sql; repeated here so this file alone is sufficient).
-- ============================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated, public;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;
