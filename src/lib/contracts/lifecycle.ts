import type { SupabaseClient } from '@supabase/supabase-js'
import { recordCampaignCreatorAction, logCampaignCreatorEvent } from '@/lib/campaign-creator-events'

interface CreateDraftContractParams {
  campaignCreatorId: string
  campaignId: string
  actorUserId: string
}

// Creates the first draft version of a contract for a row, pre-filled from
// the campaign's default payment terms / kill fee and linked to the most
// recently accepted offer (if any). Shared by the brand's manual "Draft a
// contract" button (POST .../contracts) and the offer-accept route, which
// calls this automatically the moment an offer is accepted — a brand
// shouldn't have to remember a separate step to start the contract once
// there's a deal to put in writing. Returns null if a non-void contract
// already exists on the row (the brand already has one in flight) rather
// than erroring, so the automatic call site can just skip silently.
export async function createDraftContract(
  supabase: SupabaseClient,
  params: CreateDraftContractParams
): Promise<{ id: string; version: number } | null> {
  const { data: existing } = await supabase
    .from('campaign_contracts')
    .select('id')
    .eq('campaign_creator_id', params.campaignCreatorId)
    .neq('status', 'void')
    .maybeSingle()

  if (existing) {return null}

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('default_payment_terms_days, default_kill_fee_percent')
    .eq('id', params.campaignId)
    .single()

  const { data: latestOffer } = await supabase
    .from('campaign_offers')
    .select('id')
    .eq('campaign_creator_id', params.campaignCreatorId)
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: existingVersions } = await supabase
    .from('campaign_contracts')
    .select('version')
    .eq('campaign_creator_id', params.campaignCreatorId)
    .order('version', { ascending: false })
    .limit(1)

  const nextVersion = existingVersions && existingVersions.length > 0 ? existingVersions[0].version + 1 : 1

  const { data: created, error } = await supabase
    .from('campaign_contracts')
    .insert({
      campaign_creator_id: params.campaignCreatorId,
      offer_id: latestOffer?.id ?? null,
      version: nextVersion,
      status: 'draft',
      payment_terms_days: campaign?.default_payment_terms_days ?? 14,
      kill_fee_percent: campaign?.default_kill_fee_percent ?? 50,
    })
    .select('id, version')
    .single()

  if (error || !created) {return null}

  await logCampaignCreatorEvent(supabase, {
    campaignCreatorId: params.campaignCreatorId,
    actorUserId: params.actorUserId,
    actorType: 'brand',
    eventType: 'contract_drafted',
    payload: { contract_id: created.id, version: created.version },
  })

  return created
}

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
