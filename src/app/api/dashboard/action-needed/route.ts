import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { getNextStep } from '@/lib/campaign-creator-next-step'

export const dynamic = 'force-dynamic'

// GET /api/dashboard/action-needed
// The same campaign_creators rows the tracker (brand) / my-campaigns
// (creator) pages already list, filtered down to "it's your turn" via the
// shared getNextStep() helper and sorted oldest-first, for the dashboard
// home "Action needed" widget. Caps at 20 rows — this is a glance list,
// not a full tracker.
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerProfileId || (callerUserType !== 'brand' && callerUserType !== 'creator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabase()

    let rows: { id: string; campaign_id: string; status: string; created_at: string }[] = []
    let campaignIds: string[] = []

    if (callerUserType === 'brand') {
      const { data: campaigns } = await supabase.from('campaigns').select('id').eq('brand_id', callerProfileId)
      campaignIds = (campaigns || []).map((c) => c.id)
      if (campaignIds.length === 0) {
        return NextResponse.json({ items: [] })
      }
      const { data, error } = await supabase
        .from('campaign_creators')
        .select('id, campaign_id, creator_id, status, created_at')
        .in('campaign_id', campaignIds)
        .neq('status', 'dropped')
      if (error) {
        captureError(error, { route: 'GET /api/dashboard/action-needed' })
        return NextResponse.json({ error: 'Failed to load action list' }, { status: 500 })
      }
      rows = data || []
    } else {
      const { data, error } = await supabase
        .from('campaign_creators')
        .select('id, campaign_id, status, created_at')
        .eq('creator_id', callerProfileId)
        .neq('status', 'dropped')
      if (error) {
        captureError(error, { route: 'GET /api/dashboard/action-needed' })
        return NextResponse.json({ error: 'Failed to load action list' }, { status: 500 })
      }
      rows = data || []
      campaignIds = [...new Set(rows.map((r) => r.campaign_id))]
    }

    if (rows.length === 0) {
      return NextResponse.json({ items: [] })
    }

    const rowIds = rows.map((r) => r.id)

    const { data: contractRows } = await supabase
      .from('campaign_contracts')
      .select('campaign_creator_id, status')
      .in('campaign_creator_id', rowIds)
      .neq('status', 'void')
    const contractStatusByRow: Record<string, string> = {}
    for (const c of contractRows || []) {contractStatusByRow[c.campaign_creator_id] = c.status}

    const { data: paymentRows } = await supabase
      .from('creator_payments')
      .select('campaign_creator_id, status, due_date')
      .in('campaign_creator_id', rowIds)
      .neq('status', 'cancelled')
    const now = new Date()
    const PAYMENT_STATUS_RANK: Record<string, number> = { disputed: 5, due: 4, marked_paid: 3, scheduled: 2, confirmed: 1 }
    const paymentSummaryByRow: Record<string, { status: string; overdue: boolean }> = {}
    for (const p of paymentRows || []) {
      const overdue = p.status === 'due' && !!p.due_date && new Date(p.due_date) < now
      const current = paymentSummaryByRow[p.campaign_creator_id]
      const rank = PAYMENT_STATUS_RANK[p.status] ?? 0
      if (!current || rank > (PAYMENT_STATUS_RANK[current.status] ?? 0)) {
        paymentSummaryByRow[p.campaign_creator_id] = { status: p.status, overdue }
      } else if (overdue) {
        current.overdue = true
      }
    }

    const { data: offerRows } = await supabase
      .from('campaign_offers')
      .select('campaign_creator_id, from_party')
      .in('campaign_creator_id', rowIds)
      .eq('status', 'pending')
    const pendingOfferByRow: Record<string, 'brand' | 'creator'> = {}
    for (const o of offerRows || []) {pendingOfferByRow[o.campaign_creator_id] = o.from_party}

    const { data: deliverableRows } = await supabase
      .from('creator_deliverables')
      .select('campaign_creator_id, status')
      .in('campaign_creator_id', rowIds)
    const deliverableStatusesByRow: Record<string, string[]> = {}
    for (const d of deliverableRows || []) {
      const list = deliverableStatusesByRow[d.campaign_creator_id] || []
      list.push(d.status)
      deliverableStatusesByRow[d.campaign_creator_id] = list
    }

    const { data: campaigns } = await supabase.from('campaigns').select('id, title, brand_id').in('id', campaignIds)
    const campaignById: Record<string, { id: string; title: string; brand_id: string }> = {}
    for (const c of campaigns || []) {campaignById[c.id] = c}

    const brandNameByCampaign: Record<string, string> = {}
    if (callerUserType === 'creator') {
      const brandIds = [...new Set((campaigns || []).map((c) => c.brand_id))]
      const { data: brands } = brandIds.length > 0
        ? await supabase.from('brands').select('id, company_name').in('id', brandIds)
        : { data: [] }
      const brandNameById: Record<string, string> = {}
      for (const b of brands || []) {brandNameById[b.id] = b.company_name}
      for (const c of campaigns || []) {brandNameByCampaign[c.id] = brandNameById[c.brand_id] || 'Brand'}
    }

    const creatorNameByRow: Record<string, string> = {}
    if (callerUserType === 'brand') {
      const creatorIds = [...new Set((rows as { creator_id?: string }[]).map((r) => r.creator_id).filter(Boolean) as string[])]
      const { data: creators } = creatorIds.length > 0
        ? await supabase.from('creators').select('id, display_name').in('id', creatorIds)
        : { data: [] }
      const nameById: Record<string, string> = {}
      for (const c of creators || []) {nameById[c.id] = c.display_name}
      for (const r of rows as { id: string; creator_id?: string }[]) {
        if (r.creator_id) {creatorNameByRow[r.id] = nameById[r.creator_id] || 'Creator'}
      }
    }

    const items = rows
      .map((row) => {
        const step = getNextStep(
          {
            status: row.status,
            contract_status: contractStatusByRow[row.id] ?? null,
            payment_status: paymentSummaryByRow[row.id]?.status ?? null,
            payment_overdue: paymentSummaryByRow[row.id]?.overdue ?? false,
            pending_offer_from: pendingOfferByRow[row.id] ?? null,
            deliverable_statuses: deliverableStatusesByRow[row.id] ?? [],
          },
          callerUserType as 'brand' | 'creator'
        )
        if (!step || !step.mine) {return null}
        const campaign = campaignById[row.campaign_id]
        return {
          campaign_creator_id: row.id,
          campaign_id: row.campaign_id,
          campaign_title: campaign?.title || 'Campaign',
          counterpart_name: callerUserType === 'brand' ? creatorNameByRow[row.id] || 'Creator' : brandNameByCampaign[row.campaign_id] || 'Brand',
          label: step.label,
          tab: step.tab,
          created_at: row.created_at,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 20)

    return NextResponse.json({ items })
  } catch (error) {
    captureError(error, { route: 'GET /api/dashboard/action-needed' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
