'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ClipboardCopy, Download, ListChecks, Plus, Search, X } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { cn } from '@/lib/utils'
import {
  AVAILABILITY, AVAILABILITY_LABELS, CURRENCIES, DB_PLATFORM_LABELS, DB_PLATFORMS, formatFollowers, formatMoney,
  isRateStale, RATE_FORMAT_LABELS, RATE_FORMATS, rateAgeLabel, shortlistText, type DbPlatform,
} from '@/lib/outreach/database'
import { karachiToday, LINK_LABELS, primaryLink } from '@/lib/outreach/rules'
import type { CreatorDbRow } from '@/lib/outreach/types'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, ghostButtonClass, inputClass, LinkIcon, selectClass } from '@/components/admin/outreach/ui'
import { AddDirectDialog, dbApi, dbPath, MultiFilter } from '@/components/admin/outreach/database/shared'

const PAGE_SIZE = 50
const LIST_PARAMS = ['niche', 'country', 'platform', 'format', 'availability', 'tag'] as const

const AVAIL_STYLE: Record<string, string> = {
  available: 'bg-emerald-900/50 text-emerald-300',
  limited: 'bg-amber-900/40 text-amber-300',
  booked: 'bg-red-950/60 text-red-300',
}

export function AvailabilityBadge({ value }: { value: string | null }) {
  if (!value) {return <span className="text-slate-600">–</span>}
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', AVAIL_STYLE[value])}>{AVAILABILITY_LABELS[value] ?? value}</span>
}

export function OnInfoishaiBadge({ username }: { username: string | null }) {
  if (!username) {return null}
  return (
    <a href={`/creators/${encodeURIComponent(username)}`} target="_blank" rel="noopener noreferrer"
      title="Same email signed up on Infoishai. Opens their public profile."
      className="whitespace-nowrap rounded-full bg-pink-900/40 px-2 py-0.5 text-[11px] font-medium text-pink-200 hover:bg-pink-900/70">
      On Infoishai
    </a>
  )
}

function platformLabel(id: string | null): string | null {
  return id ? DB_PLATFORM_LABELS[id as DbPlatform] ?? null : null
}

export function CreatorDatabase() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { me, team, ownerName, version } = useOutreach()
  const isAdmin = !!me?.is_admin
  const today = karachiToday()

  const [rows, setRows] = useState<CreatorDbRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ countries: string[]; niches: string[]; tags: string[] }>({ countries: [], niches: [], tags: [] })
  const [q, setQ] = useState(params.get('q') ?? '')
  const [maxPrice, setMaxPrice] = useState(params.get('max_price') ?? '')
  const [selected, setSelected] = useState<Map<string, CreatorDbRow>>(new Map())
  const [shortlistOpen, setShortlistOpen] = useState(false)
  const [adding, setAdding] = useState(false)

  const offset = Math.max(parseInt(params.get('offset') ?? '0', 10) || 0, 0)
  const sort = params.get('sort') ?? 'added'
  const dir = params.get('dir') === 'asc' ? 'asc' : 'desc'
  const list = (k: string) => (params.get(k) ?? '').split(',').filter(Boolean)

  // Filters live in the URL, so "Find matching creators" and shared links
  // open the same view.
  const setParams = useCallback((changes: Record<string, string | null>, keepOffset = false) => {
    const p = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '') {p.delete(k)}
      else {p.set(k, v)}
    }
    if (!keepOffset) {p.delete('offset')}
    router.replace(`${pathname}?${p.toString()}`)
  }, [params, pathname, router])

  // Debounced search + budget inputs.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== q.trim()) {setParams({ q: q.trim() || null })}
    }, 300)
    return () => clearTimeout(t)
  }, [q, params, setParams])
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('max_price') ?? '') !== maxPrice.trim()) {setParams({ max_price: maxPrice.trim() || null })}
    }, 400)
    return () => clearTimeout(t)
  }, [maxPrice, params, setParams])

  const query = useMemo(() => {
    const p = new URLSearchParams(params.toString())
    p.set('limit', String(PAGE_SIZE))
    return p
  }, [params])

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams(query)
    p.set('meta', '1')
    const res = await fetch(`${dbApi('creator')}?${p.toString()}`)
    const data = await readJson<{ rows: CreatorDbRow[]; total: number; filterValues?: typeof meta }>(res)
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Failed to load')
      return
    }
    setError(null)
    setRows(data.rows)
    setTotal(data.total)
    if (data.filterValues) {setMeta(data.filterValues)}
  }, [query])

  useEffect(() => { void load() }, [load, version])

  const toggleSort = (key: string) => {
    if (sort === key) {setParams({ dir: dir === 'asc' ? 'desc' : 'asc' })}
    else {setParams({ sort: key, dir: key === 'price' || key === 'name' ? 'asc' : 'desc' })}
  }

  const SortHeader = ({ k, children, className }: { k: string; children: React.ReactNode; className?: string }) => (
    <th className={cn('px-3 py-2 font-medium', className)}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-white">
        {children}
        {sort === k && (dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  )

  const toggle = (r: CreatorDbRow) => {
    const next = new Map(selected)
    if (next.has(r.lead_id)) {next.delete(r.lead_id)}
    else {next.set(r.lead_id, r)}
    setSelected(next)
  }
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.lead_id))
  const togglePage = () => {
    const next = new Map(selected)
    for (const r of rows) {
      if (allOnPage) {next.delete(r.lead_id)}
      else {next.set(r.lead_id, r)}
    }
    setSelected(next)
  }

  const exportHref = `${dbApi('creator')}/export?${new URLSearchParams([...params.entries()].filter(([k]) => k !== 'offset')).toString()}`
  const anyFilter = [...LIST_PARAMS, 'q', 'max_price', 'min_rating', 'owner'].some((k) => params.get(k))
  const colCount = isAdmin ? 12 : 11

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className={cn(inputClass, 'pl-9')} placeholder="Search name, email, niche, tags, notes" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button onClick={() => setAdding(true)} className={buttonClass}><Plus className="h-4 w-4" /> Add creator</button>
        <a href={exportHref} className={ghostButtonClass}><Download className="h-4 w-4" /> CSV</a>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MultiFilter label="Niche" options={meta.niches} value={list('niche')} onChange={(v) => setParams({ niche: v.join(',') })} />
        <MultiFilter label="Country" options={meta.countries} value={list('country')} onChange={(v) => setParams({ country: v.join(',') })} />
        <MultiFilter label="Platform" options={DB_PLATFORMS} labels={DB_PLATFORM_LABELS} value={list('platform')} onChange={(v) => setParams({ platform: v.join(',') })} />
        <MultiFilter label="Format" options={RATE_FORMATS} labels={RATE_FORMAT_LABELS} value={list('format')} onChange={(v) => setParams({ format: v.join(',') })} />
        <MultiFilter label="Availability" options={AVAILABILITY} labels={AVAILABILITY_LABELS} value={list('availability')} onChange={(v) => setParams({ availability: v.join(',') })} />
        <MultiFilter label="Tags" options={meta.tags} value={list('tag')} onChange={(v) => setParams({ tag: v.join(',') })} />
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">Price ≤</span>
          <input className={cn(inputClass, 'w-24 py-1.5')} inputMode="decimal" placeholder="Any" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="Maximum price" />
          <select className={cn(selectClass, 'py-1.5')} value={params.get('currency') ?? ''} onChange={(e) => setParams({ currency: e.target.value || null })} aria-label="Currency">
            <option value="">{maxPrice ? 'USD' : 'Any currency'}</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {isAdmin && (
          <select className={selectClass} value={params.get('min_rating') ?? ''} onChange={(e) => setParams({ min_rating: e.target.value || null })} aria-label="Minimum rating">
            <option value="">Any rating</option>
            {[5, 4, 3, 2].map((n) => <option key={n} value={n}>{n}+ stars</option>)}
          </select>
        )}
        <select className={selectClass} value={params.get('owner') ?? ''} onChange={(e) => setParams({ owner: e.target.value || null })} aria-label="Owner">
          <option value="">Every owner</option>
          <option value="me">Mine</option>
          <option value="none">Unassigned</option>
          {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
        </select>
        {anyFilter && (
          <button onClick={() => { setQ(''); setMaxPrice(''); router.replace(pathname) }} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
      {!params.get('currency') && !maxPrice && (
        <p className="text-xs text-slate-500">Prices show in each creator&apos;s main currency. Pick a currency to compare prices directly.</p>
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-violet-800 bg-violet-950/40 px-4 py-2 text-sm text-violet-100">
          <span>{selected.size} selected</span>
          <button onClick={() => setShortlistOpen(true)} className={buttonClass}><ListChecks className="h-4 w-4" /> Shortlist</button>
          <button onClick={() => setSelected(new Map())} className="text-xs text-violet-300 hover:text-white">Clear selection</button>
        </div>
      )}

      {error && <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2"><input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="Select page" /></th>
              <SortHeader k="name">Name</SortHeader>
              <SortHeader k="followers">Platforms</SortHeader>
              <th className="px-3 py-2 font-medium">Niche</th>
              <th className="px-3 py-2 font-medium">Country</th>
              <SortHeader k="price" className="text-right">Cheapest</SortHeader>
              <th className="px-3 py-2 text-right font-medium">Typical</th>
              <th className="px-3 py-2 font-medium">Availability</th>
              <SortHeader k="rate_date">Rate age</SortHeader>
              {isAdmin && <SortHeader k="rating">Rating</SortHeader>}
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {loading && rows.length === 0 ? (
              <tr><td colSpan={colCount} className="px-3 py-10 text-center text-slate-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={colCount} className="px-3 py-10 text-center text-slate-500">
                {anyFilter ? 'No creators match these filters.' : 'No creators in the Database yet. Use "Add to DB" on a creator lead, or Add creator.'}
              </td></tr>
            ) : rows.map((r) => {
              const link = primaryLink('creator', r as unknown as Record<string, unknown>)
              const stale = isRateStale(r.last_quoted_at, today)
              return (
                <tr key={r.lead_id} className={cn('text-slate-300 hover:bg-slate-800/30', loading && 'opacity-60')}>
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.has(r.lead_id)} onChange={() => toggle(r)} aria-label={`Select ${r.lead_id}`} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {link ? (
                        <a href={link.url} target="_blank" rel="noopener noreferrer" title={`${LINK_LABELS[link.kind]}: ${link.url}`}
                          className="inline-flex items-center gap-1 font-medium text-violet-300 hover:text-violet-200 hover:underline">
                          <LinkIcon kind={link.kind} /> {r.name || r.lead_id}
                        </a>
                      ) : <span className="font-medium text-slate-200">{r.name || r.lead_id}</span>}
                      <OnInfoishaiBadge username={r.on_infoishai} />
                    </div>
                    <Link href={`${dbPath('creator')}/${r.lead_id}`} className="font-mono text-[11px] text-slate-500 hover:text-white">{r.lead_id}</Link>
                  </td>
                  <td className="px-3 py-2">
                    <div className="whitespace-nowrap">{formatFollowers(r.total_followers) || '–'}</div>
                    <div className="text-xs text-slate-500">{r.all_platforms.map((p) => platformLabel(p) ?? p).join(', ')}</div>
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2">{r.niche ?? '–'}</td>
                  <td className="px-3 py-2">{r.country ?? '–'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">{r.cheapest !== null ? formatMoney(r.cheapest, r.rate_currency) : '–'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">{r.typical !== null ? formatMoney(r.typical, r.rate_currency) : '–'}</td>
                  <td className="px-3 py-2"><AvailabilityBadge value={r.availability} /></td>
                  <td className={cn('whitespace-nowrap px-3 py-2 text-xs', stale ? 'text-amber-300' : 'text-slate-400')} title={stale ? 'Older than 90 days: ask for a fresh quote' : undefined}>
                    {r.rates.length === 0 ? 'No rates' : rateAgeLabel(r.last_quoted_at, today)}
                  </td>
                  {isAdmin && <td className="px-3 py-2 text-amber-300">{r.quality_rating ? '★'.repeat(r.quality_rating) : <span className="text-slate-600">–</span>}</td>}
                  <td className="whitespace-nowrap px-3 py-2 text-xs">{ownerName(r.owner_user_id)}</td>
                  <td className="px-3 py-2">
                    <Link href={`${dbPath('creator')}/${r.lead_id}`} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">Open</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{total.toLocaleString()} creator{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button disabled={offset === 0} onClick={() => setParams({ offset: String(Math.max(offset - PAGE_SIZE, 0)) }, true)} className={ghostButtonClass} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
          <span>{total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE_SIZE, total)}</span>
          <button disabled={offset + PAGE_SIZE >= total} onClick={() => setParams({ offset: String(offset + PAGE_SIZE) }, true)} className={ghostButtonClass} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {shortlistOpen && (
        <ShortlistDialog
          creators={[...selected.values()]}
          initialFormat={list('format').length === 1 ? list('format')[0] : ''}
          initialPlatform={list('platform').length === 1 ? list('platform')[0] : ''}
          initialCurrency={params.get('currency') ?? ''}
          onClose={() => setShortlistOpen(false)}
        />
      )}
      {adding && <AddDirectDialog leadType="creator" onClose={() => setAdding(false)} />}
    </div>
  )
}

// Clean summary to paste into an email to a client: name, link, followers
// and the rate for the chosen format. No internal fields.
function ShortlistDialog({ creators, initialFormat, initialPlatform, initialCurrency, onClose }: {
  creators: CreatorDbRow[]; initialFormat: string; initialPlatform: string; initialCurrency: string; onClose: () => void
}) {
  const { toast } = useOutreach()
  useEscapeKey(onClose)
  const [format, setFormat] = useState(initialFormat)
  const [platform, setPlatform] = useState(initialPlatform)
  const [currency, setCurrency] = useState(initialCurrency)
  const text = useMemo(() => shortlistText(creators.map((c) => {
    const pid = platform || c.platform_id
    const followers = platform ? (c.followers?.[platform] ?? (c.platform_id === platform ? c.subscribers : null)) : c.total_followers
    return {
      lead_id: c.lead_id,
      name: c.name,
      link: primaryLink('creator', c as unknown as Record<string, unknown>)?.url ?? null,
      total_followers: followers ?? null,
      platform_label: platform ? platformLabel(pid) : c.all_platforms.length === 1 ? platformLabel(c.all_platforms[0]) : null,
      rates: c.rates,
    }
  }), { format: format || null, platform: platform || null, currency: currency || null }), [creators, format, platform, currency])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast('success', `Copied ${creators.length} creator${creators.length === 1 ? '' : 's'}`)
    } catch {
      toast('error', 'Copy failed. Select the text and copy it by hand.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Shortlist: {creators.length} creator{creators.length === 1 ? '' : 's'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <select className={selectClass} value={format} onChange={(e) => setFormat(e.target.value)} aria-label="Format">
            <option value="">Any format (lowest rate)</option>
            {RATE_FORMATS.map((f) => <option key={f} value={f}>{RATE_FORMAT_LABELS[f]}</option>)}
          </select>
          <select className={selectClass} value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
            <option value="">Any platform</option>
            {DB_PLATFORMS.map((p) => <option key={p} value={p}>{DB_PLATFORM_LABELS[p]}</option>)}
          </select>
          <select className={selectClass} value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency">
            <option value="">Main currency</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <textarea readOnly value={text} className={cn(inputClass, 'min-h-[260px] flex-1 font-mono text-xs')} onFocus={(e) => e.currentTarget.select()} />
        <p className="mt-2 text-xs text-slate-500">Leaves out ratings, notes, owners and emails. Check the rates before you send it.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className={ghostButtonClass}>Close</button>
          <button onClick={() => void copy()} className={buttonClass}><ClipboardCopy className="h-4 w-4" /> Copy</button>
        </div>
      </div>
    </div>
  )
}
