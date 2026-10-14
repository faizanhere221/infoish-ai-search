import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthorizedConversation {
  id: string
  creator_id: string
  brand_id: string
  creator_unread: number
  brand_unread: number
}

// Loads a conversation and checks the caller (from trusted auth headers,
// never a client-supplied id) is one of its two parties. Returns null if
// not found OR not a party — callers should respond 404 either way, so a
// stranger can't use the response to confirm a conversation id exists.
export async function loadAuthorizedConversation(
  supabase: SupabaseClient,
  conversationId: string,
  callerProfileId: string | null
): Promise<AuthorizedConversation | null> {
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, creator_id, brand_id, creator_unread, brand_unread')
    .eq('id', conversationId)
    .single()

  if (!conversation) {return null}
  if (callerProfileId !== conversation.creator_id && callerProfileId !== conversation.brand_id) {
    return null
  }
  return conversation
}
