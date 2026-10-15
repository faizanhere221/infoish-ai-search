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
//
// Fire-and-forget, guaranteed: the whole body is wrapped in try/catch, not
// just each individual Supabase call. createNotification()/
// postDealSystemMessage() already swallow their own query errors, but a
// genuinely unexpected throw (a network blip, a malformed argument) must
// still never fail the offer/deliverable action that triggered this —
// losing a side-effect message is a bug, failing an offer a creator already
// committed to is a much worse one.
interface LogEventParams {
  campaignCreatorId: string
  actorUserId: string
  actorType: 'brand' | 'creator'
  eventType: string
  payload?: Record<string, unknown>
}

// Activity-trail-only logging for routine CRUD (adding/editing/removing a
// deliverable before any draft work exists) that doesn't warrant a system
// message or notification on its own. Use recordCampaignCreatorAction()
// instead for anything that changes the state the other party is waiting on.
export async function logCampaignCreatorEvent(supabase: SupabaseClient, params: LogEventParams): Promise<void> {
  const { error } = await supabase.from('campaign_creator_events').insert({
    campaign_creator_id: params.campaignCreatorId,
    actor_user_id: params.actorUserId,
    actor_type: params.actorType,
    event_type: params.eventType,
    payload: params.payload ?? {},
  })
  if (error) {
    captureError(error, { context: 'logCampaignCreatorEvent', eventType: params.eventType })
  }
}

export async function recordCampaignCreatorAction(
  supabase: SupabaseClient,
  params: RecordActionParams
): Promise<void> {
  try {
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
  } catch (error) {
    captureError(error, { context: 'recordCampaignCreatorAction', eventType: params.eventType })
  }
}
