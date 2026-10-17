import type { SupabaseClient } from '@supabase/supabase-js'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'
import { formatMoney } from '@/components/campaigns/utils'

export interface AuthorizedCampaignCreatorRow {
  id: string
  campaign_id: string
  creator_id: string
  status: string
  payout_amount: number | null
  charge_amount: number | null
  currency: string
  planned_date: string | null
  status_locked: boolean
  brand_id: string
}

export type CampaignCreatorActor = 'brand' | 'creator'

// Loads a campaign_creators row and checks the caller (from trusted auth
// headers, never a client-supplied id) is either the owning brand or the
// row's own creator. Returns null for anyone else — callers should respond
// 404, so a stranger can't use the response to confirm a row exists.
export async function loadAuthorizedCampaignCreatorRow(
  supabase: SupabaseClient,
  rowId: string,
  callerProfileId: string | null,
  callerUserType: string | null
): Promise<{ row: AuthorizedCampaignCreatorRow; actorType: CampaignCreatorActor } | null> {
  const { data: row } = await supabase
    .from('campaign_creators')
    .select('id, campaign_id, creator_id, status, payout_amount, charge_amount, currency, planned_date, status_locked')
    .eq('id', rowId)
    .single()

  if (!row) {return null}

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('brand_id')
    .eq('id', row.campaign_id)
    .single()

  if (!campaign) {return null}

  if (callerUserType === 'brand' && callerProfileId === campaign.brand_id) {
    return { row: { ...row, brand_id: campaign.brand_id }, actorType: 'brand' }
  }
  if (callerUserType === 'creator' && callerProfileId === row.creator_id) {
    return { row: { ...row, brand_id: campaign.brand_id }, actorType: 'creator' }
  }
  return null
}

// Same, but also loads and scopes a creator_deliverables row that must
// belong to this campaign_creators row.
export async function loadAuthorizedDeliverable(
  supabase: SupabaseClient,
  rowId: string,
  deliverableId: string,
  callerProfileId: string | null,
  callerUserType: string | null
) {
  const authorized = await loadAuthorizedCampaignCreatorRow(supabase, rowId, callerProfileId, callerUserType)
  if (!authorized) {return null}

  const { data: deliverable } = await supabase
    .from('creator_deliverables')
    .select('*')
    .eq('id', deliverableId)
    .eq('campaign_creator_id', rowId)
    .single()

  if (!deliverable) {return null}

  return { ...authorized, deliverable }
}

// Same pattern, scoped to a campaign_contracts row belonging to this
// campaign_creators row.
export async function loadAuthorizedContract(
  supabase: SupabaseClient,
  rowId: string,
  contractId: string,
  callerProfileId: string | null,
  callerUserType: string | null
) {
  const authorized = await loadAuthorizedCampaignCreatorRow(supabase, rowId, callerProfileId, callerUserType)
  if (!authorized) {return null}

  const { data: contract } = await supabase
    .from('campaign_contracts')
    .select('*')
    .eq('id', contractId)
    .eq('campaign_creator_id', rowId)
    .single()

  if (!contract) {return null}

  return { ...authorized, contract }
}

// Same pattern, scoped to a creator_payments row belonging to this
// campaign_creators row.
export async function loadAuthorizedPayment(
  supabase: SupabaseClient,
  rowId: string,
  paymentId: string,
  callerProfileId: string | null,
  callerUserType: string | null
) {
  const authorized = await loadAuthorizedCampaignCreatorRow(supabase, rowId, callerProfileId, callerUserType)
  if (!authorized) {return null}

  const { data: payment } = await supabase
    .from('creator_payments')
    .select('*')
    .eq('id', paymentId)
    .eq('campaign_creator_id', rowId)
    .single()

  if (!payment) {return null}

  return { ...authorized, payment }
}

// Expires any pending offer on a row whose expires_at has passed. Lazy
// expiry — there's no cron infrastructure in this app, so every route that
// reads or acts on a row's offers calls this first instead. Notifies the
// original sender (same "who hears about it" rule as decline/withdraw) once
// per offer that actually transitions — never on a call that finds nothing
// to expire.
export async function expireStaleOffers(supabase: SupabaseClient, campaignCreatorId: string): Promise<void> {
  const { data: expired } = await supabase
    .from('campaign_offers')
    .update({ status: 'expired', responded_at: new Date().toISOString() })
    .eq('campaign_creator_id', campaignCreatorId)
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null)
    .select('id, from_party, amount, currency')

  if (!expired || expired.length === 0) {return}

  const { data: row } = await supabase
    .from('campaign_creators')
    .select('creator_id, campaign_id')
    .eq('id', campaignCreatorId)
    .single()
  if (!row) {return}

  const { data: campaign } = await supabase.from('campaigns').select('brand_id').eq('id', row.campaign_id).single()
  if (!campaign) {return}

  const creatorUserId = await getUserIdFromCreator(supabase, row.creator_id)
  const brandUserId = await getUserIdFromBrand(supabase, campaign.brand_id)

  for (const offer of expired) {
    // The event log needs a real actor_user_id (FK to users) and emitEvent
    // never notifies its own actor — so the "actor" here is whoever did NOT
    // send the offer (their non-response is what let it lapse), and the
    // recipient is the original sender, same direction as decline/withdraw.
    const senderIsBrand = offer.from_party === 'brand'
    const actorUserId = senderIsBrand ? creatorUserId : brandUserId
    const recipientUserId = senderIsBrand ? brandUserId : creatorUserId
    if (!actorUserId) {continue}

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId,
      creatorId: row.creator_id,
      brandId: campaign.brand_id,
      actorUserId,
      actorType: senderIsBrand ? 'creator' : 'brand',
      eventType: 'offer_expired',
      payload: { offer_id: offer.id, amount: offer.amount, currency: offer.currency },
      systemMessage: `⌛ An offer of ${formatMoney(offer.amount, offer.currency)} expired without a response.`,
      notification: { recipientUserId },
    })
  }
}
