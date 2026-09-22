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

    const referrals = (signups ?? []).map((signup) => ({
      ...signup,
      creator: creators.find((c) => c.id === signup.referred_creator_id) || null,
    }))

    return NextResponse.json({ referrals, total: referrals.length })
  } catch (error) {
    console.error('Referral signups fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
