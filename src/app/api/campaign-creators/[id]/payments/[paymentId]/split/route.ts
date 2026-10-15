import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedPayment } from '@/lib/campaign-creator-auth'
import { splitPayment } from '@/lib/payments/engine'
import { z } from 'zod'

interface RouteParams {
  params: { id: string; paymentId: string }
}

const SplitSchema = z.object({
  upfront_amount: z.number().positive(),
  final_amount: z.number().positive(),
})

// POST .../payments/[paymentId]/split — brand only, only the original
// 'full' record while still 'scheduled'. Amounts must add up exactly to
// the original.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, paymentId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = SplitSchema.safeParse(body)
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
      return NextResponse.json({ error: 'Only the brand can split a payment' }, { status: 403 })
    }
    if (payment.type !== 'full' || payment.status !== 'scheduled') {
      return NextResponse.json({ error: 'Only an unpaid, unsplit full payment can be split' }, { status: 400 })
    }

    const sum = Math.round((parsed.data.upfront_amount + parsed.data.final_amount) * 100) / 100
    if (sum !== payment.amount) {
      return NextResponse.json(
        { error: `Upfront and final must add up to ${payment.amount} ${payment.currency}` },
        { status: 400 }
      )
    }

    const { data: contract } = payment.contract_id
      ? await supabase.from('campaign_contracts').select('payment_terms_days').eq('id', payment.contract_id).single()
      : { data: null }

    const { upfront, final } = await splitPayment(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      originalPaymentId: paymentId,
      contractId: payment.contract_id,
      upfrontAmount: parsed.data.upfront_amount,
      finalAmount: parsed.data.final_amount,
      currency: payment.currency,
      paymentTermsDays: contract?.payment_terms_days ?? 14,
      actorUserId: callerUserId,
    })

    return NextResponse.json({ message: 'Split', upfront, final })
  } catch (error) {
    captureError(error, { route: 'POST .../payments/[paymentId]/split' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
