import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { adminResolveDispute } from '@/lib/payments/engine'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const VALID_RESOLUTIONS = ['marked_paid', 'confirmed']

// POST /api/admin/payments/[id]/resolve-dispute — admin decides which way a
// dispute actually went: back to marked_paid (the creator needs to confirm
// again) or straight to confirmed (the admin treats the brand's payment as
// settled). Notifies both parties via emitEvent (src/lib/payments/engine.ts).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))

    if (!VALID_RESOLUTIONS.includes(body.resolution)) {
      return NextResponse.json({ error: `resolution must be one of: ${VALID_RESOLUTIONS.join(', ')}` }, { status: 400 })
    }
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { data: before } = await supabase.from('creator_payments').select('*').eq('id', params.id).single()
    if (!before) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    if (before.status !== 'disputed') {
      return NextResponse.json({ error: `Only a disputed payment can be resolved this way (current status: ${before.status})` }, { status: 400 })
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
    const { record, applied } = await adminResolveDispute(supabase, {
      campaignCreatorId: cc.id,
      creatorId: cc.creator_id,
      brandId: campaign.brand_id,
      paymentId: params.id,
      resolution: body.resolution,
      resolutionNote: reasonCheck.reason,
      actorUserId: adminId ?? '',
    })

    if (!applied) {
      return NextResponse.json({ error: 'This payment is no longer disputed — someone else may have already acted on it', payment: record }, { status: 409 })
    }

    logAdminAction({
      request,
      adminId,
      action: 'payment_dispute_resolved',
      targetType: 'payment',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { status: before.status, dispute_reason: before.dispute_reason },
      after: { status: record.status },
    })

    return NextResponse.json({ payment: record })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/payments/[id]/resolve-dispute' })
    return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 })
  }
}
