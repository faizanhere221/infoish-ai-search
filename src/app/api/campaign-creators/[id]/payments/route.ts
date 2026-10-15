import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow } from '@/lib/campaign-creator-auth'
import { refreshDuePayments } from '@/lib/payments/engine'

interface RouteParams {
  params: { id: string }
}

// GET /api/campaign-creators/[id]/payments — either party. Lazily flips any
// 'scheduled' record to 'due' first (no cron, same pattern as offer
// expiry). creator_payments never carries charge/profit — it's built
// entirely from payout_amount, so there's nothing to strip for the
// creator's view.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await refreshDuePayments(supabase, id)

    const { data: payments, error } = await supabase
      .from('creator_payments')
      .select('*')
      .eq('campaign_creator_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators/[id]/payments' })
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    return NextResponse.json({ payments: payments || [] })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/[id]/payments' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
