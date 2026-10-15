import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedContract } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'
import { z } from 'zod'

interface RouteParams {
  params: { id: string; contractId: string }
}

const DeclineSchema = z.object({
  reason: z.string().min(1).max(1000),
})

const DECLINABLE_STATUSES = ['sent', 'signed_by_creator', 'signed_by_brand']

// POST .../contracts/[contractId]/decline — either party, while the
// contract is out for signature but not yet fully signed. The brand can
// send a new version (a new draft) once this one is void.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, contractId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = DeclineSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'A reason is required', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedContract(supabase, id, contractId, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { row, contract, actorType } = authorized

    if (!DECLINABLE_STATUSES.includes(contract.status)) {
      return NextResponse.json(
        { error: `Cannot decline a contract in status "${contract.status}"` },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabase
      .from('campaign_contracts')
      .update({
        status: 'void',
        voided_reason: parsed.data.reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST .../contracts/[contractId]/decline' })
      return NextResponse.json({ error: 'Failed to decline contract' }, { status: 500 })
    }

    const recipientUserId = actorType === 'brand'
      ? await getUserIdFromCreator(supabase, row.creator_id)
      : await getUserIdFromBrand(supabase, row.brand_id)

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      actorUserId: callerUserId,
      actorType,
      eventType: 'contract_declined',
      payload: { contract_id: contractId, version: contract.version, reason: parsed.data.reason },
      systemMessage: `❌ Contract declined: ${parsed.data.reason}`,
      notification: {
        recipientUserId,
        type: 'contract_voided',
        title: 'Contract declined',
        content: `The contract was declined: ${parsed.data.reason}`,
      },
    })

    return NextResponse.json({ message: 'Contract declined', contract: updated })
  } catch (error) {
    captureError(error, { route: 'POST .../contracts/[contractId]/decline' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
