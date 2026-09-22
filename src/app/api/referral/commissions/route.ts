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

    const enriched = (commissions ?? []).map((commission) => {
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

    return NextResponse.json({ commissions: enriched, total: enriched.length })
  } catch (error) {
    console.error('Referral commissions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
