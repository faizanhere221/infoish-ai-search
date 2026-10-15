'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, FileText, Loader2, Paperclip, Pencil, Plus, Scissors, Trash2, Upload } from 'lucide-react'
import { formatDate, DELIVERABLE_STATUS_BADGE } from '@/components/campaigns/utils'
import { DELIVERABLE_FORMATS, type CreatorDeliverable } from '@/types/campaigns'

interface DeliverablesTabProps {
  campaignCreatorId: string
  actorType: 'brand' | 'creator'
  token: string | null
}

const EMPTY_NEW = { title: '', platform: '', format: '', draft_due: '', publish_due: '', revisions_allowed: '2' }
const EMPTY_EDIT = { title: '', platform: '', format: '', draft_due: '', publish_due: '' }

export function DeliverablesTab({ campaignCreatorId, actorType, token }: DeliverablesTabProps) {
  const [deliverables, setDeliverables] = useState<CreatorDeliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newDeliverable, setNewDeliverable] = useState(EMPTY_NEW)
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({})
  const [draftLinkDrafts, setDraftLinkDrafts] = useState<Record<string, string>>({})
  const [postedUrlDrafts, setPostedUrlDrafts] = useState<Record<string, string>>({})
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState(EMPTY_EDIT)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileTargetId, setFileTargetId] = useState<string | null>(null)

  const authHeader = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables`, { headers: authHeader() })
      if (res.ok) {
        const data = await res.json()
        setDeliverables(data.deliverables || [])
      }
    } finally {
      setLoading(false)
    }
  }, [campaignCreatorId, authHeader])

  useEffect(() => { load() }, [load])

  async function addDeliverable() {
    setBusyId('new')
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDeliverable.title,
          platform: newDeliverable.platform || null,
          format: newDeliverable.format || null,
          draft_due: newDeliverable.draft_due || null,
          publish_due: newDeliverable.publish_due || null,
          revisions_allowed: Number(newDeliverable.revisions_allowed) || 2,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to add deliverable')
        return
      }
      setNewDeliverable(EMPTY_NEW)
      setShowAdd(false)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function act(deliverableId: string, action: 'approve' | 'request-changes' | 'complete') {
    setBusyId(deliverableId)
    setError(null)
    try {
      const body = action === 'request-changes' ? { feedback: feedbackDrafts[deliverableId] || '' } : undefined
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables/${deliverableId}/${action}`, {
        method: 'POST',
        headers: { ...authHeader(), ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Failed to ${action.replace('-', ' ')}`)
        return
      }
      setFeedbackDrafts((prev) => ({ ...prev, [deliverableId]: '' }))
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function submitDraft(deliverableId: string) {
    setBusyId(deliverableId)
    setError(null)
    try {
      const draftUrl = draftLinkDrafts[deliverableId]?.trim()
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables/${deliverableId}/submit-draft`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(draftUrl ? { draft_url: draftUrl } : {}),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit draft')
        return
      }
      setDraftLinkDrafts((prev) => ({ ...prev, [deliverableId]: '' }))
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function submitPosted(deliverableId: string) {
    setBusyId(deliverableId)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables/${deliverableId}/submit-posted`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ posted_url: postedUrlDrafts[deliverableId]?.trim() || '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit posted link')
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  function startEdit(d: CreatorDeliverable) {
    setEditingId(d.id)
    setEditDraft({
      title: d.title,
      platform: d.platform || '',
      format: d.format || '',
      draft_due: d.draft_due || '',
      publish_due: d.publish_due || '',
    })
  }

  async function saveEdit(deliverableId: string) {
    setBusyId(deliverableId)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables/${deliverableId}`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editDraft.title,
          platform: editDraft.platform || null,
          format: editDraft.format || null,
          draft_due: editDraft.draft_due || null,
          publish_due: editDraft.publish_due || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update deliverable')
        return
      }
      setEditingId(null)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function updateRevisions(deliverableId: string, revisions_allowed: number) {
    setBusyId(deliverableId)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables/${deliverableId}`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisions_allowed }),
      })
      if (res.ok) {await load()}
    } finally {
      setBusyId(null)
    }
  }

  async function splitDeliverable(deliverableId: string) {
    setBusyId(deliverableId)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables/${deliverableId}/split`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to split deliverable')
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function removeDeliverable(deliverableId: string) {
    if (!confirm('Remove this deliverable?')) {return}
    setBusyId(deliverableId)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables/${deliverableId}`, {
        method: 'DELETE',
        headers: authHeader(),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to remove deliverable')
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  function triggerFileSelect(deliverableId: string) {
    setFileTargetId(deliverableId)
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !fileTargetId) {return}
    const deliverableId = fileTargetId
    setUploadingId(deliverableId)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables/${deliverableId}/attachment`, {
        method: 'POST',
        headers: authHeader(),
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to upload file')
        return
      }
      await load()
    } finally {
      setUploadingId(null)
      setFileTargetId(null)
    }
  }

  async function viewDraft(deliverableId: string, path: string) {
    const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/deliverables/${deliverableId}/attachment/sign?path=${encodeURIComponent(path)}`, {
      headers: authHeader(),
    })
    if (res.ok) {
      const data = await res.json()
      window.open(data.url, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" onChange={handleFileSelected} className="hidden" />

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {deliverables.length === 0 && !showAdd && (
        <p className="text-sm text-gray-500 text-center py-4">
          No deliverables yet. {actorType === 'brand' ? 'Accepting an offer creates one automatically, or add one manually.' : 'They appear once the brand accepts an offer.'}
        </p>
      )}

      {deliverables.map((d) => {
        const badge = DELIVERABLE_STATUS_BADGE[d.status]
        const revisionsExhausted = d.revisions_used >= d.revisions_allowed
        return (
          <div key={d.id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{d.title}</h4>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>
                {actorType === 'brand' && d.status === 'pending' && (
                  <>
                    <button onClick={() => startEdit(d)} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Edit deliverable" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => splitDeliverable(d.id)} disabled={busyId === d.id} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Split deliverable" title="Split into two">
                      <Scissors className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeDeliverable(d.id)} disabled={busyId === d.id} className="p-1 text-gray-400 hover:text-red-500" aria-label="Remove deliverable" title="Remove">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingId === d.id ? (
              <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg">
                <input
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Title"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editDraft.format}
                    onChange={(e) => setEditDraft((f) => ({ ...f, format: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="">Format…</option>
                    {DELIVERABLE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <input
                    value={editDraft.platform}
                    onChange={(e) => setEditDraft((f) => ({ ...f, platform: e.target.value }))}
                    placeholder="Platform"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={editDraft.draft_due} onChange={(e) => setEditDraft((f) => ({ ...f, draft_due: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <input type="date" value={editDraft.publish_due} onChange={(e) => setEditDraft((f) => ({ ...f, publish_due: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
                  <button
                    onClick={() => saveEdit(d.id)}
                    disabled={busyId === d.id || !editDraft.title.trim()}
                    className="flex-1 px-3 py-1.5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
              {d.format && <span className="capitalize">{d.format}</span>}
              {d.draft_due && <span>Draft due {formatDate(d.draft_due)}</span>}
              {d.publish_due && <span>Publish due {formatDate(d.publish_due)}</span>}
              {actorType === 'brand' ? (
                <span className="inline-flex items-center gap-1">
                  {d.revisions_used} /
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={d.revisions_allowed}
                    onChange={(e) => updateRevisions(d.id, Math.max(0, Number(e.target.value) || 0))}
                    className="w-12 px-1 py-0.5 border border-gray-200 rounded text-xs"
                    aria-label="Revisions allowed"
                  /> revisions
                </span>
              ) : (
                <span>{d.revisions_used}/{d.revisions_allowed} revisions used</span>
              )}
            </div>

            {(d.draft_url || d.draft_attachment_path) && (
              <div className="flex items-center gap-2 mb-2">
                {d.draft_url && (
                  <a href={d.draft_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-purple-dark hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> Draft link
                  </a>
                )}
                {d.draft_attachment_path && (
                  <button onClick={() => viewDraft(d.id, d.draft_attachment_path as string)} className="inline-flex items-center gap-1 text-sm text-brand-purple-dark hover:underline">
                    <FileText className="w-3.5 h-3.5" /> Draft file
                  </button>
                )}
              </div>
            )}

            {d.posted_url && (
              <a href={d.posted_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-purple-dark hover:underline mb-2">
                <ExternalLink className="w-3.5 h-3.5" /> View posted content
              </a>
            )}

            {d.latest_feedback && d.status === 'changes_requested' && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">{d.latest_feedback}</p>
            )}

            {actorType === 'brand' && d.status === 'draft_submitted' && (
              <div className="space-y-2 mt-2">
                <textarea
                  value={feedbackDrafts[d.id] || ''}
                  onChange={(e) => setFeedbackDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  placeholder="Feedback if requesting changes…"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => act(d.id, 'approve')}
                    disabled={busyId === d.id}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(d.id, 'request-changes')}
                    disabled={busyId === d.id || revisionsExhausted || !feedbackDrafts[d.id]?.trim()}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    title={revisionsExhausted ? 'All revisions used' : undefined}
                  >
                    Request changes
                  </button>
                </div>
                {revisionsExhausted && <p className="text-xs text-red-500">All revisions used — approve or raise the revision cap.</p>}
              </div>
            )}

            {actorType === 'brand' && d.status === 'posted' && (
              <button
                onClick={() => act(d.id, 'complete')}
                disabled={busyId === d.id}
                className="mt-2 px-3 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
              >
                Mark complete
              </button>
            )}

            {actorType === 'creator' && (d.status === 'pending' || d.status === 'changes_requested') && (
              <div className="space-y-2 mt-2">
                <input
                  value={draftLinkDrafts[d.id] ?? d.draft_url ?? ''}
                  onChange={(e) => setDraftLinkDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  placeholder="Link to your draft (optional if uploading a file)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerFileSelect(d.id)}
                    disabled={uploadingId === d.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploadingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    {d.draft_attachment_path ? 'Replace file' : 'Attach file'}
                  </button>
                  <button
                    onClick={() => submitDraft(d.id)}
                    disabled={busyId === d.id || (!draftLinkDrafts[d.id]?.trim() && !d.draft_url && !d.draft_attachment_path)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" /> Submit draft
                  </button>
                </div>
              </div>
            )}

            {actorType === 'creator' && d.status === 'approved' && (
              <div className="flex gap-2 mt-2">
                <input
                  value={postedUrlDrafts[d.id] || ''}
                  onChange={(e) => setPostedUrlDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  placeholder="Link to the posted content"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
                <button
                  onClick={() => submitPosted(d.id)}
                  disabled={busyId === d.id || !postedUrlDrafts[d.id]?.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        )
      })}

      {actorType === 'brand' && (showAdd ? (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <input
            value={newDeliverable.title}
            onChange={(e) => setNewDeliverable((f) => ({ ...f, title: e.target.value }))}
            placeholder="Deliverable title"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newDeliverable.format}
              onChange={(e) => setNewDeliverable((f) => ({ ...f, format: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Format…</option>
              {DELIVERABLE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <input
              value={newDeliverable.platform}
              onChange={(e) => setNewDeliverable((f) => ({ ...f, platform: e.target.value }))}
              placeholder="Platform"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Draft due</label>
              <input type="date" value={newDeliverable.draft_due} onChange={(e) => setNewDeliverable((f) => ({ ...f, draft_due: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Publish due</label>
              <input type="date" value={newDeliverable.publish_due} onChange={(e) => setNewDeliverable((f) => ({ ...f, publish_due: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600">Cancel</button>
            <button
              onClick={addDeliverable}
              disabled={busyId === 'new' || !newDeliverable.title.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" /> Add deliverable
        </button>
      ))}
    </div>
  )
}

export default DeliverablesTab
