'use client'

import { useState } from 'react'
import { Flag, X, Loader2 } from 'lucide-react'

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
]

interface ReportDialogProps {
  reportedUserId: string
  messageId?: string
  conversationId?: string
  onClose: () => void
}

// Shared by the chat thread (reporting a message) and public profile pages
// (reporting a user) — the only two entry points for creating a report.
// Posts to POST /api/reports, which is rate limited server-side.
export function ReportDialog({ reportedUserId, messageId, conversationId, onClose }: ReportDialogProps) {
  const [category, setCategory] = useState('spam')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reported_user_id: reportedUserId, category, note: note.trim() || undefined, message_id: messageId, conversation_id: conversationId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {throw new Error(data.error || 'Failed to submit report')}
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" /> {done ? 'Report submitted' : 'Report'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {done ? (
          <div>
            <p className="text-sm text-gray-600">Thanks — our team will review this.</p>
            <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
              Close
            </button>
          </div>
        ) : (
          <>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">Details (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything else we should know?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportDialog
