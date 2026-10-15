-- ============================================================================
-- PHASE 5 (LITE) — PAYMENT TRACKING, NOT PAYMENT PROCESSING
-- Run this entire file once in the Supabase SQL Editor, top to bottom.
-- Every statement is idempotent (IF EXISTS / IF NOT EXISTS) so it is safe to
-- re-run if a prior attempt was interrupted partway through.
--
-- Id convention: VARCHAR(255) with DEFAULT (uuid_generate_v4())::text, same
-- as every table since Phase 2.
--
-- Money moves OUTSIDE Infoishai (Wise, Payoneer, bank transfer, PayPal,
-- other) — nothing here processes a payment or holds funds. This is a
-- ledger: who owes what, to whom, by when, and whether it's been paid and
-- confirmed. See docs/PAYMENTS.md for how a real provider (Stripe Connect)
-- would plug in later without changing this schema's shape.
--
-- Does NOT touch Stripe, card processing, wallets, balances, auth, or the
-- legacy deals flow.
-- ============================================================================


-- ============================================================================
-- STEP 2 — CREATOR PAYOUT DETAILS
--
-- Account details are encrypted at rest (AES-256-GCM, app-layer, see
-- src/lib/payments/crypto.ts + PAYOUT_ENCRYPTION_KEY) — this table only ever
-- sees ciphertext. masked_preview is plaintext by design (e.g. "•••• 1234"),
-- safe to list without decrypting anything.
-- ============================================================================

CREATE TABLE IF NOT EXISTS payout_methods (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  creator_id VARCHAR(255) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,

  method VARCHAR(20) NOT NULL, -- 'wise' | 'payoneer' | 'bank_transfer' | 'paypal' | 'other'
  account_holder_name VARCHAR(255) NOT NULL,
  details_encrypted TEXT NOT NULL, -- AES-256-GCM ciphertext (iv + authTag + data, base64)
  masked_preview VARCHAR(100), -- plaintext, display-only, e.g. "Wise · j***@example.com"
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_methods_creator ON payout_methods(creator_id);

-- Only one default method per creator.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_methods_one_default
  ON payout_methods(creator_id) WHERE is_default = TRUE;

DROP TRIGGER IF EXISTS update_payout_methods_updated_at ON payout_methods;
CREATE TRIGGER update_payout_methods_updated_at BEFORE UPDATE ON payout_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
-- No permissive policy — same reasoning as every table since the Phase 1
-- security cleanup: the service-role key bypasses RLS, nothing uses anon.
-- Every read goes through an API route that decides masked vs. revealed.

-- Brand-level payment instructions (step 6, client invoice) — free text the
-- brand sets once, shown on every invoice they generate.
ALTER TABLE brands ADD COLUMN IF NOT EXISTS payment_instructions TEXT;


-- ============================================================================
-- STEP 3 — PAYMENT RECORDS
--
-- One row per payable amount on a campaign_creators row. Created
-- automatically when a contract becomes fully_signed (one 'full' record,
-- 'scheduled'); the brand can split it into 'upfront' + 'final'. A
-- 'kill_fee' record is created automatically if a fully-signed engagement
-- is dropped after a draft was submitted. See docs/PAYMENTS.md for the full
-- state machine.
-- ============================================================================

CREATE TABLE IF NOT EXISTS creator_payments (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  campaign_creator_id VARCHAR(255) NOT NULL REFERENCES campaign_creators(id) ON DELETE CASCADE,
  contract_id VARCHAR(255) REFERENCES campaign_contracts(id) ON DELETE SET NULL,

  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',

  type VARCHAR(20) NOT NULL DEFAULT 'full',
  -- 'full' | 'upfront' | 'milestone' | 'final' | 'kill_fee'
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  -- 'scheduled' | 'due' | 'marked_paid' | 'confirmed' | 'disputed' | 'cancelled'

  due_date DATE,

  method VARCHAR(20), -- set when marked paid: 'wise' | 'payoneer' | 'bank_transfer' | 'paypal' | 'other'
  reference VARCHAR(255), -- the transfer id/reference the brand entered
  proof_path TEXT, -- path in the existing 'payment-proofs' Storage bucket

  marked_paid_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  cancelled_reason TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_payments_row ON creator_payments(campaign_creator_id, created_at);
CREATE INDEX IF NOT EXISTS idx_creator_payments_status ON creator_payments(status);
CREATE INDEX IF NOT EXISTS idx_creator_payments_due_date ON creator_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_creator_payments_contract ON creator_payments(contract_id);

DROP TRIGGER IF EXISTS update_creator_payments_updated_at ON creator_payments;
CREATE TRIGGER update_creator_payments_updated_at BEFORE UPDATE ON creator_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE creator_payments ENABLE ROW LEVEL SECURITY;
