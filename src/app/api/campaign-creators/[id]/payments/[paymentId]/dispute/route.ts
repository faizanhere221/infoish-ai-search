import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedPayment } from '@/lib/campaign-creator-auth'
import { disputePayment } from '@/lib/payments/engine'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string; paymentId: string }
}

const DisputeSchema = z.object({
  reason: z.string().min(1).max(1000),
})

// POST .../payments/[paymentId]/dispute — creator only, marked_paid -> disputed.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, paymentId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = DisputeSchema.safeParse(body)
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

    if (actorType !== 'creator') {
      return NextResponse.json({ error: 'Only the creator can dispute a payment' }, { status: 403 })
    }
    if (payment.status !== 'marked_paid') {
      return NextResponse.json({ error: `Cannot dispute from status "${payment.status}"` }, { status: 400 })
    }

    const result = await disputePayment(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      paymentId,
      reason: parsed.data.reason,
      actorUserId: callerUserId,
    })

    if (!result.applied && result.record.status !== 'disputed') {
      return NextResponse.json(
        { error: `This payment is now "${result.record.status}" — it can't be disputed from here` },
        { status: 409 }
      )
    }

    return NextResponse.json({ message: 'Disputed', payment: result.record })
  } catch (error) {
    captureError(error, { route: 'POST .../payments/[paymentId]/dispute' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
