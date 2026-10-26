import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
import { logCampaignCreatorEvent } from '@/lib/campaign-creator-events'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string; deliverableId: string; resultId: string }
}

const UpdateResultSchema = z.object({
  captured_at: z.string().optional(),
  views: z.number().int().nonnegative().max(1_000_000_000).optional(),
  likes: z.number().int().nonnegative().max(1_000_000_000).optional(),
  comments: z.number().int().nonnegative().max(1_000_000_000).optional(),
  shares: z.number().int().nonnegative().max(1_000_000_000).optional(),
  clicks: z.number().int().nonnegative().max(1_000_000_000).optional(),
  saves: z.number().int().nonnegative().max(1_000_000_000).optional(),
  notes: z.string().max(2000).optional().nullable(),
})

async function loadResult(supabase: ReturnType<typeof createServerSupabase>, resultId: string, deliverableId: string) {
  const { data } = await supabase
    .from('deliverable_results')
    .select('*')
    .eq('id', resultId)
    .eq('deliverable_id', deliverableId)
    .single()
  return data
}

// PUT — the brand can edit any entry; the creator can only edit entries
// they entered themselves.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId, resultId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = UpdateResultSchema.safeParse(body)
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

    const result = await loadResult(supabase, resultId, deliverableId)
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (authorized.actorType !== 'brand' && result.entered_by !== authorized.actorType) {
      return NextResponse.json({ error: 'You can only edit results you entered' }, { status: 403 })
    }

    const { data: updated, error } = await supabase
      .from('deliverable_results')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', resultId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'PUT .../results/[resultId]' })
      return NextResponse.json({ error: 'Failed to update results' }, { status: 500 })
    }

    await logCampaignCreatorEvent(supabase, {
      campaignCreatorId: id,
      actorUserId: callerUserId,
      actorType: authorized.actorType,
      eventType: 'results_edited',
      payload: { deliverable_id: deliverableId, result_id: resultId },
    })

    return NextResponse.json({ message: 'Updated', result: updated })
  } catch (error) {
    captureError(error, { route: 'PUT .../results/[resultId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — same ownership rule as PUT.
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId, resultId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedDeliverable(supabase, id, deliverableId, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const result = await loadResult(supabase, resultId, deliverableId)
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (authorized.actorType !== 'brand' && result.entered_by !== authorized.actorType) {
      return NextResponse.json({ error: 'You can only remove results you entered' }, { status: 403 })
    }

    const { error } = await supabase.from('deliverable_results').delete().eq('id', resultId)
    if (error) {
      captureError(error, { route: 'DELETE .../results/[resultId]' })
      return NextResponse.json({ error: 'Failed to remove results' }, { status: 500 })
    }

    await logCampaignCreatorEvent(supabase, {
      campaignCreatorId: id,
      actorUserId: callerUserId,
      actorType: authorized.actorType,
      eventType: 'results_removed',
      payload: { deliverable_id: deliverableId, result_id: resultId },
    })

    return NextResponse.json({ message: 'Removed' })
  } catch (error) {
    captureError(error, { route: 'DELETE .../results/[resultId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
