import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { onTimeRate, type DeliverableForReport } from '@/lib/reporting'
import { getCreatorEarnings } from '@/lib/creator-earnings'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/campaign-creators/my-stats — creator-only: campaigns completed,
// total earned, and on-time rate across every campaign they've worked.
// Total earned is money actually received (confirmed creator_payments +
// completed legacy deals, see src/lib/creator-earnings.ts), not the agreed
// payout_amount on every row, which counted unpaid and dropped work. Never
// includes charge/profit.
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators see this' }, { status: 403 })
    }

    const supabase = createServerSupabase()

    const { data: rows } = await supabase
      .from('campaign_creators')
      .select('id, status')
      .eq('creator_id', callerProfileId)

    const rowIds = (rows || []).map((r) => r.id)
    const { data: deliverables } = rowIds.length > 0
      ? await supabase
          .from('creator_deliverables')
          .select('id, campaign_creator_id, status, posted_at, publish_due')
          .in('campaign_creator_id', rowIds)
      : { data: [] as (DeliverableForReport & { campaign_creator_id: string })[] }

    const campaignsCompleted = (rows || []).filter((r) => r.status === 'completed').length

    const earnings = await getCreatorEarnings(supabase, callerProfileId)

    return NextResponse.json({
      campaigns_completed: campaignsCompleted,
      total_earned_by_currency: earnings.byCurrency,
      on_time_rate: onTimeRate((deliverables || []) as DeliverableForReport[]),
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/my-stats' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
