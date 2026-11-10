'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useActivity } from './useActivity'

export interface ConversationSummary {
  id: string
  creator_id: string
  brand_id: string
  deal_id: string | null
  last_message_at: string | null
  last_message_preview: string | null
  creator_unread: number
  brand_unread: number
  created_at: string
  updated_at: string
  creator: { id: string; username: string; display_name: string; profile_photo_url: string | null } | null
  brand: { id: string; company_name: string; logo_url: string | null; contact_name: string | null } | null
}

// Conversation list + unread badge. The full list (4 queries, with names
// and avatars) loads once; after that it reloads only when the shared
// once-a-minute activity check (useActivity) reports a new message or an
// unread change, so an unchanged inbox costs one tiny request a minute.
export function useConversationsList(
  userType: 'brand' | 'creator' | null,
  profileId: string | null,
  token: string | null
) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tokenRef = useRef(token)
  tokenRef.current = token

  const fetchList = useCallback(async () => {
    if (!profileId || !userType) {return}
    try {
      const qs = userType === 'brand' ? `brand_id=${profileId}` : `creator_id=${profileId}`
      const headers: Record<string, string> = tokenRef.current
        ? { Authorization: `Bearer ${tokenRef.current}` }
        : {}
      const res = await fetch(`/api/conversations?${qs}`, { headers })
      if (!res.ok) {throw new Error('Failed to load conversations')}
      const data = await res.json()
      setConversations(data.conversations || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [profileId, userType])

  useEffect(() => { fetchList() }, [fetchList])

  const { activity } = useActivity(profileId && userType ? token : null)
  const messagesVersion = activity?.messages.version ?? null
  const seenVersionRef = useRef<string | null>(null)
  useEffect(() => {
    if (messagesVersion === null) {return}
    // The first answer only records the version: the list was just loaded.
    if (seenVersionRef.current !== null && seenVersionRef.current !== messagesVersion) {void fetchList()}
    seenVersionRef.current = messagesVersion
  }, [messagesVersion, fetchList])

  const unreadTotal = conversations.reduce((sum, c) => {
    const count = userType === 'brand' ? c.brand_unread : c.creator_unread
    return sum + (count || 0)
  }, 0)

  return { conversations, loading, error, unreadTotal, refresh: fetchList }
}
