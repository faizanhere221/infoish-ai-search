import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { createNotification, getUserIdFromCreator } from '@/lib/notifications'
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

    const creatorUserId = await getUserIdFromCreator(supabase, application.creator_id)
    if (creatorUserId) {
      const notification = STATUS_NOTIFICATION[status]
      await createNotification(supabase, {
        userId: creatorUserId,
        type: 'campaign_application_update',
        title: notification?.title ?? 'Application status updated',
        message: notification?.message(campaign.title) ?? `Your application for "${campaign.title}" is now ${status}.`,
        link: `/dashboard/applications/${applicationId}`,
      })
    }

    return NextResponse.json({
      message: 'Application status updated successfully',
      application: updatedApplication,
    })
  } catch (error) {
    console.error('Error updating application status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
