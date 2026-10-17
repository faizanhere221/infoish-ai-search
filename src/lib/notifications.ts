import type { SupabaseClient } from '@supabase/supabase-js'

// Still used by the vestigial optional `notification.type` field in
// RecordActionParams (src/lib/campaign-creator-events.ts) — EVENT_CATALOG
// (src/lib/events/catalog.ts) is the real source of notification copy now.
export type NotificationType =
  | 'deal_created'
  | 'deal_accepted'
  | 'deal_declined'
  | 'deal_delivered'
  | 'deal_approved'
  | 'deal_completed'
  | 'deal_revision'
  | 'new_message'
  | 'campaign_application'
  | 'campaign_application_update'
  | 'referral_commission_earned'
  | 'referral_commission_approved'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_declined'
  | 'offer_countered'
  | 'offer_withdrawn'
  | 'deliverable_draft_submitted'
  | 'deliverable_changes_requested'
  | 'deliverable_approved'
  | 'deliverable_posted'
  | 'deliverable_completed'
  | 'contract_sent'
  | 'contract_signed'
  | 'contract_fully_signed'
  | 'contract_voided'
  | 'payment_due'
  | 'payment_marked_paid'
  | 'payment_confirmed'
  | 'payment_disputed'
  | 'payment_cancelled'
  | 'payout_method_missing'

// Look up user_id from a creator profile id
export async function getUserIdFromCreator(
  supabase: SupabaseClient,
  creatorId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('creators')
    .select('user_id')
    .eq('id', creatorId)
    .single()
  return data?.user_id ?? null
}

// Look up user_id from a brand profile id
export async function getUserIdFromBrand(
  supabase: SupabaseClient,
  brandId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('brands')
    .select('user_id')
    .eq('id', brandId)
    .single()
  return data?.user_id ?? null
}
