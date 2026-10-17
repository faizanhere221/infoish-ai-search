import type { SupabaseClient } from '@supabase/supabase-js'
import { captureError } from '@/lib/error-tracking'
import { EVENT_CATALOG, type NotificationCategory } from '@/lib/events/catalog'
import { sendEmail, type EmailCategory } from '@/lib/email/send'
import { actionNotificationTemplate } from '@/lib/email/templates/actionNotification'
import { getEventCta, getEventTab } from '@/lib/campaign-creator-cta'
import { getUserIdFromCreator } from '@/lib/notifications'
import { signUnsubscribeToken } from '@/lib/email/unsubscribeToken'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'

// Immediate email, per Phase 6B's spec — a specific curated subset of
// 'action' events, not every one (e.g. deliverable_approved/posted are
// 'action' too but deliberately not here: the brand/creator already sees
// them the moment they open the app, and "a draft was approved" isn't as
// time-sensitive as "a contract is waiting on your signature"). Everything
// else ('info' events, and 'action' events not in this set) only ever
// reaches email through the daily summary.
const IMMEDIATE_EMAIL_EVENTS = new Set([
  'offer_sent',
  'offer_countered',
  'contract_sent',
  'contract_signed_by_creator',
  'deliverable_draft_submitted',
  'deliverable_changes_requested',
  'payment_marked_paid',
  'payment_disputed',
  'added_to_campaign',
])

export interface EmitEventParams {
  // Must be a key in EVENT_CATALOG (src/lib/events/catalog.ts) — also the
  // value written to campaign_creator_events.event_type and to
  // messages/notifications.related_type, matching the existing
  // eventType-reuse pattern (see src/lib/campaign-creator-cta.ts).
  type: string
  actorUserId: string
  // Required when campaignCreatorId is set — campaign_creator_events.actor_type
  // is NOT NULL. Not part of the caller's literal "never notify yourself"
  // concern, just data the event log needs; omit for non-campaign-creator
  // events (signups, applications, deals, messages).
  actorType?: 'brand' | 'creator'
  // One notification per id here, except the actor — you are never notified
  // about your own action. Pass `null`/`undefined` entries freely (e.g. a
  // lookup that came back empty); they're filtered out, not errors.
  recipientUserIds: (string | null | undefined)[]
  campaignCreatorId?: string
  // Defaults to `type` / `campaignCreatorId` — override only when a related
  // link target isn't the campaign_creators row itself (e.g. new_message's
  // related_id is the conversation id, not a row id).
  relatedType?: string
  relatedId?: string
  data?: Record<string, unknown>
}

// The one place every notification gets created, and the only place a
// campaign_creator_events row gets written for an event that has one. Never
// throws — a lost notification must never fail the action that triggered
// it, so every failure here is captureError() and move on.
export async function emitEvent(supabase: SupabaseClient, params: EmitEventParams): Promise<void> {
  try {
    const entry = EVENT_CATALOG[params.type]
    if (!entry) {
      captureError(new Error(`emitEvent: unknown event type "${params.type}"`), { context: 'emitEvent' })
      return
    }

    if (params.campaignCreatorId) {
      if (!params.actorType) {
        captureError(new Error(`emitEvent: actorType is required when campaignCreatorId is set (type=${params.type})`), {
          context: 'emitEvent',
        })
      } else {
        const { error } = await supabase.from('campaign_creator_events').insert({
          campaign_creator_id: params.campaignCreatorId,
          actor_user_id: params.actorUserId,
          actor_type: params.actorType,
          event_type: params.type,
          payload: params.data ?? {},
        })
        if (error) {
          captureError(error, { context: 'emitEvent: campaign_creator_events', type: params.type })
        }
      }
    }

    const relatedType = params.relatedType ?? params.type
    const relatedId = params.relatedId ?? params.campaignCreatorId ?? null
    const data = params.data ?? {}
    const title = entry.title(data)
    const content = entry.content(data)

    const recipients = [...new Set(
      params.recipientUserIds.filter((id): id is string => !!id && id !== params.actorUserId)
    )]

    for (const recipientUserId of recipients) {
      const { data: inserted, error } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientUserId,
          type: params.type,
          category: entry.category,
          priority: entry.priority,
          title,
          content,
          related_type: relatedType,
          related_id: relatedId,
          data,
          is_read: false,
        })
        .select('id')
        .single()
      if (error || !inserted) {
        captureError(error ?? new Error('notification insert returned no row'), { context: 'emitEvent: notification', type: params.type, recipientUserId })
        continue
      }

      if (IMMEDIATE_EMAIL_EVENTS.has(params.type)) {
        await maybeSendImmediateEmail(supabase, {
          notificationId: inserted.id,
          type: params.type,
          title,
          content,
          category: entry.category,
          campaignCreatorId: params.campaignCreatorId,
          recipientUserId,
        })
      }
    }
  } catch (error) {
    captureError(error, { context: 'emitEvent', type: params.type })
  }
}

// Only called for the curated IMMEDIATE_EMAIL_EVENTS set — never fails the
// caller (emitEvent already wraps this in its own try/catch at the call
// site's level, but this adds its own too, since a thrown lookup here must
// not skip whatever comes after it in the recipients loop).
async function maybeSendImmediateEmail(
  supabase: SupabaseClient,
  params: {
    notificationId: string
    type: string
    title: string
    content: string
    category: NotificationCategory
    campaignCreatorId?: string
    recipientUserId: string
  }
): Promise<void> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email, email_preferences')
      .eq('id', params.recipientUserId)
      .single()
    if (!user?.email) {return}

    const prefs = (user.email_preferences ?? {}) as Record<string, boolean>
    if (prefs[params.category] === false) {return}

    let buttonUrl = `${APP_URL}/notifications`
    let buttonLabel = 'View details'

    if (params.campaignCreatorId) {
      const { data: row } = await supabase
        .from('campaign_creators')
        .select('creator_id')
        .eq('id', params.campaignCreatorId)
        .single()
      if (row) {
        const creatorUserId = await getUserIdFromCreator(supabase, row.creator_id)
        const viewerType = creatorUserId === params.recipientUserId ? 'creator' : 'brand'
        const cta = getEventCta(params.type, viewerType)
        const tab = cta?.tab ?? getEventTab(params.type) ?? 'offer'
        buttonUrl = `${APP_URL}/dashboard/go/${params.campaignCreatorId}?tab=${tab}`
        buttonLabel = cta?.label ?? 'View details'
      }
    }

    const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?token=${signUnsubscribeToken(params.recipientUserId, params.category)}`
    const manageSettingsUrl = `${APP_URL}/settings`
    const template = actionNotificationTemplate({
      title: params.title,
      content: params.content,
      buttonLabel,
      buttonUrl,
      manageSettingsUrl,
      unsubscribeUrl,
    })

    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: params.category as EmailCategory,
      template: `action_${params.type}`,
      idempotencyKey: `notification:${params.notificationId}`,
      userId: params.recipientUserId,
      deferrable: true,
      unsubscribeUrl,
    })
  } catch (error) {
    captureError(error, { context: 'maybeSendImmediateEmail', type: params.type })
  }
}

// new_message is the one exception to "one row per event": an active
// conversation shouldn't flood the recipient's list with a fresh
// notification per message, so this upserts the single
// (user_id, related_type='conversation', related_id=conversationId) row
// instead of inserting — see idx_notifications_one_per_conversation in
// supabase/phase6a_notifications_migration.sql. Bumps it back to unread and
// refreshes the preview/timestamp even if it was already read.
const UNIQUE_VIOLATION = '23505'

export async function emitNewMessageNotification(
  supabase: SupabaseClient,
  params: { conversationId: string; senderUserId: string; recipientUserId: string | null | undefined; preview: string }
): Promise<void> {
  try {
    if (!params.recipientUserId || params.recipientUserId === params.senderUserId) {return}

    const entry = EVENT_CATALOG.new_message
    const data = { preview: params.preview }
    const row = {
      type: 'new_message',
      category: entry.category,
      priority: entry.priority,
      title: entry.title(data),
      content: entry.content(data),
      data,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', params.recipientUserId)
      .eq('related_type', 'conversation')
      .eq('related_id', params.conversationId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase.from('notifications').update(row).eq('id', existing.id)
      if (error) {captureError(error, { context: 'emitNewMessageNotification: update' })}
      return
    }

    const { error } = await supabase.from('notifications').insert({
      ...row,
      user_id: params.recipientUserId,
      related_type: 'conversation',
      related_id: params.conversationId,
    })
    if (error) {
      // Two messages sent in the same instant can both miss the SELECT
      // above — idx_notifications_one_per_conversation (partial unique
      // index) is the backstop: the loser's insert hits a unique
      // violation instead of creating a second row for the same
      // conversation. Fall back to the update that should have happened.
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        const { data: nowExisting } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', params.recipientUserId)
          .eq('related_type', 'conversation')
          .eq('related_id', params.conversationId)
          .maybeSingle()
        if (nowExisting) {
          await supabase.from('notifications').update(row).eq('id', nowExisting.id)
        }
        return
      }
      captureError(error, { context: 'emitNewMessageNotification: insert' })
    }
  } catch (error) {
    captureError(error, { context: 'emitNewMessageNotification' })
  }
}
