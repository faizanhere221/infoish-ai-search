'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePolling } from './usePolling'
import type { Attachment } from '@/types/marketplace'

export interface ThreadMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachments: Attachment[]
  is_read: boolean
  read_at: string | null
  is_system: boolean
  related_type: string | null
  related_id: string | null
  created_at: string
  // Client-only: present only while a locally-sent message hasn't been
  // confirmed by the server yet (or failed to send).
  pendingStatus?: 'sending' | 'failed'
}

const POLL_INTERVAL_MS = 3000
const PAGE_SIZE = 50

function cursorOf(message: { created_at: string; id: string }): string {
  return `${message.created_at}|${message.id}`
}

export function useConversationThread(conversationId: string | null, token: string | null) {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasOlder, setHasOlder] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const newestCursorRef = useRef<string | null>(null)
  const oldestCursorRef = useRef<string | null>(null)
  const tokenRef = useRef(token)
  tokenRef.current = token

  const authHeader = useCallback((): Record<string, string> => {
    return tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}
  }, [])

  const mergeIncoming = useCallback(
    (incoming: ThreadMessage[], mode: 'replace' | 'append-newer' | 'prepend-older') => {
      setMessages(prev => {
        if (mode === 'replace') {return incoming}
        const existingIds = new Set(prev.map(m => m.id))
        const deduped = incoming.filter(m => !existingIds.has(m.id))
        if (deduped.length === 0) {return prev}
        return mode === 'append-newer' ? [...prev, ...deduped] : [...deduped, ...prev]
      })
    },
    []
  )

  const fetchInitial = useCallback(async () => {
    if (!conversationId) {return}
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=${PAGE_SIZE}`,
        { headers: authHeader() }
      )
      if (!res.ok) {throw new Error('Failed to load messages')}
      const data = await res.json()
      mergeIncoming(data.messages || [], 'replace')
      newestCursorRef.current = data.next_after_cursor ?? null
      oldestCursorRef.current = data.next_before_cursor ?? null
      setHasOlder(Boolean(data.has_more))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [conversationId, authHeader, mergeIncoming])

  const poll = useCallback(async () => {
    if (!conversationId || !newestCursorRef.current) {return}
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?after=${encodeURIComponent(newestCursorRef.current)}`,
        { headers: authHeader() }
      )
      if (!res.ok) {return}
      const data = await res.json()
      if (data.messages?.length) {mergeIncoming(data.messages, 'append-newer')}
      if (data.next_after_cursor) {newestCursorRef.current = data.next_after_cursor}
    } catch {
      // Silent — the next poll tick retries. Surfacing a transient network
      // blip as an error would be noisier than useful here.
    }
  }, [conversationId, authHeader, mergeIncoming])

  const loadOlder = useCallback(async () => {
    if (!conversationId || !oldestCursorRef.current || loadingOlder) {return}
    setLoadingOlder(true)
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?before=${encodeURIComponent(oldestCursorRef.current)}`,
        { headers: authHeader() }
      )
      if (!res.ok) {return}
      const data = await res.json()
      mergeIncoming(data.messages || [], 'prepend-older')
      oldestCursorRef.current = data.next_before_cursor ?? null
      setHasOlder(Boolean(data.has_more))
    } finally {
      setLoadingOlder(false)
    }
  }, [conversationId, loadingOlder, authHeader, mergeIncoming])

  useEffect(() => {
    newestCursorRef.current = null
    oldestCursorRef.current = null
    setMessages([])
    fetchInitial()
    // Re-run only when the conversation changes — fetchInitial itself is
    // stable across token refresh/rerenders via the token ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  usePolling(poll, POLL_INTERVAL_MS, { enabled: Boolean(conversationId) })

  const performSend = useCallback(
    async (tempId: string, content: string, attachments: Attachment[]) => {
      if (!conversationId) {return}
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, attachments }),
        })
        if (!res.ok) {throw new Error('Failed to send message')}
        const data = await res.json()
        const real: ThreadMessage = data.data
        setMessages(prev => prev.map(m => (m.id === tempId ? real : m)))
        const cursor = cursorOf(real)
        if (!newestCursorRef.current || cursor > newestCursorRef.current) {
          newestCursorRef.current = cursor
        }
      } catch {
        setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, pendingStatus: 'failed' } : m)))
      }
    },
    [conversationId, authHeader]
  )

  const sendMessage = useCallback(
    async (content: string, attachments: Attachment[] = []) => {
      if (!conversationId || (!content.trim() && attachments.length === 0)) {return}
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const optimistic: ThreadMessage = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: '',
        content,
        attachments,
        is_read: false,
        read_at: null,
        is_system: false,
        related_type: null,
        related_id: null,
        created_at: new Date().toISOString(),
        pendingStatus: 'sending',
      }
      setMessages(prev => [...prev, optimistic])
      await performSend(tempId, content, attachments)
    },
    [conversationId, performSend]
  )

  const retryMessage = useCallback(
    async (tempId: string) => {
      const failed = messages.find(m => m.id === tempId)
      if (!failed) {return}
      setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, pendingStatus: 'sending' } : m)))
      await performSend(tempId, failed.content, failed.attachments)
    },
    [messages, performSend]
  )

  const markAsRead = useCallback(async () => {
    if (!conversationId) {return}
    try {
      await fetch(`/api/conversations/${conversationId}/messages/read`, {
        method: 'POST',
        headers: authHeader(),
      })
    } catch {
      // Best-effort — a missed read receipt isn't worth surfacing to the user
    }
  }, [conversationId, authHeader])

  return {
    messages,
    loading,
    loadingOlder,
    hasOlder,
    error,
    loadOlder,
    sendMessage,
    retryMessage,
    markAsRead,
    refresh: fetchInitial,
  }
}
