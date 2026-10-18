-- Phase 7A — admin hardening. Idempotent, safe to re-run.
--
-- activity_logs/platform_settings already exist live (drift_fix_migration.sql
-- has been applied) — this file only adds what Phase 7A specifically needs.

-- ============================================================================
-- STEP 1 — soft-delete + anonymization for users. Replaces the previous
-- hard DELETE (see src/app/api/admin/users/[id]/route.ts). deleted_at
-- distinguishes "deleted" from "suspended" (is_active=false) — a suspended
-- user can be reactivated with their real data intact; a deleted user's
-- email/name/avatar are gone for good.
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
