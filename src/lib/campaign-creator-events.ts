import type { SupabaseClient } from '@supabase/supabase-js'
import { captureError } from '@/lib/error-tracking'
import type { NotificationType } from '@/lib/notifications'
import { postDealSystemMessage } from '@/lib/deal-messages'
import { emitEvent } from '@/lib/events/emit'

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
    // Vestigial — title/content/type are now generated from EVENT_CATALOG
    // (src/lib/events/catalog.ts), keyed by `eventType` above, so existing
    // call sites that still pass these keep compiling but the values are
    // ignored. New call sites only need `recipientUserId`.
    type?: NotificationType
    title?: string
    content?: string
  }
}

// Every offer/deliverable action does the same three things: log it to the
// row's activity timeline, post a system message in the Phase 1 thread, and
// notify the other party. Centralized here so no route forgets one of them.
//
// Fire-and-forget, guaranteed: the whole body is wrapped in try/catch, not
// just each individual Supabase call. emitEvent()/
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
    await postDealSystemMessage(supabase, {
      creatorId: params.creatorId,
      brandId: params.brandId,
      senderUserId: params.actorUserId,
      senderType: params.actorType,
      content: params.systemMessage,
      // Drives the actionable card + button in ChatThread, keyed off the
      // same eventType string driving everything else about this action —
      // see src/lib/campaign-creator-cta.ts.
      relatedType: params.eventType,
      relatedId: params.campaignCreatorId,
    })

    // emitEvent writes the campaign_creator_events row AND the notification
    // (if any) in one call — see src/lib/events/emit.ts. actorType is
    // folded into `data` so EVENT_CATALOG's templates (e.g. offer_countered's
    // "The brand"/"The creator") can read it.
    await emitEvent(supabase, {
      type: params.eventType,
      actorUserId: params.actorUserId,
      actorType: params.actorType,
      campaignCreatorId: params.campaignCreatorId,
      recipientUserIds: [params.notification?.recipientUserId],
      data: { ...(params.payload ?? {}), actorType: params.actorType },
    })
  } catch (error) {
    captureError(error, { context: 'recordCampaignCreatorAction', eventType: params.eventType })
  }
}
