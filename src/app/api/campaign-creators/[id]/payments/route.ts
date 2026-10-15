import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow } from '@/lib/campaign-creator-auth'
import { refreshDuePayments, createMilestonePayment } from '@/lib/payments/engine'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

const CreateMilestoneSchema = z.object({
  amount: z.number().positive(),
  deliverable_ids: z.array(z.string().min(1)).min(1, 'A milestone payment must be tied to at least one deliverable'),
})

// GET /api/campaign-creators/[id]/payments — either party. Lazily flips any
// 'scheduled' record to 'due' first (no cron, same pattern as offer
// expiry). creator_payments never carries charge/profit — it's built
// entirely from payout_amount, so there's nothing to strip for the
// creator's view.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await refreshDuePayments(supabase, id)

    const { data: payments, error } = await supabase
      .from('creator_payments')
      .select('*')
      .eq('campaign_creator_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators/[id]/payments' })
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    return NextResponse.json({ payments: payments || [] })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/[id]/payments' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaign-creators/[id]/payments — brand only. Creates a
// 'milestone' payment tied to one or more specific deliverables — the only
// payment type this endpoint creates ('full' is automatic on contract
// signing, 'upfront'/'final' come from splitting it, 'kill_fee' is
// automatic on a drop). A milestone with no deliverable_ids is rejected —
// there'd be nothing for refreshDuePayments to ever check, so it could
// never become due.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = CreateMilestoneSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (authorized.actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can add a milestone payment' }, { status: 403 })
    }

    const { data: deliverables } = await supabase
      .from('creator_deliverables')
      .select('id')
      .eq('campaign_creator_id', id)
      .in('id', parsed.data.deliverable_ids)

    const foundIds = new Set((deliverables || []).map((d) => d.id))
    const unknownIds = parsed.data.deliverable_ids.filter((did) => !foundIds.has(did))
    if (unknownIds.length > 0) {
      return NextResponse.json(
        { error: `These deliverable ids don't belong to this row: ${unknownIds.join(', ')}` },
        { status: 400 }
      )
    }

    const { data: contract } = await supabase
      .from('campaign_contracts')
      .select('id')
      .eq('campaign_creator_id', id)
      .neq('status', 'void')
      .maybeSingle()

    const record = await createMilestonePayment(supabase, {
      campaignCreatorId: id,
      creatorId: authorized.row.creator_id,
      brandId: authorized.row.brand_id,
      contractId: contract?.id ?? null,
      amount: parsed.data.amount,
      currency: authorized.row.currency,
      deliverableIds: parsed.data.deliverable_ids,
      actorUserId: callerUserId,
    })

    return NextResponse.json({ message: 'Milestone payment added', payment: record }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST /api/campaign-creators/[id]/payments' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
