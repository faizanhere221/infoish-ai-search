import type { SupabaseClient } from '@supabase/supabase-js'
import { captureError } from '@/lib/error-tracking'

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

// related_type values used by the `related_type`/`related_id` columns below,
// resolved back into a link by the notifications page (src/app/notifications/page.tsx)
export type NotificationRelatedType = 'deal' | 'campaign' | 'campaign_application' | 'partner' | 'campaign_creator'

interface NotificationPayload {
  userId: string
  type: NotificationType
  title: string
  content: string
  relatedType?: NotificationRelatedType
  relatedId?: string
}

// Fire-and-forget: logs on error, never throws (never blocks the calling route).
// Columns match the real `notifications` table (schema.sql:465-485): content,
// related_type, related_id — NOT message/link, which don't exist on the table.
export async function createNotification(
  supabase: SupabaseClient,
  payload: NotificationPayload
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    content: payload.content,
    related_type: payload.relatedType ?? null,
    related_id: payload.relatedId ?? null,
    is_read: false,
  })
  if (error) {
    captureError(error, { context: 'createNotification', type: payload.type })
  }
}

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
