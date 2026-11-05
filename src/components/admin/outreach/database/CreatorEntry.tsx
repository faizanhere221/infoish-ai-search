'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Loader2, PanelRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AVAILABILITY, AVAILABILITY_LABELS, CURRENCIES, DB_PLATFORM_LABELS, DB_PLATFORMS, formatFollowers, formatMoney,
  isRateStale, PAYMENT_METHOD_LABELS, PAYMENT_METHODS, platformId, RATE_FORMAT_LABELS, RATE_FORMATS, rateAgeLabel,
  type DbPlatform,
} from '@/lib/outreach/database'
import { karachiToday, leadLinks } from '@/lib/outreach/rules'
import type { CreatorDbFields, CreatorRate, OutreachActivityRow, OutreachCreator } from '@/lib/outreach/types'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { ConfirmDialog } from '@/components/admin/outreach/ConfirmDialog'
import { LeadForm } from '@/components/admin/outreach/LeadForm'
import { buttonClass, Card, DncBadge, ghostButtonClass, inputClass, LinkIcons, selectClass, StatusBadge } from '@/components/admin/outreach/ui'
import { OnInfoishaiBadge } from '@/components/admin/outreach/database/CreatorDatabase'
import {
  ActivityList, BackLink, ChipToggle, dbApi, dbPath, Field, fieldErrors, ListInput,
} from '@/components/admin/outreach/database/shared'

interface EntryData {
  lead: OutreachCreator & { dnc: boolean }
  entry: CreatorDbFields & { added_at: string; added_by: string | null; updated_at: string }
  rates: CreatorRate[]
  on_infoishai: string | null
  activity: OutreachActivityRow[]
}

type FormState = Omit<CreatorDbFields, 'followers' | 'min_lead_days' | 'upfront_pct' | 'quality_rating'> & {
  followers: Record<string, string>
  min_lead_days: string
  upfront_pct: string
  quality_rating: string
}

function toForm(e: EntryData['entry']): FormState {
  return {
    availability: e.availability,
    next_available_date: e.next_available_date,
    min_lead_days: e.min_lead_days === null ? '' : String(e.min_lead_days),
    payment_methods: e.payment_methods ?? [],
    upfront_pct: e.upfront_pct === null ? '' : String(e.upfront_pct),
    audience_countries: e.audience_countries ?? [],
    audience_languages: e.audience_languages ?? [],
    past_collabs: e.past_collabs ?? [],
    followers: Object.fromEntries(Object.entries(e.followers ?? {}).map(([k, v]) => [k, String(v)])),
    quality_rating: e.quality_rating ? String(e.quality_rating) : '',
    tags: e.tags ?? [],
    notes: e.notes,
  }
}

// What the API takes: only fields that differ from what was loaded.
function changedFields(initial: FormState, current: FormState, isAdmin: boolean): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(current) as (keyof FormState)[]) {
    if (k === 'quality_rating' && !isAdmin) {continue}
    if (JSON.stringify(initial[k] ?? null) !== JSON.stringify(current[k] ?? null)) {out[k] = current[k] ?? null}
  }
  return out
}

export function CreatorEntry({ leadId }: { leadId: string }) {
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
    const res = await fetch(`${dbApi('creator')}/${encodeURIComponent(leadId)}`)
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
        <BackLink leadType="creator" />
        <Card>
          <p className="text-sm text-slate-300">
            {missing.leadExists
              ? `${leadId} is not in the Creator Database${missing.removed ? ' (an admin removed it; adding it again brings back its rates and notes)' : ''}.`
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
  const links = leadLinks('creator', lead as unknown as Record<string, unknown>)
  const changes = changedFields(initial, form, isAdmin)
  const dirty = Object.keys(changes).length > 0
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm({ ...form, [k]: v })

  const save = async () => {
    setSaving(true)
    setErrors({})
    const res = await fetch(`${dbApi('creator')}/${encodeURIComponent(leadId)}`, {
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
    const res = await fetch(`${dbApi('creator')}/${encodeURIComponent(leadId)}`, { method: 'DELETE' })
    const d = await readJson<{ message: string }>(res)
    if (!res.ok) {
      toast('error', d.error ?? 'Remove failed')
      return
    }
    toast('success', d.message)
    router.push(dbPath('creator'))
  }

  const leadPlatform = platformId(lead.platform)

  return (
    <div className="space-y-4">
      <BackLink leadType="creator" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{lead.name || lead.lead_id}</h2>
            <span className="font-mono text-xs text-slate-500">{lead.lead_id}</span>
            <StatusBadge status={lead.status} />
            {lead.dnc && <DncBadge />}
            <OnInfoishaiBadge username={data.on_infoishai} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <LinkIcons links={links} />
            <span>Owner: {ownerName(lead.owner_user_id)}</span>
            <span>In the Database since {new Date(data.entry.added_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setEditingLead(true)} className={ghostButtonClass}><PanelRight className="h-4 w-4" /> Edit lead</button>
          <Link href={`/admin/outreach/creators?q=${encodeURIComponent(lead.lead_id)}`} className={ghostButtonClass}>Open in leads</Link>
          {isAdmin && (
            <button onClick={() => setConfirmRemove(true)} className={cn(ghostButtonClass, 'hover:border-red-700 hover:text-red-300')}>
              <Trash2 className="h-4 w-4" /> Remove from Database
            </button>
          )}
        </div>
      </div>

      <Card title="Lead">
        <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Platform', lead.platform],
            ['Subscribers', formatFollowers(lead.subscribers)],
            ['Niche', lead.niche],
            ['Country', lead.country],
            ['Email', lead.email],
            ['Avg views', formatFollowers(lead.avg_views)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-slate-500">{k}</dt>
              <dd className="break-words text-slate-200">{v || '–'}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-slate-500">These fields belong to the lead. Edit them with Edit lead, so duplicate checks apply.</p>
      </Card>

      <RatesCard leadId={leadId} rates={data.rates} />

      <Card
        title="Database details"
        actions={
          <button onClick={() => void save()} disabled={!dirty || saving} className={buttonClass}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {dirty ? 'Save changes' : 'Saved'}
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Availability" error={errors.availability}>
            <select className={cn(selectClass, 'w-full')} value={form.availability ?? ''} onChange={(e) => set('availability', e.target.value || null)}>
              <option value="">Not set</option>
              {AVAILABILITY.map((a) => <option key={a} value={a}>{AVAILABILITY_LABELS[a]}</option>)}
            </select>
          </Field>
          <Field label="Next available" error={errors.next_available_date}>
            <input type="date" className={inputClass} value={form.next_available_date ?? ''} onChange={(e) => set('next_available_date', e.target.value || null)} />
          </Field>
          <Field label="Minimum lead time (days)" error={errors.min_lead_days}>
            <input className={inputClass} inputMode="numeric" value={form.min_lead_days} onChange={(e) => set('min_lead_days', e.target.value)} />
          </Field>
          <Field label="Preferred payment" error={errors.payment_methods} className="md:col-span-2">
            <ChipToggle options={PAYMENT_METHODS} labels={PAYMENT_METHOD_LABELS} value={form.payment_methods} onChange={(v) => set('payment_methods', v)} />
          </Field>
          <Field label="Upfront %" error={errors.upfront_pct}>
            <input className={inputClass} inputMode="numeric" placeholder="50" value={form.upfront_pct} onChange={(e) => set('upfront_pct', e.target.value)} />
          </Field>
          <Field label="Audience top countries" hint="Comma separated" error={errors.audience_countries}>
            <ListInput value={form.audience_countries} onChange={(v) => set('audience_countries', v)} placeholder="USA, UK, India" />
          </Field>
          <Field label="Audience languages" hint="Comma separated" error={errors.audience_languages}>
            <ListInput value={form.audience_languages} onChange={(v) => set('audience_languages', v)} placeholder="English" />
          </Field>
          <Field label="Past brand collaborations" hint="Comma separated" error={errors.past_collabs}>
            <ListInput value={form.past_collabs} onChange={(v) => set('past_collabs', v)} placeholder="Notion, Linear" />
          </Field>
          <Field label="Tags" hint="Comma separated" error={errors.tags}>
            <ListInput value={form.tags} onChange={(v) => set('tags', v)} placeholder="fast reply, good editing" />
          </Field>
          {isAdmin && (
            <Field label="Quality rating (internal, admins only)" error={errors.quality_rating}>
              <select className={cn(selectClass, 'w-full')} value={form.quality_rating} onChange={(e) => set('quality_rating', e.target.value)}>
                <option value="">Not rated</option>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
              </select>
            </Field>
          )}
          <div className="md:col-span-3">
            <span className="mb-1 block text-xs font-medium text-slate-400">Followers per platform</span>
            <div className="grid gap-2 sm:grid-cols-5">
              {DB_PLATFORMS.map((p) => (
                <label key={p} className="block">
                  <span className="mb-0.5 block text-[11px] text-slate-500">{DB_PLATFORM_LABELS[p]}</span>
                  <input className={inputClass} inputMode="numeric"
                    placeholder={leadPlatform === p && lead.subscribers ? String(lead.subscribers) : ''}
                    value={form.followers[p] ?? ''}
                    onChange={(e) => {
                      const next = { ...form.followers, [p]: e.target.value }
                      if (!e.target.value.trim()) {delete next[p]}
                      set('followers', next)
                    }} />
                </label>
              ))}
            </div>
            {errors.followers && <span className="mt-1 block text-xs text-red-300">{errors.followers}</span>}
            <span className="mt-1 block text-xs text-slate-500">The lead&apos;s own platform uses its subscriber count unless you enter one here.</span>
          </div>
          <Field label="Notes" error={errors.notes} className="md:col-span-3">
            <textarea className={cn(inputClass, 'min-h-[90px]')} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value || null)} />
          </Field>
        </div>
      </Card>

      <Card title="Activity"><ActivityList activity={data.activity} /></Card>

      {editingLead && (
        <LeadForm leadType="creator" lead={lead} onClose={() => setEditingLead(false)} onSaved={() => { setEditingLead(false); bump() }} />
      )}
      {confirmRemove && (
        <ConfirmDialog
          title={`Remove ${lead.lead_id} from the Creator Database?`}
          description="The lead stays in Creator leads. Its rates and notes are kept, so adding it again brings them back."
          confirmLabel="Remove"
          danger
          onConfirm={remove}
          onClose={() => setConfirmRemove(false)}
        />
      )}
    </div>
  )
}

// ─── Rate card ───────────────────────────────────────────────────────────────

interface RateDraft {
  platform: string
  format: string
  price: string
  currency: string
  usage_rights: boolean
  usage_note: string
  quoted_at: string
}

const emptyDraft = (): RateDraft => ({
  platform: 'youtube', format: 'integration', price: '', currency: 'USD', usage_rights: false, usage_note: '', quoted_at: karachiToday(),
})

function draftOf(r: CreatorRate): RateDraft {
  return {
    platform: r.platform, format: r.format, price: String(r.price), currency: r.currency,
    usage_rights: r.usage_rights, usage_note: r.usage_note ?? '', quoted_at: r.quoted_at ?? '',
  }
}

function RateInputs({ draft, onChange, errors }: { draft: RateDraft; onChange: (d: RateDraft) => void; errors: Record<string, string> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
      <select className={selectClass} value={draft.platform} onChange={(e) => onChange({ ...draft, platform: e.target.value })} aria-label="Platform">
        {DB_PLATFORMS.map((p) => <option key={p} value={p}>{DB_PLATFORM_LABELS[p]}</option>)}
      </select>
      <select className={selectClass} value={draft.format} onChange={(e) => onChange({ ...draft, format: e.target.value })} aria-label="Format">
        {RATE_FORMATS.map((f) => <option key={f} value={f}>{RATE_FORMAT_LABELS[f]}</option>)}
      </select>
      <div>
        <input className={cn(inputClass, errors.price && 'border-red-600')} inputMode="decimal" placeholder="Price" value={draft.price} onChange={(e) => onChange({ ...draft, price: e.target.value })} aria-label="Price" />
        {errors.price && <span className="text-xs text-red-300">{errors.price}</span>}
      </div>
      <select className={selectClass} value={draft.currency} onChange={(e) => onChange({ ...draft, currency: e.target.value })} aria-label="Currency">
        {[...new Set([...CURRENCIES, draft.currency])].map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="date" className={inputClass} value={draft.quoted_at} onChange={(e) => onChange({ ...draft, quoted_at: e.target.value })} aria-label="Quoted on" />
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={draft.usage_rights} onChange={(e) => onChange({ ...draft, usage_rights: e.target.checked })} /> Usage rights
      </label>
      <input className={inputClass} placeholder="Usage note (e.g. 30 days paid ads)" value={draft.usage_note} onChange={(e) => onChange({ ...draft, usage_note: e.target.value })} aria-label="Usage note" />
    </div>
  )
}

function RatesCard({ leadId, rates }: { leadId: string; rates: CreatorRate[] }) {
  const { toast, bump } = useOutreach()
  const today = karachiToday()
  const [adding, setAdding] = useState<RateDraft | null>(null)
  const [editing, setEditing] = useState<{ id: string; draft: RateDraft } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const base = `${dbApi('creator')}/${encodeURIComponent(leadId)}/rates`

  const send = async (url: string, method: 'POST' | 'PATCH' | 'DELETE', draft?: RateDraft) => {
    setBusy(true)
    setErrors({})
    const res = await fetch(url, {
      method,
      headers: draft ? { 'Content-Type': 'application/json' } : undefined,
      body: draft ? JSON.stringify({ ...draft, quoted_at: draft.quoted_at || null, usage_note: draft.usage_note || null }) : undefined,
    })
    const d = await readJson<{ message: string; fields?: Record<string, string[]> }>(res)
    setBusy(false)
    if (!res.ok) {
      setErrors(fieldErrors(d))
      toast('error', d.error ?? 'Save failed')
      return false
    }
    bump()
    return true
  }

  return (
    <Card
      title="Rate card"
      actions={!adding && (
        <button onClick={() => { setAdding(emptyDraft()); setEditing(null) }} className={ghostButtonClass}><Plus className="h-4 w-4" /> Add rate</button>
      )}
    >
      {rates.length === 0 && !adding && <p className="text-sm text-slate-500">No rates yet. Add what the creator quoted.</p>}
      {rates.length > 0 && (
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-1.5 pr-3 font-medium">Platform</th>
              <th className="py-1.5 pr-3 font-medium">Format</th>
              <th className="py-1.5 pr-3 text-right font-medium">Price</th>
              <th className="py-1.5 pr-3 font-medium">Usage rights</th>
              <th className="py-1.5 pr-3 font-medium">Quoted</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {rates.map((r) => editing?.id === r.id ? (
              <tr key={r.id}>
                <td colSpan={6} className="py-2">
                  <RateInputs draft={editing.draft} onChange={(d) => setEditing({ id: r.id, draft: d })} errors={errors} />
                  <div className="mt-2 flex gap-2">
                    <button disabled={busy} className={buttonClass} onClick={() => void send(`${base}/${r.id}`, 'PATCH', editing.draft).then((ok) => { if (ok) {setEditing(null)} })}>
                      <Check className="h-4 w-4" /> Save
                    </button>
                    <button className={ghostButtonClass} onClick={() => { setEditing(null); setErrors({}) }}><X className="h-4 w-4" /> Cancel</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={r.id} className="text-slate-300">
                <td className="py-2 pr-3">{DB_PLATFORM_LABELS[r.platform as DbPlatform] ?? r.platform}</td>
                <td className="py-2 pr-3">{RATE_FORMAT_LABELS[r.format as keyof typeof RATE_FORMAT_LABELS] ?? r.format}</td>
                <td className="whitespace-nowrap py-2 pr-3 text-right font-medium text-white">{formatMoney(r.price, r.currency)}</td>
                <td className="py-2 pr-3 text-xs">{r.usage_rights ? `Yes${r.usage_note ? `: ${r.usage_note}` : ''}` : r.usage_note || 'No'}</td>
                <td className={cn('whitespace-nowrap py-2 pr-3 text-xs', isRateStale(r.quoted_at, today) ? 'text-amber-300' : 'text-slate-400')}>
                  {rateAgeLabel(r.quoted_at, today)}
                </td>
                <td className="whitespace-nowrap py-2 text-right">
                  <button onClick={() => { setEditing({ id: r.id, draft: draftOf(r) }); setAdding(null) }} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white" aria-label="Edit rate"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { if (window.confirm('Delete this rate?')) {void send(`${base}/${r.id}`, 'DELETE')} }} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400" aria-label="Delete rate"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {adding && (
        <div className="mt-3 rounded-lg border border-slate-800 p-3">
          <RateInputs draft={adding} onChange={setAdding} errors={errors} />
          <div className="mt-2 flex gap-2">
            <button disabled={busy} className={buttonClass} onClick={() => void send(base, 'POST', adding).then((ok) => { if (ok) {setAdding(null)} })}>
              <Check className="h-4 w-4" /> Add rate
            </button>
            <button className={ghostButtonClass} onClick={() => { setAdding(null); setErrors({}) }}>Cancel</button>
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">Rates are internal. They never appear on public pages or go to creators or brands.</p>
    </Card>
  )
}
