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

const SubmitDraftSchema = z.object({
  draft_url: z.string().url().max(500).optional(),
})

const ALLOWED_FROM = ['pending', 'changes_requested']

// POST .../submit-draft — creator only. pending|changes_requested -> draft_submitted.
// Requires a link in this request OR an attachment already uploaded via
// POST .../attachment.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json().catch(() => ({}))
    const parsed = SubmitDraftSchema.safeParse(body)
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
      return NextResponse.json({ error: 'Only the creator can submit a draft' }, { status: 403 })
    }
    if (row.status === 'dropped') {
      return NextResponse.json({ error: 'This engagement was dropped' }, { status: 400 })
    }
    if (!ALLOWED_FROM.includes(deliverable.status)) {
      return NextResponse.json({ error: `Cannot submit a draft from status "${deliverable.status}"` }, { status: 400 })
    }

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('require_contract')
      .eq('id', row.campaign_id)
      .single()

    if (campaign?.require_contract) {
      const { data: contract } = await supabase
        .from('campaign_contracts')
        .select('status')
        .eq('campaign_creator_id', id)
        .neq('status', 'void')
        .maybeSingle()

      if (contract?.status !== 'fully_signed') {
        return NextResponse.json(
          { error: 'The contract must be fully signed by both parties before you can submit a draft' },
          { status: 400 }
        )
      }
    }

    const draftUrl = parsed.data.draft_url || deliverable.draft_url
    if (!draftUrl && !deliverable.draft_attachment_path) {
      return NextResponse.json({ error: 'Provide a link or upload a file before submitting' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('creator_deliverables')
      .update({
        status: 'draft_submitted',
        draft_url: draftUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliverableId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST .../submit-draft' })
      return NextResponse.json({ error: 'Failed to submit draft' }, { status: 500 })
    }

    const brandUserId = await getUserIdFromBrand(supabase, row.brand_id)

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      actorUserId: callerUserId,
      actorType,
      eventType: 'deliverable_draft_submitted',
      payload: { deliverable_id: deliverableId, title: deliverable.title },
      systemMessage: `📝 Draft submitted for "${deliverable.title}". Please review.`,
      notification: {
        recipientUserId: brandUserId,
        type: 'deliverable_draft_submitted',
        title: 'Draft ready for review',
        content: `A draft for "${deliverable.title}" is ready for review`,
      },
    })

    return NextResponse.json({ message: 'Draft submitted', deliverable: updated })
  } catch (error) {
    captureError(error, { route: 'POST .../submit-draft' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
