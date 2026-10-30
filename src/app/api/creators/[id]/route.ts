import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'
import { isCreatorPublic } from '@/lib/creators/visibility'
import { revalidateCreatorPublicSurfaces } from '@/lib/creators/revalidate'
import { getVerifiedUserId } from '@/lib/verified-user'
import { cleanNiches } from '@/utils/constants'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const UpdateCreatorSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional().nullable(),
  country: z.string().max(2).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  // Unknown or retired niches are dropped, not rejected, so a profile still
  // holding an old niche saves without an error.
  niches: z.array(z.string()).optional().transform((v) => (v === undefined ? undefined : cleanNiches(v))),
  languages: z.array(z.string()).optional(),
  is_available: z.boolean().optional(),
  min_budget: z.number().nonnegative().optional().nullable(),
  response_time: z.string().max(50).optional().nullable(),
  profile_photo_url: z.string().url().max(500).optional().nullable(),
  availability_status: z.enum(['open', 'limited', 'booked']).optional(),
  min_lead_days: z.number().int().min(0).max(365).optional(),
})

// GET - Get creator by ID or username
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    // Check if it's a UUID or username
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    let creator = null
    let foundByUsername = false

    if (isUUID) {
      // Try user_id first
      const { data: byUserId } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', id)
        .single()
      
      if (byUserId) {
        creator = byUserId
      } else {
        // Try id
        const { data: byId } = await supabase
          .from('creators')
          .select('*')
          .eq('id', id)
          .single()
        
        if (byId) {
          creator = byId
        }
      }
    } else {
      // Try username
      const { data: byUsername } = await supabase
        .from('creators')
        .select('*')
        .eq('username', id.toLowerCase())
        .single()

      if (byUsername) {
        creator = byUsername
        foundByUsername = true
      }
    }

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Looking this up by username is always the public profile path (the
    // only caller that ever resolves this way) — a deleted, suspended, or
    // admin-hidden creator 404s here exactly like a nonexistent username
    // would. Lookups by id/user_id are internal (settings viewing its own
    // profile, an existing campaign offer, a legacy-deal prefill) and must
    // keep resolving after deletion — same "Deleted user" rule as every
    // other brand-side record, not a public surface.
    if (foundByUsername) {
      const { data: ownerUser } = await supabase
        .from('users')
        .select('deleted_at, is_active')
        .eq('id', creator.user_id)
        .single()
      if (!isCreatorPublic(ownerUser, creator)) {
        return NextResponse.json(
          { error: 'Creator not found' },
          { status: 404 }
        )
      }
    }

    // Fetch platforms separately
    const { data: platforms } = await supabase
      .from('creator_platforms')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: true })

    // Fetch services separately. Public callers only see active services.
    // The owner (verified JWT, since this GET is a public middleware route)
    // can pass ?include_inactive=1 — settings and the onboarding wizard need
    // the full list, because the services PUT replaces it: loading only
    // active rows made a paused service vanish on reload and get deleted on
    // the next save.
    const wantsInactive = request.nextUrl.searchParams.get('include_inactive') === '1'
    const includeInactive = wantsInactive && (await getVerifiedUserId(request)) === creator.user_id

    let servicesQuery = supabase
      .from('creator_services')
      .select('*')
      .eq('creator_id', creator.id)
    if (!includeInactive) {servicesQuery = servicesQuery.eq('is_active', true)}
    const { data: services } = await servicesQuery.order('created_at', { ascending: true })

    // Combine the data
    const creatorWithRelations = {
      ...creator,
      creator_platforms: platforms || [],
      creator_services: services || [],
    }

    return NextResponse.json({ creator: creatorWithRelations })

  } catch (error) {
    console.error('Error fetching creator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update creator profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    // Validate and whitelist input fields
    const body = await request.json()
    const parsed = UpdateCreatorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Verify ownership: the caller's user_id must match the creator's user_id
    const callerUserId = request.headers.get('x-user-id')
    const { data: existing } = await supabase
      .from('creators')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (existing.user_id !== callerUserId) {
      return NextResponse.json(
        { error: 'You are not authorized to update this profile' },
        { status: 403 }
      )
    }

    const { data: creator, error } = await supabase
      .from('creators')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating creator:', error)
      return NextResponse.json(
        { error: 'Failed to update creator' },
        { status: 500 }
      )
    }

    revalidateCreatorPublicSurfaces(creator.username)

    return NextResponse.json({
      message: 'Creator updated successfully',
      creator,
    })

  } catch (error) {
    console.error('Error updating creator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}