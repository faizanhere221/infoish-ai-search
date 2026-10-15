import type { SupabaseClient } from '@supabase/supabase-js'
import { renderContractBody } from '@/lib/contracts/template'

interface ContractTerms {
  special_terms: string | null
  payment_terms_days: number
  kill_fee_percent: number
}

// Shared by the draft preview (GET) and the send route's frozen snapshot —
// pulls the current brand/creator/campaign/deliverable state and renders it
// through the one template so both paths can never drift apart. Deliberately
// never touches charge_amount, brand_notes, or client_name.
export async function buildRenderedBody(
  supabase: SupabaseClient,
  campaignCreatorId: string,
  contract: ContractTerms
): Promise<string> {
  const { data: row } = await supabase
    .from('campaign_creators')
    .select('campaign_id, creator_id, payout_amount, currency')
    .eq('id', campaignCreatorId)
    .single()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('title, brand_id')
    .eq('id', row?.campaign_id)
    .single()

  const { data: brand } = await supabase
    .from('brands')
    .select('company_name')
    .eq('id', campaign?.brand_id)
    .single()

  const { data: creator } = await supabase
    .from('creators')
    .select('display_name, username')
    .eq('id', row?.creator_id)
    .single()

  const { data: deliverables } = await supabase
    .from('creator_deliverables')
    .select('title, platform, format, draft_due, publish_due, revisions_allowed')
    .eq('campaign_creator_id', campaignCreatorId)
    .order('created_at', { ascending: true })

  const { data: latestOffer } = await supabase
    .from('campaign_offers')
    .select('usage_rights')
    .eq('campaign_creator_id', campaignCreatorId)
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return renderContractBody({
    brandCompanyName: brand?.company_name || 'The brand',
    creatorDisplayName: creator?.display_name || 'The creator',
    creatorHandle: creator?.username || '',
    campaignTitle: campaign?.title || 'Untitled campaign',
    deliverables: deliverables || [],
    feeAmount: row?.payout_amount ?? null,
    currency: row?.currency || 'USD',
    paymentTermsDays: contract.payment_terms_days,
    killFeePercent: contract.kill_fee_percent,
    usageRights: latestOffer?.usage_rights ?? null,
    specialTerms: contract.special_terms,
  })
}
