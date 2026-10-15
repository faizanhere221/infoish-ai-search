import type { SupabaseClient } from '@supabase/supabase-js'
import { captureError } from '@/lib/error-tracking'

interface DealSystemMessageParams {
  // Optional — only set on the conversation when provided. Phase 3's
  // campaign_creators-driven system messages (offers, deliverables) have no
  // associated deal, so they omit it.
  dealId?: string
  creatorId: string
  brandId: string
  senderUserId: string
  senderType: 'creator' | 'brand'
  content: string
  // Drives the actionable card + deep-link button in ChatThread — see
  // src/lib/campaign-creator-cta.ts. Omitted for deal-flow messages that
  // predate the campaign_creators workflow.
  relatedType?: string
  relatedId?: string
}

// Posts a system message into the creator/brand pair's conversation, finding
// or creating it by (creator_id, brand_id) since neither `deals` nor
// `campaign_creators` has a conversation_id column (only the reverse:
// conversations.deal_id). Also bumps the OTHER party's unread counter and
// the conversation preview, same as a normal message, so the system message
// surfaces in the inbox list. Fire-and-forget: logs on error, never throws
// (never blocks the status transition that triggered it).
export async function postDealSystemMessage(
  supabase: SupabaseClient,
  params: DealSystemMessageParams
): Promise<void> {
  const { dealId, creatorId, brandId, senderUserId, senderType, content, relatedType, relatedId } = params

  const { data: existing } = await supabase
    .from('conversations')
    .select('id, creator_unread, brand_unread')
    .eq('creator_id', creatorId)
    .eq('brand_id', brandId)
    .single()

  let conversationId: string
  let creatorUnread = 0
  let brandUnread = 0

  if (existing) {
    conversationId = existing.id
    creatorUnread = existing.creator_unread || 0
    brandUnread = existing.brand_unread || 0
  } else {
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({
        creator_id: creatorId,
        brand_id: brandId,
        ...(dealId ? { deal_id: dealId } : {}),
        creator_unread: 0,
        brand_unread: 0,
      })
      .select('id')
      .single()

    if (error || !created) {
      captureError(error ?? new Error('Failed to create conversation for deal system message'), {
        context: 'postDealSystemMessage',
        dealId,
      })
      return
    }
    conversationId = created.id
  }

  const { error: messageError } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderUserId,
    content,
    is_system: true,
    attachments: [],
    is_read: false,
    related_type: relatedType ?? null,
    related_id: relatedId ?? null,
  })

  if (messageError) {
    captureError(messageError, { context: 'postDealSystemMessage: insert message', dealId })
    return
  }

  const unreadUpdate = senderType === 'creator'
    ? { brand_unread: brandUnread + 1 }
    : { creator_unread: creatorUnread + 1 }

  await supabase
    .from('conversations')
    .update({
      ...unreadUpdate,
      last_message_at: new Date().toISOString(),
      last_message_preview: content.substring(0, 100),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
}
