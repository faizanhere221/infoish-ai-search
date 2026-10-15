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

const SignSchema = z.object({
  signer_name: z.string().min(1).max(255),
  agree: z.literal(true),
})

function clientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

// POST .../contracts/[contractId]/sign — the creator signs first (sent ->
// signed_by_creator), then the brand countersigns (signed_by_creator ->
// fully_signed). Each signature is a typed full name plus the explicit
// "I agree this is my electronic signature" checkbox, with IP/user-agent
// captured for tamper-evidence alongside the body_hash.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, contractId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = SignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Type your full name and confirm the electronic signature checkbox', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedContract(supabase, id, contractId, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { row, contract, actorType } = authorized

    const ip = clientIp(request)
    const ua = request.headers.get('user-agent') || 'unknown'
    const now = new Date().toISOString()

    let updates: Record<string, unknown>
    let nextStatus: string
    let eventType: string
    let systemMessage: string
    let recipientUserId: string | null
    let notificationType: 'contract_signed' | 'contract_fully_signed'
    let notificationTitle: string
    let notificationContent: string

    if (actorType === 'creator' && contract.status === 'sent') {
      nextStatus = 'signed_by_creator'
      updates = {
        status: nextStatus,
        creator_signer_name: parsed.data.signer_name,
        creator_signed_at: now,
        creator_sign_ip: ip,
        creator_sign_ua: ua,
        updated_at: now,
      }
      eventType = 'contract_signed_by_creator'
      systemMessage = `✍️ Creator signed the contract. Waiting on the brand's countersignature.`
      recipientUserId = await getUserIdFromBrand(supabase, row.brand_id)
      notificationType = 'contract_signed'
      notificationTitle = 'Creator signed the contract'
      notificationContent = 'Countersign to make the contract fully signed'
    } else if (actorType === 'brand' && contract.status === 'signed_by_creator') {
      nextStatus = 'fully_signed'
      updates = {
        status: nextStatus,
        brand_signer_name: parsed.data.signer_name,
        brand_signed_at: now,
        brand_sign_ip: ip,
        brand_sign_ua: ua,
        updated_at: now,
      }
      eventType = 'contract_fully_signed'
      systemMessage = `✅ Contract fully signed by both parties.`
      recipientUserId = await getUserIdFromCreator(supabase, row.creator_id)
      notificationType = 'contract_fully_signed'
      notificationTitle = 'Contract fully signed'
      notificationContent = 'Both parties have signed the contract'
    } else {
      return NextResponse.json(
        { error: `You cannot sign this contract from status "${contract.status}"` },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabase
      .from('campaign_contracts')
      .update(updates)
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST .../contracts/[contractId]/sign' })
      return NextResponse.json({ error: 'Failed to sign contract' }, { status: 500 })
    }

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      actorUserId: callerUserId,
      actorType,
      eventType,
      payload: { contract_id: contractId, version: contract.version },
      systemMessage,
      notification: {
        recipientUserId,
        type: notificationType,
        title: notificationTitle,
        content: notificationContent,
      },
    })

    return NextResponse.json({ message: 'Signed', contract: updated })
  } catch (error) {
    captureError(error, { route: 'POST .../contracts/[contractId]/sign' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
