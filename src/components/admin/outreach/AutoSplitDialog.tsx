'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import type { LeadType } from '@/lib/outreach/rules'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'

interface SplitRow {
  user_id: string
  display_name: string
  count: number
}

// Auto-split (admins): the UNASSIGNED leads matching the table's current
// filters, dealt round-robin between the people picked. Preview first
// (writes nothing), then Save. Every move is an owner_changed activity row.
export function AutoSplitDialog({ leadType, filter, onClose, onDone }: {
  leadType: LeadType
  filter: string
  onClose: () => void
  onDone: () => void
}) {
  const { team, toast } = useOutreach()
  const active = team.filter((t) => t.is_active)
  const [picked, setPicked] = useState<string[]>([])
  const [preview, setPreview] = useState<{ total: number; capped: boolean; split: SplitRow[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const close = () => { if (!busy) {onClose()} }
  useEscapeKey(close)

  const segment = leadType === 'creator' ? 'creators' : 'brands'
  const post = (commit: boolean) => fetch(`/api/admin/outreach/leads/${segment}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'split', filter, member_ids: picked, commit }),
  })

  const toggle = (id: string) => {
    setPreview(null) // a new pick needs a new preview
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const runPreview = async () => {
    setBusy(true)
    const res = await post(false)
    const data = await readJson<{ total: number; capped: boolean; split: SplitRow[] }>(res)
    setBusy(false)
    if (!res.ok) {
      toast('error', data.error ?? 'Preview failed')
      return
    }
    setPreview(data)
  }

  const save = async () => {
    setBusy(true)
    const res = await post(true)
    const data = await readJson<{ message: string }>(res)
    setBusy(false)
    if (!res.ok) {
      toast('error', data.error ?? 'Auto-split failed')
      return
    }
    toast('success', data.message)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Auto-split unassigned leads">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Auto-split unassigned {leadType} leads</h2>
          <button onClick={close} disabled={busy} className="text-gray-400 hover:text-gray-600 disabled:opacity-50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Takes the unassigned leads that match the current filters and shares them evenly between the people you pick, one by one in lead id order.
        </p>

        <fieldset className="mt-4 space-y-1.5">
          <legend className="mb-1 text-sm font-medium text-gray-900">Split between</legend>
          {active.length === 0 && <p className="text-sm text-gray-500">No active team members.</p>}
          {active.map((t) => (
            <label key={t.user_id} className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={picked.includes(t.user_id)} onChange={() => toggle(t.user_id)} />
              {t.display_name} <span className="text-xs text-gray-400">({t.role})</span>
            </label>
          ))}
        </fieldset>

        {preview && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            {preview.total === 0 ? (
              <p>No unassigned leads match these filters.</p>
            ) : (
              <>
                <p className="font-medium text-gray-900">{preview.total.toLocaleString()} unassigned leads</p>
                <ul className="mt-1 space-y-0.5">
                  {preview.split.map((s) => <li key={s.user_id}>{s.display_name}: {s.count.toLocaleString()}</li>)}
                </ul>
                {preview.capped && <p className="mt-1 text-amber-700">Only the first {preview.total.toLocaleString()} are included. Narrow the filter for the rest.</p>}
              </>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={close} disabled={busy} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          {preview && preview.total > 0 ? (
            <button onClick={save} disabled={busy} autoFocus className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Save split
            </button>
          ) : (
            <button onClick={runPreview} disabled={busy || picked.length === 0} className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Preview
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
