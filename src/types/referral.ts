// ============================================================================
// REFERRAL PARTNER SYSTEM - TYPES (Phase 1: Foundation)
// ============================================================================

export type PartnerStatus = 'active' | 'paused' | 'deactivated'
export type ReferralSignupStatus = 'signed_up' | 'profile_complete' | 'first_deal' | 'active'
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled'
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ReferralPartner {
  id: string
  user_id: string | null
  name: string
  email: string
  referral_code: string
  commission_rate: number
  status: PartnerStatus
  total_referrals: number
  total_earnings_cents: number
  total_paid_cents: number
  created_at: string
  updated_at: string
}

export interface ReferralSignupCreatorSummary {
  id: string
  username: string
  display_name: string
  profile_photo_url: string | null
  verification_status: string
}

export interface ReferralSignup {
  id: string
  partner_id: string
  referred_user_id: string | null
  referred_creator_id: string | null
  referred_email: string | null
  referred_name: string | null
  referral_code: string
  signup_date: string
  status: ReferralSignupStatus
  created_at: string
  partner?: Pick<ReferralPartner, 'id' | 'name' | 'referral_code'> | null
  creator?: ReferralSignupCreatorSummary | null
  deals_count?: number
  total_deal_amount_cents?: number
  total_commission_cents?: number
}

export interface ReferralCommission {
  id: string
  partner_id: string
  referral_signup_id: string
  deal_id: string | null
  deal_amount_cents: number
  platform_fee_cents: number | null
  commission_rate: number
  commission_amount_cents: number
  status: CommissionStatus
  created_at: string
  paid_at: string | null
  referral_signup?: Pick<ReferralSignup, 'id' | 'referred_name' | 'referred_email' | 'referral_code'> | null
  deal?: { id: string; title: string } | null
}

export interface ReferralPayout {
  id: string
  partner_id: string
  amount_cents: number
  payment_method: string | null
  payment_reference: string | null
  notes: string | null
  status: PayoutStatus
  created_at: string
  completed_at: string | null
}

export interface PartnerStats {
  total_referrals: number
  active_creators: number
  total_earnings_cents: number
  pending_payout_cents: number
  referrals_this_month: number
  earnings_this_month_cents: number
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreatePartnerInput {
  user_id?: string | null
  name: string
  email: string
  referral_code?: string
  commission_rate?: number
}

export interface UpdatePartnerInput {
  name?: string
  email?: string
  commission_rate?: number
  status?: PartnerStatus
}

export interface CreatePayoutInput {
  amount_cents: number
  payment_method?: string
  payment_reference?: string
  notes?: string
  status?: PayoutStatus
}
