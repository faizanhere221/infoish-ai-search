-- ============================================================================
-- AUDIT FIXES — found during a full read-only audit of Phases 1-5 (brand
-- side). Run this entire file once in the Supabase SQL Editor, top to
-- bottom. Every statement is idempotent (IF EXISTS / IF NOT EXISTS) so it
-- is safe to re-run if a prior attempt was interrupted partway through.
-- ============================================================================


-- ============================================================================
-- FIX 1 — creator_deliverables.posted_at did not exist
--
-- src/lib/reporting.ts's DeliverableForReport type (used by the campaign
-- report, brand analytics, creator stats, roster performance history, and
-- the results-todo widget) has always assumed creator_deliverables carries
-- its own posted_at — it never did (only campaign_creators.posted_at
-- exists, set once per row, not per deliverable). Confirmed live: querying
-- creator_deliverables.posted_at threw `42703 column ... does not exist`,
-- which meant every one of those five features silently reported zero/null
-- on-time rates and engagement totals instead of real numbers (results-todo
-- hard-500'd instead, since it's the one route that checks the query error).
--
-- Fix: add the column for real, and set it in submit-posted/route.ts
-- alongside the existing campaign_creators update (done in the same commit
-- as this migration). Deliverables posted before this migration runs have
-- no posted_at and are simply excluded from on-time-rate calculations going
-- forward — there's no reliable way to backfill a real historical date.
-- ============================================================================

ALTER TABLE creator_deliverables ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;


-- ============================================================================
-- FIX 2 — kill fee could be billed more than once for the same drop
--
-- createKillFeeIfEligible() had no existing-kill_fee check, and the route
-- that calls it couldn't tell "just dropped" from "already dropped" (it
-- never read the row's current status before updating it). A repeated PUT
-- with status: 'dropped' — a retry, a double-click, or re-saving the row
-- while status stays 'dropped' — created a brand-new kill_fee payment each
-- time. The application-side guard (reading status before the update) is
-- fixed in code; this is the database-level backstop, same pattern as
-- idx_creator_payments_one_full for 'full' payments.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_payments_one_kill_fee
  ON creator_payments(campaign_creator_id) WHERE type = 'kill_fee' AND status <> 'cancelled';


-- ============================================================================
-- FIX 3 — payment-proofs Storage bucket was public with no limits
--
-- No migration file (across all 5 phases, or earlier) ever created this
-- bucket — it exists live, created by hand outside any committed
-- migration, as `public = true` with no file_size_limit or
-- allowed_mime_types, unlike chat-attachments/deliverables (both private,
-- 10MB, explicit MIME list). The Phase 5 proof-upload route
-- (src/app/api/campaign-creators/[id]/payments/[paymentId]/proof/route.ts)
-- treats it as private and only ever serves reads through a signed URL
-- after a membership check — but because the bucket itself is public,
-- every uploaded proof (which can show bank/IBAN/PayPal details in a
-- screenshot) was ALSO reachable at its public object URL with no auth at
-- all, bypassing that entire membership check.
--
-- Fix: flip it private and cap it the same way the other two buckets are.
-- Existing proof files remain at the same paths; only the bucket's public
-- flag and limits change, so no re-upload is needed. If this UPDATE
-- affects 0 rows, the bucket may need to be edited via Dashboard -> Storage
-- -> payment-proofs -> Edit bucket instead (set Private, 10MB limit, the
-- same MIME list below).
-- ============================================================================

UPDATE storage.buckets
SET
  public = FALSE,
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
WHERE id = 'payment-proofs';
