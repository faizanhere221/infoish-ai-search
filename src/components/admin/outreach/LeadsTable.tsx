'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Columns3, Database, Download, Eraser, MailWarning, PanelRight, Plus, RotateCcw,
  Search, SkipForward, Trash2,
} from 'lucide-react'
import { platformName } from '@/utils/constants'
import {
  BRAND_STATUSES, CHANNEL_LABELS, CHANNELS, CREATOR_STATUSES, LIST_LABELS, listsFor, primaryLink, STATUS_LABELS, type LeadType,
} from '@/lib/outreach/rules'
import type { OutreachLeadRow } from '@/lib/outreach/types'
import { ReasonDialog } from '@/components/admin/ReasonDialog'
import { ConfirmDialog } from '@/components/admin/outreach/ConfirmDialog'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { LeadActions } from '@/components/admin/outreach/LeadActions'
import { LeadForm } from '@/components/admin/outreach/LeadForm'
import { ContactsEditor } from '@/components/admin/outreach/ContactsEditor'
import { EditableCell } from '@/components/admin/outreach/EditableCell'
import {
  BRAND_COLUMNS, CREATOR_COLUMNS, cellDisplay, cellEditor, cellValue, extraColumn, KNOWN_EXTRAS, type LeadColumn,
} from '@/components/admin/outreach/columns'
import {
  buttonClass, DncBadge, ghostButtonClass, inputClass, selectClass,
} from '@/components/admin/outreach/ui'

const PAGE_SIZE = 50
const DELETE_BATCH = 200 // ids per delete/restore request
const BULK_BATCH = 500 // ids per owner/status request (the route's max)

interface FilterValues { countries: string[]; niches: string[]; platforms: string[] }

// Owner/status bulk changes and "delete personal data" keep the reason step.
interface Pending {
  kind: 'erase' | 'bulk'
  lead?: OutreachLeadRow
  bulk?: { owner_user_id?: string | null; status?: string }
}

// Soft delete / restore: one row, or the selection (page or all matching).
interface Confirming {
  kind: 'delete' | 'restore'
  lead?: OutreachLeadRow
}

function leadTitle(lead: OutreachLeadRow): string {
  const l = lead as unknown as Record<string, unknown>
  return String(l.name ?? l.company ?? l.email ?? '').trim()
}

function plural(n: number, word: string): string {
  return `${n.toLocaleString()} ${n === 1 ? word : `${word}s`}`
}

interface EditingCell {
  leadId: string
  colId: string
  initial?: string
  error?: string
}

function columnsKey(leadType: LeadType) {
  return `outreach_columns_${leadType}`
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
  const { me, team, ownerName, toast, version, bump, addToDatabase } = useOutreach()
  const segment = leadType === 'creator' ? 'creators' : 'brands'
  const statuses: readonly string[] = leadType === 'creator' ? CREATOR_STATUSES : BRAND_STATUSES
  const baseColumns = leadType === 'creator' ? CREATOR_COLUMNS : BRAND_COLUMNS
  const isAdmin = !!me?.is_admin

  const [q, setQ] = useState(sp.get('q') ?? '')
  const [debouncedQ, setDebouncedQ] = useState(q)
  const [owner, setOwner] = useState(sp.get('owner') ?? '')
  const [status, setStatus] = useState(sp.get('status') ?? '')
  const [country, setCountry] = useState('')
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState('')
  const [channel, setChannel] = useState('')
  const [list, setList] = useState(sp.get('list') ?? '')
  // What the database has (lists, brand contacts: outreach_contacts_lists_migration.sql).
  const [features, setFeatures] = useState<{ lists: boolean; contacts: boolean }>({ lists: false, contacts: false })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [missingEmail, setMissingEmail] = useState(sp.get('missing') === 'email')
  const [showDeleted, setShowDeleted] = useState(sp.get('deleted') === '1')
  const [sort, setSort] = useState('created_at')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [offset, setOffset] = useState(0)

  const [leads, setLeads] = useState<OutreachLeadRow[]>([])
  const [total, setTotal] = useState(0)
  const [missingCount, setMissingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterValues, setFilterValues] = useState<FilterValues>({ countries: [], niches: [], platforms: [] })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [panel, setPanel] = useState<OutreachLeadRow | null | 'new'>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [confirming, setConfirming] = useState<Confirming | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  // "Select all N matching this filter": the selection is every lead the
  // filters match, not only this page. Ids are fetched when an action runs.
  const [allMatching, setAllMatching] = useState(false)
  const [bulkOwner, setBulkOwner] = useState('')
  const [bulkStatus, setBulkStatus] = useState('')
  const [editing, setEditing] = useState<EditingCell | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [visibleIds, setVisibleIds] = useState<string[]>(() => baseColumns.filter((c) => c.defaultVisible).map((c) => c.id))
  const [pickerOpen, setPickerOpen] = useState(false)
  // After a reload in "missing email" mode, open the first row's email cell.
  const openFirstMissingAfterLoad = useRef(false)

  // Column choice is a per-browser convenience.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(columnsKey(leadType)) ?? 'null')
      if (Array.isArray(saved) && saved.every((x) => typeof x === 'string')) {
        // Column choices saved before the Links column existed: add it once.
        const seenKey = `${columnsKey(leadType)}_links`
        if (!saved.includes('links') && !localStorage.getItem(seenKey)) {
          const at = saved.indexOf(leadType === 'creator' ? 'name' : 'company')
          saved.splice(at + 1, 0, 'links')
          localStorage.setItem(columnsKey(leadType), JSON.stringify(saved))
        }
        localStorage.setItem(seenKey, '1')
        // Saved before the List / Contacts columns existed: add them once.
        const v2Key = `${columnsKey(leadType)}_v2`
        if (!localStorage.getItem(v2Key)) {
          for (const id of leadType === 'brand' ? ['contacts', 'list'] : ['list']) {
            if (!saved.includes(id)) {saved.splice(id === 'contacts' ? saved.indexOf('links') + 1 : saved.length, 0, id)}
          }
          localStorage.setItem(columnsKey(leadType), JSON.stringify(saved))
          localStorage.setItem(v2Key, '1')
        }
        setVisibleIds(saved)
      }
    } catch {
      // storage blocked or bad JSON: keep the defaults
    }
  }, [leadType])

  const setColumns = (ids: string[]) => {
    setVisibleIds(ids)
    try { localStorage.setItem(columnsKey(leadType), JSON.stringify(ids)) } catch { /* storage blocked */ }
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => { setOffset(0) }, [debouncedQ, owner, status, country, niche, platform, channel, list, missingEmail, showDeleted, sort, dir])

  const filterParams = useMemo(() => {
    const p = new URLSearchParams()
    if (debouncedQ) {p.set('q', debouncedQ)}
    if (owner) {p.set('owner', owner)}
    if (status) {p.set('status', status)}
    if (country) {p.set('country', country)}
    if (niche) {p.set('niche', niche)}
    if (platform) {p.set('platform', platform)}
    if (channel) {p.set('channel', channel)}
    if (list) {p.set('list', list)}
    if (missingEmail) {p.set('missing', 'email')}
    if (showDeleted && isAdmin) {p.set('deleted', '1')}
    p.set('sort', sort)
    p.set('dir', dir)
    return p
  }, [debouncedQ, owner, status, country, niche, platform, channel, list, missingEmail, showDeleted, isAdmin, sort, dir])
  const inDeletedView = showDeleted && isAdmin

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams(filterParams)
    p.set('limit', String(PAGE_SIZE))
    p.set('offset', String(offset))
    if (offset === 0) {p.set('meta', '1')}
    const res = await fetch(`/api/admin/outreach/leads/${segment}?${p}`)
    const data = await readJson<{ leads: OutreachLeadRow[]; total: number; filterValues?: FilterValues; missingEmailCount: number; features?: { lists: boolean; contacts: boolean } }>(res)
    setLoading(false)
    if (!res.ok) {
      toast('error', data.error ?? 'Failed to load leads')
      return
    }
    setLeads(data.leads)
    setTotal(data.total)
    setMissingCount(data.missingEmailCount)
    if (data.features) {setFeatures(data.features)}
    if (data.filterValues) {setFilterValues(data.filterValues)}
    if (openFirstMissingAfterLoad.current) {
      openFirstMissingAfterLoad.current = false
      const first = data.leads.find((l) => !l.email)
      if (first) {setEditing({ leadId: first.lead_id, colId: 'email' })}
      else {toast('success', 'No leads without email left here.')}
    }
  }, [filterParams, offset, segment, toast])

  useEffect(() => { void load() }, [load, version])
  useEffect(() => {
    setSelected(new Set())
    setAllMatching(false)
  }, [filterParams, offset])

  // Extra keys: the known ones for this lead type plus any on this page.
  const extraKeys = useMemo(() => {
    const keys = new Set(KNOWN_EXTRAS[leadType])
    for (const l of leads) {for (const k of Object.keys(l.extra ?? {})) {keys.add(k)}}
    return [...keys].sort()
  }, [leads, leadType])
  // List and Contacts columns only once the database has them.
  const available = useMemo(() => baseColumns.filter((c) => (c.kind !== 'list' || features.lists) && (c.kind !== 'contacts' || features.contacts)), [baseColumns, features])
  const allColumns = useMemo(() => [...available, ...extraKeys.map(extraColumn)], [available, extraKeys])
  const columns = allColumns.filter((c) => visibleIds.includes(c.id))
  // Email stays reachable for the missing-email flow even if hidden.
  const shownColumns = (missingEmail || editing?.colId === 'email') && !columns.some((c) => c.id === 'email')
    ? [...columns, allColumns.find((c) => c.id === 'email') as LeadColumn]
    : columns

  const onSort = (field: string) => {
    if (sort === field) {setDir(dir === 'asc' ? 'desc' : 'asc')}
    else {
      setSort(field)
      setDir(field === 'name' || field === 'company' ? 'asc' : 'desc')
    }
  }

  const replaceLead = (lead: OutreachLeadRow) => setLeads((ls) => ls.map((l) => (l.lead_id === lead.lead_id ? lead : l)))

  const nextMissingAfter = (leadId: string | null) => {
    const start = leadId ? leads.findIndex((l) => l.lead_id === leadId) + 1 : 0
    return leads.slice(start).find((l) => !l.email && l.lead_id !== leadId) ?? null
  }

  const goToNextMissing = (afterLeadId: string | null) => {
    const next = nextMissingAfter(afterLeadId)
    if (next) {
      setEditing({ leadId: next.lead_id, colId: 'email' })
      return
    }
    if (missingEmail) {
      // Rows with a new email have left the filter: reload for the next batch.
      openFirstMissingAfterLoad.current = true
      setOffset(0)
      void load()
    } else {
      setEditing(null)
      toast('success', 'No more leads without email on this page.')
    }
  }

  // Optimistic cell save: show the new value now, roll back and reopen the
  // cell with the error if the server refuses it.
  const saveCell = async (lead: OutreachLeadRow, c: LeadColumn, text: string) => {
    if (!c.field) {return}
    const value: unknown = c.kind === 'extra'
      ? { ...(lead.extra ?? {}), [c.extraKey as string]: text.trim() }
      : text.trim() === '' ? null : text.trim()
    const optimistic = c.kind === 'extra'
      ? { ...lead, extra: value as OutreachLeadRow['extra'] }
      : ({ ...lead, [c.field]: value } as OutreachLeadRow)

    setEditing(null)
    replaceLead(optimistic)
    setSaving((s) => new Set(s).add(`${lead.lead_id}:${c.id}`))
    const res = await fetch(`/api/admin/outreach/leads/${segment}/${encodeURIComponent(lead.lead_id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [c.field]: value }),
    })
    const data = await readJson<{ lead: OutreachLeadRow; changed: boolean; fields?: Record<string, string[]> }>(res)
    setSaving((s) => { const n = new Set(s); n.delete(`${lead.lead_id}:${c.id}`); return n })

    if (!res.ok) {
      replaceLead(lead)
      const message = data.fields?.[c.field]?.[0] ?? data.error ?? 'Save failed'
      setEditing({ leadId: lead.lead_id, colId: c.id, initial: text, error: message })
      toast('error', `${lead.lead_id}: ${message}`)
      return
    }
    replaceLead(data.lead)
    if (data.changed) {toast('success', 'Saved')}
    if (c.id === 'email' && data.lead.email && !lead.email) {goToNextMissing(lead.lead_id)}
  }

  const toggle = (id: string) => {
    setAllMatching(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {next.delete(id)} else {next.add(id)}
      return next
    })
  }
  const allOnPage = leads.length > 0 && leads.every((l) => selected.has(l.lead_id))
  const selectedCount = allMatching ? total : selected.size

  const clearSelection = () => {
    setSelected(new Set())
    setAllMatching(false)
  }

  // The ids an action applies to: the checked rows, or every lead the
  // filters match (fetched now, so the list is current).
  const resolveSelection = async (): Promise<string[] | null> => {
    if (!allMatching) {return [...selected]}
    const res = await fetch(`/api/admin/outreach/leads/${segment}?${filterParams}&ids=1`)
    const data = await readJson<{ ids: string[]; capped: boolean }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Failed to load the matching leads')
      return null
    }
    if (data.capped) {toast('error', `Only the first ${plural(data.ids.length, 'lead')} are included. Narrow the filter for the rest.`)}
    return data.ids
  }

  // Sends ids in batches and adds up `countKey` from each response. Stops at
  // the first failed batch and reports what was done before it.
  const runInBatches = async (
    ids: string[],
    size: number,
    send: (batch: string[]) => Promise<Response>,
    countKey: string,
    verb: string,
  ): Promise<{ done: number; error: string | null }> => {
    let done = 0
    for (let i = 0; i < ids.length; i += size) {
      if (ids.length > size) {setProgress(`${verb} ${Math.min(i, ids.length).toLocaleString()} of ${ids.length.toLocaleString()}…`)}
      const res = await send(ids.slice(i, i + size))
      const data = await readJson<Record<string, unknown>>(res)
      if (!res.ok) {return { done, error: (data.error as string | undefined) ?? 'Request failed' }}
      done += Number(data[countKey] ?? 0)
    }
    return { done, error: null }
  }

  const postIds = (path: string, extra: Record<string, unknown> = {}) => (batch: string[]) =>
    fetch(`/api/admin/outreach/leads/${segment}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: batch, ...extra }),
    })

  const afterBatch = () => {
    setProgress(null)
    clearSelection()
    bump()
  }

  // Soft delete / restore, for one row or the selection.
  const runConfirming = async () => {
    if (!confirming) {return}
    const deleting = confirming.kind === 'delete'
    const ids = confirming.lead ? [confirming.lead.lead_id] : await resolveSelection()
    if (!ids) {return}
    if (ids.length === 0) {
      toast('error', 'No leads selected')
      return
    }
    const { done, error } = await runInBatches(
      ids, DELETE_BATCH, postIds(deleting ? 'delete' : 'restore'),
      deleting ? 'deleted' : 'restored', deleting ? 'Deleted' : 'Restored',
    )
    const summary = `${deleting ? 'Deleted' : 'Restored'} ${plural(done, 'lead')}`
    if (error) {
      toast('error', `${summary} of ${ids.length.toLocaleString()}. Stopped: ${error}`)
    } else {
      const skipped = ids.length - done
      toast('success', skipped > 0 ? `${summary}. ${plural(skipped, 'lead')} skipped (already ${deleting ? 'deleted' : 'restored'}).` : summary)
    }
    setConfirming(null)
    afterBatch()
  }

  const runPending = async (reason: string) => {
    if (!pending) {return}
    if (pending.kind === 'bulk') {
      const ids = await resolveSelection()
      if (!ids) {return}
      const { done, error } = await runInBatches(ids, BULK_BATCH, postIds('bulk', { ...pending.bulk, reason }), 'updated', 'Updated')
      if (error) {toast('error', `Updated ${plural(done, 'lead')} of ${ids.length.toLocaleString()}. Stopped: ${error}`)}
      else {toast('success', `Updated ${plural(done, 'lead')}`)}
      setPending(null)
      setBulkOwner('')
      setBulkStatus('')
      afterBatch()
      return
    }
    const lead = pending.lead as OutreachLeadRow
    const res = await fetch(`/api/admin/outreach/leads/${segment}/${encodeURIComponent(lead.lead_id)}/erase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    const data = await readJson<{ message: string }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Failed')
      return
    }
    toast('success', data.message)
    setPending(null)
    bump()
  }

  const editorCtx = { team, countries: filterValues.countries, niches: filterValues.niches, leadType }
  const exportHref = `/api/admin/outreach/leads/${segment}/export?${filterParams}`
  const colCount = shownColumns.length + 2 + (isAdmin ? 1 : 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={leadType === 'creator' ? 'Search id, name, email, URL, notes, extra' : 'Search id, company, domain, email, notes, extra'}
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
        {features.lists && (
          <select value={list} onChange={(e) => setList(e.target.value)} className={selectClass} aria-label="List">
            <option value="">All lists</option>
            {listsFor(leadType).map((l) => <option key={l} value={l}>{LIST_LABELS[l]}</option>)}
          </select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setMissingEmail(!missingEmail)}
          className={missingEmail
            ? 'inline-flex items-center gap-1.5 rounded-lg border border-amber-600 bg-amber-950/50 px-3 py-2 text-sm text-amber-200'
            : ghostButtonClass}
          aria-pressed={missingEmail}
        >
          <MailWarning className="h-4 w-4" />
          Missing email
          <span className="rounded bg-slate-800 px-1.5 text-xs text-slate-300">{missingCount.toLocaleString()}</span>
        </button>
        <span className="text-sm text-slate-400">{missingCount.toLocaleString()} {missingCount === 1 ? 'lead' : 'leads'} without email</span>
        {missingCount > 0 && !inDeletedView && (
          <button onClick={() => goToNextMissing(editing?.colId === 'email' ? editing.leadId : null)} className={ghostButtonClass}>
            <SkipForward className="h-4 w-4" /> Next without email
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setShowDeleted(!showDeleted) }}
            className={inDeletedView
              ? 'inline-flex items-center gap-1.5 rounded-lg border border-red-700 bg-red-950/50 px-3 py-2 text-sm text-red-200'
              : ghostButtonClass}
            aria-pressed={inDeletedView}
            title="Show only deleted leads, to restore them"
          >
            <Trash2 className="h-4 w-4" /> Deleted
          </button>
        )}
        <div className="flex-1" />
        <div className="relative">
          <button onClick={() => setPickerOpen(!pickerOpen)} className={ghostButtonClass} aria-expanded={pickerOpen}>
            <Columns3 className="h-4 w-4" /> Columns
          </button>
          {pickerOpen && (
            <div className="absolute right-0 top-11 z-40 max-h-[420px] w-64 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
              <div className="mb-1 flex justify-between px-1 text-xs">
                <button onClick={() => setColumns(baseColumns.filter((c) => c.defaultVisible).map((c) => c.id))} className="text-violet-300 hover:text-violet-200">Defaults</button>
                <button onClick={() => setPickerOpen(false)} className="text-slate-400 hover:text-white">Close</button>
              </div>
              {allColumns.map((c, i) => (
                <div key={c.id}>
                  {i === available.length && <p className="mt-2 border-t border-slate-800 px-1 pt-2 text-[11px] uppercase tracking-wide text-slate-500">Extra fields</p>}
                  <label className="flex items-center gap-2 rounded px-1 py-1 text-sm text-slate-300 hover:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={visibleIds.includes(c.id)}
                      onChange={() => setColumns(visibleIds.includes(c.id) ? visibleIds.filter((x) => x !== c.id) : [...visibleIds, c.id])}
                    />
                    {c.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        <a href={exportHref} className={ghostButtonClass}><Download className="h-4 w-4" /> CSV</a>
        <button onClick={() => setPanel('new')} className={buttonClass}><Plus className="h-4 w-4" /> Add {leadType}</button>
      </div>

      {inDeletedView && (
        <p className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          Deleted leads. They stay out of tables, Today and exports, and their email, URL and domain still block duplicates. Restore a lead to work on it again.
        </p>
      )}

      {isAdmin && selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-800 bg-violet-950/40 px-3 py-2 text-sm text-slate-200">
          <span className="font-medium">{plural(selectedCount, 'lead')} selected</span>
          {allOnPage && !allMatching && total > leads.length && (
            <button onClick={() => setAllMatching(true)} className="text-violet-300 underline hover:text-violet-200">
              Select all {total.toLocaleString()} matching this filter
            </button>
          )}
          {allMatching && <span className="text-xs text-slate-400">(every lead matching this filter)</span>}
          {inDeletedView ? (
            <button onClick={() => setConfirming({ kind: 'restore' })} className={buttonClass}>
              <RotateCcw className="h-4 w-4" /> Restore selected ({selectedCount.toLocaleString()})
            </button>
          ) : (
            <>
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
          <button
            onClick={() => setConfirming({ kind: 'delete' })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" /> Delete selected ({selectedCount.toLocaleString()})
          </button>
            </>
          )}
          <button onClick={clearSelection} className="text-xs text-slate-400 hover:text-white">Clear</button>
        </div>
      )}

      {!inDeletedView && (
        <p className="text-xs text-slate-500">Click a cell to edit it. Enter saves, Esc cancels. The name opens the main profile; use the pencil to edit it. Status changes go through actions so mailbox limits and undo apply.</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80">
            <tr>
              {isAdmin && (
                <th className="w-8 px-3 py-2">
                  <input type="checkbox" checked={allOnPage} aria-label="Select all on this page" title="Select all on this page"
                    onChange={() => {
                      setAllMatching(false)
                      setSelected(allOnPage ? new Set() : new Set(leads.map((l) => l.lead_id)))
                    }} />
                </th>
              )}
              <SortHeader label="Lead" field="lead_id" sort={sort} dir={dir} onSort={onSort} />
              {shownColumns.map((c) => c.sort
                ? <SortHeader key={c.id} label={c.label} field={c.sort} sort={sort} dir={dir} onSort={onSort} />
                : <PlainHeader key={c.id} label={c.label} />)}
              <PlainHeader label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {loading && leads.length === 0 ? (
              <tr><td colSpan={colCount} className="px-3 py-10 text-center text-slate-500">Loading…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={colCount} className="px-3 py-10 text-center text-slate-500">No leads match these filters.</td></tr>
            ) : leads.map((lead) => (
              <Fragment key={lead.lead_id}>
              <tr className={`text-slate-300 hover:bg-slate-800/30 ${loading ? 'opacity-60' : ''}`}>
                {isAdmin && (
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={allMatching || selected.has(lead.lead_id)} onChange={() => toggle(lead.lead_id)} aria-label={`Select ${lead.lead_id}`} />
                  </td>
                )}
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-slate-300">{lead.lead_id}</span>
                    {lead.dnc && <DncBadge />}
                    {lead.in_db && !inDeletedView && (
                      <Link
                        href={`/admin/outreach/database/${leadType === 'creator' ? 'creators' : 'brands'}/${lead.lead_id}`}
                        className="rounded bg-violet-900/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200 hover:bg-violet-800"
                        title={`Open in the ${leadType === 'creator' ? 'Creator' : 'Client'} Database`}
                      >
                        DB
                      </Link>
                    )}
                  </div>
                </td>
                {shownColumns.map((c) => {
                  const isEditing = editing?.leadId === lead.lead_id && editing.colId === c.id
                  if (inDeletedView) {
                    return (
                      <td key={c.id} className="max-w-[240px] truncate px-3 py-2 opacity-70">
                        {cellDisplay(lead, c, ownerName, leadType)}
                      </td>
                    )
                  }
                  if (c.kind === 'contacts') {
                    const open = expanded.has(lead.lead_id)
                    return (
                      <td key={c.id} className="max-w-[220px] px-3 py-2">
                        <button
                          onClick={() => setExpanded((prev) => { const n = new Set(prev); if (open) {n.delete(lead.lead_id)} else {n.add(lead.lead_id)}; return n })}
                          className="flex max-w-full items-center gap-1 text-left hover:text-white" aria-expanded={open}
                          title={open ? 'Hide contacts' : 'Show and edit contacts'}
                        >
                          {open ? <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />}
                          {cellDisplay(lead, c, ownerName, leadType)}
                        </button>
                      </td>
                    )
                  }
                  if (c.kind === 'status') {
                    return isEditing ? (
                      <td key={c.id} className="px-1.5 py-1">
                        <LeadActions lead={lead} leadType={leadType} selectOnly onDone={() => setEditing(null)} />
                      </td>
                    ) : (
                      <td key={c.id} className="cursor-pointer px-3 py-2" onClick={() => setEditing({ leadId: lead.lead_id, colId: c.id })}>
                        {cellDisplay(lead, c, ownerName, leadType)}
                      </td>
                    )
                  }
                  const readOnly = !c.field || ((c.kind === 'owner' || c.kind === 'list') && !isAdmin)
                  const hasLink = !!c.profileLink && !!primaryLink(leadType, lead as unknown as Record<string, unknown>)
                  return (
                    <EditableCell
                      key={c.id}
                      display={cellDisplay(lead, c, ownerName, leadType)}
                      editIcon={hasLink}
                      value={cellValue(lead, c)}
                      editor={cellEditor(c, editorCtx)}
                      editing={isEditing}
                      readOnly={readOnly}
                      initial={isEditing ? editing?.initial : undefined}
                      error={isEditing ? editing?.error : undefined}
                      saving={saving.has(`${lead.lead_id}:${c.id}`)}
                      title={!isAdmin && c.kind === 'owner' ? 'Only admins change the owner' : !isAdmin && c.kind === 'list' ? 'Only admins change the list' : undefined}
                      className={c.kind === 'int' || c.kind === 'number' ? 'text-right' : undefined}
                      onStart={() => setEditing({ leadId: lead.lead_id, colId: c.id })}
                      onCancel={() => setEditing(null)}
                      onSave={(v) => void saveCell(lead, c, v)}
                    />
                  )
                })}
                <td className="whitespace-nowrap px-3 py-2">
                  {inDeletedView ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500" title={lead.deleted_at ?? undefined}>
                        Deleted {lead.deleted_at ? new Date(lead.deleted_at).toLocaleDateString() : ''}
                        {lead.deleted_by ? ` by ${ownerName(lead.deleted_by)}` : ''}
                      </span>
                      <button onClick={() => setConfirming({ kind: 'restore', lead })} className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800" aria-label={`Restore ${lead.lead_id}`}>
                        <RotateCcw className="h-3.5 w-3.5" /> Restore
                      </button>
                      <button onClick={() => setPending({ kind: 'erase', lead })} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-amber-300" title="Delete personal data" aria-label={`Delete personal data of ${lead.lead_id}`}>
                        <Eraser className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                  <div className="flex items-center gap-1">
                    <LeadActions lead={lead} leadType={leadType} />
                    <button onClick={() => setPanel(lead)} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white" title="Edit all fields" aria-label={`Edit ${lead.lead_id}`}>
                      <PanelRight className="h-3.5 w-3.5" />
                    </button>
                    {!lead.in_db && (
                      <button onClick={() => void addToDatabase(lead.lead_id)} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-violet-300" title="Add to Database" aria-label={`Add ${lead.lead_id} to the Database`}>
                        <Database className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <button onClick={() => setPending({ kind: 'erase', lead })} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-amber-300" title="Delete personal data" aria-label={`Delete personal data of ${lead.lead_id}`}>
                          <Eraser className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setConfirming({ kind: 'delete', lead })} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400" title="Delete lead" aria-label={`Delete ${lead.lead_id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                  )}
                </td>
              </tr>
              {expanded.has(lead.lead_id) && (
                <tr className="bg-slate-950/40">
                  <td colSpan={colCount} className="px-6 py-3">
                    <ContactsEditor lead={lead} readOnly={inDeletedView} compact />
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
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

      {panel && (
        <LeadForm
          leadType={leadType}
          lead={panel === 'new' ? null : panel}
          extraKeys={extraKeys}
          onClose={() => setPanel(null)}
          onSaved={(saved) => {
            setPanel(null)
            if (saved && panel !== 'new') {replaceLead(saved)} else {bump()}
          }}
        />
      )}

      {pending && (
        <ReasonDialog
          danger={pending.kind === 'erase'}
          title={pending.kind === 'erase' ? `Delete personal data of ${pending.lead?.lead_id}?` : `Update ${plural(selectedCount, 'lead')}?`}
          description={
            pending.kind === 'erase'
              ? 'Clears name, email, profile and social links, notes and edit history. The email and profile URL stay on the do-not-contact list so the lead never comes back.'
              : 'Bulk changes skip the mailbox count and have no undo. Deleted leads are skipped.'
          }
          confirmLabel={pending.kind === 'erase' ? 'Delete personal data' : 'Apply'}
          onConfirm={runPending}
          onClose={() => setPending(null)}
        />
      )}

      {confirming && (
        <ConfirmDialog
          danger={confirming.kind === 'delete'}
          title={
            confirming.lead
              ? `${confirming.kind === 'delete' ? 'Delete' : 'Restore'} ${confirming.lead.lead_id}${leadTitle(confirming.lead) ? ` (${leadTitle(confirming.lead)})` : ''}?`
              : `${confirming.kind === 'delete' ? 'Delete' : 'Restore'} ${plural(selectedCount, 'lead')}?`
          }
          description={confirming.kind === 'delete'
            ? 'Deleted leads leave every table, Today, counts and exports. Their email, URL and domain still block duplicates on import, and their activity stays in the stats. Restore them from the Deleted filter.'
            : 'Restored leads come back to the tables and Today with their status and history.'}
          confirmLabel={confirming.kind === 'delete'
            ? (confirming.lead ? 'Delete' : `Delete ${plural(selectedCount, 'lead')}`)
            : (confirming.lead ? 'Restore' : `Restore ${plural(selectedCount, 'lead')}`)}
          progress={progress}
          onConfirm={runConfirming}
          onClose={() => { setConfirming(null); setProgress(null) }}
        />
      )}
    </div>
  )
}
