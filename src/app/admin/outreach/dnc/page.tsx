'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { DNC_KEY_TYPES, DNC_REASONS, type DncKeyType } from '@/lib/outreach/rules'
import type { OutreachDncEntry } from '@/lib/outreach/types'
import { ReasonDialog } from '@/components/admin/ReasonDialog'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, Card, ghostButtonClass, inputClass, selectClass } from '@/components/admin/outreach/ui'

const PAGE_SIZE = 50
const REASON_LABELS: Record<string, string> = {
  opted_out: 'Opted out', bounced: 'Bounced', removal_request: 'Removal request', competitor: 'Competitor', other: 'Other',
}
const TYPE_LABELS: Record<string, string> = { email: 'Email', domain: 'Domain', profile_url: 'Profile URL' }

export default function OutreachDncPage() {
  useDocumentTitle('Do not contact')
  const { me, toast, ownerName, bump, version } = useOutreach()
  const [entries, setEntries] = useState<OutreachDncEntry[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [reason, setReason] = useState('')
  const [form, setForm] = useState<{ key_type: DncKeyType; value: string; reason: string; note: string }>({ key_type: 'email', value: '', reason: 'removal_request', note: '' })
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<OutreachDncEntry | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setOffset(0) }, 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    const p = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
    if (debouncedQ) {p.set('q', debouncedQ)}
    if (reason) {p.set('reason', reason)}
    const res = await fetch(`/api/admin/outreach/dnc?${p}`)
    const data = await readJson<{ entries: OutreachDncEntry[]; total: number }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Failed to load')
      return
    }
    setEntries(data.entries)
    setTotal(data.total)
  }, [offset, debouncedQ, reason, toast])

  useEffect(() => { void load() }, [load, version])

  const add = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/outreach/dnc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await readJson<{ message: string }>(res)
    setSaving(false)
    if (!res.ok) {
      toast('error', data.error ?? 'Failed to add')
      return
    }
    toast('success', data.message)
    setForm({ ...form, value: '', note: '' })
    bump()
  }

  const remove = async (why: string) => {
    if (!removing) {return}
    const res = await fetch(`/api/admin/outreach/dnc/${encodeURIComponent(removing.id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: why }),
    })
    const data = await readJson<{ message: string }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Failed to remove')
      return
    }
    toast('success', data.message)
    setRemoving(null)
    bump()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Do not contact</h1>
        <p className="text-sm text-slate-400">
          Entries here block imports and sends, and leads matching them show a DNC badge. A domain entry blocks every email at the domain.
        </p>
      </div>

      {me?.is_admin && (
        <Card title="Add an entry">
          <div className="flex flex-wrap items-center gap-2">
            <select value={form.key_type} onChange={(e) => setForm({ ...form, key_type: e.target.value as DncKeyType })} className={selectClass}>
              {DNC_KEY_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="name@company.com, company.com or a profile URL" className={`${inputClass} min-w-[260px] flex-1`} />
            <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={selectClass}>
              {DNC_REASONS.map((r) => <option key={r} value={r}>{REASON_LABELS[r]}</option>)}
            </select>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note (optional)" className={`${inputClass} w-56`} />
            <button onClick={add} disabled={saving || !form.value.trim()} className={buttonClass}><Plus className="h-4 w-4" /> Add</button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className={`${inputClass} pl-9`} />
        </div>
        <select value={reason} onChange={(e) => { setReason(e.target.value); setOffset(0) }} className={selectClass}>
          <option value="">All reasons</option>
          {DNC_REASONS.map((r) => <option key={r} value={r}>{REASON_LABELS[r]}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Type</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2">Lead</th><th className="px-3 py-2">Added by</th><th className="px-3 py-2">Date</th>
              {me?.is_admin && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {entries.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">No entries.</td></tr>
            ) : entries.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap px-3 py-2 text-slate-400">{TYPE_LABELS[e.key_type] ?? e.key_type}</td>
                <td className="max-w-[320px] truncate px-3 py-2 font-mono text-xs text-slate-200" title={e.key_value}>{e.key_value}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-300">{REASON_LABELS[e.reason] ?? e.reason}{e.note ? <span className="text-slate-500"> · {e.note}</span> : null}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">{e.lead_id ?? ''}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-400">{e.created_by ? ownerName(e.created_by) : 'System'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-400">{e.created_at.slice(0, 10)}</td>
                {me?.is_admin && (
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setRemoving(e)} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400" aria-label={`Remove ${e.key_value}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{total.toLocaleString()} entries</span>
        <div className="flex gap-2">
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(offset - PAGE_SIZE, 0))} className={ghostButtonClass}>Prev</button>
          <button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)} className={ghostButtonClass}>Next</button>
        </div>
      </div>

      {removing && (
        <ReasonDialog
          danger
          title={`Remove ${removing.key_value}?`}
          description="Imports and sends to this value are allowed again."
          confirmLabel="Remove"
          onConfirm={remove}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  )
}
