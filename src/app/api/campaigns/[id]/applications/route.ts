import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { createNotification, getUserIdFromBrand } from '@/lib/notifications'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

const SubmitApplicationSchema = z.object({
  proposed_rate: z.number().int().nonnegative().max(1_000_000_000).optional().nullable(),
  cover_message: z.string().max(5000).optional().nullable(),
  pitch: z.string().max(5000).optional().nullable(),
})

// GET /api/campaigns/[id]/applications - List applications (campaign owner only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'You are not authorized to view these applications' }, { status: 403 })
    }

    const { data: applications, error } = await supabase
      .from('campaign_applications')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ applications: [] })
    }

    const creatorIds = [...new Set(applications.map((a) => a.creator_id).filter(Boolean))]

    const [{ data: creators }, { data: platforms }] = await Promise.all([
      supabase
        .from('creators')
        .select('id, username, display_name, profile_photo_url, bio, country, niches, total_followers')
        .in('id', creatorIds),
      supabase
        .from('creator_platforms')
        .select('creator_id, platform, followers')
        .in('creator_id', creatorIds),
    ])

    const applicationsWithRelations = applications.map((application) => {
      const creator = creators?.find((c) => c.id === application.creator_id)
      return {
        ...application,
        creator: creator
          ? {
              ...creator,
              platforms: (platforms || [])
                .filter((p) => p.creator_id === creator.id)
                .map((p) => ({ platform: p.platform, followers: p.followers })),
            }
          : null,
      }
    })

    return NextResponse.json({ applications: applicationsWithRelations })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaigns/[id]/applications - Submit application (creators only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators can apply to campaigns' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = SubmitApplicationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'published') {
      return NextResponse.json(
        { error: 'This campaign is not currently accepting applications' },
        { status: 400 }
      )
    }

    if (campaign.application_deadline && new Date(campaign.application_deadline) < new Date()) {
      return NextResponse.json({ error: 'The application deadline for this campaign has passed' }, { status: 400 })
    }

    const { proposed_rate, cover_message, pitch } = parsed.data

    const { data: application, error } = await supabase
      .from('campaign_applications')
      .insert({
        campaign_id: id,
        creator_id: callerProfileId,
        proposed_rate: proposed_rate ?? null,
        cover_message: cover_message || null,
        pitch: pitch || null,
        status: 'submitted',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // unique_violation on (campaign_id, creator_id)
        return NextResponse.json({ error: 'You have already applied to this campaign' }, { status: 409 })
      }
      console.error('Error submitting application:', error)
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }

    // applications_count is kept in sync by a DB trigger — no need to
    // increment it here.

    const brandUserId = await getUserIdFromBrand(supabase, campaign.brand_id)
    if (brandUserId) {
      await createNotification(supabase, {
        userId: brandUserId,
        type: 'campaign_application',
        title: 'New campaign application',
        message: `You received a new application for "${campaign.title}"`,
        link: `/dashboard/campaigns/${id}/applications`,
      })
    }

    return NextResponse.json(
      { message: 'Application submitted successfully', application },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
