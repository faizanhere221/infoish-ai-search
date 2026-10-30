import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'
import { revalidateCreatorPublicSurfaces } from '@/lib/creators/revalidate'
import { captureError } from '@/lib/error-tracking'
import { normalizeProfileUrl, parseFollowerCount } from '@/lib/creators/platform-input'
import { PLATFORM_IDS } from '@/utils/constants'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const PlatformSchema = z.object({
  platform: z.enum(PLATFORM_IDS),
  // Kept as typed (with or without "@"), only trimmed — trailing spaces
  // from copy-paste were being stored and shown on the profile.
  platform_username: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v.trim() : '') || null)
    .refine((v) => v === null || v.length <= 100, 'Username must be 100 characters or fewer'),
  // "x.com/handle" gets https://; javascript: and other schemes are rejected.
  platform_url: z
    .unknown()
    .optional()
    .transform((v, ctx) => {
      const result = normalizeProfileUrl(v)
      if (!result.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error })
        return z.NEVER
      }
      return result.url
    }),
  // Accepts 5076, "5,076", "5k", "1.2M" — the same parser the settings page uses.
  followers: z
    .unknown()
    .optional()
    .transform((v, ctx) => {
      const count = parseFollowerCount(v)
      if (count === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `"${String(v)}" is not a follower count` })
        return z.NEVER
      }
      return count
    }),
})

const UpdatePlatformsSchema = z.object({
  platforms: z.array(PlatformSchema).max(PLATFORM_IDS.length),
})

// "twitter: Profile URL must start with http:// or https://" — a message the
// settings page can show as-is instead of a bare "Invalid request body".
function describeIssue(body: unknown, error: z.ZodError): string {
  const issue = error.issues[0]
  if (!issue) {return 'Invalid request body'}
  const index = typeof issue.path[1] === 'number' ? issue.path[1] : null
  const rows = (body as { platforms?: { platform?: unknown }[] } | null)?.platforms
  const platform = index !== null && Array.isArray(rows) ? rows[index]?.platform : null
  return platform ? `${String(platform)}: ${issue.message}` : issue.message
}

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
        { error: describeIssue(body, parsed.error), details: parsed.error.flatten().fieldErrors },
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
      if (seen.has(p.platform)) {duplicates.add(p.platform)}
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
      .select('user_id, username')
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
    let savedPlatforms: Record<string, unknown>[] = []
    if (platforms.length > 0) {
      const platformRecords = platforms.map((p) => ({
        creator_id: id,
        platform: p.platform,
        platform_username: p.platform_username || null,
        platform_url: p.platform_url || null,
        followers: p.followers || 0,
        // No DB trigger maintains updated_at, so set it here — otherwise an
        // edit is indistinguishable from the signup-time row when debugging.
        updated_at: new Date().toISOString(),
      }))

      const { data, error } = await supabase
        .from('creator_platforms')
        .upsert(platformRecords, { onConflict: 'creator_id,platform' })
        .select()

      if (error) {
        captureError(error, { route: 'PUT /api/creators/[id]/platforms', step: 'upsert', creatorId: id })
        return NextResponse.json(
          { error: 'Failed to save platforms' },
          { status: 500 }
        )
      }

      savedPlatforms = data || []
    }

    // Every step below must succeed or the request fails. Previously these
    // errors were ignored, so a partial failure still returned 200 and the
    // settings page showed "Saved!" for data that never landed.
    const keepPlatformIds = new Set(platforms.map((p) => p.platform))
    const { data: existingRows, error: existingError } = await supabase
      .from('creator_platforms')
      .select('id, platform')
      .eq('creator_id', id)

    if (existingError) {
      captureError(existingError, { route: 'PUT /api/creators/[id]/platforms', step: 'select', creatorId: id })
      return NextResponse.json({ error: 'Failed to save platforms' }, { status: 500 })
    }

    const idsToRemove = (existingRows || [])
      .filter((row) => !keepPlatformIds.has(row.platform))
      .map((row) => row.id)

    if (idsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('creator_platforms')
        .delete()
        .in('id', idsToRemove)
        .eq('creator_id', id)
      if (deleteError) {
        captureError(deleteError, { route: 'PUT /api/creators/[id]/platforms', step: 'delete', creatorId: id })
        return NextResponse.json({ error: 'Failed to remove old platforms' }, { status: 500 })
      }
    }

    // Update total followers on creator profile
    const totalFollowers = platforms.reduce((sum, p) => sum + (p.followers || 0), 0)
    const { error: totalError } = await supabase
      .from('creators')
      .update({ total_followers: totalFollowers })
      .eq('id', id)

    if (totalError) {
      captureError(totalError, { route: 'PUT /api/creators/[id]/platforms', step: 'total_followers', creatorId: id })
      return NextResponse.json({ error: 'Platforms saved, but follower total failed to update' }, { status: 500 })
    }

    revalidateCreatorPublicSurfaces(creator.username)

    return NextResponse.json({
      message: 'Platforms updated successfully',
      platforms: savedPlatforms,
    })

  } catch (error) {
    captureError(error, { route: 'PUT /api/creators/[id]/platforms' })
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
