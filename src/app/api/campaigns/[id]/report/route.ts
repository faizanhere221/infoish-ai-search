import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import {
  latestResultByDeliverable, sumEngagementTotals, engagementRate, cpm, costPerEngagement, onTimeRate, postedCount,
  type ResultRow, type DeliverableForReport,
} from '@/lib/reporting'
import { refreshDuePayments } from '@/lib/payments/engine'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

// GET /api/campaigns/[id]/report — brand owner only. Aggregates results
// (latest check-in per deliverable, never summed across check-ins) against
// money and timing per creator, plus campaign totals. Feeds both the report
// tab and its CSV export (built client-side from this response, same
// pattern as the tracker's existing CSV export).
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id, title, currency')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: rows } = await supabase
      .from('campaign_creators')
      .select('id, creator_id, status, payout_amount, charge_amount, currency')
      .eq('campaign_id', id)

    const rowIds = (rows || []).map((r) => r.id)
    if (rowIds.length === 0) {
      return NextResponse.json({ campaign: { title: campaign.title }, totals: null, creators: [], payments_by_currency: [] })
    }

    const { data: creators } = await supabase
      .from('creators')
      .select('id, display_name, username')
      .in('id', [...new Set((rows || []).map((r) => r.creator_id))])

    const { data: deliverables } = await supabase
      .from('creator_deliverables')
      .select('id, campaign_creator_id, status, posted_at, publish_due')
      .in('campaign_creator_id', rowIds)

    const deliverableIds = (deliverables || []).map((d) => d.id)
    const { data: results } = deliverableIds.length > 0
      ? await supabase
          .from('deliverable_results')
          .select('deliverable_id, captured_at, views, likes, comments, shares, clicks, saves')
          .in('deliverable_id', deliverableIds)
      : { data: [] as ResultRow[] }

    // Lazy due-transition first (no cron) — same as every other
    // payment-reading GET — so a payment that should already show 'due'
    // isn't still bucketed as scheduled/"outstanding" here.
    await Promise.all(rowIds.map((rowId) => refreshDuePayments(supabase, rowId)))

    // Paid vs outstanding, per currency — never summed across currencies.
    // 'paid' = money has moved (marked_paid or confirmed); 'outstanding' =
    // still owed (scheduled, due, or disputed). Cancelled records don't
    // count either way.
    const { data: payments } = await supabase
      .from('creator_payments')
      .select('status, amount, currency')
      .in('campaign_creator_id', rowIds)
      .neq('status', 'cancelled')

    const paymentsByCurrency: Record<string, { paid: number; outstanding: number }> = {}
    for (const p of payments || []) {
      const bucket = paymentsByCurrency[p.currency] || { paid: 0, outstanding: 0 }
      if (p.status === 'marked_paid' || p.status === 'confirmed') {
        bucket.paid += p.amount
      } else {
        bucket.outstanding += p.amount
      }
      paymentsByCurrency[p.currency] = bucket
    }
    const paymentsSummary = Object.entries(paymentsByCurrency).map(([currency, b]) => ({ currency, ...b }))

    const latestByDeliverable = latestResultByDeliverable((results || []) as ResultRow[])

    const deliverablesByRow = new Map<string, DeliverableForReport[]>()
    for (const d of deliverables || []) {
      const list = deliverablesByRow.get(d.campaign_creator_id) || []
      list.push(d)
      deliverablesByRow.set(d.campaign_creator_id, list)
    }

    let grandViews = 0, grandEngagements = 0, grandPayout = 0, grandCharge = 0, grandPostedCount = 0
    const allDeliverablesForOnTime: DeliverableForReport[] = deliverables || []

    const creatorRows = (rows || []).map((row) => {
      const creator = creators?.find((c) => c.id === row.creator_id) || null
      const rowDeliverables = deliverablesByRow.get(row.id) || []
      const rowResultRows = rowDeliverables
        .map((d) => latestByDeliverable.get(d.id))
        .filter((r): r is ResultRow => !!r)
      const totals = sumEngagementTotals(rowResultRows)
      const posted = postedCount(rowDeliverables)

      grandViews += totals.views
      grandEngagements += totals.engagements
      grandPayout += row.payout_amount || 0
      grandCharge += row.charge_amount || 0
      grandPostedCount += posted

      return {
        campaign_creator_id: row.id,
        creator_id: row.creator_id,
        creator_name: creator?.display_name ?? null,
        creator_username: creator?.username ?? null,
        status: row.status,
        payout_amount: row.payout_amount,
        charge_amount: row.charge_amount,
        currency: row.currency,
        posted_count: posted,
        views: totals.views,
        engagements: totals.engagements,
        engagement_rate: engagementRate(totals),
        cpm_on_charge: cpm(row.charge_amount, totals.views),
        cpm_on_payout: cpm(row.payout_amount, totals.views),
        on_time_rate: onTimeRate(rowDeliverables),
      }
    })

    return NextResponse.json({
      campaign: { title: campaign.title, currency: campaign.currency },
      totals: {
        posted_count: grandPostedCount,
        views: grandViews,
        engagements: grandEngagements,
        engagement_rate: engagementRate({ views: grandViews, engagements: grandEngagements }),
        total_payout: grandPayout,
        total_charge: grandCharge,
        total_profit: grandCharge - grandPayout,
        cpm_on_charge: cpm(grandCharge, grandViews),
        cpm_on_payout: cpm(grandPayout, grandViews),
        cost_per_engagement_charge: costPerEngagement(grandCharge, grandEngagements),
        cost_per_engagement_payout: costPerEngagement(grandPayout, grandEngagements),
        on_time_rate: onTimeRate(allDeliverablesForOnTime),
      },
      creators: creatorRows,
      payments_by_currency: paymentsSummary,
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaigns/[id]/report' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
