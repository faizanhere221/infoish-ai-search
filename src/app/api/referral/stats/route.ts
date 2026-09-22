import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { getPartnerStats } from '@/lib/referral'

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
      .select('id, total_referrals, total_paid_cents')
      .eq('user_id', userId)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Not a referral partner' }, { status: 403 })
    }

    const stats = await getPartnerStats(supabase, partner)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Referral stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
