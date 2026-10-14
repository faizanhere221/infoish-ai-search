import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'
import { CAMPAIGN_CREATOR_STATUSES } from '@/types/campaigns'

interface RouteParams {
  params: { id: string; creatorRowId: string }
}

const STATUS_VALUES = CAMPAIGN_CREATOR_STATUSES as unknown as [string, ...string[]]

const UpdateCreatorRowSchema = z.object({
  status: z.enum(STATUS_VALUES).optional(),
  planned_date: z.string().optional().nullable(),
  posted_at: z.string().optional().nullable(),
  posted_url: z.string().url().max(500).optional().nullable().or(z.literal('')),
  payout_amount: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  charge_amount: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  currency: z.string().min(3).max(10).optional(),
  brand_notes: z.string().max(2000).optional().nullable(),
})

async function requireOwner(
  supabase: ReturnType<typeof createServerSupabase>,
  campaignId: string,
  creatorRowId: string,
  callerProfileId: string | null,
  callerUserType: string | null
) {
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, brand_id')
    .eq('id', campaignId)
    .single()

  if (!campaign) {return { error: NextResponse.json({ error: 'Campaign not found' }, { status: 404 }) }}

  if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
    return { error: NextResponse.json({ error: 'You are not authorized to manage this campaign' }, { status: 403 }) }
  }

  const { data: row } = await supabase
    .from('campaign_creators')
    .select('id')
    .eq('id', creatorRowId)
    .eq('campaign_id', campaignId)
    .single()

  if (!row) {return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }}

  return { error: null }
}

// PUT /api/campaigns/[id]/creators/[creatorRowId] — brand owner only
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, creatorRowId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = UpdateCreatorRowSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const { error: authError } = await requireOwner(supabase, id, creatorRowId, callerProfileId, callerUserType)
    if (authError) {return authError}

    const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() }
    if (updates.posted_url === '') {updates.posted_url = null}
    // A manual status change is a deliberate override — stop the Phase 3
    // deliverable auto-sync trigger from silently reverting it on the next
    // deliverable event.
    if (parsed.data.status !== undefined) {updates.status_locked = true}

    const { data: row, error } = await supabase
      .from('campaign_creators')
      .update(updates)
      .eq('id', creatorRowId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'PUT /api/campaigns/[id]/creators/[creatorRowId]' })
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Updated', campaign_creator: row })
  } catch (error) {
    captureError(error, { route: 'PUT /api/campaigns/[id]/creators/[creatorRowId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/campaigns/[id]/creators/[creatorRowId] — brand owner only
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, creatorRowId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const { error: authError } = await requireOwner(supabase, id, creatorRowId, callerProfileId, callerUserType)
    if (authError) {return authError}

    const { error } = await supabase.from('campaign_creators').delete().eq('id', creatorRowId)

    if (error) {
      captureError(error, { route: 'DELETE /api/campaigns/[id]/creators/[creatorRowId]' })
      return NextResponse.json({ error: 'Failed to remove creator' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Removed' })
  } catch (error) {
    captureError(error, { route: 'DELETE /api/campaigns/[id]/creators/[creatorRowId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
