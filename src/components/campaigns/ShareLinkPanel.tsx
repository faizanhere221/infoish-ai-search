'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link2, Copy, Check, Ban, Plus } from 'lucide-react'
import type { CampaignShareLink } from '@/types/campaigns'

interface ShareLinkPanelProps {
  campaignId: string
  token: string | null
}

function formatViewedAt(dateStr: string | null): string {
  if (!dateStr) {return 'Never viewed'}
  return `Last viewed ${new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
}

export function ShareLinkPanel({ campaignId, token }: ShareLinkPanelProps) {
  const [links, setLinks] = useState<CampaignShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const authHeader = useCallback(
    (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/share-links`, { headers: authHeader() })
      if (res.ok) {
        const data = await res.json()
        setLinks(data.share_links || [])
      }
    } finally {
      setLoading(false)
    }
  }, [campaignId, authHeader])

  useEffect(() => { load() }, [load])

  async function createLink() {
    setCreating(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/share-links`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_charge: true }),
      })
      if (res.ok) {
        const data = await res.json()
        setLinks((prev) => [data.share_link, ...prev])
      }
    } finally {
      setCreating(false)
    }
  }

  async function updateLink(id: string, updates: { show_charge?: boolean; revoked?: boolean }) {
    const res = await fetch(`/api/campaigns/${campaignId}/share-links/${id}`, {
      method: 'PATCH',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const data = await res.json()
      setLinks((prev) => prev.map((l) => (l.id === id ? data.share_link : l)))
    }
  }

  function shareUrl(token: string) {
    if (typeof window === 'undefined') {return `/share/${token}`}
    return `${window.location.origin}/share/${token}`
  }

  async function copyLink(link: CampaignShareLink) {
    try {
      await navigator.clipboard.writeText(shareUrl(link.token))
      setCopiedId(link.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Clipboard API can fail silently (permissions/non-secure context) —
      // not worth surfacing an error for a convenience copy button.
    }
  }

  const activeLinks = links.filter((l) => !l.revoked_at)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-brand-purple-dark" aria-hidden="true" />
          Client share link
        </h3>
        <button
          onClick={createLink}
          disabled={creating}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple-dark hover:bg-brand-pink/10 px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> New link
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : activeLinks.length === 0 ? (
        <p className="text-sm text-gray-500">No active link yet. Create one to share read-only progress with your client.</p>
      ) : (
        <div className="space-y-3">
          {activeLinks.map((link) => (
            <div key={link.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  readOnly
                  value={shareUrl(link.token)}
                  className="flex-1 min-w-0 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 truncate"
                  aria-label="Share link URL"
                />
                <button
                  onClick={() => copyLink(link)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                  aria-label="Copy share link"
                >
                  {copiedId === link.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => updateLink(link.id, { revoked: true })}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  aria-label="Revoke share link"
                  title="Revoke"
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={link.show_charge}
                    onChange={(e) => updateLink(link.id, { show_charge: e.target.checked })}
                    className="rounded border-gray-300 text-brand-purple focus:ring-brand-pink"
                  />
                  Show client charge amounts
                </label>
                <span className="text-xs text-gray-400">{formatViewedAt(link.last_viewed_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ShareLinkPanel
