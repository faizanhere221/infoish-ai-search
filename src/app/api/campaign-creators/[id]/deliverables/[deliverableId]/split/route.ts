import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
import { logCampaignCreatorEvent } from '@/lib/campaign-creator-events'
import { voidContractOnTermsChange } from '@/lib/contracts/lifecycle'
import { getUserIdFromCreator } from '@/lib/notifications'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string; deliverableId: string }
}

const SplitSchema = z.object({
  title: z.string().min(1).max(255).optional(),
})

// POST .../split — brand only, source must still be 'pending'. Creates a new
// sibling deliverable copying platform/format/revisions_allowed from the
// source, leaving dates blank for the brand to set. The source row is left
// untouched.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json().catch(() => ({}))
    const parsed = SplitSchema.safeParse(body)
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
    const { deliverable } = authorized

    if (authorized.actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can split a deliverable' }, { status: 403 })
    }
    if (deliverable.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only a deliverable with no draft submitted yet can be split' },
        { status: 400 }
      )
    }

    const { data: created, error } = await supabase
      .from('creator_deliverables')
      .insert({
        campaign_creator_id: id,
        title: parsed.data.title || `${deliverable.title} (2)`,
        platform: deliverable.platform,
        format: deliverable.format,
        revisions_allowed: deliverable.revisions_allowed,
      })
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST .../deliverables/[deliverableId]/split' })
      return NextResponse.json({ error: 'Failed to split deliverable' }, { status: 500 })
    }

    await logCampaignCreatorEvent(supabase, {
      campaignCreatorId: id,
      actorUserId: callerUserId,
      actorType: 'brand',
      eventType: 'deliverable_split',
      payload: { source_deliverable_id: deliverableId, new_deliverable_id: created.id },
    })

    const recipientUserId = await getUserIdFromCreator(supabase, authorized.row.creator_id)
    await voidContractOnTermsChange(supabase, {
      campaignCreatorId: id,
      creatorId: authorized.row.creator_id,
      brandId: authorized.row.brand_id,
      actorUserId: callerUserId,
      reason: 'a deliverable was split',
      recipientUserId,
    })

    return NextResponse.json({ message: 'Deliverable split', deliverable: created }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST .../deliverables/[deliverableId]/split' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
