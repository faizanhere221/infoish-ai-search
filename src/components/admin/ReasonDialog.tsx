'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'

interface ReasonDialogProps {
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: (reason: string) => Promise<void> | void
  onClose: () => void
}

// Every admin action that changes data goes through this: a short reason is
// required (matches requireReason() on the server — src/lib/admin-action.ts),
// shown as a confirm step rather than firing immediately on click.
export function ReasonDialog({ title, description, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }: ReasonDialogProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEscapeKey(onClose)

  const handleConfirm = async () => {
    if (reason.trim().length < 3) {
      setError('Enter a reason (at least 3 characters).')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await onConfirm(reason.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {danger && <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}

        <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError('') }}
          rows={3}
          autoFocus
          placeholder="Why are you doing this?"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
        {error && <p className="text-sm text-red-600 mt-1.5">{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-5">
          <button onClick={onClose} disabled={submitting} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReasonDialog
