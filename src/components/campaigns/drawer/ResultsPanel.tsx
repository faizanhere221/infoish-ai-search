'use client'

import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Loader2, Plus, Trash2 } from 'lucide-react'
import { formatDate } from '@/components/campaigns/utils'

interface DeliverableResult {
  id: string
  captured_at: string
  views: number
  likes: number
  comments: number
  shares: number
  clicks: number
  saves: number
  notes: string | null
  entered_by: 'creator' | 'brand'
}

interface ResultsPanelProps {
  campaignCreatorId: string
  deliverableId: string
  actorType: 'brand' | 'creator'
  token: string | null
}

const EMPTY_FORM = { views: '', likes: '', comments: '', shares: '', clicks: '', saves: '', notes: '' }

export function ResultsPanel({ campaignCreatorId, deliverableId, actorType, token }: ResultsPanelProps) {
  const [results, setResults] = useState<DeliverableResult[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authHeader = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token])
  const base = `/api/campaign-creators/${campaignCreatorId}/deliverables/${deliverableId}/results`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(base, { headers: authHeader() })
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
      }
    } finally {
      setLoading(false)
    }
  }, [base, authHeader])

  useEffect(() => { load() }, [load])

  async function addResult() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(base, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          views: Number(form.views) || 0,
          likes: Number(form.likes) || 0,
          comments: Number(form.comments) || 0,
          shares: Number(form.shares) || 0,
          clicks: Number(form.clicks) || 0,
          saves: Number(form.saves) || 0,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to add results')
        return
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function removeResult(resultId: string) {
    if (!confirm('Remove this results entry?')) {return}
    setBusy(true)
    try {
      const res = await fetch(`${base}/${resultId}`, { method: 'DELETE', headers: authHeader() })
      if (res.ok) {await load()}
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" /> Results
        </h5>
        <button onClick={() => setShowForm((v) => !v)} className="text-xs text-brand-purple-dark hover:underline inline-flex items-center gap-0.5">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {results.length === 0 && !showForm && (
        <p className="text-xs text-gray-400">No results logged yet.</p>
      )}

      {results.map((r) => (
        <div key={r.id} className="flex items-center justify-between py-1.5 text-xs text-gray-600 border-b border-gray-50 last:border-0">
          <span>{formatDate(r.captured_at)} &middot; {r.views.toLocaleString()} views &middot; {r.likes.toLocaleString()} likes &middot; {r.comments.toLocaleString()} comments ({r.entered_by})</span>
          {(actorType === 'brand' || r.entered_by === actorType) && (
            <button onClick={() => removeResult(r.id)} disabled={busy} className="text-gray-300 hover:text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {showForm && (
        <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-2">
            {(['views', 'likes', 'comments', 'shares', 'clicks', 'saves'] as const).map((field) => (
              <div key={field}>
                <label className="block text-[10px] text-gray-400 capitalize mb-0.5">{field}</label>
                <input
                  type="number"
                  min={0}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                />
              </div>
            ))}
          </div>
          <input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)"
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600">Cancel</button>
            <button onClick={addResult} disabled={busy} className="flex-1 px-2 py-1.5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-xs font-medium disabled:opacity-50">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsPanel
