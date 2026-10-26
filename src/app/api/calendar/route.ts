import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/calendar — draft_due/publish_due across every deliverable the
// caller can see. Brands see every campaign they own (filterable by
// campaign_id/client_name); creators see only their own rows. Never
// returns charge/payout/brand_notes/client_name to a creator caller.
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerProfileId || (callerUserType !== 'brand' && callerUserType !== 'creator')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignIdFilter = searchParams.get('campaign_id')
    const clientNameFilter = searchParams.get('client_name')

    const supabase = createServerSupabase()

    type CampaignRow = { id: string; title: string; brand_id: string; client_name: string | null }
    let campaigns: CampaignRow[] = []
    let rowIds: string[] = []
    const rowToCampaign: Record<string, string> = {}
    const rowToCreator: Record<string, string> = {}
    const rowToCurrency: Record<string, string> = {}

    if (callerUserType === 'brand') {
      let campaignQuery = supabase.from('campaigns').select('id, title, brand_id, client_name').eq('brand_id', callerProfileId)
      if (campaignIdFilter) {campaignQuery = campaignQuery.eq('id', campaignIdFilter)}
      if (clientNameFilter) {campaignQuery = campaignQuery.ilike('client_name', `%${clientNameFilter}%`)}
      const { data } = await campaignQuery
      campaigns = data || []

      if (campaigns.length === 0) {
        return NextResponse.json({ items: [] })
      }

      const { data: rows } = await supabase
        .from('campaign_creators')
        .select('id, campaign_id, creator_id, currency')
        .in('campaign_id', campaigns.map((c) => c.id))

      rowIds = (rows || []).map((r) => r.id)
      for (const r of rows || []) {
        rowToCampaign[r.id] = r.campaign_id
        rowToCreator[r.id] = r.creator_id
        rowToCurrency[r.id] = r.currency
      }
    } else {
      const { data: rows } = await supabase
        .from('campaign_creators')
        .select('id, campaign_id, creator_id')
        .eq('creator_id', callerProfileId)

      rowIds = (rows || []).map((r) => r.id)
      for (const r of rows || []) {
        rowToCampaign[r.id] = r.campaign_id
      }

      const campaignIds = [...new Set((rows || []).map((r) => r.campaign_id))]
      if (campaignIds.length > 0) {
        const { data } = await supabase.from('campaigns').select('id, title, brand_id, client_name').in('id', campaignIds)
        campaigns = data || []
      }
    }

    if (rowIds.length === 0) {
      return NextResponse.json({ items: [] })
    }

    const { data: deliverables, error } = await supabase
      .from('creator_deliverables')
      .select('id, campaign_creator_id, title, status, draft_due, publish_due')
      .in('campaign_creator_id', rowIds)

    if (error) {
      captureError(error, { route: 'GET /api/calendar' })
      return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 })
    }

    const creatorIds = callerUserType === 'brand' ? [...new Set(Object.values(rowToCreator))] : []
    const { data: creators } = creatorIds.length > 0
      ? await supabase.from('creators').select('id, username, display_name').in('id', creatorIds)
      : { data: [] }

    const activeStatuses = ['posted', 'completed']
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const dueFlags = (dateStr: string | null, status: string) => {
      if (!dateStr || activeStatuses.includes(status)) {return { overdue: false, dueSoon: false }}
      const due = new Date(dateStr)
      return { overdue: due < now, dueSoon: due >= now && due <= in48h }
    }

    const items = (deliverables || []).flatMap((d) => {
      const campaignId = rowToCampaign[d.campaign_creator_id]
      const campaign = campaigns.find((c) => c.id === campaignId)
      const creator = callerUserType === 'brand' ? creators?.find((c) => c.id === rowToCreator[d.campaign_creator_id]) : null

      const brandOnlyFields = callerUserType === 'brand' ? {
        client_name: campaign?.client_name ?? null,
        creator_id: rowToCreator[d.campaign_creator_id] ?? null,
        currency: rowToCurrency[d.campaign_creator_id] ?? 'USD',
      } : {}

      const entries: Record<string, unknown>[] = []
      if (d.draft_due) {
        entries.push({
          deliverable_id: d.id,
          campaign_creator_id: d.campaign_creator_id,
          campaign_id: campaignId,
          campaign_title: campaign?.title ?? null,
          ...brandOnlyFields,
          creator_name: creator?.display_name ?? null,
          title: d.title,
          kind: 'draft_due',
          date: d.draft_due,
          status: d.status,
          ...dueFlags(d.draft_due, d.status),
        })
      }
      if (d.publish_due) {
        entries.push({
          deliverable_id: d.id,
          campaign_creator_id: d.campaign_creator_id,
          campaign_id: campaignId,
          campaign_title: campaign?.title ?? null,
          ...brandOnlyFields,
          creator_name: creator?.display_name ?? null,
          title: d.title,
          kind: 'publish_due',
          date: d.publish_due,
          status: d.status,
          ...dueFlags(d.publish_due, d.status),
        })
      }
      return entries
    })

    return NextResponse.json({ items })
  } catch (error) {
    captureError(error, { route: 'GET /api/calendar' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
