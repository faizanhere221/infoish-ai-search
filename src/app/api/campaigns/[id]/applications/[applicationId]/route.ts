import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { createNotification, getUserIdFromCreator } from '@/lib/notifications'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'
import { APPLICATION_STATUSES } from '@/types/campaigns'

interface RouteParams {
  params: { id: string; applicationId: string }
}

const UpdateApplicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES as unknown as [string, ...string[]]),
})

const STATUS_NOTIFICATION: Record<string, { title: string; message: (campaignTitle: string) => string }> = {
  viewed: {
    title: 'Application viewed',
    message: (t) => `Your application for "${t}" was viewed`,
  },
  shortlisted: {
    title: "You've been shortlisted!",
    message: (t) => `You've been shortlisted for "${t}"`,
  },
  rejected: {
    title: 'Application update',
    message: (t) => `Your application for "${t}" was declined`,
  },
  hired: {
    title: "You've been hired!",
    message: (t) => `You've been hired for "${t}"`,
  },
}

// PUT /api/campaigns/[id]/applications/[applicationId] - Update application status (campaign owner only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, applicationId } = params
    const body = await request.json()

    const parsed = UpdateApplicationStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id, title')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'You are not authorized to update this application' }, { status: 403 })
    }

    const { data: application } = await supabase
      .from('campaign_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('campaign_id', id)
      .single()

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const { status } = parsed.data

    const { data: updatedApplication, error } = await supabase
      .from('campaign_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating application status:', error)
      return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 })
    }

    // applications_count / hired_count are kept in sync by DB triggers.

    // Hiring an applicant and the campaign tracker used to be two completely
    // disconnected flows (per the Phase 1 audit) — a hired applicant never
    // got a campaign_creators row. Create one now, best-effort, so the
    // tracker always reflects who's actually been hired. Find-or-create:
    // a brand may have already added this creator to the tracker manually
    // before the application was marked hired.
    if (status === 'hired') {
      const { data: existingRow } = await supabase
        .from('campaign_creators')
        .select('id')
        .eq('campaign_id', id)
        .eq('creator_id', application.creator_id)
        .single()

      if (!existingRow) {
        const { error: trackerError } = await supabase.from('campaign_creators').insert({
          campaign_id: id,
          creator_id: application.creator_id,
          status: 'confirmed',
          payout_amount: application.proposed_rate !== null ? application.proposed_rate / 100 : null,
          application_id: applicationId,
        })
        if (trackerError) {
          captureError(trackerError, { route: 'PUT /api/campaigns/[id]/applications/[applicationId]', context: 'auto-create campaign_creators on hire' })
        }
      }
    }

    const creatorUserId = await getUserIdFromCreator(supabase, application.creator_id)
    if (creatorUserId) {
      const notification = STATUS_NOTIFICATION[status]
      await createNotification(supabase, {
        userId: creatorUserId,
        type: 'campaign_application_update',
        title: notification?.title ?? 'Application status updated',
        content: notification?.message(campaign.title) ?? `Your application for "${campaign.title}" is now ${status}.`,
        relatedType: 'campaign_application',
        relatedId: applicationId,
      })
    }

    // Join creator (+ platforms) the same way GET /api/campaigns/[id]/applications
    // does — without this, the response only had the bare campaign_applications
    // row, so the frontend's `application.creator` was undefined and fell back
    // to "C" / "Creator" / "@unknown" every time this PUT ran (which happens
    // automatically on first view of a submitted application).
    const [{ data: creator }, { data: platforms }] = await Promise.all([
      supabase
        .from('creators')
        .select('id, username, display_name, profile_photo_url, bio, country, niches, total_followers')
        .eq('id', updatedApplication.creator_id)
        .single(),
      supabase
        .from('creator_platforms')
        .select('platform, followers')
        .eq('creator_id', updatedApplication.creator_id),
    ])

    return NextResponse.json({
      message: 'Application status updated successfully',
      application: {
        ...updatedApplication,
        creator: creator ? { ...creator, platforms: platforms || [] } : null,
      },
    })
  } catch (error) {
    captureError(error, { route: 'PUT /api/campaigns/[id]/applications/[applicationId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
