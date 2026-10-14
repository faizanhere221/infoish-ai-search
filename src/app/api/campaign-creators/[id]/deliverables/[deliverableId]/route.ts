import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
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

// PUT /api/campaign-creators/[id]/deliverables/[deliverableId] — brand owner
// only. Metadata edits (title/platform/format/due dates/revision cap) —
// status transitions go through their own dedicated endpoints.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
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
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (authorized.actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can edit deliverable details' }, { status: 403 })
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

    return NextResponse.json({ message: 'Updated', deliverable: updated })
  } catch (error) {
    captureError(error, { route: 'PUT /api/campaign-creators/[id]/deliverables/[deliverableId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
