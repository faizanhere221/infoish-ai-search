import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { adminCancelPayment } from '@/lib/payments/engine'

export const dynamic = 'force-dynamic'

// POST /api/admin/payments/[id]/cancel — admin override cancel, broader
// than the brand's own cancel (scheduled/due only): also reaches
// marked_paid/disputed, for resolving an escalation. Notifies both parties
// via emitEvent (src/lib/payments/engine.ts).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { data: before } = await supabase.from('creator_payments').select('*').eq('id', params.id).single()
    if (!before) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    if (['confirmed', 'cancelled'].includes(before.status)) {
      return NextResponse.json({ error: `A ${before.status} payment can't be cancelled` }, { status: 400 })
    }

    const { data: cc } = await supabase
      .from('campaign_creators')
      .select('id, campaign_id, creator_id')
      .eq('id', before.campaign_creator_id)
      .single()
    if (!cc) {
      return NextResponse.json({ error: 'Workflow row not found for this payment' }, { status: 404 })
    }
    const { data: campaign } = await supabase.from('campaigns').select('brand_id').eq('id', cc.campaign_id).single()
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found for this payment' }, { status: 404 })
    }

    const adminId = request.headers.get('x-user-id')
    const { record, applied } = await adminCancelPayment(supabase, {
      campaignCreatorId: cc.id,
      creatorId: cc.creator_id,
      brandId: campaign.brand_id,
      paymentId: params.id,
      reason: reasonCheck.reason,
      actorUserId: adminId ?? '',
    })

    if (!applied) {
      return NextResponse.json({ error: 'This payment already moved on — someone else may have already acted on it', payment: record }, { status: 409 })
    }

    logAdminAction({
      request,
      adminId,
      action: 'payment_admin_cancelled',
      targetType: 'payment',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { status: before.status },
      after: { status: record.status },
    })

    return NextResponse.json({ payment: record })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/payments/[id]/cancel' })
    return NextResponse.json({ error: 'Failed to cancel payment' }, { status: 500 })
  }
}
