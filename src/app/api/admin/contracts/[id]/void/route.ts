import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { emitEvent } from '@/lib/events/emit'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'

// POST /api/admin/contracts/[id]/void — admin override void, broader than
// voidContractOnTermsChange (which only ever voids a fully_signed contract
// automatically): an admin can void any non-void contract, at any stage.
// Notifies both parties via emitEvent.
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

    const { data: before } = await supabase.from('campaign_contracts').select('id, status, campaign_creator_id').eq('id', params.id).single()
    if (!before) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }
    if (before.status === 'void') {
      return NextResponse.json({ error: 'This contract is already void' }, { status: 400 })
    }

    const { data: cc } = await supabase.from('campaign_creators').select('id, campaign_id, creator_id').eq('id', before.campaign_creator_id).single()
    if (!cc) {
      return NextResponse.json({ error: 'Workflow row not found for this contract' }, { status: 404 })
    }
    const { data: campaign } = await supabase.from('campaigns').select('brand_id').eq('id', cc.campaign_id).single()
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found for this contract' }, { status: 404 })
    }

    const { data: contract, error } = await supabase
      .from('campaign_contracts')
      .update({ status: 'void', voided_reason: `Voided by admin: ${reasonCheck.reason}`, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .neq('status', 'void')
      .select()
      .maybeSingle()

    if (error) {
      captureError(error, { route: 'POST /api/admin/contracts/[id]/void' })
      return NextResponse.json({ error: 'Failed to void contract' }, { status: 500 })
    }
    if (!contract) {
      return NextResponse.json({ error: 'This contract was already voided by someone else' }, { status: 409 })
    }

    const adminId = request.headers.get('x-user-id')
    const [brandUserId, creatorUserId] = await Promise.all([
      getUserIdFromBrand(supabase, campaign.brand_id),
      getUserIdFromCreator(supabase, cc.creator_id),
    ])

    await emitEvent(supabase, {
      type: 'contract_voided_by_admin',
      actorUserId: adminId ?? '',
      actorType: 'admin',
      campaignCreatorId: cc.id,
      recipientUserIds: [brandUserId, creatorUserId],
      data: { contract_id: contract.id, reason: reasonCheck.reason },
    })

    logAdminAction({
      request,
      adminId,
      action: 'contract_voided_by_admin',
      targetType: 'contract',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { status: before.status },
      after: { status: 'void' },
    })

    return NextResponse.json({ contract })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/contracts/[id]/void' })
    return NextResponse.json({ error: 'Failed to void contract' }, { status: 500 })
  }
}
