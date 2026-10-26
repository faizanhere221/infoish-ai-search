import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'
import { CAMPAIGN_CREATOR_STATUSES } from '@/types/campaigns'
import { createKillFeeIfEligible } from '@/lib/payments/engine'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string }
}

const STATUS_VALUES = CAMPAIGN_CREATOR_STATUSES as unknown as [string, ...string[]]

const BulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  status: z.enum(STATUS_VALUES),
})

// PUT /api/campaigns/[id]/creators/bulk-status — brand owner only
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = BulkStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'You are not authorized to manage this campaign' }, { status: 403 })
    }

    // Read the rows' current state first — same reason the single-row PUT
    // does — so we know which ones are actually transitioning INTO
    // 'dropped' (not already there) before billing a kill fee for any of
    // them.
    const { data: existingRows } = await supabase
      .from('campaign_creators')
      .select('id, creator_id, status, payout_amount, currency')
      .eq('campaign_id', id)
      .in('id', parsed.data.ids)

    const { data: rows, error } = await supabase
      .from('campaign_creators')
      // Manual override — stop the deliverable auto-sync trigger from
      // reverting it on the next deliverable event.
      .update({ status: parsed.data.status, status_locked: true, updated_at: new Date().toISOString() })
      .eq('campaign_id', id)
      .in('id', parsed.data.ids)
      .select('id')

    if (error) {
      captureError(error, { route: 'PUT /api/campaigns/[id]/creators/bulk-status' })
      return NextResponse.json({ error: 'Failed to update statuses' }, { status: 500 })
    }

    if (callerUserId && parsed.data.status === 'dropped') {
      const droppingNow = (existingRows || []).filter((r) => r.status !== 'dropped')
      await Promise.all(
        droppingNow.map((row) =>
          createKillFeeIfEligible(supabase, {
            campaignCreatorId: row.id,
            creatorId: row.creator_id,
            brandId: campaign.brand_id,
            actorUserId: callerUserId,
            payoutAmount: row.payout_amount,
            currency: row.currency,
          })
        )
      )
    }

    return NextResponse.json({ message: 'Statuses updated', updated: rows?.length ?? 0 })
  } catch (error) {
    captureError(error, { route: 'PUT /api/campaigns/[id]/creators/bulk-status' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
