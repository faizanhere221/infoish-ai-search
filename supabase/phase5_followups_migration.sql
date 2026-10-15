-- ============================================================================
-- PHASE 5 FOLLOW-UPS — milestone payments, key versioning, race-condition
-- guards. Run this entire file once in the Supabase SQL Editor, top to
-- bottom. Every statement is idempotent (IF EXISTS / IF NOT EXISTS) so it
-- is safe to re-run if a prior attempt was interrupted partway through.
-- ============================================================================


-- ============================================================================
-- ITEM 2 — milestone payments need their own deliverable-scoped trigger
--
-- The task asked for `uuid[]`, but every id in this schema (including
-- creator_deliverables.id) is VARCHAR(255) text generated via
-- (uuid_generate_v4())::text, not a native Postgres `uuid` — the same
-- convention established since Phase 2 and reconfirmed by the Phase 4 type
-- audit. Using a real `uuid[]` column here would force a cast on every
-- comparison against creator_deliverables.id and reintroduce exactly the
-- uuid/varchar mismatch class of bug that audit existed to rule out. This
-- uses TEXT[] instead — same semantics, consistent types.
-- ============================================================================

ALTER TABLE creator_payments ADD COLUMN IF NOT EXISTS deliverable_ids TEXT[];

CREATE INDEX IF NOT EXISTS idx_creator_payments_deliverable_ids
  ON creator_payments USING GIN (deliverable_ids);


-- ============================================================================
-- ITEM 3 — key versioning for payout encryption
--
-- Every payout_methods row records which key encrypted it. Today only
-- version 1 (PAYOUT_ENCRYPTION_KEY) exists; src/lib/payments/crypto.ts is
-- structured so a PAYOUT_ENCRYPTION_KEY_V2 env var can be added later and
-- CURRENT_KEY_VERSION bumped to 2 — new writes use the new key, old rows
-- keep decrypting correctly under their own stored key_version. This does
-- NOT perform a rotation; it only makes one possible without a schema
-- change later.
-- ============================================================================

ALTER TABLE payout_methods ADD COLUMN IF NOT EXISTS key_version INTEGER NOT NULL DEFAULT 1;


-- ============================================================================
-- ITEM 5 — race-condition guards (database-level, not application-level)
-- ============================================================================

-- (a) At most one ACTIVE 'full' payment per row, ever — a DB-level backstop
-- behind the sign route's own conditional UPDATE guard. Even if two sign
-- requests somehow both believed they'd won the contract-status transition,
-- only one INSERT into creator_payments can succeed; the second hits this
-- unique violation and the app treats that as "already created," not an
-- error (see createInitialPaymentOnSign in src/lib/payments/engine.ts).
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_payments_one_full
  ON creator_payments(campaign_creator_id) WHERE type = 'full' AND status <> 'cancelled';

-- (b) split_payment() — atomic split of a 'full' payment into 'upfront' +
-- 'final'. SELECT ... FOR UPDATE row-locks the original exactly like
-- accept_campaign_offer (Phase 3) does for offers: a concurrent second call
-- blocks on the lock, then finds the original no longer 'scheduled' once
-- the first transaction commits, and raises — the route catches that and
-- reports the split as already done rather than creating a duplicate pair.
CREATE OR REPLACE FUNCTION split_payment(
  p_original_payment_id VARCHAR(255),
  p_upfront_amount NUMERIC,
  p_final_amount NUMERIC,
  p_due_date DATE
)
RETURNS TABLE (
  upfront_id VARCHAR(255),
  final_id VARCHAR(255)
) AS $$
DECLARE
  v_payment creator_payments%ROWTYPE;
  v_upfront_id VARCHAR(255);
  v_final_id VARCHAR(255);
BEGIN
  SELECT * INTO v_payment
  FROM creator_payments
  WHERE id = p_original_payment_id AND type = 'full' AND status = 'scheduled'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment % is not an unsplit scheduled full payment', p_original_payment_id;
  END IF;

  UPDATE creator_payments
  SET status = 'cancelled', cancelled_reason = 'Split into upfront + final', updated_at = NOW()
  WHERE id = p_original_payment_id;

  INSERT INTO creator_payments (campaign_creator_id, contract_id, amount, currency, type, status, due_date)
  VALUES (v_payment.campaign_creator_id, v_payment.contract_id, p_upfront_amount, v_payment.currency, 'upfront', 'due', p_due_date)
  RETURNING id INTO v_upfront_id;

  INSERT INTO creator_payments (campaign_creator_id, contract_id, amount, currency, type, status)
  VALUES (v_payment.campaign_creator_id, v_payment.contract_id, p_final_amount, v_payment.currency, 'final', 'scheduled')
  RETURNING id INTO v_final_id;

  RETURN QUERY SELECT v_upfront_id, v_final_id;
END;
$$ LANGUAGE plpgsql;

-- mark-paid / confirm / dispute / cancel don't need a stored function —
-- each is a single-row conditional UPDATE (`WHERE id = ... AND status IN
-- (<valid from-statuses>)`) in src/lib/payments/provider.ts, which Postgres
-- already makes atomic: only one concurrent UPDATE can match and change a
-- given row, so a second simultaneous call always matches zero rows
-- instead of double-applying.


-- ============================================================================
-- ITEM 6 — RLS audit (read-only introspection against the live database;
-- no policy changes needed, included here as documentation)
--
-- Checked live via psql:
--   - payout_methods:   relrowsecurity = true, 0 policies
--   - creator_payments: relrowsecurity = true, 0 policies
--   - Both tables grant anon/authenticated the full set of table
--     privileges (SELECT/INSERT/UPDATE/DELETE/...) — confirmed this is
--     Supabase's standard default-privilege grant applied to every table in
--     the public schema (campaign_contracts, an existing Phase 4 table,
--     carries the identical grant set), not something specific to these
--     two tables.
--
-- Postgres RLS semantics: when row-level security is ENABLED on a table
-- and NO policy exists, every row is denied to any role that doesn't
-- bypass RLS — a GRANT only controls whether a role may issue a SELECT/
-- INSERT/UPDATE/DELETE statement at all; RLS policies control which rows
-- that statement can see or touch. With zero policies, the row set is
-- always empty for anon/authenticated regardless of the GRANTs above. Only
-- the service-role key (used by every API route in this codebase) and the
-- table owner bypass RLS entirely.
--
-- In short: both tables are already correctly locked down, via the same
-- "RLS enabled, zero policies" pattern as every other table added since
-- the Phase 1 security cleanup. No ALTER/CREATE POLICY statements are
-- needed or included here.
-- ============================================================================
