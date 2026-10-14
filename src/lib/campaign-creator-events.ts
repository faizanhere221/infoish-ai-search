import type { SupabaseClient } from '@supabase/supabase-js'
import { captureError } from '@/lib/error-tracking'
import { createNotification, type NotificationType } from '@/lib/notifications'
import { postDealSystemMessage } from '@/lib/deal-messages'

interface RecordActionParams {
  campaignCreatorId: string
  creatorId: string
  brandId: string
  actorUserId: string
  actorType: 'brand' | 'creator'
  eventType: string
  payload?: Record<string, unknown>
  systemMessage: string
  notification?: {
    recipientUserId: string | null
    type: NotificationType
    title: string
    content: string
  }
}

// Every offer/deliverable action does the same three things: log it to the
// row's activity timeline, post a system message in the Phase 1 thread, and
// notify the other party. Centralized here so no route forgets one of them.
// Fire-and-forget: logs on error, never throws (never blocks the action that
// triggered it).
export async function recordCampaignCreatorAction(
  supabase: SupabaseClient,
  params: RecordActionParams
): Promise<void> {
  const { error: eventError } = await supabase.from('campaign_creator_events').insert({
    campaign_creator_id: params.campaignCreatorId,
    actor_user_id: params.actorUserId,
    actor_type: params.actorType,
    event_type: params.eventType,
    payload: params.payload ?? {},
  })
  if (eventError) {
    captureError(eventError, { context: 'recordCampaignCreatorAction: event log', eventType: params.eventType })
  }

  await postDealSystemMessage(supabase, {
    creatorId: params.creatorId,
    brandId: params.brandId,
    senderUserId: params.actorUserId,
    senderType: params.actorType,
    content: params.systemMessage,
  })

  if (params.notification?.recipientUserId) {
    await createNotification(supabase, {
      userId: params.notification.recipientUserId,
      type: params.notification.type,
      title: params.notification.title,
      content: params.notification.content,
      relatedType: 'campaign_creator',
      relatedId: params.campaignCreatorId,
    })
  }
}
