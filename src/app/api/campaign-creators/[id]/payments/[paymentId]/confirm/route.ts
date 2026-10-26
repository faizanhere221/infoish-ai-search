import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedPayment } from '@/lib/campaign-creator-auth'
import { confirmPaymentReceived } from '@/lib/payments/engine'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string; paymentId: string }
}

// POST .../payments/[paymentId]/confirm — creator only, marked_paid -> confirmed.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, paymentId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedPayment(supabase, id, paymentId, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { row, payment, actorType } = authorized

    if (actorType !== 'creator') {
      return NextResponse.json({ error: 'Only the creator can confirm receipt' }, { status: 403 })
    }
    if (payment.status !== 'marked_paid') {
      return NextResponse.json({ error: `Cannot confirm from status "${payment.status}"` }, { status: 400 })
    }

    const result = await confirmPaymentReceived(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      paymentId,
      actorUserId: callerUserId,
    })

    if (!result.applied && result.record.status !== 'confirmed') {
      return NextResponse.json(
        { error: `This payment is now "${result.record.status}" — it can't be confirmed from here` },
        { status: 409 }
      )
    }

    return NextResponse.json({ message: 'Confirmed', payment: result.record })
  } catch (error) {
    captureError(error, { route: 'POST .../payments/[paymentId]/confirm' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
