import type { SupabaseClient } from '@supabase/supabase-js'

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

// Expires any pending offer on a row whose expires_at has passed. Lazy
// expiry — there's no cron infrastructure in this app, so every route that
// reads or acts on a row's offers calls this first instead.
export async function expireStaleOffers(supabase: SupabaseClient, campaignCreatorId: string): Promise<void> {
  await supabase
    .from('campaign_offers')
    .update({ status: 'expired', responded_at: new Date().toISOString() })
    .eq('campaign_creator_id', campaignCreatorId)
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null)
}
