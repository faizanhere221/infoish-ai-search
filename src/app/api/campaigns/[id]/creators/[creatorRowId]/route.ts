import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'
import { CAMPAIGN_CREATOR_STATUSES } from '@/types/campaigns'
import { voidContractOnTermsChange } from '@/lib/contracts/lifecycle'
import { getUserIdFromCreator } from '@/lib/notifications'
import { createKillFeeIfEligible } from '@/lib/payments/engine'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

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
  status_locked: z.boolean().optional(),
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
    .select('id, creator_id, status, payout_amount, currency')
    .eq('id', creatorRowId)
    .eq('campaign_id', campaignId)
    .single()

  if (!row) {return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }}

  return { error: null, row, brandId: campaign.brand_id }
}

// PUT /api/campaigns/[id]/creators/[creatorRowId] — brand owner only
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, creatorRowId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
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
    const authResult = await requireOwner(supabase, id, creatorRowId, callerProfileId, callerUserType)
    if (authResult.error) {return authResult.error}
    const { row: existingRow, brandId } = authResult

    const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() }
    if (updates.posted_url === '') {updates.posted_url = null}
    // A manual status change is a deliberate override — stop the Phase 3
    // deliverable auto-sync trigger from silently reverting it on the next
    // deliverable event. A caller can still explicitly send
    // { status_locked: false } on its own (no status field) to resume
    // auto-sync — the spread above already carries that through.
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

    // Fee changed after a contract was fully signed — the signed document no
    // longer matches reality.
    if (
      callerUserId && existingRow && brandId &&
      parsed.data.payout_amount !== undefined &&
      parsed.data.payout_amount !== existingRow.payout_amount
    ) {
      const recipientUserId = await getUserIdFromCreator(supabase, existingRow.creator_id)
      await voidContractOnTermsChange(supabase, {
        campaignCreatorId: creatorRowId,
        creatorId: existingRow.creator_id,
        brandId,
        actorUserId: callerUserId,
        reason: 'the fee changed',
        recipientUserId,
      })
    }

    // Dropping a fully-signed engagement after a draft was submitted owes
    // a kill fee — created automatically, not something the brand has to
    // remember to add. Gated on an actual transition INTO 'dropped'
    // (existingRow.status read before this update) — otherwise re-saving
    // an already-dropped row (a retry, or editing an unrelated field while
    // status stays 'dropped') would bill a second kill fee for the same
    // drop. createKillFeeIfEligible also has a DB-level unique-index
    // backstop against this, same pattern as the 'full' payment.
    if (
      callerUserId && existingRow && brandId &&
      parsed.data.status === 'dropped' && existingRow.status !== 'dropped'
    ) {
      await createKillFeeIfEligible(supabase, {
        campaignCreatorId: creatorRowId,
        creatorId: existingRow.creator_id,
        brandId,
        actorUserId: callerUserId,
        payoutAmount: existingRow.payout_amount,
        currency: existingRow.currency,
      })
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
    const authResult = await requireOwner(supabase, id, creatorRowId, callerProfileId, callerUserType)
    if (authResult.error) {return authResult.error}

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
