import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { refreshDuePayments } from '@/lib/payments/engine'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/payments — brand only. Every payment record across every
// campaign the brand owns, joined with creator/campaign/client info.
// ?status=&campaign_id=&client_name= filter; totals are computed
// client-side, per currency (never summed across currencies).
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'brand' || !callerProfileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const campaignIdFilter = searchParams.get('campaign_id')
    const clientNameFilter = searchParams.get('client_name')

    const supabase = createServerSupabase()

    let campaignQuery = supabase.from('campaigns').select('id, title, client_name').eq('brand_id', callerProfileId)
    if (campaignIdFilter) {campaignQuery = campaignQuery.eq('id', campaignIdFilter)}
    if (clientNameFilter) {campaignQuery = campaignQuery.ilike('client_name', `%${clientNameFilter}%`)}
    const { data: campaigns } = await campaignQuery

    const campaignIds = (campaigns || []).map((c) => c.id)
    if (campaignIds.length === 0) {
      return NextResponse.json({ payments: [] })
    }

    const { data: rows } = await supabase
      .from('campaign_creators')
      .select('id, campaign_id, creator_id, status')
      .in('campaign_id', campaignIds)

    const rowIds = (rows || []).map((r) => r.id)
    if (rowIds.length === 0) {
      return NextResponse.json({ payments: [] })
    }

    // Lazy due-transition, scoped to the rows actually in view.
    await Promise.all(rowIds.map((rowId) => refreshDuePayments(supabase, rowId)))

    let paymentQuery = supabase
      .from('creator_payments')
      .select('*')
      .in('campaign_creator_id', rowIds)
      .order('due_date', { ascending: true, nullsFirst: false })
    if (statusFilter) {paymentQuery = paymentQuery.eq('status', statusFilter)}

    const { data: payments, error } = await paymentQuery

    if (error) {
      captureError(error, { route: 'GET /api/payments' })
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    const creatorIds = [...new Set((rows || []).map((r) => r.creator_id))]
    const { data: creators } = creatorIds.length > 0
      ? await supabase.from('creators').select('id, display_name, username').in('id', creatorIds)
      : { data: [] }

    const rowById: Record<string, { campaign_id: string; creator_id: string }> = {}
    for (const r of rows || []) {rowById[r.id] = r}
    const campaignById: Record<string, { title: string; client_name: string | null }> = {}
    for (const c of campaigns || []) {campaignById[c.id] = c}

    const enriched = (payments || []).map((p) => {
      const row = rowById[p.campaign_creator_id]
      const campaign = row ? campaignById[row.campaign_id] : null
      const creator = row ? creators?.find((c) => c.id === row.creator_id) : null
      return {
        ...p,
        campaign_title: campaign?.title ?? null,
        client_name: campaign?.client_name ?? null,
        creator_name: creator?.display_name ?? null,
        creator_username: creator?.username ?? null,
      }
    })

    return NextResponse.json({ payments: enriched })
  } catch (error) {
    captureError(error, { route: 'GET /api/payments' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
