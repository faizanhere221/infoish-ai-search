'use client'

import { useState, useEffect } from 'react'

// Resolves a private chat-attachments storage path to a short-lived signed
// URL (see GET /api/conversations/[id]/attachments/sign). Re-fetches
// whenever the path changes; the sign endpoint re-checks conversation
// membership on every call.
export function useSignedAttachmentUrl(conversationId: string, path: string, token: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    setUrl(null)

    fetch(`/api/conversations/${conversationId}/attachments/sign?path=${encodeURIComponent(path)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) {throw new Error('Failed to resolve attachment')}
        return res.json()
      })
      .then(data => {
        if (!cancelled) {setUrl(data.url)}
      })
      .catch(() => {
        if (!cancelled) {setError(true)}
      })
      .finally(() => {
        if (!cancelled) {setLoading(false)}
      })

    return () => { cancelled = true }
  }, [conversationId, path, token])

  return { url, loading, error }
}
