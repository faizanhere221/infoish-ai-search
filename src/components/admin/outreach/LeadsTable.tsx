'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Eraser, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { platformName } from '@/utils/constants'
import {
  BRAND_STATUSES, CHANNEL_LABELS, CHANNELS, CREATOR_STATUSES, STATUS_LABELS, type LeadType,
} from '@/lib/outreach/rules'
import type { OutreachBrand, OutreachCreator, OutreachLeadRow } from '@/lib/outreach/types'
import { ReasonDialog } from '@/components/admin/ReasonDialog'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { LeadActions } from '@/components/admin/outreach/LeadActions'
import { LeadForm } from '@/components/admin/outreach/LeadForm'
import {
  buttonClass, DncBadge, ExternalLink, formatCount, ghostButtonClass, inputClass, selectClass, StatusBadge,
} from '@/components/admin/outreach/ui'

const PAGE_SIZE = 50

interface FilterValues { countries: string[]; niches: string[]; platforms: string[] }

interface Pending {
  kind: 'delete' | 'erase' | 'bulk'
  lead?: OutreachLeadRow
  bulk?: { owner_user_id?: string | null; status?: string }
}

function SortHeader({ label, field, sort, dir, onSort }: { label: string; field: string; sort: string; dir: string; onSort: (f: string) => void }) {
  const active = sort === field
  return (
    <th className="whitespace-nowrap px-3 py-2 text-left">
      <button onClick={() => onSort(field)} className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${active ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
        {label}
        {active && (dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  )
}

function PlainHeader({ label }: { label: string }) {
  return <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</th>
}

export function LeadsTable({ leadType }: { leadType: LeadType }) {
  const sp = useSearchParams()
  const { me, team, ownerName, toast, version, bump } = useOutreach()
  const segment = leadType === 'creator' ? 'creators' : 'brands'
  const statuses: readonly string[] = leadType === 'creator' ? CREATOR_STATUSES : BRAND_STATUSES

  const [q, setQ] = useState(sp.get('q') ?? '')
  const [debouncedQ, setDebouncedQ] = useState(q)
  const [owner, setOwner] = useState(sp.get('owner') ?? '')
  const [status, setStatus] = useState(sp.get('status') ?? '')
  const [country, setCountry] = useState('')
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState('')
  const [channel, setChannel] = useState('')
  const [sort, setSort] = useState('created_at')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [offset, setOffset] = useState(0)

  const [leads, setLeads] = useState<OutreachLeadRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterValues, setFilterValues] = useState<FilterValues>({ countries: [], niches: [], platforms: [] })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<OutreachLeadRow | null | 'new'>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [bulkOwner, setBulkOwner] = useState('')
  const [bulkStatus, setBulkStatus] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  // Any filter change goes back to page 1.
  useEffect(() => { setOffset(0) }, [debouncedQ, owner, status, country, niche, platform, channel, sort, dir])

  const filterParams = useMemo(() => {
    const p = new URLSearchParams()
    if (debouncedQ) {p.set('q', debouncedQ)}
    if (owner) {p.set('owner', owner)}
    if (status) {p.set('status', status)}
    if (country) {p.set('country', country)}
    if (niche) {p.set('niche', niche)}
    if (platform) {p.set('platform', platform)}
    if (channel) {p.set('channel', channel)}
    p.set('sort', sort)
    p.set('dir', dir)
    return p
  }, [debouncedQ, owner, status, country, niche, platform, channel, sort, dir])

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams(filterParams)
    p.set('limit', String(PAGE_SIZE))
    p.set('offset', String(offset))
    if (offset === 0) {p.set('meta', '1')}
    const res = await fetch(`/api/admin/outreach/leads/${segment}?${p}`)
    const data = await readJson<{ leads: OutreachLeadRow[]; total: number; filterValues?: FilterValues }>(res)
    setLoading(false)
    if (!res.ok) {
      toast('error', data.error ?? 'Failed to load leads')
      return
    }
    setLeads(data.leads)
    setTotal(data.total)
    if (data.filterValues) {setFilterValues(data.filterValues)}
  }, [filterParams, offset, segment, toast])

  useEffect(() => { void load() }, [load, version])
  useEffect(() => { setSelected(new Set()) }, [filterParams, offset])

  const onSort = (field: string) => {
    if (sort === field) {setDir(dir === 'asc' ? 'desc' : 'asc')}
    else {
      setSort(field)
      setDir(field === 'lead_id' || field === 'name' || field === 'company' ? 'asc' : 'desc')
    }
  }

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) {next.delete(id)} else {next.add(id)}
    return next
  })
  const allOnPage = leads.length > 0 && leads.every((l) => selected.has(l.lead_id))

  const runPending = async (reason: string) => {
    if (!pending) {return}
    let res: Response
    if (pending.kind === 'bulk') {
      res = await fetch(`/api/admin/outreach/leads/${segment}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: [...selected], ...pending.bulk, reason }),
      })
    } else {
      const lead = pending.lead as OutreachLeadRow
      const url = `/api/admin/outreach/leads/${segment}/${encodeURIComponent(lead.lead_id)}${pending.kind === 'erase' ? '/erase' : ''}`
      res = await fetch(url, {
        method: pending.kind === 'erase' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
    }
    const data = await readJson<{ message: string }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Failed')
      return
    }
    toast('success', data.message)
    setPending(null)
    setSelected(new Set())
    setBulkOwner('')
    setBulkStatus('')
    bump()
  }

  const exportHref = `/api/admin/outreach/leads/${segment}/export?${filterParams}`
  const isAdmin = !!me?.is_admin
  const colCount = (leadType === 'creator' ? 14 : 11) + (isAdmin ? 1 : 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={leadType === 'creator' ? 'Search id, name, email, URL' : 'Search id, company, domain, email'}
            className={`${inputClass} pl-9`} />
        </div>
        <select value={owner} onChange={(e) => setOwner(e.target.value)} className={selectClass} aria-label="Owner">
          <option value="">All owners</option>
          <option value="me">Mine</option>
          <option value="none">Unassigned</option>
          {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass} aria-label="Status">
          <option value="">All statuses</option>
          <option value="found,contacted,followed_up,replied">Open</option>
          {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass} aria-label="Country">
          <option value="">All countries</option>
          {filterValues.countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {leadType === 'creator' && (
          <>
            <select value={niche} onChange={(e) => setNiche(e.target.value)} className={selectClass} aria-label="Niche">
              <option value="">All niches</option>
              {filterValues.niches.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectClass} aria-label="Platform">
              <option value="">All platforms</option>
              {filterValues.platforms.map((p) => <option key={p} value={p}>{platformName(p) === 'Other platform' ? p : platformName(p)}</option>)}
            </select>
          </>
        )}
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className={selectClass} aria-label="Channel">
          <option value="">All channels</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
        </select>
        <a href={exportHref} className={ghostButtonClass}><Download className="h-4 w-4" /> CSV</a>
        <button onClick={() => setEditing('new')} className={buttonClass}><Plus className="h-4 w-4" /> Add {leadType}</button>
      </div>

      {isAdmin && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-800 bg-violet-950/40 px-3 py-2 text-sm text-slate-200">
          <span className="font-medium">{selected.size} selected</span>
          <select value={bulkOwner} onChange={(e) => setBulkOwner(e.target.value)} className={selectClass}>
            <option value="">Set owner</option>
            <option value="__none">Unassigned</option>
            {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
          </select>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className={selectClass}>
            <option value="">Set status</option>
            {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button
            disabled={!bulkOwner && !bulkStatus}
            onClick={() => setPending({
              kind: 'bulk',
              bulk: {
                ...(bulkOwner ? { owner_user_id: bulkOwner === '__none' ? null : bulkOwner } : {}),
                ...(bulkStatus ? { status: bulkStatus } : {}),
              },
            })}
            className={buttonClass}
          >
            Apply
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-white">Clear</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80">
            <tr>
              {isAdmin && (
                <th className="w-8 px-3 py-2">
                  <input type="checkbox" checked={allOnPage} aria-label="Select page"
                    onChange={() => setSelected(allOnPage ? new Set() : new Set(leads.map((l) => l.lead_id)))} />
                </th>
              )}
              <SortHeader label="Lead" field="lead_id" sort={sort} dir={dir} onSort={onSort} />
              {leadType === 'creator' ? (
                <>
                  <SortHeader label="Name" field="name" sort={sort} dir={dir} onSort={onSort} />
                  <SortHeader label="Platform" field="platform" sort={sort} dir={dir} onSort={onSort} />
                  <SortHeader label="Country" field="country" sort={sort} dir={dir} onSort={onSort} />
                  <SortHeader label="Niche" field="niche" sort={sort} dir={dir} onSort={onSort} />
                  <SortHeader label="Subs" field="subscribers" sort={sort} dir={dir} onSort={onSort} />
                  <SortHeader label="Views" field="avg_views" sort={sort} dir={dir} onSort={onSort} />
                  <PlainHeader label="Sponsors" />
                </>
              ) : (
                <>
                  <SortHeader label="Company" field="company" sort={sort} dir={dir} onSort={onSort} />
                  <SortHeader label="Country" field="country" sort={sort} dir={dir} onSort={onSort} />
                  <SortHeader label="Score" field="score" sort={sort} dir={dir} onSort={onSort} />
                  <PlainHeader label="Contact" />
                </>
              )}
              <PlainHeader label="Email" />
              <PlainHeader label="Owner" />
              <SortHeader label="Status" field="status" sort={sort} dir={dir} onSort={onSort} />
              <SortHeader label="Contacted" field="date_contacted" sort={sort} dir={dir} onSort={onSort} />
              <SortHeader label="Follow-up" field="follow_up_date" sort={sort} dir={dir} onSort={onSort} />
              <PlainHeader label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {loading && leads.length === 0 ? (
              <tr><td colSpan={colCount} className="px-3 py-10 text-center text-slate-500">Loading…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={colCount} className="px-3 py-10 text-center text-slate-500">No leads match these filters.</td></tr>
            ) : leads.map((lead) => {
              const c = lead as OutreachCreator & { dnc: boolean }
              const b = lead as OutreachBrand & { dnc: boolean }
              return (
                <tr key={lead.lead_id} className={`hover:bg-slate-800/40 ${loading ? 'opacity-60' : ''}`}>
                  {isAdmin && (
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={selected.has(lead.lead_id)} onChange={() => toggle(lead.lead_id)} aria-label={`Select ${lead.lead_id}`} />
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-slate-300">{lead.lead_id}</span>
                      {lead.dnc && <DncBadge />}
                    </div>
                  </td>
                  {leadType === 'creator' ? (
                    <>
                      <td className="max-w-[220px] truncate px-3 py-2 text-white">
                        <ExternalLink href={c.profile_url}>{c.name || c.profile_url || '(no name)'}</ExternalLink>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-300">{c.platform ? (platformName(c.platform) === 'Other platform' ? c.platform : platformName(c.platform)) : ''}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-300">{c.country}</td>
                      <td className="max-w-[140px] truncate px-3 py-2 text-slate-300">{c.niche}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-slate-300">{formatCount(c.subscribers)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-slate-300">{formatCount(c.avg_views)}</td>
                      <td className="max-w-[160px] truncate px-3 py-2 text-slate-400" title={c.sponsor_brands ?? ''}>
                        {c.does_sponsorships === true ? 'Yes' : c.does_sponsorships === false ? 'No' : ''}
                        {c.sponsor_brands ? ` · ${c.sponsor_brands}` : ''}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="max-w-[220px] truncate px-3 py-2 text-white">
                        <ExternalLink href={b.website || b.domain}>{b.company || b.domain || '(no name)'}</ExternalLink>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-300">{b.country}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-slate-300">{b.score ?? ''}</td>
                      <td className="max-w-[180px] truncate px-3 py-2 text-slate-300">{[b.contact_name, b.role].filter(Boolean).join(', ')}</td>
                    </>
                  )}
                  <td className="max-w-[200px] truncate px-3 py-2 text-slate-300">{lead.email}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-300">{ownerName(lead.owner_user_id)}</td>
                  <td className="px-3 py-2"><StatusBadge status={lead.status} /></td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-400">{lead.date_contacted ?? ''}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-400">{lead.follow_up_date ?? ''}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex items-center gap-1">
                      <LeadActions lead={lead} leadType={leadType} />
                      <button onClick={() => setEditing(lead)} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white" title="Edit" aria-label={`Edit ${lead.lead_id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => setPending({ kind: 'erase', lead })} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-amber-300" title="Delete personal data" aria-label={`Delete personal data of ${lead.lead_id}`}>
                            <Eraser className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setPending({ kind: 'delete', lead })} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400" title="Delete lead" aria-label={`Delete ${lead.lead_id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {total === 0 ? 'No results' : `${(offset + 1).toLocaleString()}–${Math.min(offset + PAGE_SIZE, total).toLocaleString()} of ${total.toLocaleString()}`}
        </span>
        <div className="flex gap-2">
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(offset - PAGE_SIZE, 0))} className={ghostButtonClass}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)} className={ghostButtonClass}>
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing && (
        <LeadForm
          leadType={leadType}
          lead={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); bump() }}
        />
      )}

      {pending && (
        <ReasonDialog
          danger={pending.kind !== 'bulk'}
          title={
            pending.kind === 'delete' ? `Delete ${pending.lead?.lead_id}?`
              : pending.kind === 'erase' ? `Delete personal data of ${pending.lead?.lead_id}?`
                : `Update ${selected.size} leads?`
          }
          description={
            pending.kind === 'delete' ? 'The lead row is removed. Its do-not-contact entries and activity history stay.'
              : pending.kind === 'erase' ? 'Clears name, email, profile and social links and notes. The email and profile URL stay on the do-not-contact list so the lead never comes back.'
                : 'Bulk changes skip the mailbox count and have no undo.'
          }
          confirmLabel={pending.kind === 'delete' ? 'Delete' : pending.kind === 'erase' ? 'Delete personal data' : 'Apply'}
          onConfirm={runPending}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  )
}
