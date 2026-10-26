import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromCreator } from '@/lib/notifications'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string; deliverableId: string }
}

const RequestChangesSchema = z.object({
  feedback: z.string().min(1).max(2000),
})

// POST .../request-changes — brand only. draft_submitted -> changes_requested.
// Feedback is required. Blocked once revisions_used >= revisions_allowed.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = RequestChangesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedDeliverable(supabase, id, deliverableId, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { row, deliverable, actorType } = authorized

    if (actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can request changes' }, { status: 403 })
    }
    if (row.status === 'dropped') {
      return NextResponse.json({ error: 'This engagement was dropped' }, { status: 400 })
    }
    if (deliverable.status !== 'draft_submitted') {
      return NextResponse.json({ error: `Cannot request changes from status "${deliverable.status}"` }, { status: 400 })
    }
    if (deliverable.revisions_used >= deliverable.revisions_allowed) {
      return NextResponse.json(
        { error: `This deliverable has used all ${deliverable.revisions_allowed} allowed revisions. Approve it or adjust the revision cap first.` },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabase
      .from('creator_deliverables')
      .update({
        status: 'changes_requested',
        latest_feedback: parsed.data.feedback,
        revisions_used: deliverable.revisions_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliverableId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST .../request-changes' })
      return NextResponse.json({ error: 'Failed to request changes' }, { status: 500 })
    }

    const creatorUserId = await getUserIdFromCreator(supabase, row.creator_id)

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      actorUserId: callerUserId,
      actorType,
      eventType: 'deliverable_changes_requested',
      payload: { deliverable_id: deliverableId, title: deliverable.title, feedback: parsed.data.feedback },
      systemMessage: `🔄 Changes requested for "${deliverable.title}": ${parsed.data.feedback}`,
      notification: {
        recipientUserId: creatorUserId,
        type: 'deliverable_changes_requested',
        title: 'Changes requested',
        content: `The brand requested changes on "${deliverable.title}"`,
      },
    })

    return NextResponse.json({ message: 'Changes requested', deliverable: updated })
  } catch (error) {
    captureError(error, { route: 'POST .../request-changes' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
