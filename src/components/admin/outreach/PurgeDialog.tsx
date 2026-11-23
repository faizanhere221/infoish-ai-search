'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { readJson } from '@/components/admin/outreach/OutreachContext'

const PURGE_BATCH = 500 // the route's max ids per request
const CONFIRM_WORD = 'DELETE'

interface Counts {
  brands: number
  skipped_not_deleted: number
  contacts: number
  database_entries: number
  keys: number
  activity_unlinked: number
  dnc_blocked: number
}

const ZERO: Counts = { brands: 0, skipped_not_deleted: 0, contacts: 0, database_entries: 0, keys: 0, activity_unlinked: 0, dnc_blocked: 0 }

function n(v: number, word: string): string {
  return `${v.toLocaleString()} ${v === 1 ? word : `${word}s`}`
}

// Super admins: "Permanently delete (allow re-import)" for soft-deleted
// brands. Step 1 runs the dry run over every id and shows the count; step 2
// needs DELETE typed before anything is removed.
export function PurgeDialog({ resolveIds, onClose, onDone, toast }: {
  resolveIds: () => Promise<string[] | null>
  onClose: () => void
  onDone: () => void
  toast: (kind: 'success' | 'error', message: string) => void
}) {
  const [ids, setIds] = useState<string[] | null>(null)
  const [counts, setCounts] = useState<Counts | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  const close = () => { if (!running) {onClose()} }
  useEscapeKey(close)

  const send = async (batch: string[], commit: boolean): Promise<Counts> => {
    const res = await fetch('/api/admin/outreach/leads/brands/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: batch, commit }),
    })
    const data = await readJson<{ purge: Counts }>(res)
    if (!res.ok) {throw new Error(data.error ?? 'Request failed')}
    return data.purge
  }

  const add = (a: Counts, b: Counts): Counts =>
    Object.fromEntries(Object.keys(ZERO).map((k) => [k, a[k as keyof Counts] + b[k as keyof Counts]])) as unknown as Counts

  // Dry run on open.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const resolved = await resolveIds()
      if (cancelled) {return}
      if (!resolved) {
        onClose()
        return
      }
      try {
        let total = ZERO
        for (let i = 0; i < resolved.length; i += PURGE_BATCH) {
          total = add(total, await send(resolved.slice(i, i + PURGE_BATCH), false))
        }
        if (!cancelled) {
          setIds(resolved)
          setCounts(total)
        }
      } catch (err) {
        if (!cancelled) {setError(err instanceof Error ? err.message : 'Dry run failed')}
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const confirm = async () => {
    if (!ids || typed !== CONFIRM_WORD) {return}
    setRunning(true)
    let done = 0
    try {
      for (let i = 0; i < ids.length; i += PURGE_BATCH) {
        if (ids.length > PURGE_BATCH) {setProgress(`Deleted ${done.toLocaleString()} of ${counts?.brands.toLocaleString()}…`)}
        done += (await send(ids.slice(i, i + PURGE_BATCH), true)).brands
      }
      toast('success', `${n(done, 'brand')} permanently deleted. Their domains and emails import again.`)
      onDone()
    } catch (err) {
      toast('error', `${n(done, 'brand')} permanently deleted. Stopped: ${err instanceof Error ? err.message : 'request failed'}`)
      onDone()
    } finally {
      setRunning(false)
      setProgress(null)
    }
  }

  const title = 'Permanently delete (allow re-import)'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button onClick={close} disabled={running} className="text-gray-400 hover:text-gray-600 disabled:opacity-50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !counts ? (
          <p className="flex items-center gap-2 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin" /> Counting…</p>
        ) : counts.brands === 0 ? (
          <p className="text-sm text-gray-600">No soft-deleted brands in this selection. Only deleted brands are permanently deleted.</p>
        ) : (
          <div className="space-y-3 text-sm text-gray-600">
            <p className="text-base font-semibold text-gray-900">{n(counts.brands, 'brand')} will be permanently deleted.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{n(counts.contacts, 'contact')}, {n(counts.database_entries, 'Client Database entry')} and {n(counts.keys, 'duplicate key')} go with them.</li>
              <li>{n(counts.activity_unlinked, 'activity row')} stay in the stats, without the link to the brand.</li>
              <li>The same domains and emails import again afterwards.</li>
              {counts.dnc_blocked > 0 && <li>{n(counts.dnc_blocked, 'brand')} on the do-not-contact list stay blocked on import.</li>}
              {counts.skipped_not_deleted > 0 && <li>{n(counts.skipped_not_deleted, 'lead')} in the selection are not deleted and are skipped.</li>}
            </ul>
            <p>There is no undo. Type <strong className="font-mono text-gray-900">{CONFIRM_WORD}</strong> to confirm.</p>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} disabled={running} autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900" aria-label={`Type ${CONFIRM_WORD} to confirm`} />
          </div>
        )}
        {progress && <p className="mt-3 text-sm font-medium text-gray-900">{progress}</p>}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={close} disabled={running} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          {counts && counts.brands > 0 && (
            <button onClick={() => void confirm()} disabled={running || typed !== CONFIRM_WORD}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {running && <Loader2 className="h-4 w-4 animate-spin" />} Permanently delete {n(counts.brands, 'brand')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
