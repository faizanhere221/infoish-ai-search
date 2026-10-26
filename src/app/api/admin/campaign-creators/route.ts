import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const VALID_STATUS = new Set([
  'shortlisted', 'contacted', 'negotiating', 'confirmed', 'drafting',
  'draft_review', 'scheduled', 'posted', 'completed', 'dropped',
])

// GET /api/admin/campaign-creators — every tracker row across every brand,
// read-only. Filters: status, brand_id, creator_id, overdue (any
// non-posted/completed deliverable past its due date), or `filter` (a
// dashboard-tile convenience: 'offers_pending' | 'deliverables_overdue').
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20))
    const status = searchParams.get('status') ?? ''
    const brandId = searchParams.get('brand_id') ?? ''
    const creatorId = searchParams.get('creator_id') ?? ''
    const overdue = searchParams.get('overdue') === 'true'
    const filter = searchParams.get('filter') ?? ''
    const search = searchParams.get('search')?.trim() ?? ''

    const supabase = createServerSupabase()

    let allowedIds: string[] | null = null

    if (filter === 'offers_pending') {
      const { data: offers } = await supabase.from('campaign_offers').select('campaign_creator_id').eq('status', 'pending')
      allowedIds = [...new Set((offers ?? []).map((o) => o.campaign_creator_id))]
    } else if (filter === 'deliverables_overdue' || overdue) {
      const today = new Date().toISOString().slice(0, 10)
      const { data: deliverables } = await supabase
        .from('creator_deliverables')
        .select('campaign_creator_id, draft_due, publish_due, status')
        .not('status', 'in', '(posted,completed)')
      const overdueIds = new Set(
        (deliverables ?? [])
          .filter((d) => (d.publish_due ?? d.draft_due) && (d.publish_due ?? d.draft_due) < today)
          .map((d) => d.campaign_creator_id)
      )
      allowedIds = [...overdueIds]
    }

    if (search) {
      const [{ data: matchedCampaigns }, { data: matchedCreators }, { data: matchedBrands }] = await Promise.all([
        supabase.from('campaigns').select('id').ilike('title', `%${search}%`),
        supabase.from('creators').select('id').or(`display_name.ilike.%${search}%,username.ilike.%${search}%`),
        supabase.from('brands').select('id').ilike('company_name', `%${search}%`),
      ])
      const brandCampaignIds: string[] = []
      if ((matchedBrands ?? []).length > 0) {
        const { data: campaignsForBrands } = await supabase.from('campaigns').select('id').in('brand_id', (matchedBrands ?? []).map((b) => b.id))
        brandCampaignIds.push(...(campaignsForBrands ?? []).map((c) => c.id))
      }
      const searchCampaignIds = [...new Set([...(matchedCampaigns ?? []).map((c) => c.id), ...brandCampaignIds])]
      const searchCreatorIds = (matchedCreators ?? []).map((c) => c.id)

      let rowQuery = supabase.from('campaign_creators').select('id')
      if (searchCampaignIds.length > 0 && searchCreatorIds.length > 0) {
        rowQuery = rowQuery.or(`campaign_id.in.(${searchCampaignIds.join(',')}),creator_id.in.(${searchCreatorIds.join(',')})`)
      } else if (searchCampaignIds.length > 0) {
        rowQuery = rowQuery.in('campaign_id', searchCampaignIds)
      } else if (searchCreatorIds.length > 0) {
        rowQuery = rowQuery.in('creator_id', searchCreatorIds)
      } else {
        return NextResponse.json({ rows: [], total: 0, page, limit })
      }
      const { data: searchRows } = await rowQuery
      const searchIds = new Set((searchRows ?? []).map((r) => r.id))
      allowedIds = allowedIds ? allowedIds.filter((id) => searchIds.has(id)) : [...searchIds]
    }

    if (creatorId) {
      if (allowedIds) {
        const { data: rows } = await supabase.from('campaign_creators').select('id').eq('creator_id', creatorId).in('id', allowedIds)
        allowedIds = (rows ?? []).map((r) => r.id)
      } else {
        const { data: rows } = await supabase.from('campaign_creators').select('id').eq('creator_id', creatorId)
        allowedIds = (rows ?? []).map((r) => r.id)
      }
    }
    if (brandId) {
      const { data: brandCampaigns } = await supabase.from('campaigns').select('id').eq('brand_id', brandId)
      const brandCampaignIds = (brandCampaigns ?? []).map((c) => c.id)
      if (brandCampaignIds.length === 0) {
        return NextResponse.json({ rows: [], total: 0, page, limit })
      }
      const base = allowedIds
        ? supabase.from('campaign_creators').select('id').in('campaign_id', brandCampaignIds).in('id', allowedIds)
        : supabase.from('campaign_creators').select('id').in('campaign_id', brandCampaignIds)
      const { data: rows } = await base
      allowedIds = (rows ?? []).map((r) => r.id)
    }

    if (allowedIds && allowedIds.length === 0) {
      return NextResponse.json({ rows: [], total: 0, page, limit })
    }

    let query = supabase
      .from('campaign_creators')
      .select('id, campaign_id, creator_id, status, planned_date, posted_at, created_at, updated_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (allowedIds) {query = query.in('id', allowedIds)}
    if (status && VALID_STATUS.has(status)) {query = query.eq('status', status)}

    const { data: rows, count, error } = await query
    if (error) {throw error}

    const campaignIds = [...new Set((rows ?? []).map((r) => r.campaign_id))]
    const creatorIds = [...new Set((rows ?? []).map((r) => r.creator_id))]
    const [{ data: campaigns }, { data: creators }] = await Promise.all([
      campaignIds.length > 0 ? supabase.from('campaigns').select('id, title, brand_id').in('id', campaignIds) : Promise.resolve({ data: [] }),
      creatorIds.length > 0 ? supabase.from('creators').select('id, username, display_name').in('id', creatorIds) : Promise.resolve({ data: [] }),
    ])
    const campaignById = new Map((campaigns ?? []).map((c) => [c.id, c]))
    const creatorById = new Map((creators ?? []).map((c) => [c.id, c]))

    const brandIds = [...new Set((campaigns ?? []).map((c) => c.brand_id))]
    const { data: brands } = brandIds.length > 0 ? await supabase.from('brands').select('id, company_name').in('id', brandIds) : { data: [] }
    const brandById = new Map((brands ?? []).map((b) => [b.id, b]))

    const enriched = (rows ?? []).map((r) => {
      const campaign = campaignById.get(r.campaign_id)
      const creator = creatorById.get(r.creator_id)
      const brand = campaign ? brandById.get(campaign.brand_id) : null
      return {
        ...r,
        campaign_title: campaign?.title ?? null,
        creator_name: creator?.display_name ?? creator?.username ?? null,
        brand_name: brand?.company_name ?? null,
      }
    })

    return NextResponse.json({ rows: enriched, total: count ?? 0, page, limit })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/campaign-creators' })
    return NextResponse.json({ error: 'Failed to fetch workflow rows' }, { status: 500 })
  }
}
