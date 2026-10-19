import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromBrand } from '@/lib/notifications'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string; deliverableId: string }
}

const SubmitPostedSchema = z.object({
  posted_url: z.string().url().max(500),
})

// POST .../submit-posted — creator only. approved -> posted. posted_url required.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = SubmitPostedSchema.safeParse(body)
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

    if (actorType !== 'creator') {
      return NextResponse.json({ error: 'Only the creator can submit the posted link' }, { status: 403 })
    }
    if (row.status === 'dropped') {
      return NextResponse.json({ error: 'This engagement was dropped' }, { status: 400 })
    }
    if (deliverable.status !== 'approved') {
      return NextResponse.json({ error: `Cannot submit a posted link from status "${deliverable.status}"` }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('creator_deliverables')
      .update({
        status: 'posted',
        posted_url: parsed.data.posted_url,
        posted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliverableId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST .../submit-posted' })
      return NextResponse.json({ error: 'Failed to submit posted link' }, { status: 500 })
    }

    // Also reflected on the tracker row itself, so "Posted" shows there too
    // without waiting on the next read.
    await supabase
      .from('campaign_creators')
      .update({ posted_url: parsed.data.posted_url, posted_at: new Date().toISOString() })
      .eq('id', id)

    const brandUserId = await getUserIdFromBrand(supabase, row.brand_id)

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      actorUserId: callerUserId,
      actorType,
      eventType: 'deliverable_posted',
      payload: { deliverable_id: deliverableId, title: deliverable.title, posted_url: parsed.data.posted_url },
      systemMessage: `🚀 "${deliverable.title}" is live: ${parsed.data.posted_url}`,
      notification: {
        recipientUserId: brandUserId,
        type: 'deliverable_posted',
        title: 'Deliverable posted',
        content: `"${deliverable.title}" has been posted`,
      },
    })

    return NextResponse.json({ message: 'Posted link submitted', deliverable: updated })
  } catch (error) {
    captureError(error, { route: 'POST .../submit-posted' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
