import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import type { PartnerStats } from '@/types/referral'

// GET - Current partner's dashboard stats (auth required, caller must be a partner)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = createServerSupabase()

    const { data: partner, error: partnerError } = await supabase
      .from('referral_partners')
      .select('id, total_referrals, total_earnings_cents, total_paid_cents')
      .eq('user_id', userId)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Not a referral partner' }, { status: 403 })
    }

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [{ count: activeCreators }, { count: referralsThisMonth }, { data: commissionsThisMonth }] = await Promise.all([
      supabase
        .from('referral_signups')
        .select('id', { count: 'exact', head: true })
        .eq('partner_id', partner.id)
        .eq('status', 'active'),
      supabase
        .from('referral_signups')
        .select('id', { count: 'exact', head: true })
        .eq('partner_id', partner.id)
        .gte('created_at', monthStart.toISOString()),
      supabase
        .from('referral_commissions')
        .select('commission_amount_cents')
        .eq('partner_id', partner.id)
        .neq('status', 'cancelled')
        .gte('created_at', monthStart.toISOString()),
    ])

    const earningsThisMonthCents = (commissionsThisMonth ?? []).reduce(
      (sum, c) => sum + (c.commission_amount_cents || 0),
      0
    )

    const stats: PartnerStats = {
      total_referrals: partner.total_referrals,
      active_creators: activeCreators ?? 0,
      total_earnings_cents: partner.total_earnings_cents,
      pending_payout_cents: Math.max(partner.total_earnings_cents - partner.total_paid_cents, 0),
      referrals_this_month: referralsThisMonth ?? 0,
      earnings_this_month_cents: earningsThisMonthCents,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Referral stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
