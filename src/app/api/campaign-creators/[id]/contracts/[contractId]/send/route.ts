import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedContract } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromCreator } from '@/lib/notifications'
import { buildRenderedBody } from '@/lib/contracts/render'
import { hashContractBody } from '@/lib/contracts/template'

interface RouteParams {
  params: { id: string; contractId: string }
}

// POST .../contracts/[contractId]/send — brand only, draft -> sent. Renders
// the body once from current data and freezes it: body_snapshot/body_hash
// are never touched again after this (editing deliverables/fee afterward
// voids the contract instead, via voidContractOnTermsChange).
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, contractId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedContract(supabase, id, contractId, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { row, contract, actorType } = authorized

    if (actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can send a contract' }, { status: 403 })
    }
    if (contract.status !== 'draft') {
      return NextResponse.json({ error: `Cannot send from status "${contract.status}"` }, { status: 400 })
    }

    const bodySnapshot = await buildRenderedBody(supabase, id, contract)
    const bodyHash = hashContractBody(bodySnapshot)

    const { data: updated, error } = await supabase
      .from('campaign_contracts')
      .update({
        status: 'sent',
        body_snapshot: bodySnapshot,
        body_hash: bodyHash,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST .../contracts/[contractId]/send' })
      return NextResponse.json({ error: 'Failed to send contract' }, { status: 500 })
    }

    const creatorUserId = await getUserIdFromCreator(supabase, row.creator_id)

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      actorUserId: callerUserId,
      actorType,
      eventType: 'contract_sent',
      payload: { contract_id: contractId, version: contract.version },
      systemMessage: `📄 Contract sent for review and signature (v${contract.version}).`,
      notification: {
        recipientUserId: creatorUserId,
        type: 'contract_sent',
        title: 'Contract ready to sign',
        content: 'A contract is ready for you to read and sign',
      },
    })

    return NextResponse.json({ message: 'Contract sent', contract: updated })
  } catch (error) {
    captureError(error, { route: 'POST .../contracts/[contractId]/send' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
