'use client'

import { useCallback, useEffect, useState } from 'react'
import { Hand, Loader2 } from 'lucide-react'
import { CLAIM_MAX_PER_REQUEST, LIST_LABELS, listsFor, type LeadType } from '@/lib/outreach/rules'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, selectClass } from '@/components/admin/outreach/ui'

interface ClaimInfo {
  enabled: boolean
  available: number
  cap: number
  claimed_today: number
  remaining_today: number
}

// Members on "My leads": take the next N unassigned open leads, oldest
// first. Only a count of the pool is shown, never the leads themselves;
// the API enforces the per-claim max and the daily cap.
export function ClaimBar({ defaultType }: { defaultType: LeadType }) {
  const { toast, bump, version } = useOutreach()
  const [leadType, setLeadType] = useState<LeadType>(defaultType)
  const [list, setList] = useState('')
  const [count, setCount] = useState(10)
  const [info, setInfo] = useState<ClaimInfo | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const p = new URLSearchParams({ type: leadType })
    if (list) {p.set('list', list)}
    const res = await fetch(`/api/admin/outreach/claim?${p}`)
    const data = await readJson<ClaimInfo>(res)
    setInfo(res.ok ? data : null) // 409 before the migration: no bar
  }, [leadType, list])

  useEffect(() => { void load() }, [load, version])

  if (!info?.enabled) {return null}

  const claim = async () => {
    setBusy(true)
    const res = await fetch('/api/admin/outreach/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_type: leadType, count, list: list || null }),
    })
    const data = await readJson<{ message: string; claimed: number }>(res)
    setBusy(false)
    if (!res.ok) {
      toast('error', data.error ?? 'Claim failed')
      void load()
      return
    }
    toast(data.claimed > 0 ? 'success' : 'warn', data.message)
    bump()
  }

  const capped = info.remaining_today === 0
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
      <span className="font-medium text-white">Claim leads</span>
      <select value={leadType} onChange={(e) => { setLeadType(e.target.value as LeadType); setList('') }} className={selectClass} aria-label="Lead type to claim">
        <option value="creator">Creators</option>
        <option value="brand">Brands</option>
      </select>
      <select value={list} onChange={(e) => setList(e.target.value)} className={selectClass} aria-label="List to claim from">
        <option value="">Any list</option>
        {listsFor(leadType).map((l) => <option key={l} value={l}>{LIST_LABELS[l]}</option>)}
      </select>
      <input
        type="number" min={1} max={CLAIM_MAX_PER_REQUEST} value={count}
        onChange={(e) => setCount(Math.min(CLAIM_MAX_PER_REQUEST, Math.max(1, Math.trunc(Number(e.target.value) || 1))))}
        className="w-20 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-right text-sm text-white" aria-label="How many to claim"
      />
      <button onClick={claim} disabled={busy || capped || info.available === 0} className={buttonClass}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hand className="h-4 w-4" />} Claim next {count}
      </button>
      <span className="text-xs text-slate-400">
        {info.available.toLocaleString()} available · {info.claimed_today} of {info.cap} claimed today
        {capped ? ' · daily limit reached' : ''}
      </span>
    </div>
  )
}
