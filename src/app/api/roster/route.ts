import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'
import { latestResultByDeliverable, onTimeRate, cpm, type ResultRow, type DeliverableForReport } from '@/lib/reporting'
import { getExcludedCreatorUserIdsList, isCreatorPublic } from '@/lib/creators/visibility'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const AddToRosterSchema = z.object({
  creator_id: z.string().min(1),
  notes: z.string().max(2000).optional().nullable(),
  typical_payout: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  typical_charge: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  currency: z.string().min(3).max(10).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
})

type CreatorSummaryRow = {
  id: string
  username: string
  display_name: string
  profile_photo_url: string | null
  total_followers: number
  avg_engagement_rate: number | null
}

// GET /api/roster — the authenticated brand's saved-creator roster
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'brand' || !callerProfileId) {
      return NextResponse.json({ error: 'Only brands have a roster' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const platform = searchParams.get('platform')
    const search = searchParams.get('search')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    const supabase = createServerSupabase()

    let query = supabase
      .from('saved_creators')
      .select('*', { count: 'exact' })
      .eq('brand_id', callerProfileId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data: entries, error, count } = await query

    if (error) {
      captureError(error, { route: 'GET /api/roster' })
      return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 })
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ roster: [], total: count ?? 0, limit, offset })
    }

    // A deleted/suspended/hidden creator drops off the roster entirely —
    // same "no longer discoverable" rule as the marketplace listing, not
    // the "keep showing Deleted user" rule for an actual engagement record
    // (this is a brand's saved-for-later bookmark, not one).
    const excludedUserIds = await getExcludedCreatorUserIdsList(supabase)
    let creatorIds = [...new Set(entries.map((e) => e.creator_id))]

    let creators: CreatorSummaryRow[] = []
    const { data: creatorRows } = await supabase
      .from('creators')
      .select('id, username, display_name, profile_photo_url, total_followers, avg_engagement_rate')
      .in('id', creatorIds)
      .eq('hidden_from_marketplace', false)
      .not('user_id', 'in', excludedUserIds)
    creators = creatorRows || []
    creatorIds = creators.map((c) => c.id)

    if (search) {
      const q = search.toLowerCase()
      const matchingIds = new Set(
        creators.filter((c) => c.display_name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q)).map((c) => c.id)
      )
      creatorIds = creatorIds.filter((id) => matchingIds.has(id))
    }

    type PlatformRow = { creator_id: string; platform: string; followers: number | null; avg_views: number | null }
    const { data: platformRows } = await supabase
      .from('creator_platforms')
      .select('creator_id, platform, followers, avg_views')
      .in('creator_id', creatorIds)

    // Primary platform (most followers) per creator, for the platform/avg-views columns
    const primaryByCreator: Record<string, PlatformRow> = {}
    for (const row of (platformRows || []) as PlatformRow[]) {
      const current = primaryByCreator[row.creator_id]
      if (!current || (row.followers ?? 0) > (current.followers ?? 0)) {
        primaryByCreator[row.creator_id] = row
      }
    }

    let filteredEntries = entries.filter((e) => creatorIds.includes(e.creator_id))
    if (platform) {
      filteredEntries = filteredEntries.filter((e) => primaryByCreator[e.creator_id]?.platform === platform)
    }

    // Performance history — this brand's own history with each creator
    // (campaigns done, avg views delivered, avg CPM, on-time %), pulled from
    // results. One batch of queries for the whole page, not N+1.
    const { data: brandCampaigns } = await supabase.from('campaigns').select('id').eq('brand_id', callerProfileId)
    const brandCampaignIds = (brandCampaigns || []).map((c) => c.id)

    const { data: historyRows } = brandCampaignIds.length > 0 && creatorIds.length > 0
      ? await supabase
          .from('campaign_creators')
          .select('id, creator_id, status, charge_amount')
          .in('campaign_id', brandCampaignIds)
          .in('creator_id', creatorIds)
      : { data: [] }

    const historyRowIds = (historyRows || []).map((r) => r.id)
    const { data: historyDeliverables } = historyRowIds.length > 0
      ? await supabase
          .from('creator_deliverables')
          .select('id, campaign_creator_id, status, posted_at, publish_due')
          .in('campaign_creator_id', historyRowIds)
      : { data: [] as (DeliverableForReport & { campaign_creator_id: string })[] }

    const { data: historyResults } = (historyDeliverables || []).length > 0
      ? await supabase
          .from('deliverable_results')
          .select('deliverable_id, captured_at, views, likes, comments, shares, clicks, saves')
          .in('deliverable_id', (historyDeliverables || []).map((d) => d.id))
      : { data: [] as ResultRow[] }

    const latestResultByDel = latestResultByDeliverable((historyResults || []) as ResultRow[])
    const viewsByRow: Record<string, number> = {}
    const deliverablesByRow = new Map<string, DeliverableForReport[]>()
    for (const d of historyDeliverables || []) {
      const r = latestResultByDel.get(d.id)
      if (r) {viewsByRow[d.campaign_creator_id] = (viewsByRow[d.campaign_creator_id] || 0) + r.views}
      const list = deliverablesByRow.get(d.campaign_creator_id) || []
      list.push(d)
      deliverablesByRow.set(d.campaign_creator_id, list)
    }

    const performanceByCreator: Record<string, { campaigns_done: number; avg_views: number | null; avg_cpm: number | null; on_time_pct: number | null }> = {}
    for (const creatorId of creatorIds) {
      const rowsForCreator = (historyRows || []).filter((r) => r.creator_id === creatorId)
      if (rowsForCreator.length === 0) {
        performanceByCreator[creatorId] = { campaigns_done: 0, avg_views: null, avg_cpm: null, on_time_pct: null }
        continue
      }
      const campaignsDone = rowsForCreator.filter((r) => r.status === 'completed').length
      const totalViews = rowsForCreator.reduce((sum, r) => sum + (viewsByRow[r.id] || 0), 0)
      const totalCharge = rowsForCreator.reduce((sum, r) => sum + (r.charge_amount || 0), 0)
      const allDeliverables = rowsForCreator.flatMap((r) => deliverablesByRow.get(r.id) || [])
      performanceByCreator[creatorId] = {
        campaigns_done: campaignsDone,
        avg_views: rowsForCreator.length > 0 ? Math.round(totalViews / rowsForCreator.length) : null,
        avg_cpm: cpm(totalCharge, totalViews),
        on_time_pct: onTimeRate(allDeliverables),
      }
    }

    const roster = filteredEntries.map((entry) => {
      const creator = creators.find((c) => c.id === entry.creator_id) || null
      const primaryPlatform = primaryByCreator[entry.creator_id]
      return {
        ...entry,
        creator: creator ? {
          ...creator,
          primary_platform: primaryPlatform?.platform ?? null,
          avg_views: primaryPlatform?.avg_views ?? null,
        } : null,
        performance: performanceByCreator[entry.creator_id] || { campaigns_done: 0, avg_views: null, avg_cpm: null, on_time_pct: null },
      }
    })

    return NextResponse.json({ roster, total: count ?? roster.length, limit, offset })
  } catch (error) {
    captureError(error, { route: 'GET /api/roster' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/roster — save a creator to the roster
export async function POST(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'brand' || !callerProfileId) {
      return NextResponse.json({ error: 'Only brands have a roster' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = AddToRosterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: creator } = await supabase
      .from('creators')
      .select('id, user_id, hidden_from_marketplace')
      .eq('id', parsed.data.creator_id)
      .single()
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }
    const { data: ownerUser } = await supabase.from('users').select('deleted_at, is_active').eq('id', creator.user_id).single()
    if (!isCreatorPublic(ownerUser, creator)) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const { data: entry, error } = await supabase
      .from('saved_creators')
      .insert({
        brand_id: callerProfileId,
        creator_id: parsed.data.creator_id,
        notes: parsed.data.notes || null,
        typical_payout: parsed.data.typical_payout ?? null,
        typical_charge: parsed.data.typical_charge ?? null,
        currency: parsed.data.currency || 'USD',
        tags: parsed.data.tags || [],
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This creator is already on your roster' }, { status: 409 })
      }
      captureError(error, { route: 'POST /api/roster' })
      return NextResponse.json({ error: 'Failed to add to roster' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Added to roster', roster_entry: entry }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST /api/roster' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
