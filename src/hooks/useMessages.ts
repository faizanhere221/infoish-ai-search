'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Conversation, Message } from '@/types/marketplace'

interface UseConversationsOptions {
  userId: string
  userType: 'creator' | 'brand'
  autoFetch?: boolean
}

interface UseConversationsReturn {
  conversations: Conversation[]
  isLoading: boolean
  error: string | null
  totalUnread: number
  refetch: () => Promise<void>
  createConversation: (creatorId: string, brandId: string) => Promise<{ conversation?: Conversation; error?: string }>
}

export function useConversations({ userId, userType, autoFetch = true }: UseConversationsOptions): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        user_id: userId,
        user_type: userType,
      })

      const response = await fetch(`/api/conversations?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversations')
      }

      setConversations(data.conversations || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [userId, userType])

  useEffect(() => {
    if (autoFetch && userId) {
      fetchConversations()
    }
  }, [autoFetch, userId, fetchConversations])

  // Calculate total unread
  const totalUnread = conversations.reduce((sum, conv) => {
    return sum + (userType === 'creator' ? conv.creator_unread_count : conv.brand_unread_count)
  }, 0)

  const createConversation = useCallback(async (creatorId: string, brandId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId, brand_id: brandId }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Failed to create conversation' }
      }

      // Add to list if new
      if (data.created) {
        setConversations(prev => [data.conversation, ...prev])
      }

      return { conversation: data.conversation }
    } catch (err) {
      return { error: 'Network error' }
    }
  }, [])

  return {
    conversations,
    isLoading,
    error,
    totalUnread,
    refetch: fetchConversations,
    createConversation,
  }
}

// Hook for single conversation messages
interface UseMessagesOptions {
  conversationId: string
  userId: string
  userType: 'creator' | 'brand'
  autoFetch?: boolean
  pollInterval?: number // in milliseconds, 0 to disable
}

interface Attachment {
  id: string
  type: 'image' | 'file' | 'link'
  url: string
  name?: string
  size?: number
}

interface UseMessagesReturn {
  messages: Message[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  hasMore: boolean
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<{ success: boolean; error?: string; warning?: string }>
  loadMore: () => Promise<void>
  markAsRead: () => Promise<void>
  refetch: () => Promise<void>
}

export function useMessages({ 
  conversationId, 
  userId, 
  userType, 
  autoFetch = true,
  pollInterval = 5000 
}: UseMessagesOptions): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMessages = useCallback(async (before?: string) => {
    if (!conversationId) return

    if (!before) {
      setIsLoading(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({
        conversation_id: conversationId,
        limit: '50',
      })
      if (before) {
        params.set('before', before)
      }

      const response = await fetch(`/api/messages?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages')
      }

      if (before) {
        // Loading more - prepend older messages
        setMessages(prev => [...data.messages, ...prev])
      } else {
        // Initial load or refresh
        setMessages(data.messages || [])
      }
      
      setHasMore(data.hasMore)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  // Initial fetch
  useEffect(() => {
    if (autoFetch && conversationId) {
      fetchMessages()
    }
  }, [autoFetch, conversationId, fetchMessages])

  // Polling for new messages
  useEffect(() => {
    if (!conversationId || pollInterval === 0) return

    pollIntervalRef.current = setInterval(() => {
      fetchMessages()
    }, pollInterval)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [conversationId, pollInterval, fetchMessages])

  const sendMessage = useCallback(async (content: string, attachments: Attachment[] = []) => {
    if (!conversationId || !content.trim()) {
      return { success: false, error: 'Invalid message' }
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: userId,
          sender_type: userType,
          content: content.trim(),
          attachments,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send message' }
      }

      // Add message to list
      setMessages(prev => [...prev, data.message])

      return { 
        success: true, 
        warning: data.warning // Contact info warning
      }
    } catch (err) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsSending(false)
    }
  }, [conversationId, userId, userType])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || messages.length === 0) return
    
    const oldestMessage = messages[0]
    await fetchMessages(oldestMessage.created_at)
  }, [hasMore, isLoading, messages, fetchMessages])

  const markAsRead = useCallback(async () => {
    if (!conversationId) return

    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          reader_type: userType,
        }),
      })
    } catch (err) {
      console.error('Error marking messages as read:', err)
    }
  }, [conversationId, userType])

  return {
    messages,
    isLoading,
    isSending,
    error,
    hasMore,
    sendMessage,
    loadMore,
    markAsRead,
    refetch: fetchMessages,
  }
}

// Hook for real-time message subscription (Supabase Realtime)
export function useRealtimeMessages(conversationId: string, onNewMessage: (message: Message) => void) {
  useEffect(() => {
    if (!conversationId) return

    // In production, set up Supabase Realtime subscription:
    // const supabase = createClientSupabase()
    // const channel = supabase
    //   .channel(`conversation:${conversationId}`)
    //   .on('postgres_changes', {
    //     event: 'INSERT',
    //     schema: 'public',
    //     table: 'messages',
    //     filter: `conversation_id=eq.${conversationId}`,
    //   }, (payload) => {
    //     onNewMessage(payload.new as Message)
    //   })
    //   .subscribe()
    //
    // return () => {
    //   supabase.removeChannel(channel)
    // }

    // Placeholder - polling is used instead for now
    console.log('Realtime subscription would be set up here for:', conversationId)
  }, [conversationId, onNewMessage])
}

export default useMessages