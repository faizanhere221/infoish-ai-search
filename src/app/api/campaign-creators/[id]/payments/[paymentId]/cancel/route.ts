import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedPayment } from '@/lib/campaign-creator-auth'
import { cancelPayment } from '@/lib/payments/engine'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string; paymentId: string }
}

const CancelSchema = z.object({
  reason: z.string().min(1).max(1000),
})

const CANCELLABLE_FROM = ['scheduled', 'due']

// POST .../payments/[paymentId]/cancel — brand only, scheduled|due ->
// cancelled, only once the row itself has been dropped — a payment can't
// be cancelled out from under an engagement that's still active.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, paymentId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = CancelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'A reason is required', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedPayment(supabase, id, paymentId, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { row, payment, actorType } = authorized

    if (actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can cancel a payment' }, { status: 403 })
    }
    if (!CANCELLABLE_FROM.includes(payment.status)) {
      return NextResponse.json({ error: `Cannot cancel from status "${payment.status}"` }, { status: 400 })
    }
    if (row.status !== 'dropped') {
      return NextResponse.json({ error: 'A payment can only be cancelled once this engagement is dropped' }, { status: 400 })
    }

    const result = await cancelPayment(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      paymentId,
      reason: parsed.data.reason,
      actorUserId: callerUserId,
    })

    if (!result.applied && result.record.status !== 'cancelled') {
      return NextResponse.json(
        { error: `This payment is now "${result.record.status}" — it can't be cancelled from here` },
        { status: 409 }
      )
    }

    return NextResponse.json({ message: 'Cancelled', payment: result.record })
  } catch (error) {
    captureError(error, { route: 'POST .../payments/[paymentId]/cancel' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
