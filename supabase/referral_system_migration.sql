-- ============================================================================
-- REFERRAL PARTNER SYSTEM - DATABASE SCHEMA (Phase 1: Foundation)
-- ============================================================================
-- Partners get a unique referral link/code. When creators sign up through
-- that link, the signup is tracked. Partners earn commission on deals from
-- referred creators (commission creation/payout workflow lands in a later
-- phase; this migration lays the foundation tables + counters).
--
-- Matches the live convention already used across this schema (users,
-- creators, brands, deals, campaigns, ...): VARCHAR(255) ids via
-- uuid_generate_v4()::text, not the native Postgres `uuid` type.
-- ============================================================================

-- ============================================================================
-- REFERRAL PARTNERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_partners (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deactivated')),
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_earnings_cents INTEGER NOT NULL DEFAULT 0,
  total_paid_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_partners_code ON referral_partners(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_partners_user ON referral_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_partners_email ON referral_partners(email);

DROP TRIGGER IF EXISTS update_referral_partners_updated_at ON referral_partners;
CREATE TRIGGER update_referral_partners_updated_at BEFORE UPDATE ON referral_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- REFERRAL SIGNUPS
-- ============================================================================
-- One row per creator/user who signed up through a partner's referral link.

CREATE TABLE IF NOT EXISTS referral_signups (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  partner_id VARCHAR(255) NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
  referred_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  referred_creator_id VARCHAR(255) REFERENCES creators(id) ON DELETE SET NULL,
  referred_email TEXT,
  referred_name TEXT,
  referral_code TEXT NOT NULL,
  signup_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'profile_complete', 'first_deal', 'active')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_signups_partner ON referral_signups(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_user ON referral_signups(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_creator ON referral_signups(referred_creator_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_code ON referral_signups(referral_code);

-- ============================================================================
-- REFERRAL COMMISSIONS
-- ============================================================================
-- One row per deal-driven commission earned by a partner.

CREATE TABLE IF NOT EXISTS referral_commissions (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  partner_id VARCHAR(255) NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
  referral_signup_id VARCHAR(255) NOT NULL REFERENCES referral_signups(id) ON DELETE CASCADE,
  deal_id VARCHAR(255),
  deal_amount_cents INTEGER NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_partner ON referral_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);

-- ============================================================================
-- REFERRAL PAYOUTS
-- ============================================================================
-- One row per payout made to a partner (covering one or more commissions).

CREATE TABLE IF NOT EXISTS referral_payouts (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  partner_id VARCHAR(255) NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referral_payouts_partner ON referral_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_status ON referral_payouts(status);

-- ============================================================================
-- DENORMALIZED COUNTER TRIGGERS
-- ============================================================================
-- Mirrors the trigger-based denormalized-counter approach already used
-- elsewhere in this schema (on_deal_completed in schema.sql,
-- campaign_applications_count_sync in campaigns_migration.sql) rather than
-- incrementing counts from application code, so counts stay correct even
-- under concurrent writes.

-- referral_signups -> referral_partners.total_referrals
CREATE OR REPLACE FUNCTION referral_signups_count_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE referral_partners SET total_referrals = total_referrals + 1 WHERE id = NEW.partner_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE referral_partners SET total_referrals = GREATEST(total_referrals - 1, 0) WHERE id = OLD.partner_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referral_signups_count_insert ON referral_signups;
CREATE TRIGGER referral_signups_count_insert
  AFTER INSERT ON referral_signups
  FOR EACH ROW EXECUTE FUNCTION referral_signups_count_sync();

DROP TRIGGER IF EXISTS referral_signups_count_delete ON referral_signups;
CREATE TRIGGER referral_signups_count_delete
  AFTER DELETE ON referral_signups
  FOR EACH ROW EXECUTE FUNCTION referral_signups_count_sync();

-- referral_payouts -> referral_partners.total_paid_cents (only money that has
-- actually landed, i.e. status = 'completed', counts toward the total)
CREATE OR REPLACE FUNCTION referral_payouts_paid_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' THEN
      UPDATE referral_partners SET total_paid_cents = total_paid_cents + NEW.amount_cents WHERE id = NEW.partner_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'completed' AND NEW.status = 'completed' THEN
      UPDATE referral_partners SET total_paid_cents = total_paid_cents + NEW.amount_cents WHERE id = NEW.partner_id;
    ELSIF OLD.status = 'completed' AND NEW.status <> 'completed' THEN
      UPDATE referral_partners SET total_paid_cents = GREATEST(total_paid_cents - OLD.amount_cents, 0) WHERE id = NEW.partner_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed' THEN
      UPDATE referral_partners SET total_paid_cents = GREATEST(total_paid_cents - OLD.amount_cents, 0) WHERE id = OLD.partner_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referral_payouts_paid_insert ON referral_payouts;
CREATE TRIGGER referral_payouts_paid_insert
  AFTER INSERT ON referral_payouts
  FOR EACH ROW EXECUTE FUNCTION referral_payouts_paid_sync();

DROP TRIGGER IF EXISTS referral_payouts_paid_update ON referral_payouts;
CREATE TRIGGER referral_payouts_paid_update
  AFTER UPDATE ON referral_payouts
  FOR EACH ROW EXECUTE FUNCTION referral_payouts_paid_sync();

DROP TRIGGER IF EXISTS referral_payouts_paid_delete ON referral_payouts;
CREATE TRIGGER referral_payouts_paid_delete
  AFTER DELETE ON referral_payouts
  FOR EACH ROW EXECUTE FUNCTION referral_payouts_paid_sync();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Matches the live convention on every other table in this schema: RLS is
-- enabled but the active policy is permissive (USING true). This app does
-- not use Supabase Auth (no auth.uid()) — authorization is enforced in the
-- Next.js API layer via middleware.ts (JWT verification) plus per-route
-- ownership checks against x-profile-id/x-user-type/x-user-role. Server
-- routes call Supabase with the service-role key, which bypasses RLS
-- regardless of policy.

ALTER TABLE referral_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_partners_all_access ON referral_partners;
CREATE POLICY referral_partners_all_access ON referral_partners FOR ALL USING (true);

DROP POLICY IF EXISTS referral_signups_all_access ON referral_signups;
CREATE POLICY referral_signups_all_access ON referral_signups FOR ALL USING (true);

DROP POLICY IF EXISTS referral_commissions_all_access ON referral_commissions;
CREATE POLICY referral_commissions_all_access ON referral_commissions FOR ALL USING (true);

DROP POLICY IF EXISTS referral_payouts_all_access ON referral_payouts;
CREATE POLICY referral_payouts_all_access ON referral_payouts FOR ALL USING (true);

-- ============================================================================
-- DONE
-- ============================================================================
-- Tables created: referral_partners, referral_signups, referral_commissions,
-- referral_payouts
-- ============================================================================
