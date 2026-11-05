'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Database, Loader2, X } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { cn } from '@/lib/utils'
import { STATUS_LABELS, type LeadType } from '@/lib/outreach/rules'
import type { DuplicateMatch, OutreachActivityRow } from '@/lib/outreach/types'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { DuplicateNotice } from '@/components/admin/outreach/LeadForm'
import { buttonClass, ghostButtonClass, inputClass, selectClass } from '@/components/admin/outreach/ui'

export const dbPath = (leadType: LeadType) => `/admin/outreach/database/${leadType === 'creator' ? 'creators' : 'brands'}`
export const dbApi = (leadType: LeadType) => `/api/admin/outreach/database/${leadType === 'creator' ? 'creators' : 'brands'}`

// ─── Multi-select filter (popover with checkboxes) ───────────────────────────

interface MultiFilterProps {
  label: string
  options: readonly string[]
  labels?: Record<string, string>
  value: string[]
  onChange: (v: string[]) => void
}

export function MultiFilter({ label, options, labels, value, onChange }: MultiFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) {return}
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) {setOpen(false)} }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  // Values from the URL ("Find matching creators") stay listed even when
  // no row has them yet.
  const all = [...new Set([...options, ...value])]
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(selectClass, 'inline-flex items-center gap-1.5', value.length > 0 && 'border-violet-500 text-violet-200')}
      >
        {label}{value.length > 0 ? ` (${value.length})` : ''}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 z-40 mt-1 max-h-72 w-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-2xl">
          {all.length === 0 && <p className="px-2 py-1.5 text-xs text-slate-500">No values yet</p>}
          {all.map((o) => (
            <button key={o} type="button" onClick={() => toggle(o)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800">
              <span className={cn('flex h-4 w-4 items-center justify-center rounded border', value.includes(o) ? 'border-violet-500 bg-violet-600' : 'border-slate-600')}>
                {value.includes(o) && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="truncate">{labels?.[o] ?? o}</span>
            </button>
          ))}
          {value.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded px-2 py-1.5 text-left text-xs text-slate-400 hover:bg-slate-800">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Chips (multi choice inside a form) ──────────────────────────────────────

export function ChipToggle({ options, labels, value, onChange, disabled }: {
  options: readonly string[]; labels?: Record<string, string>; value: string[]; onChange: (v: string[]) => void; disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <button key={o} type="button" disabled={disabled}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn('rounded-full border px-2.5 py-1 text-xs', on ? 'border-violet-500 bg-violet-600/20 text-white' : 'border-slate-700 text-slate-400 hover:text-white')}>
            {labels?.[o] ?? o}
          </button>
        )
      })}
    </div>
  )
}

// Comma-separated text ↔ list. Keeps the typed text while focused.
export function ListInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState(value.join(', '))
  const joined = value.join(', ')
  const [focused, setFocused] = useState(false)
  useEffect(() => { if (!focused) {setText(joined)} }, [joined, focused])
  return (
    <input
      className={inputClass}
      value={text}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        setText(e.target.value)
        onChange([...new Set(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))])
      }}
    />
  )
}

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

// First error per field from a { fields: { name: [msg] } } response.
export function fieldErrors(data: { fields?: Record<string, string[]> }): Record<string, string> {
  return Object.fromEntries(Object.entries(data.fields ?? {}).map(([k, v]) => [k, v[0]]))
}

// ─── Add directly ────────────────────────────────────────────────────────────

const DIRECT_FIELDS: Record<LeadType, { name: string; label: string; placeholder?: string }[]> = {
  creator: [
    { name: 'name', label: 'Name' },
    { name: 'profile_url', label: 'Profile URL', placeholder: 'youtube.com/@name' },
    { name: 'email', label: 'Email' },
    { name: 'platform', label: 'Main platform', placeholder: 'YouTube' },
    { name: 'subscribers', label: 'Subscribers / followers', placeholder: '120k' },
    { name: 'niche', label: 'Niche' },
    { name: 'country', label: 'Country' },
  ],
  brand: [
    { name: 'company', label: 'Company' },
    { name: 'website', label: 'Website', placeholder: 'acme.io' },
    { name: 'contact_name', label: 'Primary contact' },
    { name: 'role', label: 'Role' },
    { name: 'email', label: 'Email' },
    { name: 'country', label: 'Country' },
  ],
}

// Creates the lead (same duplicate and DNC rules as "Add lead") and adds it
// to the Database in one go. A duplicate offers the existing lead instead.
export function AddDirectDialog({ leadType, onClose }: { leadType: LeadType; onClose: () => void }) {
  const router = useRouter()
  const { toast, addToDatabase } = useOutreach()
  useEscapeKey(onClose)
  const [values, setValues] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('replied')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    setErrors({})
    setDuplicates([])
    const lead = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim()))
    const res = await fetch(dbApi(leadType), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead, status }),
    })
    const data = await readJson<{ message: string; lead_id: string; duplicates?: DuplicateMatch[]; fields?: Record<string, string[]> }>(res)
    setSaving(false)
    if (!res.ok) {
      setErrors(fieldErrors(data))
      setDuplicates(data.duplicates ?? [])
      if (!data.duplicates?.length) {toast('error', data.error ?? 'Could not add')}
      return
    }
    toast('success', data.message)
    router.push(`${dbPath(leadType)}/${data.lead_id}`)
  }

  const existing = duplicates.find((d) => d.lead_type === leadType && !d.deleted)
  const addExisting = async () => {
    if (!existing) {return}
    if (await addToDatabase(existing.lead_id)) {router.push(`${dbPath(leadType)}/${existing.lead_id}`)}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Add a {leadType === 'creator' ? 'creator' : 'client'} to the Database</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-4 text-xs text-slate-400">
          This creates the lead too (status {leadType === 'creator' ? 'Replied' : 'below'}), with the usual duplicate checks.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIRECT_FIELDS[leadType].map((f) => (
            <Field key={f.name} label={f.label} error={errors[f.name]}>
              <input className={inputClass} placeholder={f.placeholder} value={values[f.name] ?? ''}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
            </Field>
          ))}
          {leadType === 'brand' && (
            <Field label="Status" error={errors.status}>
              <select className={cn(selectClass, 'w-full')} value={status} onChange={(e) => setStatus(e.target.value)}>
                {['replied', 'call_booked', 'won'].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
          )}
        </div>
        {duplicates.length > 0 && (
          <div className="mt-4 space-y-2">
            <DuplicateNotice duplicates={duplicates} />
            {existing && (
              <button onClick={() => void addExisting()} className={ghostButtonClass}>
                <Database className="h-4 w-4" /> Add {existing.lead_id} to the Database instead
              </button>
            )}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className={ghostButtonClass}>Cancel</button>
          <button onClick={() => void submit()} disabled={saving} className={buttonClass}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Activity ────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  ...STATUS_LABELS,
  status_changed: 'Status changed',
  owner_changed: 'Owner changed',
  edited: 'Lead edited',
  erased: 'Personal data deleted',
  deleted: 'Lead deleted',
  restored: 'Lead restored',
  db_added: 'Added to the Database',
  db_removed: 'Removed from the Database',
  db_edited: 'Database edited',
}

function short(v: unknown): string {
  if (v === null || v === undefined || v === '') {return '–'}
  if (Array.isArray(v)) {return v.length ? v.join(', ') : '–'}
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    if ('format' in o && 'price' in o) {return `${o.platform} ${o.format} ${o.price} ${o.currency ?? ''}`.trim()}
    if ('title' in o) {return String(o.title)}
    if ('name' in o || 'email' in o) {return [o.name, o.email].filter(Boolean).join(' ') || '–'}
    return Object.entries(o).map(([k, x]) => `${k} ${x}`).join(', ') || '–'
  }
  return String(v)
}

export function ActivityList({ activity }: { activity: OutreachActivityRow[] }) {
  const { ownerName } = useOutreach()
  if (activity.length === 0) {return <p className="text-sm text-slate-500">No activity yet.</p>}
  return (
    <ul className="space-y-2 text-sm">
      {activity.map((a) => (
        <li key={a.id} className={cn('rounded-lg border border-slate-800 px-3 py-2', a.undone_at && 'opacity-50')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-slate-200">{ACTION_LABELS[a.action] ?? a.action}{a.undone_at ? ' (undone)' : ''}</span>
            <span className="text-xs text-slate-500">
              {a.user_id ? ownerName(a.user_id) : 'System'} · {new Date(a.created_at).toLocaleString()}
            </span>
          </div>
          {a.changes && (
            <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
              {Object.entries(a.changes).map(([field, c]) => (
                <li key={field} className="break-words">
                  <span className="text-slate-300">{field.replace(/_/g, ' ')}</span>: {short(c?.old)} → {short(c?.new)}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

export function BackLink({ leadType }: { leadType: LeadType }) {
  return (
    <Link href={dbPath(leadType)} className="text-sm text-slate-400 hover:text-white">
      ← {leadType === 'creator' ? 'Creator' : 'Client'} Database
    </Link>
  )
}
