import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const VALID_STATUS = new Set(['draft', 'sent', 'signed_by_creator', 'signed_by_brand', 'fully_signed', 'void'])
const AWAITING_SIGNATURE = ['sent', 'signed_by_creator', 'signed_by_brand']

// GET /api/admin/contracts — every contract version across every brand.
// Filters: status, or `filter=awaiting_signature` (the dashboard tile's
// convenience param, wired up in step 1), or a free-text `search`.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20))
    const status = searchParams.get('status') ?? ''
    const filter = searchParams.get('filter') ?? ''
    const search = searchParams.get('search')?.trim() ?? ''

    const supabase = createServerSupabase()

    let allowedCcIds: string[] | null = null
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
      const campaignIds = [...new Set([...(matchedCampaigns ?? []).map((c) => c.id), ...brandCampaignIds])]
      const creatorIds = (matchedCreators ?? []).map((c) => c.id)

      let rowQuery = supabase.from('campaign_creators').select('id')
      if (campaignIds.length > 0 && creatorIds.length > 0) {
        rowQuery = rowQuery.or(`campaign_id.in.(${campaignIds.join(',')}),creator_id.in.(${creatorIds.join(',')})`)
      } else if (campaignIds.length > 0) {
        rowQuery = rowQuery.in('campaign_id', campaignIds)
      } else if (creatorIds.length > 0) {
        rowQuery = rowQuery.in('creator_id', creatorIds)
      } else {
        return NextResponse.json({ contracts: [], total: 0, page, limit })
      }
      const { data: rows } = await rowQuery
      allowedCcIds = (rows ?? []).map((r) => r.id)
      if (allowedCcIds.length === 0) {
        return NextResponse.json({ contracts: [], total: 0, page, limit })
      }
    }

    let query = supabase
      .from('campaign_contracts')
      .select('id, campaign_creator_id, version, status, payment_terms_days, kill_fee_percent, created_at, sent_at, creator_signed_at, brand_signed_at, voided_reason', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (allowedCcIds) {query = query.in('campaign_creator_id', allowedCcIds)}
    if (filter === 'awaiting_signature') {query = query.in('status', AWAITING_SIGNATURE)}
    else if (status && VALID_STATUS.has(status)) {query = query.eq('status', status)}

    const { data: contracts, count, error } = await query
    if (error) {throw error}

    const ccIds = [...new Set((contracts ?? []).map((c) => c.campaign_creator_id))]
    const { data: ccRows } = ccIds.length > 0
      ? await supabase.from('campaign_creators').select('id, campaign_id, creator_id').in('id', ccIds)
      : { data: [] }
    const ccById = new Map((ccRows ?? []).map((r) => [r.id, r]))

    const campaignIds2 = [...new Set((ccRows ?? []).map((r) => r.campaign_id))]
    const creatorIds2 = [...new Set((ccRows ?? []).map((r) => r.creator_id))]
    const [{ data: campaigns }, { data: creators }] = await Promise.all([
      campaignIds2.length > 0 ? supabase.from('campaigns').select('id, title, brand_id').in('id', campaignIds2) : Promise.resolve({ data: [] }),
      creatorIds2.length > 0 ? supabase.from('creators').select('id, username, display_name').in('id', creatorIds2) : Promise.resolve({ data: [] }),
    ])
    const campaignById = new Map((campaigns ?? []).map((c) => [c.id, c]))
    const creatorById = new Map((creators ?? []).map((c) => [c.id, c]))
    const brandIds = [...new Set((campaigns ?? []).map((c) => c.brand_id))]
    const { data: brands } = brandIds.length > 0 ? await supabase.from('brands').select('id, company_name').in('id', brandIds) : { data: [] }
    const brandById = new Map((brands ?? []).map((b) => [b.id, b]))

    const enriched = (contracts ?? []).map((c) => {
      const cc = ccById.get(c.campaign_creator_id)
      const campaign = cc ? campaignById.get(cc.campaign_id) : null
      const creator = cc ? creatorById.get(cc.creator_id) : null
      const brand = campaign ? brandById.get(campaign.brand_id) : null
      return {
        ...c,
        campaign_title: campaign?.title ?? null,
        creator_name: creator?.display_name ?? creator?.username ?? null,
        brand_name: brand?.company_name ?? null,
      }
    })

    return NextResponse.json({ contracts: enriched, total: count ?? 0, page, limit })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/contracts' })
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}
