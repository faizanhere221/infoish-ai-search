import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

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

    const { data: commissions, error } = await supabase
      .from('referral_commissions')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching referral commissions:', error)
      return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
    }

    const signupIds = [...new Set((commissions ?? []).map((c) => c.referral_signup_id).filter(Boolean))]
    let signups: { id: string; referred_name: string | null; referred_email: string | null; referral_code: string }[] = []

    if (signupIds.length > 0) {
      const { data } = await supabase
        .from('referral_signups')
        .select('id, referred_name, referred_email, referral_code')
        .in('id', signupIds)
      signups = data || []
    }

    const enriched = (commissions ?? []).map((commission) => ({
      ...commission,
      referral_signup: signups.find((s) => s.id === commission.referral_signup_id) || null,
    }))

    return NextResponse.json({ commissions: enriched, total: enriched.length })
  } catch (error) {
    console.error('Referral commissions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
