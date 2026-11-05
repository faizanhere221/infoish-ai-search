'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Crown, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONTACT_ACTIONS, contactName, STATUS_LABELS } from '@/lib/outreach/rules'
import type { BrandContact, OutreachLeadRow } from '@/lib/outreach/types'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { ActionDialog } from '@/components/admin/outreach/LeadActions'
import { ExternalLink, ghostButtonClass, inputClass, StatusBadge } from '@/components/admin/outreach/ui'

// Every contact of one brand: inline editing, add, remove, make primary,
// and per-contact actions (contacted, followed up, replied, ...). The
// brand's status follows its furthest-along contact (in the database).

const FIELDS = [
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'title', label: 'Title' },
  { key: 'email', label: 'Email' },
  { key: 'linkedin', label: 'LinkedIn' },
] as const
type Draft = Record<(typeof FIELDS)[number]['key'] | 'notes', string>

const empty = (): Draft => ({ first_name: '', last_name: '', title: '', email: '', linkedin: '', notes: '' })
const draftOf = (c: BrandContact): Draft => ({
  first_name: c.first_name ?? '', last_name: c.last_name ?? '', title: c.title ?? '',
  email: c.email ?? '', linkedin: c.linkedin ?? '', notes: c.notes ?? '',
})

interface ContactsEditorProps {
  lead: OutreachLeadRow
  readOnly?: boolean // deleted leads
  compact?: boolean // inside a table row
}

export function ContactsEditor({ lead, readOnly, compact }: ContactsEditorProps) {
  const { toast, bump, version } = useOutreach()
  const [contacts, setContacts] = useState<BrandContact[] | null>(null)
  const [migrated, setMigrated] = useState(true)
  const [editId, setEditId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(empty())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [action, setAction] = useState<{ contact: BrandContact; action: string } | null>(null)
  const base = `/api/admin/outreach/leads/brands/${encodeURIComponent(lead.lead_id)}/contacts`

  const load = useCallback(async () => {
    const res = await fetch(base)
    const data = await readJson<{ contacts: BrandContact[]; migrated: boolean }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Failed to load contacts')
      return
    }
    setContacts(data.contacts)
    setMigrated(data.migrated)
  }, [base, toast])

  useEffect(() => { void load() }, [load, version])

  const send = async (url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: Record<string, unknown>) => {
    setBusy(true)
    setErrors({})
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await readJson<{ message: string; fields?: Record<string, string[]> }>(res)
    setBusy(false)
    if (!res.ok) {
      setErrors(Object.fromEntries(Object.entries(data.fields ?? {}).map(([k, v]) => [k, v[0]])))
      toast('error', data.error ?? 'Save failed')
      return false
    }
    bump()
    return true
  }

  const save = async () => {
    const body = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim() || null]))
    const ok = editId === 'new' ? await send(base, 'POST', body) : await send(`${base}/${editId}`, 'PATCH', body)
    if (ok) {
      setEditId(null)
      toast('success', editId === 'new' ? 'Contact added' : 'Contact saved')
    }
  }

  if (!migrated) {
    return <p className="text-xs text-slate-500">Several contacts per brand need the contacts migration (supabase/outreach_contacts_lists_migration.sql).</p>
  }
  if (!contacts) {return <p className="text-xs text-slate-500">Loading contacts…</p>}

  const inputs = (
    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <input className={cn(inputClass, 'py-1.5', errors[f.key] && 'border-red-600')} placeholder={f.label} aria-label={f.label}
            value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') {void save()} if (e.key === 'Escape') {setEditId(null)} }} />
          {errors[f.key] && <span className="text-xs text-red-300">{errors[f.key]}</span>}
        </div>
      ))}
      <input className={cn(inputClass, 'py-1.5')} placeholder="Notes" aria-label="Notes" value={draft.notes}
        onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
      <div className="flex gap-1.5 sm:col-span-3 lg:col-span-6">
        <button disabled={busy} onClick={() => void save()} className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} {editId === 'new' ? 'Add contact' : 'Save'}
        </button>
        <button onClick={() => { setEditId(null); setErrors({}) }} className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800">
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div className={cn('space-y-2', compact && 'text-sm')}>
      {contacts.length === 0 && editId !== 'new' && <p className="text-sm text-slate-500">No contacts yet.</p>}
      <ul className="divide-y divide-slate-800/70">
        {contacts.map((c) => editId === c.id ? (
          <li key={c.id} className="py-2">{inputs}</li>
        ) : (
          <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <div className="min-w-[180px] flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {c.is_primary && <span className="inline-flex items-center gap-1 rounded-full bg-violet-900/50 px-1.5 py-0.5 text-[10px] font-medium text-violet-200"><Crown className="h-3 w-3" /> Primary</span>}
                <button disabled={readOnly} onClick={() => { setEditId(c.id); setDraft(draftOf(c)); setErrors({}) }}
                  className="font-medium text-slate-200 hover:text-white disabled:cursor-default" title={readOnly ? undefined : 'Edit contact'}>
                  {contactName(c)}
                </button>
                {c.title && <span className="text-xs text-slate-500">{c.title}</span>}
                <StatusBadge status={c.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {c.email && <span>{c.email}</span>}
                {c.linkedin && <ExternalLink href={c.linkedin}>LinkedIn</ExternalLink>}
                {c.date_contacted && <span>Contacted {c.date_contacted}</span>}
                {c.follow_up_date && c.status === 'contacted' && <span>Follow-up {c.follow_up_date}</span>}
                {c.notes && <span className="truncate" title={c.notes}>{c.notes}</span>}
              </div>
            </div>
            {!readOnly && (
              <div className="flex items-center gap-1">
                <select value="" disabled={busy} aria-label={`Log an action for ${contactName(c)}`}
                  onChange={(e) => { if (e.target.value) {setAction({ contact: c, action: e.target.value })} }}
                  className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-300 focus:outline-none">
                  <option value="">Log…</option>
                  {CONTACT_ACTIONS.map((a) => (
                    <option key={a} value={a} disabled={a === 'followed_up' && !c.date_contacted}>{STATUS_LABELS[a]}</option>
                  ))}
                </select>
                {!c.is_primary && (
                  <button disabled={busy} onClick={() => void send(`${base}/${c.id}`, 'PATCH', { is_primary: true })}
                    className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-violet-300" title="Make primary" aria-label={`Make ${contactName(c)} primary`}>
                    <Crown className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={() => { setEditId(c.id); setDraft(draftOf(c)); setErrors({}) }} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white" aria-label={`Edit ${contactName(c)}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button disabled={busy}
                  onClick={() => { if (window.confirm(`Remove ${contactName(c)} from ${lead.lead_id}?`)) {void send(`${base}/${c.id}`, 'DELETE').then((ok) => { if (ok) {toast('success', 'Contact removed')} })} }}
                  className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400" aria-label={`Remove ${contactName(c)}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {editId === 'new' ? inputs : !readOnly && (
        <button onClick={() => { setEditId('new'); setDraft(empty()); setErrors({}) }} className={cn(ghostButtonClass, 'px-2.5 py-1 text-xs')}>
          <Plus className="h-3.5 w-3.5" /> Add contact
        </button>
      )}
      {action && (
        <ActionDialog lead={lead} leadType="brand" action={action.action} contact={action.contact} onClose={() => setAction(null)} />
      )}
    </div>
  )
}
