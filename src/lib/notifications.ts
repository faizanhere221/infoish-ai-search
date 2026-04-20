import type { SupabaseClient } from '@supabase/supabase-js'

export type NotificationType =
  | 'deal_created'
  | 'deal_accepted'
  | 'deal_declined'
  | 'deal_delivered'
  | 'deal_approved'
  | 'deal_completed'
  | 'deal_revision'
  | 'new_message'

interface NotificationPayload {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}

// Fire-and-forget: logs on error, never throws (never blocks the calling route)
export async function createNotification(
  supabase: SupabaseClient,
  payload: NotificationPayload
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link ?? null,
    is_read: false,
  })
  if (error) {
    console.error('Failed to create notification:', error.message)
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
