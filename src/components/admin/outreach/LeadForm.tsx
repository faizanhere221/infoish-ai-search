'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Ban, Loader2, X } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { PLATFORMS } from '@/utils/constants'
import { CHANNEL_LABELS, CHANNELS, headerKey, STATUS_LABELS, type LeadType } from '@/lib/outreach/rules'
import type { DuplicateMatch, OutreachLeadRow } from '@/lib/outreach/types'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, ghostButtonClass, inputClass, selectClass } from '@/components/admin/outreach/ui'

type FieldKind = 'text' | 'number' | 'bool' | 'textarea' | 'platform' | 'owner' | 'channel' | 'mailbox'
interface Field { name: string; label: string; kind?: FieldKind; wide?: boolean }

const CREATOR_FIELDS: Field[] = [
  { name: 'name', label: 'Name' },
  { name: 'platform', label: 'Platform', kind: 'platform' },
  { name: 'profile_url', label: 'Profile URL', wide: true },
  { name: 'email', label: 'Email' },
  { name: 'country', label: 'Country' },
  { name: 'niche', label: 'Niche' },
  { name: 'subscribers', label: 'Subscribers', kind: 'number' },
  { name: 'avg_views', label: 'Avg views', kind: 'number' },
  { name: 'engagement_pct', label: 'Engagement %', kind: 'number' },
  { name: 'does_sponsorships', label: 'Does sponsorships', kind: 'bool' },
  { name: 'sponsor_brands', label: 'Sponsor brands', wide: true },
  { name: 'instagram', label: 'Instagram' },
  { name: 'x', label: 'X' },
  { name: 'linkedin', label: 'LinkedIn' },
  { name: 'tiktok', label: 'TikTok' },
  { name: 'website', label: 'Website' },
  { name: 'owner_user_id', label: 'Owner', kind: 'owner' },
  { name: 'channel', label: 'Channel', kind: 'channel' },
  { name: 'mailbox_id', label: 'Mailbox', kind: 'mailbox' },
  { name: 'source', label: 'Source' },
  { name: 'notes', label: 'Notes', kind: 'textarea', wide: true },
]

const BRAND_FIELDS: Field[] = [
  { name: 'company', label: 'Company' },
  { name: 'domain', label: 'Domain' },
  { name: 'website', label: 'Website' },
  { name: 'country', label: 'Country' },
  { name: 'product', label: 'Product', wide: true },
  { name: 'team_size', label: 'Team size' },
  { name: 'score', label: 'Score', kind: 'number' },
  { name: 'why_them', label: 'Why them', kind: 'textarea', wide: true },
  { name: 'contact_name', label: 'Contact name' },
  { name: 'role', label: 'Role' },
  { name: 'email', label: 'Email' },
  { name: 'linkedin', label: 'LinkedIn' },
  { name: 'owner_user_id', label: 'Owner', kind: 'owner' },
  { name: 'channel', label: 'Channel', kind: 'channel' },
  { name: 'mailbox_id', label: 'Mailbox', kind: 'mailbox' },
  { name: 'source', label: 'Source' },
  { name: 'notes', label: 'Notes', kind: 'textarea', wide: true },
]

const KEY_FIELDS: Record<LeadType, string[]> = {
  creator: ['email', 'profile_url'],
  brand: ['email', 'domain', 'website'],
}

export function DuplicateNotice({ duplicates }: { duplicates: DuplicateMatch[] }) {
  if (duplicates.length === 0) {return null}
  return (
    <div className="rounded-lg border border-amber-800 bg-amber-950/50 px-3 py-2 text-sm text-amber-200">
      {duplicates.map((d) => (
        <div key={`${d.key_type}:${d.key_value}`} className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {d.contact_removed ? (
            <span>
              Previously removed contact of{' '}
              <Link href={`/admin/outreach/brands?q=${encodeURIComponent(d.lead_id)}`} className="font-semibold underline">{d.lead_id}</Link>{' '}
              (same email). An admin restores it from the brand's removed contacts.
            </span>
          ) : d.deleted ? (
            <span>
              Previously deleted:{' '}
              <Link href={`/admin/outreach/${d.lead_type === 'creator' ? 'creators' : 'brands'}?q=${encodeURIComponent(d.lead_id)}&deleted=1`} className="font-semibold underline">
                {d.lead_id}
              </Link>{' '}
              (same {d.key_type.replace('_', ' ')}). An admin restores it from the Deleted filter.
            </span>
          ) : (
            <span>
              Already exists:{' '}
              <Link href={`/admin/outreach/${d.lead_type === 'creator' ? 'creators' : 'brands'}?q=${encodeURIComponent(d.lead_id)}`} className="font-semibold underline">
                {d.lead_id}
              </Link>
              {d.owner_name ? `, owned by ${d.owner_name}` : ', no owner'}
              {d.status ? `, status ${STATUS_LABELS[d.status] ?? d.status}` : ''} (same {d.key_type.replace('_', ' ')})
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

interface LeadFormProps {
  leadType: LeadType
  lead?: OutreachLeadRow | null // edit when set
  extraKeys?: string[] // extra fields to offer as inputs (batch, tags, ...)
  onClose: () => void
  onSaved: (lead: OutreachLeadRow | null) => void
}

export function LeadForm({ leadType, lead, extraKeys = [], onClose, onSaved }: LeadFormProps) {
  const { team, mailboxes, me, toast } = useOutreach()
  useEscapeKey(onClose)
  const fields = leadType === 'creator' ? CREATOR_FIELDS : BRAND_FIELDS
  const [initialValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {}
    for (const f of fields) {
      const raw = lead ? (lead as unknown as Record<string, unknown>)[f.name] : undefined
      v[f.name] = raw === null || raw === undefined ? '' : String(raw)
    }
    if (!lead && me) {v.owner_user_id = me.user_id}
    return v
  })
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [initialExtra] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(lead?.extra ?? {}).map(([k, v]) => [k, String(v)])))
  // Known extra fields show as empty inputs so they're easy to fill in.
  const [extra, setExtra] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(extraKeys.map((k) => [k, ''])),
    ...initialExtra,
  }))
  const [newExtraKey, setNewExtraKey] = useState('')
  const canChangeOwner = !!me?.is_admin
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [dncHits, setDncHits] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  // Live duplicate + DNC check on the key fields (debounced).
  const keySignature = KEY_FIELDS[leadType].map((k) => values[k] ?? '').join('|')
  useEffect(() => {
    const keyValues = Object.fromEntries(KEY_FIELDS[leadType].map((k) => [k, values[k] ?? '']))
    if (!Object.values(keyValues).some((v) => v.trim())) {
      setDuplicates([])
      setDncHits([])
      return
    }
    const t = setTimeout(async () => {
      const qs = new URLSearchParams({ type: leadType, ...keyValues })
      if (lead) {qs.set('exclude', lead.lead_id)}
      const res = await fetch(`/api/admin/outreach/check-duplicate?${qs}`)
      const data = await readJson<{ duplicates: DuplicateMatch[]; dnc: string[] }>(res)
      if (res.ok) {
        setDuplicates(data.duplicates)
        setDncHits(data.dnc)
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keySignature covers the key fields
  }, [keySignature, leadType, lead])

  const set = (name: string, v: string) => setValues((prev) => ({ ...prev, [name]: v }))
  const setExtraValue = (key: string, v: string) => setExtra((prev) => ({ ...prev, [key]: v }))

  const save = async () => {
    setSaving(true)
    setErrors({})
    // Edits send only what changed, so the activity log shows real changes
    // and a member's untouched owner field never trips the admin-only rule.
    const body: Record<string, unknown> = {}
    for (const f of fields) {
      const v = values[f.name]
      if (lead && v === initialValues[f.name]) {continue}
      if (f.kind === 'bool') {body[f.name] = v === '' ? null : v === 'true'}
      else {body[f.name] = v === '' ? null : v}
    }
    const extraOut = Object.fromEntries(Object.entries(extra).filter(([k, v]) => k.trim() && v.trim()).map(([k, v]) => [k.trim(), v.trim()]))
    if (!lead ? Object.keys(extraOut).length > 0 : JSON.stringify(extraOut) !== JSON.stringify(initialExtra)) {
      body.extra = extraOut
    }
    if (lead && Object.keys(body).length === 0) {
      setSaving(false)
      onClose()
      return
    }
    const url = lead
      ? `/api/admin/outreach/leads/${leadType}s/${encodeURIComponent(lead.lead_id)}`
      : `/api/admin/outreach/leads/${leadType}s`
    const res = await fetch(url, {
      method: lead ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await readJson<{ lead?: OutreachLeadRow; duplicates?: DuplicateMatch[]; fields?: Record<string, string[]> }>(res)
    setSaving(false)
    if (!res.ok) {
      if (data.duplicates) {setDuplicates(data.duplicates)}
      if (data.fields) {setErrors(data.fields)}
      toast('error', data.error ?? 'Save failed')
      return
    }
    toast('success', lead ? `${lead.lead_id} saved` : 'Lead added')
    onSaved(data.lead ?? null)
  }

  const renderInput = (f: Field) => {
    const v = values[f.name] ?? ''
    switch (f.kind) {
      case 'textarea':
        return <textarea value={v} onChange={(e) => set(f.name, e.target.value)} rows={3} className={inputClass} />
      case 'bool':
        return (
          <select value={v} onChange={(e) => set(f.name, e.target.value)} className={`${selectClass} w-full`}>
            <option value="">Unknown</option><option value="true">Yes</option><option value="false">No</option>
          </select>
        )
      case 'platform':
        return (
          <select value={v} onChange={(e) => set(f.name, e.target.value)} className={`${selectClass} w-full`}>
            <option value="">None</option>
            {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            {v && !PLATFORMS.some((p) => p.id === v) && <option value={v}>{v}</option>}
          </select>
        )
      case 'owner':
        return (
          <select value={v} onChange={(e) => set(f.name, e.target.value)} disabled={!canChangeOwner}
            title={canChangeOwner ? undefined : 'Only admins change the owner'} className={`${selectClass} w-full disabled:opacity-60`}>
            <option value="">Unassigned</option>
            {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
          </select>
        )
      case 'channel':
        return (
          <select value={v} onChange={(e) => set(f.name, e.target.value)} className={`${selectClass} w-full`}>
            <option value="">None</option>
            {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
          </select>
        )
      case 'mailbox':
        return (
          <select value={v} onChange={(e) => set(f.name, e.target.value)} className={`${selectClass} w-full`}>
            <option value="">None</option>
            {mailboxes.map((m) => <option key={m.id} value={m.id}>{m.address}</option>)}
          </select>
        )
      default:
        return <input value={v} onChange={(e) => set(f.name, e.target.value)} inputMode={f.kind === 'number' ? 'decimal' : undefined} className={inputClass} />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-slate-800 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-base font-semibold text-white">{lead ? `Edit ${lead.lead_id}` : `Add ${leadType}`}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <DuplicateNotice duplicates={duplicates} />
          {dncHits.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
              <Ban className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>On the do-not-contact list: {dncHits.map((h) => h.replace(':', ' ')).join(', ')}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.name} className={f.wide ? 'col-span-2' : ''}>
                <label className="mb-1 block text-xs font-medium text-slate-400">{f.label}</label>
                {renderInput(f)}
                {errors[f.name] && <p className="mt-1 text-xs text-red-400">{errors[f.name].join(', ')}</p>}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="mb-1 text-sm font-semibold text-white">Extra fields</h3>
            <p className="mb-3 text-xs text-slate-500">Source data with no column of its own (batch, tags, YC link, ...). Searchable and exported.</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(extra).sort().map((k) => (
                <div key={k}>
                  <label className="mb-1 block text-xs font-medium text-slate-400">{k.replace(/_/g, ' ')}</label>
                  <input value={extra[k]} onChange={(e) => setExtraValue(k, e.target.value)} className={inputClass} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input value={newExtraKey} onChange={(e) => setNewExtraKey(e.target.value)} placeholder="New field name" className={`${inputClass} max-w-[220px]`} />
              <button
                type="button"
                disabled={!headerKey(newExtraKey) || headerKey(newExtraKey) in extra}
                onClick={() => { setExtraValue(headerKey(newExtraKey), ''); setNewExtraKey('') }}
                className={ghostButtonClass}
              >
                Add field
              </button>
            </div>
            {errors.extra && <p className="mt-1 text-xs text-red-400">{errors.extra.join(', ')}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3">
          <button onClick={onClose} className={ghostButtonClass}>Cancel</button>
          <button onClick={save} disabled={saving || (!lead && duplicates.length > 0)} className={buttonClass}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {lead ? 'Save' : 'Add lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
