import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
import { logCampaignCreatorEvent } from '@/lib/campaign-creator-events'
import { voidContractOnTermsChange } from '@/lib/contracts/lifecycle'
import { getUserIdFromCreator } from '@/lib/notifications'
import { DELIVERABLE_FORMATS } from '@/types/campaigns'
import { z } from 'zod'

interface RouteParams {
  params: { id: string; deliverableId: string }
}

const FORMAT_VALUES = DELIVERABLE_FORMATS.map((f) => f.value) as [string, ...string[]]

const UpdateDeliverableSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  platform: z.string().max(50).optional().nullable(),
  format: z.enum(FORMAT_VALUES).optional().nullable(),
  draft_due: z.string().optional().nullable(),
  publish_due: z.string().optional().nullable(),
  revisions_allowed: z.number().int().min(0).max(20).optional(),
})

// Fields that redefine *what* the creator is making — locked once a draft
// has been submitted so the brand can't change the brief out from under
// work already in progress. revisions_allowed is a cap the brand can still
// raise/lower at any stage.
const LOCKED_AFTER_PENDING_FIELDS = ['title', 'platform', 'format', 'draft_due', 'publish_due'] as const

// PUT /api/campaign-creators/[id]/deliverables/[deliverableId] — brand owner
// only. title/platform/format/due dates are only editable while the
// deliverable is still 'pending' (no draft submitted yet); revisions_allowed
// can be changed at any stage. Status transitions go through their own
// dedicated endpoints.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = UpdateDeliverableSchema.safeParse(body)
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
    if (authorized.actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can edit deliverable details' }, { status: 403 })
    }

    const attemptingLockedField = LOCKED_AFTER_PENDING_FIELDS.some((f) => parsed.data[f] !== undefined)
    if (attemptingLockedField && authorized.deliverable.status !== 'pending') {
      return NextResponse.json(
        { error: 'Title, platform, format, and due dates can only be changed before a draft is submitted' },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabase
      .from('creator_deliverables')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', deliverableId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'PUT /api/campaign-creators/[id]/deliverables/[deliverableId]' })
      return NextResponse.json({ error: 'Failed to update deliverable' }, { status: 500 })
    }

    await logCampaignCreatorEvent(supabase, {
      campaignCreatorId: id,
      actorUserId: callerUserId,
      actorType: 'brand',
      eventType: 'deliverable_edited',
      payload: { deliverable_id: deliverableId, fields: Object.keys(parsed.data) },
    })

    if (attemptingLockedField) {
      const recipientUserId = await getUserIdFromCreator(supabase, authorized.row.creator_id)
      await voidContractOnTermsChange(supabase, {
        campaignCreatorId: id,
        creatorId: authorized.row.creator_id,
        brandId: authorized.row.brand_id,
        actorUserId: callerUserId,
        reason: 'a deliverable changed',
        recipientUserId,
      })
    }

    return NextResponse.json({ message: 'Updated', deliverable: updated })
  } catch (error) {
    captureError(error, { route: 'PUT /api/campaign-creators/[id]/deliverables/[deliverableId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/campaign-creators/[id]/deliverables/[deliverableId] — brand
// owner only, only while 'pending' (no draft/posted work to lose).
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    if (authorized.actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can remove a deliverable' }, { status: 403 })
    }
    if (authorized.deliverable.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only a deliverable with no draft submitted yet can be removed' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('creator_deliverables').delete().eq('id', deliverableId)
    if (error) {
      captureError(error, { route: 'DELETE /api/campaign-creators/[id]/deliverables/[deliverableId]' })
      return NextResponse.json({ error: 'Failed to remove deliverable' }, { status: 500 })
    }

    await logCampaignCreatorEvent(supabase, {
      campaignCreatorId: id,
      actorUserId: callerUserId,
      actorType: 'brand',
      eventType: 'deliverable_removed',
      payload: { deliverable_id: deliverableId, title: authorized.deliverable.title },
    })

    const recipientUserId = await getUserIdFromCreator(supabase, authorized.row.creator_id)
    await voidContractOnTermsChange(supabase, {
      campaignCreatorId: id,
      creatorId: authorized.row.creator_id,
      brandId: authorized.row.brand_id,
      actorUserId: callerUserId,
      reason: 'a deliverable was removed',
      recipientUserId,
    })

    return NextResponse.json({ message: 'Removed' })
  } catch (error) {
    captureError(error, { route: 'DELETE /api/campaign-creators/[id]/deliverables/[deliverableId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
