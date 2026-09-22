import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { getEnrichedCommissions } from '@/lib/referral'

// GET - All commissions for the current partner (auth required, caller must be a partner)
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

    const commissions = await getEnrichedCommissions(supabase, partner.id)

    return NextResponse.json({ commissions, total: commissions.length })
  } catch (error) {
    console.error('Referral commissions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
