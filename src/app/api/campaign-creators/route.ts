import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { CAMPAIGN_CREATOR_STATUSES } from '@/types/campaigns'

// GET /api/campaign-creators - the calling creator's own tracker rows across
// every campaign, with campaign + brand details joined in. Mirrors
// /api/applications (same "my own X" shape). Strips charge_amount,
// brand_notes, and client_name server-side via an explicit field list —
// never relies on the frontend to hide them. Supports ?status=.
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators can view this' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    const supabase = createServerSupabase()

    let query = supabase
      .from('campaign_creators')
      .select('id, campaign_id, status, planned_date, posted_at, posted_url, payout_amount, currency', { count: 'exact' })
      .eq('creator_id', callerProfileId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && (CAMPAIGN_CREATOR_STATUSES as readonly string[]).includes(status)) {
      query = query.eq('status', status)
    }

    const { data: rows, error, count } = await query

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators' })
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ campaign_creators: [], total: count ?? 0, limit, offset })
    }

    const campaignIds = [...new Set(rows.map((r) => r.campaign_id))]
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, title, brand_id')
      .in('id', campaignIds)

    const brandIds = [...new Set((campaigns || []).map((c) => c.brand_id))]
    const { data: brands } = brandIds.length > 0
      ? await supabase.from('brands').select('id, company_name, logo_url, contact_name').in('id', brandIds)
      : { data: [] }

    // Contract/payment/offer status per row — same computation as the
    // brand tracker list (GET /api/campaigns/[id]/creators), so the
    // "next step" guidance helper has the same signals on both sides.
    const rowIds = rows.map((r) => r.id)

    const { data: contractRows } = rowIds.length > 0
      ? await supabase.from('campaign_contracts').select('campaign_creator_id, status').in('campaign_creator_id', rowIds).neq('status', 'void')
      : { data: [] }
    const contractStatusByRow: Record<string, string> = {}
    for (const c of contractRows || []) {contractStatusByRow[c.campaign_creator_id] = c.status}

    const { data: paymentRows } = rowIds.length > 0
      ? await supabase.from('creator_payments').select('campaign_creator_id, status, due_date').in('campaign_creator_id', rowIds).neq('status', 'cancelled')
      : { data: [] }
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

    const { data: offerRows } = rowIds.length > 0
      ? await supabase.from('campaign_offers').select('campaign_creator_id, from_party').in('campaign_creator_id', rowIds).eq('status', 'pending')
      : { data: [] }
    const pendingOfferByRow: Record<string, 'brand' | 'creator'> = {}
    for (const o of offerRows || []) {pendingOfferByRow[o.campaign_creator_id] = o.from_party}

    const { data: deliverableRows } = rowIds.length > 0
      ? await supabase.from('creator_deliverables').select('campaign_creator_id, status').in('campaign_creator_id', rowIds)
      : { data: [] }
    const deliverableStatusesByRow: Record<string, string[]> = {}
    for (const d of deliverableRows || []) {
      const list = deliverableStatusesByRow[d.campaign_creator_id] || []
      list.push(d.status)
      deliverableStatusesByRow[d.campaign_creator_id] = list
    }

    const withRelations = rows.map((row) => {
      const campaign = campaigns?.find((c) => c.id === row.campaign_id)
      const brand = campaign ? brands?.find((b) => b.id === campaign.brand_id) : null
      return {
        id: row.id,
        campaign_id: row.campaign_id,
        status: row.status,
        planned_date: row.planned_date,
        posted_at: row.posted_at,
        posted_url: row.posted_url,
        payout_amount: row.payout_amount,
        currency: row.currency,
        campaign: campaign ? { id: campaign.id, title: campaign.title } : null,
        brand: brand || null,
        contract_status: contractStatusByRow[row.id] ?? null,
        payment_status: paymentSummaryByRow[row.id]?.status ?? null,
        payment_overdue: paymentSummaryByRow[row.id]?.overdue ?? false,
        pending_offer_from: pendingOfferByRow[row.id] ?? null,
        deliverable_statuses: deliverableStatusesByRow[row.id] ?? [],
      }
    })

    return NextResponse.json({ campaign_creators: withRelations, total: count ?? withRelations.length, limit, offset })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
