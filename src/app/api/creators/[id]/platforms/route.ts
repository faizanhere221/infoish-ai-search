import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'

const PLATFORM_IDS = [
  'youtube', 'twitter', 'linkedin', 'instagram', 'tiktok', 'twitch',
  'blog', 'newsletter', 'podcast', 'github', 'discord', 'other',
] as const

const PlatformSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
  platform_username: z.string().max(100).optional().nullable(),
  platform_url: z.string().max(2000).optional().nullable(),
  followers: z.number().int().nonnegative().max(1_000_000_000).optional(),
})

const UpdatePlatformsSchema = z.object({
  platforms: z.array(PlatformSchema).max(PLATFORM_IDS.length),
})

// PUT - Update creator platforms
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const parsed = UpdatePlatformsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { platforms } = parsed.data

    // A creator can only have one row per platform type (DB has a UNIQUE
    // constraint on creator_id+platform) — catch duplicates here with a clear
    // error instead of letting the DB write fail after data has been deleted.
    const seen = new Set<string>()
    const duplicates = new Set<string>()
    for (const p of platforms) {
      if (seen.has(p.platform)) duplicates.add(p.platform)
      seen.add(p.platform)
    }
    if (duplicates.size > 0) {
      return NextResponse.json(
        { error: `Each platform can only be added once. Duplicate: ${[...duplicates].join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Verify ownership: the caller's user_id must match the creator's user_id
    const callerUserId = request.headers.get('x-user-id')
    const { data: creator } = await supabase
      .from('creators')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (creator.user_id !== callerUserId) {
      return NextResponse.json(
        { error: 'You are not authorized to update these platforms' },
        { status: 403 }
      )
    }

    // Write new/updated platforms FIRST (upsert), then remove any platforms
    // that are no longer present. This order means a failed write never loses
    // existing data — the old delete-then-insert approach could wipe every
    // platform if the insert failed after the delete had already succeeded.
    let savedPlatforms: any[] = []
    if (platforms.length > 0) {
      const platformRecords = platforms.map((p) => ({
        creator_id: id,
        platform: p.platform,
        platform_username: p.platform_username || null,
        platform_url: p.platform_url || null,
        followers: p.followers || 0,
      }))

      const { data, error } = await supabase
        .from('creator_platforms')
        .upsert(platformRecords, { onConflict: 'creator_id,platform' })
        .select()

      if (error) {
        console.error('Error saving platforms:', error.message)
        return NextResponse.json(
          { error: 'Failed to save platforms' },
          { status: 500 }
        )
      }

      savedPlatforms = data || []
    }

    const keepPlatformIds = new Set(platforms.map((p) => p.platform))
    const { data: existingRows } = await supabase
      .from('creator_platforms')
      .select('id, platform')
      .eq('creator_id', id)

    const idsToRemove = (existingRows || [])
      .filter((row) => !keepPlatformIds.has(row.platform))
      .map((row) => row.id)

    if (idsToRemove.length > 0) {
      await supabase.from('creator_platforms').delete().in('id', idsToRemove)
    }

    // Update total followers on creator profile
    const totalFollowers = platforms.reduce((sum, p) => sum + (p.followers || 0), 0)
    await supabase
      .from('creators')
      .update({ total_followers: totalFollowers })
      .eq('id', id)

    return NextResponse.json({
      message: 'Platforms updated successfully',
      platforms: savedPlatforms,
    })

  } catch (error) {
    console.error('Error updating platforms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - List platforms for a creator
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { data: platforms, error } = await supabase
      .from('creator_platforms')
      .select('*')
      .eq('creator_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching platforms:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch platforms' },
        { status: 500 }
      )
    }

    return NextResponse.json({ platforms: platforms || [] })

  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a single platform by id (?platformId=)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const platformId = request.nextUrl.searchParams.get('platformId')

    if (!platformId) {
      return NextResponse.json({ error: 'platformId is required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const callerUserId = request.headers.get('x-user-id')
    const { data: creator } = await supabase
      .from('creators')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (creator.user_id !== callerUserId) {
      return NextResponse.json(
        { error: 'You are not authorized to modify these platforms' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('creator_platforms')
      .delete()
      .eq('id', platformId)
      .eq('creator_id', id)

    if (error) {
      console.error('Error deleting platform:', error.message)
      return NextResponse.json({ error: 'Failed to delete platform' }, { status: 500 })
    }

    const { data: remaining } = await supabase
      .from('creator_platforms')
      .select('followers')
      .eq('creator_id', id)

    const totalFollowers = (remaining || []).reduce((sum, p) => sum + (p.followers || 0), 0)
    await supabase.from('creators').update({ total_followers: totalFollowers }).eq('id', id)

    return NextResponse.json({ message: 'Platform deleted successfully' })

  } catch (error) {
    console.error('Error deleting platform:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
