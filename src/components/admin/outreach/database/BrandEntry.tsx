'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Loader2, PanelRight, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { NICHES } from '@/utils/constants'
import { cn } from '@/lib/utils'
import {
  BRAND_STAGE_LABELS, BRAND_STAGES, CREATOR_SIZE_LABELS, CREATOR_SIZES, CURRENCIES, DB_PLATFORM_LABELS, DB_PLATFORMS,
  formatMoney, matchingCreatorsQuery,
} from '@/lib/outreach/database'
import { karachiToday, leadLinks } from '@/lib/outreach/rules'
import type { BrandCampaign, BrandDbFields, OutreachActivityRow, OutreachBrand } from '@/lib/outreach/types'
import { ContactsEditor } from '@/components/admin/outreach/ContactsEditor'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { ConfirmDialog } from '@/components/admin/outreach/ConfirmDialog'
import { LeadForm } from '@/components/admin/outreach/LeadForm'
import {
  buttonClass, Card, DncBadge, ghostButtonClass, inputClass, LinkIcons, selectClass, StatusBadge,
} from '@/components/admin/outreach/ui'
import { budgetLabel } from '@/components/admin/outreach/database/BrandDatabase'
import {
  ActivityList, BackLink, ChipToggle, dbApi, dbPath, Field, fieldErrors, ListInput,
} from '@/components/admin/outreach/database/shared'

interface EntryData {
  lead: OutreachBrand & { dnc: boolean }
  entry: BrandDbFields & { added_at: string }
  campaigns: BrandCampaign[]
  activity: OutreachActivityRow[]
}

type FormState = Omit<BrandDbFields, 'budget_min' | 'budget_max'> & { budget_min: string; budget_max: string }

function toForm(e: BrandDbFields): FormState {
  return {
    promotes: e.promotes,
    target_countries: e.target_countries ?? [],
    niches: e.niches ?? [],
    platforms: e.platforms ?? [],
    budget_min: e.budget_min === null ? '' : String(Number(e.budget_min)),
    budget_max: e.budget_max === null ? '' : String(Number(e.budget_max)),
    budget_currency: e.budget_currency,
    creator_sizes: e.creator_sizes ?? [],
    stage: e.stage,
    start_date: e.start_date,
    payment_terms: e.payment_terms,
    notes: e.notes,
  }
}

function changedFields(initial: FormState, current: FormState): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(current) as (keyof FormState)[]) {
    if (JSON.stringify(initial[k] ?? null) !== JSON.stringify(current[k] ?? null)) {out[k] = current[k] ?? null}
  }
  return out
}

export function BrandEntry({ leadId }: { leadId: string }) {
  const router = useRouter()
  const { me, ownerName, toast, version, bump, addToDatabase } = useOutreach()
  const isAdmin = !!me?.is_admin
  const [data, setData] = useState<EntryData | null>(null)
  const [missing, setMissing] = useState<{ removed: boolean; leadExists: boolean } | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [initial, setInitial] = useState<FormState | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [editingLead, setEditingLead] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`${dbApi('brand')}/${encodeURIComponent(leadId)}`)
    const d = await readJson<EntryData & { in_db?: boolean; removed?: boolean }>(res)
    if (!res.ok) {
      setData(null)
      setMissing({ removed: !!d.removed, leadExists: d.in_db === false })
      return
    }
    setMissing(null)
    setData(d)
    const f = toForm(d.entry)
    setForm(f)
    setInitial(f)
  }, [leadId])

  useEffect(() => { void load() }, [load, version])

  if (missing) {
    return (
      <div className="space-y-4">
        <BackLink leadType="brand" />
        <Card>
          <p className="text-sm text-slate-300">
            {missing.leadExists
              ? `${leadId} is not in the Client Database${missing.removed ? ' (an admin removed it; adding it again brings back its contacts and campaigns)' : ''}.`
              : 'Lead not found. It may have been deleted.'}
          </p>
          {missing.leadExists && (
            <button className={cn(buttonClass, 'mt-3')} onClick={() => void addToDatabase(leadId).then((ok) => { if (ok) {void load()} })}>
              Add {leadId} to the Database
            </button>
          )}
        </Card>
      </div>
    )
  }
  if (!data || !form || !initial) {return <p className="text-sm text-slate-500">Loading…</p>}

  const { lead } = data
  const changes = changedFields(initial, form)
  const dirty = Object.keys(changes).length > 0
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm({ ...form, [k]: v })
  const matchHref = `${dbPath('creator')}?${matchingCreatorsQuery({ ...data.entry, country: lead.country })}`

  const save = async () => {
    setSaving(true)
    setErrors({})
    const res = await fetch(`${dbApi('brand')}/${encodeURIComponent(leadId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    const d = await readJson<{ message: string; fields?: Record<string, string[]> }>(res)
    setSaving(false)
    if (!res.ok) {
      setErrors(fieldErrors(d))
      toast('error', d.error ?? 'Save failed')
      return
    }
    toast('success', d.message)
    bump()
  }

  const remove = async () => {
    const res = await fetch(`${dbApi('brand')}/${encodeURIComponent(leadId)}`, { method: 'DELETE' })
    const d = await readJson<{ message: string }>(res)
    if (!res.ok) {
      toast('error', d.error ?? 'Remove failed')
      return
    }
    toast('success', d.message)
    router.push(dbPath('brand'))
  }

  return (
    <div className="space-y-4">
      <BackLink leadType="brand" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{lead.company || lead.domain || lead.lead_id}</h2>
            <span className="font-mono text-xs text-slate-500">{lead.lead_id}</span>
            <StatusBadge status={lead.status} />
            {lead.dnc && <DncBadge />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <LinkIcons links={leadLinks('brand', lead as unknown as Record<string, unknown>)} />
            <span>Owner: {ownerName(lead.owner_user_id)}</span>
            <span>Budget: {budgetLabel({ budget_min: data.entry.budget_min, budget_max: data.entry.budget_max, budget_currency: data.entry.budget_currency })}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={matchHref} className={buttonClass}><Users className="h-4 w-4" /> Find matching creators</Link>
          <button onClick={() => setEditingLead(true)} className={ghostButtonClass}><PanelRight className="h-4 w-4" /> Edit lead</button>
          <Link href={`/admin/outreach/brands?q=${encodeURIComponent(lead.lead_id)}`} className={ghostButtonClass}>Open in leads</Link>
          {isAdmin && (
            <button onClick={() => setConfirmRemove(true)} className={cn(ghostButtonClass, 'hover:border-red-700 hover:text-red-300')}>
              <Trash2 className="h-4 w-4" /> Remove from Database
            </button>
          )}
        </div>
      </div>

      <Card title="Contacts">
        <ContactsEditor lead={lead} />
        <p className="mt-3 text-xs text-slate-500">Each contact has its own status. The brand status follows the furthest-along contact.</p>
      </Card>

      <Card
        title="Client details"
        actions={
          <button onClick={() => void save()} disabled={!dirty || saving} className={buttonClass}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {dirty ? 'Save changes' : 'Saved'}
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Deal stage" error={errors.stage}>
            <select className={cn(selectClass, 'w-full')} value={form.stage} onChange={(e) => set('stage', e.target.value)}>
              {BRAND_STAGES.map((s) => <option key={s} value={s}>{BRAND_STAGE_LABELS[s]}</option>)}
            </select>
          </Field>
          <Field label="Start date" error={errors.start_date}>
            <input type="date" className={inputClass} value={form.start_date ?? ''} onChange={(e) => set('start_date', e.target.value || null)} />
          </Field>
          <Field label="What they promote" error={errors.promotes}>
            <input className={inputClass} value={form.promotes ?? ''} onChange={(e) => set('promotes', e.target.value || null)} placeholder={lead.product ?? 'Product or launch'} />
          </Field>
          <Field label="Budget per campaign" error={errors.budget_min || errors.budget_max} className="md:col-span-2">
            <div className="flex gap-2">
              <input className={inputClass} inputMode="decimal" placeholder="Min" value={form.budget_min} onChange={(e) => set('budget_min', e.target.value)} aria-label="Minimum budget" />
              <input className={inputClass} inputMode="decimal" placeholder="Max" value={form.budget_max} onChange={(e) => set('budget_max', e.target.value)} aria-label="Maximum budget" />
              <select className={selectClass} value={form.budget_currency} onChange={(e) => set('budget_currency', e.target.value)} aria-label="Budget currency">
                {[...new Set([...CURRENCIES, form.budget_currency])].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Target countries" hint="Comma separated" error={errors.target_countries}>
            <ListInput value={form.target_countries} onChange={(v) => set('target_countries', v)} placeholder="USA, UK" />
          </Field>
          <Field label="Niches" error={errors.niches} className="md:col-span-3">
            <ChipToggle options={NICHES} value={form.niches} onChange={(v) => set('niches', v)} />
          </Field>
          <Field label="Platforms" error={errors.platforms}>
            <ChipToggle options={DB_PLATFORMS} labels={DB_PLATFORM_LABELS} value={form.platforms} onChange={(v) => set('platforms', v)} />
          </Field>
          <Field label="Preferred creator size" error={errors.creator_sizes} className="md:col-span-2">
            <ChipToggle options={CREATOR_SIZES} labels={CREATOR_SIZE_LABELS} value={form.creator_sizes} onChange={(v) => set('creator_sizes', v)} />
          </Field>
          <Field label="Payment terms" error={errors.payment_terms} className="md:col-span-3">
            <input className={inputClass} value={form.payment_terms ?? ''} onChange={(e) => set('payment_terms', e.target.value || null)} placeholder="Net 30, 50% upfront" />
          </Field>
          <Field label="Notes" error={errors.notes} className="md:col-span-3">
            <textarea className={cn(inputClass, 'min-h-[90px]')} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value || null)} />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">Budgets are internal. They never appear on public pages or go to creators or brands.</p>
      </Card>

      <CampaignsCard leadId={leadId} campaigns={data.campaigns} />

      <Card title="Activity"><ActivityList activity={data.activity} /></Card>

      {editingLead && (
        <LeadForm leadType="brand" lead={lead} onClose={() => setEditingLead(false)} onSaved={() => { setEditingLead(false); bump() }} />
      )}
      {confirmRemove && (
        <ConfirmDialog
          title={`Remove ${lead.lead_id} from the Client Database?`}
          description="The lead stays in Brand leads. Its contacts, campaigns and notes are kept, so adding it again brings them back."
          confirmLabel="Remove"
          danger
          onConfirm={remove}
          onClose={() => setConfirmRemove(false)}
        />
      )}
    </div>
  )
}

// ─── Small item editor (contacts, campaigns) ─────────────────────────────────

function useItemApi(leadId: string, kind: 'campaigns') {
  const { toast, bump } = useOutreach()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const base = `${dbApi('brand')}/${encodeURIComponent(leadId)}/${kind}`
  const send = async (path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: Record<string, unknown>) => {
    setBusy(true)
    setErrors({})
    const res = await fetch(`${base}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const d = await readJson<{ message: string; fields?: Record<string, string[]> }>(res)
    setBusy(false)
    if (!res.ok) {
      setErrors(fieldErrors(d))
      toast('error', d.error ?? 'Save failed')
      return false
    }
    if (method !== 'PATCH') {toast('success', d.message)}
    bump()
    return true
  }
  return { send, errors, busy, setErrors }
}

interface CampaignDraft {
  title: string
  run_date: string
  creators_used: string
  total_budget: string
  currency: string
  result_notes: string
}

const emptyCampaign = (): CampaignDraft => ({ title: '', run_date: karachiToday(), creators_used: '', total_budget: '', currency: 'USD', result_notes: '' })

function CampaignsCard({ leadId, campaigns }: { leadId: string; campaigns: BrandCampaign[] }) {
  const { send, errors, busy, setErrors } = useItemApi(leadId, 'campaigns')
  const [draft, setDraft] = useState<CampaignDraft | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const submit = async () => {
    if (!draft) {return}
    const body = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim() || null]))
    const ok = editId ? await send(`/${editId}`, 'PATCH', body) : await send('', 'POST', body)
    if (ok) {
      setDraft(null)
      setEditId(null)
    }
  }

  const form = draft && (
    <div className="rounded-lg border border-slate-800 p-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <Field label="Title" error={errors.title} className="sm:col-span-2">
          <input className={inputClass} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        <Field label="Date" error={errors.run_date}>
          <input type="date" className={inputClass} value={draft.run_date} onChange={(e) => setDraft({ ...draft, run_date: e.target.value })} />
        </Field>
        <Field label="Total budget" error={errors.total_budget || errors.currency}>
          <div className="flex gap-1">
            <input className={inputClass} inputMode="decimal" value={draft.total_budget} onChange={(e) => setDraft({ ...draft, total_budget: e.target.value })} />
            <select className={selectClass} value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} aria-label="Currency">
              {[...new Set([...CURRENCIES, draft.currency])].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Creators used" error={errors.creators_used} className="sm:col-span-2">
          <input className={inputClass} value={draft.creators_used} onChange={(e) => setDraft({ ...draft, creators_used: e.target.value })} placeholder="C-0012, C-0040 or names" />
        </Field>
        <Field label="Result notes" error={errors.result_notes} className="sm:col-span-2">
          <input className={inputClass} value={draft.result_notes} onChange={(e) => setDraft({ ...draft, result_notes: e.target.value })} />
        </Field>
      </div>
      <div className="mt-2 flex gap-2">
        <button disabled={busy} className={buttonClass} onClick={() => void submit()}><Check className="h-4 w-4" /> {editId ? 'Save' : 'Add campaign'}</button>
        <button className={ghostButtonClass} onClick={() => { setDraft(null); setEditId(null); setErrors({}) }}>Cancel</button>
      </div>
    </div>
  )

  return (
    <Card title="Campaigns run" actions={!draft && <button onClick={() => { setDraft(emptyCampaign()); setEditId(null) }} className={ghostButtonClass}><Plus className="h-4 w-4" /> Add campaign</button>}>
      {campaigns.length === 0 && !draft && <p className="text-sm text-slate-500">No campaigns yet.</p>}
      <ul className="space-y-2 text-sm">
        {campaigns.map((c) => editId === c.id ? <li key={c.id}>{form}</li> : (
          <li key={c.id} className="rounded-lg border border-slate-800 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-slate-200">{c.title}</span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{c.run_date ?? 'No date'}</span>
                {c.total_budget !== null && <span>{formatMoney(c.total_budget, c.currency)}</span>}
                <button onClick={() => { setEditId(c.id); setDraft({ title: c.title, run_date: c.run_date ?? '', creators_used: c.creators_used ?? '', total_budget: c.total_budget === null ? '' : String(Number(c.total_budget)), currency: c.currency, result_notes: c.result_notes ?? '' }) }} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white" aria-label="Edit campaign"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => { if (window.confirm('Delete this campaign?')) {void send(`/${c.id}`, 'DELETE')} }} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400" aria-label="Delete campaign"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            {c.creators_used && <p className="mt-1 text-xs text-slate-400">Creators: {c.creators_used}</p>}
            {c.result_notes && <p className="mt-1 text-xs text-slate-400">{c.result_notes}</p>}
          </li>
        ))}
      </ul>
      {draft && !editId && <div className="mt-3">{form}</div>}
    </Card>
  )
}
