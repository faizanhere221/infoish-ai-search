import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET - All referral signups for the current partner, with creator details (auth required, caller must be a partner)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = createServerSupabase()

    const { data: partner, error: partnerError } = await supabase
      .from('referral_partners')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Not a referral partner' }, { status: 403 })
    }

    const { data: signups, error } = await supabase
      .from('referral_signups')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching referral signups:', error)
      return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
    }

    const creatorIds = [...new Set((signups ?? []).map((s) => s.referred_creator_id).filter(Boolean))]
    let creators: { id: string; username: string; display_name: string; profile_photo_url: string | null; verification_status: string }[] = []

    if (creatorIds.length > 0) {
      const { data } = await supabase
        .from('creators')
        .select('id, username, display_name, profile_photo_url, verification_status')
        .in('id', creatorIds)
      creators = data || []
    }

    // Per-referral deal/earnings summary, so the table can show "Deals",
    // "Earnings" (deal value generated) and "Commission" (partner's cut)
    // without a separate round trip per row.
    const signupIds = (signups ?? []).map((s) => s.id)
    let commissionTotals = new Map<string, { deals_count: number; total_deal_amount_cents: number; total_commission_cents: number }>()

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
      }, new Map<string, { deals_count: number; total_deal_amount_cents: number; total_commission_cents: number }>())
    }

    const referrals = (signups ?? []).map((signup) => ({
      ...signup,
      creator: creators.find((c) => c.id === signup.referred_creator_id) || null,
      ...(commissionTotals.get(signup.id) ?? { deals_count: 0, total_deal_amount_cents: 0, total_commission_cents: 0 }),
    }))

    return NextResponse.json({ referrals, total: referrals.length })
  } catch (error) {
    console.error('Referral signups fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
