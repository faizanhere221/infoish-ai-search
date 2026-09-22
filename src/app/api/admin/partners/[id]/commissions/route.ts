import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { getEnrichedCommissions } from '@/lib/referral'

// GET - All commissions for a given partner (admin only, enforced by middleware)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const commissions = await getEnrichedCommissions(supabase, params.id)
    return NextResponse.json({ commissions, total: commissions.length })
  } catch (err) {
    console.error('Admin partner commissions fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
  }
}
