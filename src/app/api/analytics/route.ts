import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { latestResultByDeliverable, onTimeRate, type ResultRow, type DeliverableForReport } from '@/lib/reporting'

// GET /api/analytics — brand owner only. ?start=YYYY-MM-DD&end=YYYY-MM-DD
// (optional) and ?client=<name> (optional, matches campaigns.client_name
// exactly). Aggregates across every campaign the brand owns — spend/
// charge/profit by month and by client, top creators by views and by cost
// per view, and an overall on-time rate.
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'brand' || !callerProfileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const clientFilter = searchParams.get('client')

    const supabase = createServerSupabase()

    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, title, client_name, currency')
      .eq('brand_id', callerProfileId)

    const availableClients = [...new Set((campaigns || []).map((c) => c.client_name).filter(Boolean))] as string[]

    let relevantCampaigns = campaigns || []
    if (clientFilter) {
      relevantCampaigns = relevantCampaigns.filter((c) => c.client_name === clientFilter)
    }
    const campaignIds = relevantCampaigns.map((c) => c.id)
    const campaignById = new Map(relevantCampaigns.map((c) => [c.id, c]))

    if (campaignIds.length === 0) {
      return NextResponse.json({
        by_month: [], by_client: [], top_creators_by_views: [], top_creators_by_cost_per_view: [],
        on_time_rate: null, available_clients: availableClients,
      })
    }

    const { data: rows } = await supabase
      .from('campaign_creators')
      .select('id, campaign_id, creator_id, payout_amount, charge_amount, posted_at, created_at')
      .in('campaign_id', campaignIds)

    let filteredRows = rows || []
    if (start) {
      filteredRows = filteredRows.filter((r) => new Date(r.posted_at || r.created_at) >= new Date(start))
    }
    if (end) {
      filteredRows = filteredRows.filter((r) => new Date(r.posted_at || r.created_at) <= new Date(end))
    }

    const rowIds = filteredRows.map((r) => r.id)

    const { data: deliverables } = rowIds.length > 0
      ? await supabase
          .from('creator_deliverables')
          .select('id, campaign_creator_id, status, posted_at, publish_due')
          .in('campaign_creator_id', rowIds)
      : { data: [] as (DeliverableForReport & { campaign_creator_id: string })[] }

    const deliverableIds = (deliverables || []).map((d) => d.id)
    const { data: results } = deliverableIds.length > 0
      ? await supabase
          .from('deliverable_results')
          .select('deliverable_id, captured_at, views, likes, comments, shares, clicks, saves')
          .in('deliverable_id', deliverableIds)
      : { data: [] as ResultRow[] }

    const latestByDeliverable = latestResultByDeliverable((results || []) as ResultRow[])
    const viewsByRow: Record<string, number> = {}
    for (const d of deliverables || []) {
      const r = latestByDeliverable.get(d.id)
      if (r) {viewsByRow[d.campaign_creator_id] = (viewsByRow[d.campaign_creator_id] || 0) + r.views}
    }

    // By month (bucketed on posted_at, falling back to created_at)
    const monthBuckets: Record<string, { spend: number; charge: number }> = {}
    for (const r of filteredRows) {
      const date = new Date(r.posted_at || r.created_at)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const bucket = monthBuckets[month] || { spend: 0, charge: 0 }
      bucket.spend += r.payout_amount || 0
      bucket.charge += r.charge_amount || 0
      monthBuckets[month] = bucket
    }
    const byMonth = Object.entries(monthBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, b]) => ({ month, spend: b.spend, charge: b.charge, profit: b.charge - b.spend }))

    // By client
    const clientBuckets: Record<string, { spend: number; charge: number }> = {}
    for (const r of filteredRows) {
      const clientName = campaignById.get(r.campaign_id)?.client_name || 'No client set'
      const bucket = clientBuckets[clientName] || { spend: 0, charge: 0 }
      bucket.spend += r.payout_amount || 0
      bucket.charge += r.charge_amount || 0
      clientBuckets[clientName] = bucket
    }
    const byClient = Object.entries(clientBuckets)
      .map(([client_name, b]) => ({ client_name, spend: b.spend, charge: b.charge, profit: b.charge - b.spend }))
      .sort((a, b) => b.charge - a.charge)

    // Top creators
    const creatorIds = [...new Set(filteredRows.map((r) => r.creator_id))]
    const { data: creators } = creatorIds.length > 0
      ? await supabase.from('creators').select('id, display_name, username').in('id', creatorIds)
      : { data: [] }

    const byCreator: Record<string, { views: number; charge: number }> = {}
    for (const r of filteredRows) {
      const bucket = byCreator[r.creator_id] || { views: 0, charge: 0 }
      bucket.views += viewsByRow[r.id] || 0
      bucket.charge += r.charge_amount || 0
      byCreator[r.creator_id] = bucket
    }

    const creatorEntries = Object.entries(byCreator).map(([creatorId, b]) => {
      const creator = creators?.find((c) => c.id === creatorId)
      return {
        creator_id: creatorId,
        creator_name: creator?.display_name ?? null,
        creator_username: creator?.username ?? null,
        views: b.views,
        cost_per_view: b.views > 0 && b.charge > 0 ? b.charge / b.views : null,
      }
    })

    const topByViews = [...creatorEntries].sort((a, b) => b.views - a.views).slice(0, 10)
    const topByCostPerView = creatorEntries
      .filter((c) => c.cost_per_view !== null)
      .sort((a, b) => (a.cost_per_view as number) - (b.cost_per_view as number))
      .slice(0, 10)

    return NextResponse.json({
      by_month: byMonth,
      by_client: byClient,
      top_creators_by_views: topByViews,
      top_creators_by_cost_per_view: topByCostPerView,
      on_time_rate: onTimeRate((deliverables || []) as DeliverableForReport[]),
      available_clients: availableClients,
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/analytics' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
