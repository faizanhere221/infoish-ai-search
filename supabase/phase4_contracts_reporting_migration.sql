-- ============================================================================
-- PHASE 4 — CONTRACTS AND REPORTING
-- Run this entire file once in the Supabase SQL Editor, top to bottom.
-- Every statement is idempotent (IF EXISTS / IF NOT EXISTS) so it is safe to
-- re-run if a prior attempt was interrupted partway through.
--
-- Id convention: VARCHAR(255) with DEFAULT (uuid_generate_v4())::text, same
-- as every table since Phase 2.
--
-- Does NOT touch payments, email, auth, or the legacy deals flow.
-- ============================================================================


-- ============================================================================
-- STEP 0d — TYPE AUDIT (read-only introspection, no fix needed)
--
-- Every Postgres function created by Phases 1-3
-- (accept_campaign_offer, send_conversation_message,
-- sync_campaign_creator_status, and the trigger functions) and every FK
-- column added across campaign_creators / campaign_offers /
-- creator_deliverables / campaign_creator_events / campaign_share_links was
-- checked against the live database:
--   - pg_proc: every function parameter that represents one of our ids is
--     VARCHAR(255) (send_conversation_message was the one exception, already
--     retyped from UUID to VARCHAR(255) in phase4_fixes_migration.sql — this
--     was independently reconfirmed live, already correct).
--   - information_schema: every FK column and the primary key it references
--     (campaigns.id, creators.id, campaign_creators.id, users.id, deals.id,
--     campaign_applications.id, and the FK columns pointing at them) are all
--     character varying(255).
-- No uuid/varchar mismatch exists anywhere in Phases 1-3's schema. No DDL
-- change is needed for this step.
-- ============================================================================


-- ============================================================================
-- STEP 1 — CONTRACTS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- campaigns: require_contract gate + brand-wide contract defaults.
-- ---------------------------------------------------------------------------

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS require_contract BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS default_payment_terms_days INTEGER NOT NULL DEFAULT 14;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS default_kill_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 50;

-- ---------------------------------------------------------------------------
-- campaign_contracts — one row per contract version for a campaign_creators
-- row. Only one non-void (active) version at a time, enforced by the DB.
-- body_snapshot/body_hash are written once, at send time, and never edited
-- after — editing fee/deliverables/dates once fully_signed voids the row
-- and the brand creates a new version instead.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_contracts (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  campaign_creator_id VARCHAR(255) NOT NULL REFERENCES campaign_creators(id) ON DELETE CASCADE,
  offer_id VARCHAR(255) REFERENCES campaign_offers(id) ON DELETE SET NULL,

  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- 'draft' | 'sent' | 'signed_by_creator' | 'signed_by_brand' | 'fully_signed' | 'void'
  -- The documented flow always has the creator sign first, so
  -- 'signed_by_brand' is not reached by the app today — kept in the enum
  -- for the symmetric case, per spec.

  special_terms TEXT,
  payment_terms_days INTEGER NOT NULL DEFAULT 14,
  kill_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 50,

  body_snapshot TEXT,
  body_hash VARCHAR(64),

  brand_signer_name VARCHAR(255),
  brand_signed_at TIMESTAMPTZ,
  brand_sign_ip VARCHAR(64),
  brand_sign_ua TEXT,

  creator_signer_name VARCHAR(255),
  creator_signed_at TIMESTAMPTZ,
  creator_sign_ip VARCHAR(64),
  creator_sign_ua TEXT,

  voided_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaign_contracts_row ON campaign_contracts(campaign_creator_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_contracts_status ON campaign_contracts(status);

-- Only one ACTIVE (non-void) contract per row at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_contracts_one_active
  ON campaign_contracts(campaign_creator_id) WHERE status <> 'void';

DROP TRIGGER IF EXISTS update_campaign_contracts_updated_at ON campaign_contracts;
CREATE TRIGGER update_campaign_contracts_updated_at BEFORE UPDATE ON campaign_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE campaign_contracts ENABLE ROW LEVEL SECURITY;
-- No permissive policy — same reasoning as every table since the Phase 1
-- security cleanup: the service-role key bypasses RLS, nothing uses anon.


-- ============================================================================
-- STEP 2 — RESULTS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS deliverable_results (
  id VARCHAR(255) PRIMARY KEY DEFAULT (uuid_generate_v4())::text,
  deliverable_id VARCHAR(255) NOT NULL REFERENCES creator_deliverables(id) ON DELETE CASCADE,

  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0),
  comments INTEGER NOT NULL DEFAULT 0 CHECK (comments >= 0),
  shares INTEGER NOT NULL DEFAULT 0 CHECK (shares >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  saves INTEGER NOT NULL DEFAULT 0 CHECK (saves >= 0),
  notes TEXT,
  screenshot_path TEXT, -- path within the existing 'deliverables' Storage bucket

  entered_by VARCHAR(10) NOT NULL, -- 'creator' | 'brand'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverable_results_deliverable ON deliverable_results(deliverable_id, captured_at DESC);

DROP TRIGGER IF EXISTS update_deliverable_results_updated_at ON deliverable_results;
CREATE TRIGGER update_deliverable_results_updated_at BEFORE UPDATE ON deliverable_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE deliverable_results ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 3 — REPORTING
-- ============================================================================

-- share link: client-facing "show results" toggle, independent of
-- show_charge. The client view always computes CPM on charge only (never
-- payout), enforced in application code in GET /api/share/[token].
ALTER TABLE campaign_share_links ADD COLUMN IF NOT EXISTS show_results BOOLEAN NOT NULL DEFAULT FALSE;

-- No new tables needed for 3a/3c/3d/3e — all computed on read from
-- campaign_creators + creator_deliverables + deliverable_results.
