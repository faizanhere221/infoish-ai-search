import type { SupabaseClient } from '@supabase/supabase-js'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'

interface VoidOnChangeParams {
  campaignCreatorId: string
  creatorId: string
  brandId: string
  actorUserId: string
  reason: string
  recipientUserId: string | null
}

// Changing the fee or a deliverable's scope/dates after a contract is fully
// signed invalidates it — the signed document no longer matches reality.
// Called from the routes that make those edits (deliverables PUT/split/
// DELETE, campaign_creators PUT when payout_amount changes). Only voids a
// contract that is actually 'fully_signed' — a draft/sent/declined one isn't
// "signed" yet, so editing terms before that point is normal and expected.
export async function voidContractOnTermsChange(
  supabase: SupabaseClient,
  params: VoidOnChangeParams
): Promise<boolean> {
  const { data: contract } = await supabase
    .from('campaign_contracts')
    .select('id')
    .eq('campaign_creator_id', params.campaignCreatorId)
    .eq('status', 'fully_signed')
    .maybeSingle()

  if (!contract) {return false}

  await supabase
    .from('campaign_contracts')
    .update({
      status: 'void',
      voided_reason: `Automatically voided: ${params.reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contract.id)

  await recordCampaignCreatorAction(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    creatorId: params.creatorId,
    brandId: params.brandId,
    actorUserId: params.actorUserId,
    actorType: 'brand',
    eventType: 'contract_voided',
    payload: { contract_id: contract.id, reason: params.reason },
    systemMessage: `⚠️ The signed contract was voided: ${params.reason}. A new version is needed.`,
    notification: {
      recipientUserId: params.recipientUserId,
      type: 'contract_voided',
      title: 'Contract voided',
      content: `The signed contract was voided: ${params.reason}`,
    },
  })

  return true
}
