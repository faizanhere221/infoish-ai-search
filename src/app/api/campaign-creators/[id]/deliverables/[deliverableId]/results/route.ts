import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
import { logCampaignCreatorEvent } from '@/lib/campaign-creator-events'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string; deliverableId: string }
}

const CreateResultSchema = z.object({
  captured_at: z.string().optional(),
  views: z.number().int().nonnegative().max(1_000_000_000).optional(),
  likes: z.number().int().nonnegative().max(1_000_000_000).optional(),
  comments: z.number().int().nonnegative().max(1_000_000_000).optional(),
  shares: z.number().int().nonnegative().max(1_000_000_000).optional(),
  clicks: z.number().int().nonnegative().max(1_000_000_000).optional(),
  saves: z.number().int().nonnegative().max(1_000_000_000).optional(),
  notes: z.string().max(2000).optional().nullable(),
})

const RESULT_ELIGIBLE_STATUSES = ['posted', 'completed']

// GET /api/campaign-creators/[id]/deliverables/[deliverableId]/results —
// either party on the row.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedDeliverable(supabase, id, deliverableId, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: results, error } = await supabase
      .from('deliverable_results')
      .select('*')
      .eq('deliverable_id', deliverableId)
      .order('captured_at', { ascending: false })

    if (error) {
      captureError(error, { route: 'GET .../deliverables/[deliverableId]/results' })
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
    }

    return NextResponse.json({ results: results || [] })
  } catch (error) {
    captureError(error, { route: 'GET .../deliverables/[deliverableId]/results' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaign-creators/[id]/deliverables/[deliverableId]/results —
// either party, once the deliverable is posted (or completed).
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = CreateResultSchema.safeParse(body)
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
    if (!RESULT_ELIGIBLE_STATUSES.includes(authorized.deliverable.status)) {
      return NextResponse.json({ error: 'Results can only be added once this deliverable is posted' }, { status: 400 })
    }

    const { data: created, error } = await supabase
      .from('deliverable_results')
      .insert({
        deliverable_id: deliverableId,
        captured_at: parsed.data.captured_at || new Date().toISOString(),
        views: parsed.data.views ?? 0,
        likes: parsed.data.likes ?? 0,
        comments: parsed.data.comments ?? 0,
        shares: parsed.data.shares ?? 0,
        clicks: parsed.data.clicks ?? 0,
        saves: parsed.data.saves ?? 0,
        notes: parsed.data.notes || null,
        entered_by: authorized.actorType,
      })
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST .../deliverables/[deliverableId]/results' })
      return NextResponse.json({ error: 'Failed to add results' }, { status: 500 })
    }

    await logCampaignCreatorEvent(supabase, {
      campaignCreatorId: id,
      actorUserId: callerUserId,
      actorType: authorized.actorType,
      eventType: 'results_added',
      payload: { deliverable_id: deliverableId, result_id: created.id, views: created.views },
    })

    return NextResponse.json({ message: 'Results added', result: created }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST .../deliverables/[deliverableId]/results' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
