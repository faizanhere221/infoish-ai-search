import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { onTimeRate, type DeliverableForReport } from '@/lib/reporting'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/campaign-creators/my-stats — creator-only: campaigns completed,
// total earned (from payout_amount only — never charge/profit, which this
// creator never sees anywhere else either), and on-time rate across every
// campaign they've worked.
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
      .select('id, status, payout_amount, currency')
      .eq('creator_id', callerProfileId)

    const rowIds = (rows || []).map((r) => r.id)
    const { data: deliverables } = rowIds.length > 0
      ? await supabase
          .from('creator_deliverables')
          .select('id, campaign_creator_id, status, posted_at, publish_due')
          .in('campaign_creator_id', rowIds)
      : { data: [] as (DeliverableForReport & { campaign_creator_id: string })[] }

    const campaignsCompleted = (rows || []).filter((r) => r.status === 'completed').length

    // Grouped by currency — summing across currencies would silently
    // produce a meaningless number for a creator paid in more than one.
    const earnedByCurrency: Record<string, number> = {}
    for (const r of rows || []) {
      if (!r.payout_amount) {continue}
      earnedByCurrency[r.currency] = (earnedByCurrency[r.currency] || 0) + r.payout_amount
    }

    return NextResponse.json({
      campaigns_completed: campaignsCompleted,
      total_earned_by_currency: earnedByCurrency,
      on_time_rate: onTimeRate((deliverables || []) as DeliverableForReport[]),
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/my-stats' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
