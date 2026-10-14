import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'
import { CAMPAIGN_CREATOR_STATUSES } from '@/types/campaigns'

interface RouteParams {
  params: { id: string }
}

const STATUS_VALUES = CAMPAIGN_CREATOR_STATUSES as unknown as [string, ...string[]]

const AddCreatorSchema = z.object({
  creator_id: z.string().min(1),
  status: z.enum(STATUS_VALUES).optional(),
  planned_date: z.string().optional().nullable(),
  payout_amount: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  charge_amount: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  currency: z.string().min(3).max(10).optional(),
  brand_notes: z.string().max(2000).optional().nullable(),
})

type CreatorSummaryRow = {
  id: string
  username: string
  display_name: string
  profile_photo_url: string | null
  total_followers: number
}

// Attaches `creator` (avatar/name/primary platform) and `campaign` (title,
// client_name) joins to a list of campaign_creators rows. `includeClientName`
// is false for creator-facing responses — client_name must never reach a
// creator even nested inside a joined campaign object.
async function attachJoins(
  supabase: ReturnType<typeof createServerSupabase>,
  rows: { creator_id: string }[],
  campaign: { id: string; title: string; client_name?: string | null },
  includeClientName: boolean
) {
  const creatorIds = [...new Set(rows.map((r) => r.creator_id))]
  let creators: CreatorSummaryRow[] = []
  let platformByCreator: Record<string, string> = {}

  if (creatorIds.length > 0) {
    const { data } = await supabase
      .from('creators')
      .select('id, username, display_name, profile_photo_url, total_followers')
      .in('id', creatorIds)
    creators = data || []

    const { data: platformRows } = await supabase
      .from('creator_platforms')
      .select('creator_id, platform, followers')
      .in('creator_id', creatorIds)
    type PlatformRow = { creator_id: string; platform: string; followers: number | null }
    platformByCreator = ((platformRows || []) as PlatformRow[]).reduce<Record<string, string>>((acc, row) => {
      const currentPlatform = acc[row.creator_id]
      if (!currentPlatform) {
        acc[row.creator_id] = row.platform
      } else {
        const currentFollowers = (platformRows as PlatformRow[]).find(
          (r) => r.creator_id === row.creator_id && r.platform === currentPlatform
        )?.followers ?? 0
        if ((row.followers ?? 0) > currentFollowers) {acc[row.creator_id] = row.platform}
      }
      return acc
    }, {})
  }

  const campaignSummary = includeClientName
    ? { id: campaign.id, title: campaign.title, client_name: campaign.client_name ?? null }
    : { id: campaign.id, title: campaign.title }

  return { creators, platformByCreator, campaignSummary }
}

// GET /api/campaigns/[id]/creators
// Brand owner: every row, full fields (incl. charge_amount, brand_notes,
// client_name via the joined campaign). A creator: only their own row, with
// charge_amount/brand_notes/client_name stripped server-side — never relies
// on the frontend to hide them.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id, title, client_name')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const isOwner = callerUserType === 'brand' && callerProfileId === campaign.brand_id

    if (isOwner) {
      const { data: rows, error } = await supabase
        .from('campaign_creators')
        .select('*')
        .eq('campaign_id', id)
        .order('created_at', { ascending: true })

      if (error) {
        captureError(error, { route: 'GET /api/campaigns/[id]/creators' })
        return NextResponse.json({ error: 'Failed to fetch campaign creators' }, { status: 500 })
      }

      const { creators, platformByCreator, campaignSummary } = await attachJoins(supabase, rows || [], campaign, true)

      const withRelations = (rows || []).map((row) => {
        const creator = creators.find((c) => c.id === row.creator_id) || null
        return {
          ...row,
          creator: creator ? { ...creator, primary_platform: platformByCreator[creator.id] ?? null } : null,
          campaign: campaignSummary,
        }
      })

      return NextResponse.json({ campaign_creators: withRelations })
    }

    if (callerUserType === 'creator' && callerProfileId) {
      const { data: rows, error } = await supabase
        .from('campaign_creators')
        .select('id, campaign_id, status, planned_date, posted_at, posted_url, payout_amount, currency, creator_id')
        .eq('campaign_id', id)
        .eq('creator_id', callerProfileId)

      if (error) {
        captureError(error, { route: 'GET /api/campaigns/[id]/creators' })
        return NextResponse.json({ error: 'Failed to fetch campaign creators' }, { status: 500 })
      }

      const { campaignSummary } = await attachJoins(supabase, rows || [], campaign, false)

      const { data: brand } = await supabase
        .from('brands')
        .select('id, company_name, logo_url, contact_name, industry')
        .eq('id', campaign.brand_id)
        .single()

      // Explicit field list (not a spread of `row`) so a future column added
      // to campaign_creators can't silently leak to creators by default.
      const withRelations = (rows || []).map((row) => ({
        id: row.id,
        campaign_id: row.campaign_id,
        status: row.status,
        planned_date: row.planned_date,
        posted_at: row.posted_at,
        posted_url: row.posted_url,
        payout_amount: row.payout_amount,
        currency: row.currency,
        campaign: campaignSummary,
        brand: brand || null,
      }))

      return NextResponse.json({ campaign_creators: withRelations })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaigns/[id]/creators' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaigns/[id]/creators — add a creator directly to the tracker
// (brand owner only). Prefills nothing itself; the frontend fills
// payout/charge from the roster's typical rates before submitting.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = AddCreatorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'You are not authorized to manage this campaign' }, { status: 403 })
    }

    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('id', parsed.data.creator_id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const { data: row, error } = await supabase
      .from('campaign_creators')
      .insert({
        campaign_id: id,
        creator_id: parsed.data.creator_id,
        status: parsed.data.status || 'shortlisted',
        planned_date: parsed.data.planned_date || null,
        payout_amount: parsed.data.payout_amount ?? null,
        charge_amount: parsed.data.charge_amount ?? null,
        currency: parsed.data.currency || 'USD',
        brand_notes: parsed.data.brand_notes || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This creator is already on the tracker for this campaign' }, { status: 409 })
      }
      captureError(error, { route: 'POST /api/campaigns/[id]/creators' })
      return NextResponse.json({ error: 'Failed to add creator' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Creator added', campaign_creator: row }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST /api/campaigns/[id]/creators' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
