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
