import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromCreator } from '@/lib/notifications'

interface RouteParams {
  params: { id: string; deliverableId: string }
}

// POST .../complete — brand only. posted -> completed.
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
      return NextResponse.json({ error: 'Only the brand can mark a deliverable complete' }, { status: 403 })
    }
    if (deliverable.status !== 'posted') {
      return NextResponse.json({ error: `Cannot complete from status "${deliverable.status}"` }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('creator_deliverables')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', deliverableId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST .../complete' })
      return NextResponse.json({ error: 'Failed to complete deliverable' }, { status: 500 })
    }

    const creatorUserId = await getUserIdFromCreator(supabase, row.creator_id)

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      actorUserId: callerUserId,
      actorType,
      eventType: 'deliverable_completed',
      payload: { deliverable_id: deliverableId, title: deliverable.title },
      systemMessage: `🎉 "${deliverable.title}" marked complete.`,
      notification: {
        recipientUserId: creatorUserId,
        type: 'deliverable_completed',
        title: 'Deliverable completed',
        content: `"${deliverable.title}" was marked complete`,
      },
    })

    return NextResponse.json({ message: 'Deliverable completed', deliverable: updated })
  } catch (error) {
    captureError(error, { route: 'POST .../complete' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
