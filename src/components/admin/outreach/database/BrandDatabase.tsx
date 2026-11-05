'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Plus, Search, Users, X } from 'lucide-react'
import { NICHES } from '@/utils/constants'
import { cn } from '@/lib/utils'
import {
  BRAND_STAGE_LABELS, BRAND_STAGES, CURRENCIES, DB_PLATFORM_LABELS, DB_PLATFORMS, formatMoney, matchingCreatorsQuery,
  type DbPlatform,
} from '@/lib/outreach/database'
import { LINK_LABELS, primaryLink } from '@/lib/outreach/rules'
import type { BrandDbRow } from '@/lib/outreach/types'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, ghostButtonClass, inputClass, LinkIcon, selectClass } from '@/components/admin/outreach/ui'
import { AddDirectDialog, dbApi, dbPath, MultiFilter } from '@/components/admin/outreach/database/shared'

const PAGE_SIZE = 50

const STAGE_STYLE: Record<string, string> = {
  prospect: 'bg-slate-700/60 text-slate-300',
  active: 'bg-emerald-900/50 text-emerald-300',
  paused: 'bg-amber-900/40 text-amber-300',
  past: 'bg-slate-800 text-slate-400',
}

export function StageBadge({ stage }: { stage: string }) {
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STAGE_STYLE[stage])}>{BRAND_STAGE_LABELS[stage] ?? stage}</span>
}

export function budgetLabel(b: { budget_min: number | null; budget_max: number | null; budget_currency: string }): string {
  const { budget_min: min, budget_max: max, budget_currency: cur } = b
  if (min === null && max === null) {return '–'}
  if (min !== null && max !== null) {return min === max ? formatMoney(min, cur) : `${formatMoney(min, cur)}–${formatMoney(max, cur)}`}
  return min !== null ? `${formatMoney(min, cur)}+` : `Up to ${formatMoney(max, cur)}`
}

export function BrandDatabase() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { team, ownerName, version } = useOutreach()

  const [rows, setRows] = useState<BrandDbRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countries, setCountries] = useState<string[]>([])
  const [q, setQ] = useState(params.get('q') ?? '')
  const [minBudget, setMinBudget] = useState(params.get('min_budget') ?? '')
  const [adding, setAdding] = useState(false)

  const offset = Math.max(parseInt(params.get('offset') ?? '0', 10) || 0, 0)
  const sort = params.get('sort') ?? 'added'
  const dir = params.get('dir') === 'asc' ? 'asc' : 'desc'
  const list = (k: string) => (params.get(k) ?? '').split(',').filter(Boolean)

  const setParams = useCallback((changes: Record<string, string | null>, keepOffset = false) => {
    const p = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '') {p.delete(k)}
      else {p.set(k, v)}
    }
    if (!keepOffset) {p.delete('offset')}
    router.replace(`${pathname}?${p.toString()}`)
  }, [params, pathname, router])

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== q.trim()) {setParams({ q: q.trim() || null })}
    }, 300)
    return () => clearTimeout(t)
  }, [q, params, setParams])
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('min_budget') ?? '') !== minBudget.trim()) {setParams({ min_budget: minBudget.trim() || null })}
    }, 400)
    return () => clearTimeout(t)
  }, [minBudget, params, setParams])

  const query = useMemo(() => {
    const p = new URLSearchParams(params.toString())
    p.set('limit', String(PAGE_SIZE))
    p.set('meta', '1')
    return p.toString()
  }, [params])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`${dbApi('brand')}?${query}`)
    const data = await readJson<{ rows: BrandDbRow[]; total: number; filterValues?: { countries: string[] } }>(res)
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Failed to load')
      return
    }
    setError(null)
    setRows(data.rows)
    setTotal(data.total)
    if (data.filterValues) {setCountries(data.filterValues.countries)}
  }, [query])

  useEffect(() => { void load() }, [load, version])

  const toggleSort = (key: string) => {
    if (sort === key) {setParams({ dir: dir === 'asc' ? 'desc' : 'asc' })}
    else {setParams({ sort: key, dir: key === 'company' ? 'asc' : 'desc' })}
  }
  const SortHeader = ({ k, children, className }: { k: string; children: React.ReactNode; className?: string }) => (
    <th className={cn('px-3 py-2 font-medium', className)}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-white">
        {children}
        {sort === k && (dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  )

  const exportHref = `${dbApi('brand')}/export?${new URLSearchParams([...params.entries()].filter(([k]) => k !== 'offset')).toString()}`
  const anyFilter = ['stage', 'country', 'niche', 'platform', 'q', 'min_budget', 'owner'].some((k) => params.get(k))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className={cn(inputClass, 'pl-9')} placeholder="Search company, contact, product, notes" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button onClick={() => setAdding(true)} className={buttonClass}><Plus className="h-4 w-4" /> Add client</button>
        <a href={exportHref} className={ghostButtonClass}><Download className="h-4 w-4" /> CSV</a>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MultiFilter label="Stage" options={BRAND_STAGES} labels={BRAND_STAGE_LABELS} value={list('stage')} onChange={(v) => setParams({ stage: v.join(',') })} />
        <MultiFilter label="Country" options={countries} value={list('country')} onChange={(v) => setParams({ country: v.join(',') })} />
        <MultiFilter label="Niche" options={NICHES} value={list('niche')} onChange={(v) => setParams({ niche: v.join(',') })} />
        <MultiFilter label="Platform" options={DB_PLATFORMS} labels={DB_PLATFORM_LABELS} value={list('platform')} onChange={(v) => setParams({ platform: v.join(',') })} />
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">Budget ≥</span>
          <input className={cn(inputClass, 'w-24 py-1.5')} inputMode="decimal" placeholder="Any" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} aria-label="Minimum budget" />
          <select className={cn(selectClass, 'py-1.5')} value={params.get('currency') ?? ''} onChange={(e) => setParams({ currency: e.target.value || null })} aria-label="Budget currency">
            <option value="">USD</option>
            {CURRENCIES.filter((c) => c !== 'USD').map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <select className={selectClass} value={params.get('owner') ?? ''} onChange={(e) => setParams({ owner: e.target.value || null })} aria-label="Owner">
          <option value="">Every owner</option>
          <option value="me">Mine</option>
          <option value="none">Unassigned</option>
          {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
        </select>
        {anyFilter && (
          <button onClick={() => { setQ(''); setMinBudget(''); router.replace(pathname) }} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {error && <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <SortHeader k="company">Company</SortHeader>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">Primary contact</th>
              <th className="px-3 py-2 font-medium">Promotes</th>
              <th className="px-3 py-2 font-medium">Targets</th>
              <SortHeader k="budget" className="text-right">Budget / campaign</SortHeader>
              <SortHeader k="start_date">Start</SortHeader>
              <th className="px-3 py-2 font-medium">Campaigns</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {loading && rows.length === 0 ? (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-slate-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                {anyFilter ? 'No clients match these filters.' : 'No clients in the Database yet. Use "Add to DB" on a brand lead, or Add client.'}
              </td></tr>
            ) : rows.map((r) => {
              const link = primaryLink('brand', r as unknown as Record<string, unknown>)
              const targets = [
                ...r.target_countries,
                ...r.niches,
                ...r.platforms.map((p) => DB_PLATFORM_LABELS[p as DbPlatform] ?? p),
              ]
              return (
                <tr key={r.lead_id} className={cn('text-slate-300 hover:bg-slate-800/30', loading && 'opacity-60')}>
                  <td className="px-3 py-2">
                    {link ? (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" title={`${LINK_LABELS[link.kind]}: ${link.url}`}
                        className="inline-flex items-center gap-1 font-medium text-violet-300 hover:text-violet-200 hover:underline">
                        <LinkIcon kind={link.kind} /> {r.company || r.domain || r.lead_id}
                      </a>
                    ) : <span className="font-medium text-slate-200">{r.company || r.lead_id}</span>}
                    <div><Link href={`${dbPath('brand')}/${r.lead_id}`} className="font-mono text-[11px] text-slate-500 hover:text-white">{r.lead_id}</Link></div>
                  </td>
                  <td className="px-3 py-2"><StageBadge stage={r.stage} /></td>
                  <td className="px-3 py-2">
                    <div>{r.contact_name || r.email || '–'}</div>
                    {r.role && <div className="text-xs text-slate-500">{r.role}</div>}
                    {r.extra_contacts > 0 && <div className="text-xs text-slate-500">+{r.extra_contacts} more</div>}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2" title={r.promotes ?? undefined}>{r.promotes || r.product || '–'}</td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-xs text-slate-400" title={targets.join(', ')}>{targets.join(', ') || '–'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">{budgetLabel(r)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">{r.start_date ?? '–'}</td>
                  <td className="px-3 py-2 text-xs">{r.campaigns_count > 0 ? `${r.campaigns_count}${r.last_campaign_date ? `, last ${r.last_campaign_date}` : ''}` : '–'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">{ownerName(r.owner_user_id)}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Link href={`${dbPath('brand')}/${r.lead_id}`} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">Open</Link>
                      <Link href={`${dbPath('creator')}?${matchingCreatorsQuery(r)}`} title="Find matching creators" aria-label={`Find creators matching ${r.company ?? r.lead_id}`}
                        className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-violet-300">
                        <Users className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{total.toLocaleString()} client{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button disabled={offset === 0} onClick={() => setParams({ offset: String(Math.max(offset - PAGE_SIZE, 0)) }, true)} className={ghostButtonClass} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
          <span>{total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE_SIZE, total)}</span>
          <button disabled={offset + PAGE_SIZE >= total} onClick={() => setParams({ offset: String(offset + PAGE_SIZE) }, true)} className={ghostButtonClass} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {adding && <AddDirectDialog leadType="brand" onClose={() => setAdding(false)} />}
    </div>
  )
}
