import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromCreator } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string; deliverableId: string }
}

// POST .../approve — brand only. draft_submitted -> approved.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedDeliverable(supabase, id, deliverableId, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { row, deliverable, actorType } = authorized

    if (actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can approve a draft' }, { status: 403 })
    }
    if (row.status === 'dropped') {
      return NextResponse.json({ error: 'This engagement was dropped' }, { status: 400 })
    }
    if (deliverable.status !== 'draft_submitted') {
      return NextResponse.json({ error: `Cannot approve from status "${deliverable.status}"` }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('creator_deliverables')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', deliverableId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST .../approve' })
      return NextResponse.json({ error: 'Failed to approve draft' }, { status: 500 })
    }

    const creatorUserId = await getUserIdFromCreator(supabase, row.creator_id)

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      actorUserId: callerUserId,
      actorType,
      eventType: 'deliverable_approved',
      payload: { deliverable_id: deliverableId, title: deliverable.title },
      systemMessage: `✅ Draft approved for "${deliverable.title}". Ready to post.`,
      notification: {
        recipientUserId: creatorUserId,
        type: 'deliverable_approved',
        title: 'Draft approved',
        content: `Your draft for "${deliverable.title}" was approved`,
      },
    })

    return NextResponse.json({ message: 'Draft approved', deliverable: updated })
  } catch (error) {
    captureError(error, { route: 'POST .../approve' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
