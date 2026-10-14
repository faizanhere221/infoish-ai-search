import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'

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

    let creatorIds = [...new Set(entries.map((e) => e.creator_id))]

    let creators: CreatorSummaryRow[] = []
    const { data: creatorRows } = await supabase
      .from('creators')
      .select('id, username, display_name, profile_photo_url, total_followers, avg_engagement_rate')
      .in('id', creatorIds)
    creators = creatorRows || []

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

    const { data: creator } = await supabase.from('creators').select('id').eq('id', parsed.data.creator_id).single()
    if (!creator) {
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
