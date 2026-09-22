import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET - The current user's own referral_partners record, if any (auth
// required). Used by the dashboard to know whether to show the partner nav
// link and to populate the partner dashboard header (name, status,
// referral code). Returns 403, not 404, when the caller isn't a partner —
// matches the other /api/referral/* partner routes.
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = createServerSupabase()

    const { data: partner, error } = await supabase
      .from('referral_partners')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !partner) {
      return NextResponse.json({ error: 'Not a referral partner' }, { status: 403 })
    }

    return NextResponse.json({ partner })
  } catch (error) {
    console.error('Referral partner self-lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
