import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { getEnrichedReferralSignups } from '@/lib/referral'

// GET - All referral signups for a given partner (admin only, enforced by middleware)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const referrals = await getEnrichedReferralSignups(supabase, params.id)
    return NextResponse.json({ referrals, total: referrals.length })
  } catch (err) {
    console.error('Admin partner referrals fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
  }
}
