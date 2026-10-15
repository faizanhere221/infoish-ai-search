import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedPayment } from '@/lib/campaign-creator-auth'
import { markPaymentPaid } from '@/lib/payments/engine'
import { z } from 'zod'

interface RouteParams {
  params: { id: string; paymentId: string }
}

const MarkPaidSchema = z.object({
  method: z.enum(['wise', 'payoneer', 'bank_transfer', 'paypal', 'other']),
  reference: z.string().min(1).max(255),
  proof_path: z.string().max(500).optional().nullable(),
})

const ALLOWED_FROM = ['due', 'disputed']

// POST .../payments/[paymentId]/mark-paid — brand only, due|disputed ->
// marked_paid. Method + reference required; proof is optional (upload it
// separately first via .../proof, then pass the returned path here).
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, paymentId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = MarkPaidSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
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
      return NextResponse.json({ error: 'Only the brand can mark a payment as paid' }, { status: 403 })
    }
    if (!ALLOWED_FROM.includes(payment.status)) {
      return NextResponse.json({ error: `Cannot mark paid from status "${payment.status}"` }, { status: 400 })
    }

    const result = await markPaymentPaid(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      paymentId,
      method: parsed.data.method,
      reference: parsed.data.reference,
      proofPath: parsed.data.proof_path,
      actorUserId: callerUserId,
    })

    // Lost a race to a concurrent call: if the other call landed on the
    // same end state we wanted, that's an idempotent success, not an
    // error. If it landed somewhere else entirely, it's a real conflict.
    if (!result.applied && result.record.status !== 'marked_paid') {
      return NextResponse.json(
        { error: `This payment is now "${result.record.status}" — it can't be marked paid from here` },
        { status: 409 }
      )
    }

    return NextResponse.json({ message: 'Marked as paid', payment: result.record })
  } catch (error) {
    captureError(error, { route: 'POST .../payments/[paymentId]/mark-paid' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
