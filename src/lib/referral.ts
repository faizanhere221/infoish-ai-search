// ============================================================================
// REFERRAL PARTNER SYSTEM - UTILITIES
// (Phase 1: Foundation, Phase 2: Tracking, Phase 3: Dashboard, Phase 4: Admin)
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PartnerStats, ReferralCommission, ReferralSignup } from '@/types/referral'

export const REFERRAL_COOKIE_NAME = 'infoishai_ref'
export const REFERRAL_COOKIE_DAYS = 30

const REFERRAL_CODE_PATTERN = /^[a-z0-9-]{5,30}$/

/** 5-30 chars, lowercase alphanumeric + hyphens only. */
export function isValidReferralCode(code: string): boolean {
  return REFERRAL_CODE_PATTERN.test(code)
}

/** Builds a URL-safe referral code from a partner's name plus a short random suffix to avoid collisions. */
export function generateReferralCode(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20)

  const suffix = Math.random().toString(36).slice(2, 6)
  const code = `${slug || 'partner'}-${suffix}`

  return code.slice(0, 30)
}

/** Formats a smallest-currency-unit integer (cents) as a "$X.XX" string. */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Links a referral_signups row to the creator profile once it's created, and
 * advances its status past the initial 'signed_up' state. Best-effort: a
 * missing signup (the user wasn't referred) is not an error, it's the common
 * case, so this resolves silently rather than throwing. Callers should treat
 * this as non-fatal to profile creation.
 */
export async function updateReferralOnProfileComplete(
  supabase: SupabaseClient,
  userId: string,
  creatorId: string
): Promise<void> {
  const { data: signup } = await supabase
    .from('referral_signups')
    .select('id')
    .eq('referred_user_id', userId)
    .is('referred_creator_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!signup) {return}

  await supabase
    .from('referral_signups')
    .update({ referred_creator_id: creatorId, status: 'profile_complete' })
    .eq('id', signup.id)
}

const ACTIVE_CREATOR_STATUSES = ['profile_complete', 'first_deal', 'active']

/**
 * Computes a partner's dashboard stats. Shared by the partner's own
 * /api/referral/stats and the admin partner-detail route so both surfaces
 * agree on what "earnings" and "active" mean. Earnings are computed live
 * from referral_commissions (approved/paid only), not trusted from a cached
 * column, since nothing currently writes to referral_partners.total_earnings_cents.
 */
export async function getPartnerStats(
  supabase: SupabaseClient,
  partner: { id: string; total_referrals: number; total_paid_cents: number }
): Promise<PartnerStats> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [
    { count: activeCreators },
    { count: referralsThisMonth },
    { data: allEarnedCommissions },
    { data: commissionsThisMonth },
  ] = await Promise.all([
    supabase
      .from('referral_signups')
      .select('id', { count: 'exact', head: true })
      .eq('partner_id', partner.id)
      .in('status', ACTIVE_CREATOR_STATUSES),
    supabase
      .from('referral_signups')
      .select('id', { count: 'exact', head: true })
      .eq('partner_id', partner.id)
      .gte('created_at', monthStart.toISOString()),
    supabase
      .from('referral_commissions')
      .select('commission_amount_cents')
      .eq('partner_id', partner.id)
      .in('status', ['approved', 'paid']),
    supabase
      .from('referral_commissions')
      .select('commission_amount_cents')
      .eq('partner_id', partner.id)
      .in('status', ['approved', 'paid'])
      .gte('created_at', monthStart.toISOString()),
  ])

  const totalEarningsCents = (allEarnedCommissions ?? []).reduce((sum, c) => sum + (c.commission_amount_cents || 0), 0)
  const earningsThisMonthCents = (commissionsThisMonth ?? []).reduce((sum, c) => sum + (c.commission_amount_cents || 0), 0)

  return {
    total_referrals: partner.total_referrals,
    active_creators: activeCreators ?? 0,
    total_earnings_cents: totalEarningsCents,
    pending_payout_cents: Math.max(totalEarningsCents - partner.total_paid_cents, 0),
    referrals_this_month: referralsThisMonth ?? 0,
    earnings_this_month_cents: earningsThisMonthCents,
  }
}

interface CommissionTotal {
  deals_count: number
  total_deal_amount_cents: number
  total_commission_cents: number
}

/** All referral signups for a partner, enriched with creator info and per-signup deal/commission totals. */
export async function getEnrichedReferralSignups(supabase: SupabaseClient, partnerId: string): Promise<ReferralSignup[]> {
  const { data: signups, error } = await supabase
    .from('referral_signups')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (error) {throw error}

  const creatorIds = [...new Set((signups ?? []).map((s) => s.referred_creator_id).filter(Boolean))]
  let creators: { id: string; username: string; display_name: string; profile_photo_url: string | null; verification_status: string }[] = []
  if (creatorIds.length > 0) {
    const { data } = await supabase
      .from('creators')
      .select('id, username, display_name, profile_photo_url, verification_status')
      .in('id', creatorIds)
    creators = data || []
  }

  const signupIds = (signups ?? []).map((s) => s.id)
  let commissionTotals = new Map<string, CommissionTotal>()
  if (signupIds.length > 0) {
    const { data: commissions } = await supabase
      .from('referral_commissions')
      .select('referral_signup_id, deal_amount_cents, commission_amount_cents, status')
      .in('referral_signup_id', signupIds)
      .neq('status', 'cancelled')

    commissionTotals = (commissions ?? []).reduce((acc, c) => {
      const existing = acc.get(c.referral_signup_id) ?? { deals_count: 0, total_deal_amount_cents: 0, total_commission_cents: 0 }
      existing.deals_count += 1
      existing.total_deal_amount_cents += c.deal_amount_cents || 0
      existing.total_commission_cents += c.commission_amount_cents || 0
      acc.set(c.referral_signup_id, existing)
      return acc
    }, new Map<string, CommissionTotal>())
  }

  return (signups ?? []).map((signup) => ({
    ...signup,
    creator: creators.find((c) => c.id === signup.referred_creator_id) || null,
    ...(commissionTotals.get(signup.id) ?? { deals_count: 0, total_deal_amount_cents: 0, total_commission_cents: 0 }),
  }))
}

/** All commissions for a partner, enriched with the referred creator's name and the deal title. */
export async function getEnrichedCommissions(supabase: SupabaseClient, partnerId: string): Promise<ReferralCommission[]> {
  const { data: commissions, error } = await supabase
    .from('referral_commissions')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (error) {throw error}

  const signupIds = [...new Set((commissions ?? []).map((c) => c.referral_signup_id).filter(Boolean))]
  let signups: { id: string; referred_name: string | null; referred_email: string | null; referral_code: string; referred_creator_id: string | null }[] = []
  if (signupIds.length > 0) {
    const { data } = await supabase
      .from('referral_signups')
      .select('id, referred_name, referred_email, referral_code, referred_creator_id')
      .in('id', signupIds)
    signups = data || []
  }

  const creatorIds = [...new Set(signups.map((s) => s.referred_creator_id).filter(Boolean))]
  let creators: { id: string; display_name: string }[] = []
  if (creatorIds.length > 0) {
    const { data } = await supabase.from('creators').select('id, display_name').in('id', creatorIds as string[])
    creators = data || []
  }

  const dealIds = [...new Set((commissions ?? []).map((c) => c.deal_id).filter(Boolean))]
  let deals: { id: string; title: string }[] = []
  if (dealIds.length > 0) {
    const { data } = await supabase.from('deals').select('id, title').in('id', dealIds as string[])
    deals = data || []
  }

  return (commissions ?? []).map((commission) => {
    const signup = signups.find((s) => s.id === commission.referral_signup_id) || null
    const creator = signup?.referred_creator_id ? creators.find((c) => c.id === signup.referred_creator_id) : null
    return {
      ...commission,
      referral_signup: signup
        ? { id: signup.id, referred_name: creator?.display_name || signup.referred_name, referred_email: signup.referred_email, referral_code: signup.referral_code }
        : null,
      deal: commission.deal_id ? deals.find((d) => d.id === commission.deal_id) || null : null,
    }
  })
}
