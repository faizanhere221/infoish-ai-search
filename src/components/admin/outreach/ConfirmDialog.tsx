'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'

interface ConfirmDialogProps {
  title: string
  description?: React.ReactNode
  confirmLabel: string
  danger?: boolean
  progress?: string | null // e.g. "Deleted 400 of 1,234…" while a batch runs
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

// Confirm step for soft delete / restore. No reason field: both are logged
// in outreach_activity and a delete is undone by a restore.
export function ConfirmDialog({ title, description, confirmLabel, danger = false, progress, onConfirm, onClose }: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const close = () => { if (!submitting) {onClose()} }
  useEscapeKey(close)

  const confirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {danger && <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button onClick={close} disabled={submitting} className="text-gray-400 hover:text-gray-600 disabled:opacity-50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {description && <div className="text-sm text-gray-600">{description}</div>}
        {progress && <p className="mt-3 text-sm font-medium text-gray-900">{progress}</p>}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={close} disabled={submitting} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={submitting}
            autoFocus
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
