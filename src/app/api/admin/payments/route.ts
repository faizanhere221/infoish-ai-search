import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const VALID_STATUS = new Set(['scheduled', 'due', 'marked_paid', 'confirmed', 'disputed', 'cancelled'])

// GET /api/admin/payments — list across every brand/creator pairing, with
// filters (status, currency, overdue, campaign, brand, creator). Joined
// manually in application code (campaign_creators -> campaigns -> brands,
// -> creators), not via Supabase's nested select(), per this codebase's
// convention.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20))
    const status = searchParams.get('status') ?? ''
    const currency = searchParams.get('currency') ?? ''
    const overdue = searchParams.get('overdue') === 'true'
    const campaignId = searchParams.get('campaign_id') ?? ''
    const brandId = searchParams.get('brand_id') ?? ''
    const creatorId = searchParams.get('creator_id') ?? ''
    const search = searchParams.get('search')?.trim() ?? ''

    const supabase = createServerSupabase()

    // Resolve a campaign_creator_id allowlist when campaign/brand/creator is
    // filtered, or a free-text search is given — creator_payments has no
    // direct column for any of these. `search` matches campaign title,
    // creator name, or brand name and takes priority over the explicit id
    // filters (a UI convenience; the id filters stay for direct links from
    // the dashboard/other admin pages).
    let campaignCreatorIds: string[] | null = null

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
      const allCampaignIds = [...new Set([...(matchedCampaigns ?? []).map((c) => c.id), ...brandCampaignIds])]
      const creatorIdsFromSearch = (matchedCreators ?? []).map((c) => c.id)

      let rowQuery = supabase.from('campaign_creators').select('id')
      if (allCampaignIds.length > 0 && creatorIdsFromSearch.length > 0) {
        rowQuery = rowQuery.or(`campaign_id.in.(${allCampaignIds.join(',')}),creator_id.in.(${creatorIdsFromSearch.join(',')})`)
      } else if (allCampaignIds.length > 0) {
        rowQuery = rowQuery.in('campaign_id', allCampaignIds)
      } else if (creatorIdsFromSearch.length > 0) {
        rowQuery = rowQuery.in('creator_id', creatorIdsFromSearch)
      } else {
        return NextResponse.json({ payments: [], total: 0, page, limit })
      }
      const { data: rows } = await rowQuery
      campaignCreatorIds = (rows ?? []).map((r) => r.id)
    } else if (campaignId || brandId || creatorId) {
      let rowQuery = supabase.from('campaign_creators').select('id, campaign_id, creator_id')
      if (campaignId) {rowQuery = rowQuery.eq('campaign_id', campaignId)}
      if (creatorId) {rowQuery = rowQuery.eq('creator_id', creatorId)}
      const { data: rows } = await rowQuery

      let filtered = rows ?? []
      if (brandId) {
        const campaignIds = [...new Set(filtered.map((r) => r.campaign_id))]
        const { data: campaigns } = campaignIds.length > 0
          ? await supabase.from('campaigns').select('id').eq('brand_id', brandId).in('id', campaignIds)
          : { data: [] }
        const allowedCampaignIds = new Set((campaigns ?? []).map((c) => c.id))
        filtered = filtered.filter((r) => allowedCampaignIds.has(r.campaign_id))
      }
      campaignCreatorIds = filtered.map((r) => r.id)
    }

    let query = supabase
      .from('creator_payments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (campaignCreatorIds) {
      if (campaignCreatorIds.length === 0) {
        return NextResponse.json({ payments: [], total: 0, page, limit })
      }
      query = query.in('campaign_creator_id', campaignCreatorIds)
    }
    if (status && VALID_STATUS.has(status)) {query = query.eq('status', status)}
    if (currency) {query = query.eq('currency', currency)}
    if (overdue) {
      const today = new Date().toISOString().slice(0, 10)
      query = query.eq('status', 'due').lt('due_date', today)
    }

    const { data: payments, count, error } = await query
    if (error) {throw error}

    // Enrich with campaign/brand/creator display names.
    const ccIds = [...new Set((payments ?? []).map((p) => p.campaign_creator_id))]
    const { data: ccRows } = ccIds.length > 0
      ? await supabase.from('campaign_creators').select('id, campaign_id, creator_id').in('id', ccIds)
      : { data: [] }
    const ccById = new Map((ccRows ?? []).map((r) => [r.id, r]))

    const campaignIds = [...new Set((ccRows ?? []).map((r) => r.campaign_id))]
    const { data: campaigns } = campaignIds.length > 0
      ? await supabase.from('campaigns').select('id, title, brand_id').in('id', campaignIds)
      : { data: [] }
    const campaignById = new Map((campaigns ?? []).map((c) => [c.id, c]))

    const creatorIds = [...new Set((ccRows ?? []).map((r) => r.creator_id))]
    const brandIds = [...new Set((campaigns ?? []).map((c) => c.brand_id))]
    const [{ data: creators }, { data: brands }] = await Promise.all([
      creatorIds.length > 0 ? supabase.from('creators').select('id, username, display_name').in('id', creatorIds) : Promise.resolve({ data: [] }),
      brandIds.length > 0 ? supabase.from('brands').select('id, company_name').in('id', brandIds) : Promise.resolve({ data: [] }),
    ])
    const creatorById = new Map((creators ?? []).map((c) => [c.id, c]))
    const brandById = new Map((brands ?? []).map((b) => [b.id, b]))

    const enriched = (payments ?? []).map((p) => {
      const cc = ccById.get(p.campaign_creator_id)
      const campaign = cc ? campaignById.get(cc.campaign_id) : null
      const creator = cc ? creatorById.get(cc.creator_id) : null
      const brand = campaign ? brandById.get(campaign.brand_id) : null
      return {
        ...p,
        campaign_title: campaign?.title ?? null,
        creator_name: creator?.display_name ?? creator?.username ?? null,
        brand_name: brand?.company_name ?? null,
        is_overdue: p.status === 'due' && p.due_date && p.due_date < new Date().toISOString().slice(0, 10),
      }
    })

    return NextResponse.json({ payments: enriched, total: count ?? 0, page, limit })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/payments' })
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
