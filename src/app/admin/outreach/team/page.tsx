'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, UserMinus, UserPlus } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { CLAIM_DAILY_CAP_MAX, CLAIM_MAX_PER_REQUEST, type AssignDefaults, type AssignRule } from '@/lib/outreach/rules'
import type { OutreachTeamMember } from '@/lib/outreach/types'
import { ReasonDialog } from '@/components/admin/ReasonDialog'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, Card, ghostButtonClass, inputClass, selectClass } from '@/components/admin/outreach/ui'

// Shown wherever someone new is added: nobody's account or password is
// created here.
const SIGN_UP_FIRST = 'Ask them to sign up at /signup, then promote them here. A brand or creator account works too, and keeps working as before.'

interface Account {
  user_id: string
  email: string
  role: string
  user_type: string
  is_active: boolean
  has_creator_profile: boolean
  has_brand_profile: boolean
  account_label: string // information only, e.g. "brand account, profile complete"
  on_team: boolean
  team_active: boolean
}

interface Lookup {
  account: Account | null
  can_add: boolean
  promote: boolean
  error: string | null
}

interface NewMember {
  display_name: string
  works_saturday: boolean
  creators_monthly_target: string
  brands_monthly_target: string
  reason: string
}

const EMPTY: NewMember = { display_name: '', works_saturday: false, creators_monthly_target: '1000', brands_monthly_target: '0', reason: '' }

const RULES: { rule: AssignRule; label: string; help: string }[] = [
  { rule: 'creator', label: 'New creator imports go to', help: 'Rows without an owner picked in the import preview.' },
  { rule: 'brand', label: 'New brand imports go to', help: 'CSV and Apollo imports, rows without an owner picked.' },
  { rule: 'interested', label: 'Interested leads go to', help: 'Creators marked Replied, brands marked Replied or Call booked.' },
]

// Who-changes-what on this page:
//   admins        names, working days, targets, DM warning, default owner rules
//   super admins  + add (promote an existing account), remove, role changes
type Pending =
  | { kind: 'role'; member: OutreachTeamMember; role: 'outreach' | 'admin' }
  | { kind: 'remove'; member: OutreachTeamMember }

function NumberCell({ value, onSave, min = 0, max = 100000 }: { value: number; onSave: (v: number) => void; min?: number; max?: number }) {
  return (
    <input type="number" min={min} max={max} defaultValue={value}
      onBlur={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== value) {onSave(v)} }}
      className="w-24 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-right text-xs text-white" />
  )
}

function DefaultOwnerRules() {
  const { team, toast } = useOutreach()
  const [assign, setAssign] = useState<AssignDefaults | null>(null)
  const [migrated, setMigrated] = useState(true)
  // null before outreach_claim_migration.sql
  const [claimCap, setClaimCap] = useState<number | null>(null)
  const active = team.filter((t) => t.is_active)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/outreach/settings')
    const data = await readJson<{ assign: AssignDefaults; assignment: boolean; settings: { claim_daily_cap: number | null } }>(res)
    if (res.ok) {
      setAssign(data.assign)
      setMigrated(data.assignment)
      setClaimCap(data.settings?.claim_daily_cap ?? null)
    }
  }, [])
  useEffect(() => { void load() }, [load])

  const saveCap = async (v: number) => {
    if (!Number.isInteger(v) || v < 1 || v > CLAIM_DAILY_CAP_MAX || v === claimCap) {return}
    const res = await fetch('/api/admin/outreach/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_daily_cap: v }),
    })
    const data = await readJson<Record<string, unknown>>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Save failed')
      return
    }
    setClaimCap(v)
    toast('success', `Members claim up to ${v} leads a day`)
  }

  const save = async (rule: AssignRule, userId: string) => {
    const key = rule === 'creator' ? 'assign_creator_owner' : rule === 'brand' ? 'assign_brand_owner' : 'assign_interested_owner'
    const res = await fetch('/api/admin/outreach/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: userId || null }),
    })
    const data = await readJson<{ assign: AssignDefaults }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Save failed')
      return
    }
    setAssign(data.assign)
    toast('success', 'Owner rule saved')
  }

  return (
    <Card title="Default owner rules">
      {!migrated ? (
        <p className="text-sm text-amber-300">Run supabase/outreach_assignment_migration.sql in the Supabase SQL Editor to use these rules.</p>
      ) : !assign ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {RULES.map(({ rule, label, help }) => (
            <label key={rule} className="flex flex-col gap-1 text-xs text-slate-400">
              {label}
              <select value={assign[rule] ?? ''} onChange={(e) => void save(rule, e.target.value)} className={selectClass}>
                <option value="">Nobody (off)</option>
                {active.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
              </select>
              <span className="text-slate-500">{help}</span>
            </label>
          ))}
        </div>
      )}
      {claimCap !== null && (
        <label className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
          Members claim up to
          <input key={claimCap} type="number" min={1} max={CLAIM_DAILY_CAP_MAX} defaultValue={claimCap}
            onBlur={(e) => void saveCap(Number(e.target.value))}
            className="w-24 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-right text-sm text-white" aria-label="Daily claim limit per member" />
          unassigned leads a day (Karachi), {CLAIM_MAX_PER_REQUEST} per claim.
        </label>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Outreach members always own the leads they add or import themselves. An Interested lead moves when the status is set; undoing that action moves it back.
      </p>
    </Card>
  )
}

function AddMember() {
  const { toast, refreshTeam } = useOutreach()
  const [email, setEmail] = useState('')
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [form, setForm] = useState<NewMember>(EMPTY)
  const [busy, setBusy] = useState(false)

  const find = async () => {
    setBusy(true)
    setLookup(null)
    const res = await fetch(`/api/admin/outreach/team/lookup?email=${encodeURIComponent(email.trim())}`)
    const data = await readJson<Lookup>(res)
    setBusy(false)
    if (!res.ok) {
      toast('error', data.error ?? 'Lookup failed')
      return
    }
    setLookup(data)
  }

  const add = async () => {
    setBusy(true)
    const res = await fetch('/api/admin/outreach/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        display_name: form.display_name,
        works_saturday: form.works_saturday,
        creators_monthly_target: Number(form.creators_monthly_target) || 0,
        brands_monthly_target: Number(form.brands_monthly_target) || 0,
        reason: form.reason,
      }),
    })
    const data = await readJson<{ message: string; fields?: Record<string, string[]> }>(res)
    setBusy(false)
    if (!res.ok) {
      const fieldError = data.fields ? Object.entries(data.fields).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ') : ''
      toast('error', fieldError || data.error || 'Failed to add')
      return
    }
    toast('success', data.message)
    setEmail('')
    setLookup(null)
    setForm(EMPTY)
    await refreshTeam()
  }

  const account = lookup?.account ?? null
  return (
    <Card title="Add a team member">
      <p className="mb-3 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200">{SIGN_UP_FIRST}</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-[260px] flex-1 flex-col gap-1 text-xs text-slate-400">Their account email
          <input value={email} onChange={(e) => { setEmail(e.target.value); setLookup(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && email.trim()) {void find()} }}
            className={inputClass} placeholder="name@example.com" autoComplete="off" />
        </label>
        <button onClick={find} disabled={busy || !email.trim()} className={ghostButtonClass}>
          <Search className="h-4 w-4" /> Find
        </button>
      </div>

      {lookup && (
        <div className="mt-3 space-y-1 text-sm">
          {account && (
            <p className="text-slate-300">
              {account.email} · role {account.role} · {account.account_label}{account.is_active ? '' : ' · deactivated'}
              {account.on_team ? (account.team_active ? ' · on the team' : ' · removed from the team earlier') : ''}
            </p>
          )}
          {lookup.error && <p className="text-amber-300">{lookup.error}</p>}
          {lookup.can_add && (
            <p className="text-emerald-300">
              {lookup.promote
                ? `This account gets the outreach role: in the outreach section it sees only its own leads, at /admin/login with its own password.${
                  account?.user_type === 'brand' || account?.user_type === 'creator' ? ` Its ${account.user_type} account, profile and dashboard stay exactly as they are.` : ''}`
                : `This account joins the team as ${account?.role}.`}
            </p>
          )}
        </div>
      )}

      {lookup?.can_add && (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <label className="flex flex-col gap-1 text-xs text-slate-400">Name
              <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">Creators/month
              <input type="number" min={0} value={form.creators_monthly_target} onChange={(e) => setForm({ ...form, creators_monthly_target: e.target.value })} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">Brands/month
              <input type="number" min={0} value={form.brands_monthly_target} onChange={(e) => setForm({ ...form, brands_monthly_target: e.target.value })} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">Works
              <select value={form.works_saturday ? 'sat' : 'fri'} onChange={(e) => setForm({ ...form, works_saturday: e.target.value === 'sat' })} className={selectClass}>
                <option value="fri">Mon–Fri</option><option value="sat">Mon–Sat</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">Reason
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} placeholder="New VA" />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={add} disabled={busy || !form.display_name.trim() || form.reason.trim().length < 3} className={buttonClass}>
              <UserPlus className="h-4 w-4" /> {lookup.promote ? 'Promote to outreach' : 'Add to team'}
            </button>
          </div>
        </>
      )}
    </Card>
  )
}

export default function OutreachTeamPage() {
  useDocumentTitle('Outreach team')
  const { me, team, toast, refreshTeam, bump } = useOutreach()
  const [pending, setPending] = useState<Pending | null>(null)

  if (me && !me.is_admin) {return <p className="text-sm text-slate-400">Only admins manage the team.</p>}
  const isSuper = !!me?.is_super_admin

  const update = async (m: OutreachTeamMember, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/outreach/team/${encodeURIComponent(m.user_id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await readJson<{ member: unknown; message?: string }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Save failed')
      return false
    }
    toast('success', body.role ? data.message ?? 'Role changed' : `${m.display_name} saved`)
    await refreshTeam()
    bump()
    return true
  }

  const runPending = async (reason: string) => {
    if (!pending) {return}
    if (pending.kind === 'role') {
      if (await update(pending.member, { role: pending.role, reason })) {setPending(null)}
      return
    }
    const res = await fetch(`/api/admin/outreach/team/${encodeURIComponent(pending.member.user_id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    const data = await readJson<{ message: string }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Remove failed')
      return
    }
    toast('success', data.message)
    setPending(null)
    await refreshTeam()
    bump()
  }

  const sorted = [...team].sort((a, b) => Number(b.is_active) - Number(a.is_active))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Outreach team</h1>
        <p className="text-sm text-slate-400">
          Monthly targets count first contacts. Working days drive the on-track and behind status.
          Outreach members see and work only the leads assigned to them; admins see every lead.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Works</th><th className="px-3 py-2 text-right">Creators/month</th>
              <th className="px-3 py-2 text-right">Brands/month</th><th className="px-3 py-2 text-right">DM warning/day</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {sorted.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">No team members yet.</td></tr>
            ) : sorted.map((m) => {
              const roleEditable = isSuper && m.is_active && m.user_id !== me?.user_id && (m.role === 'outreach' || m.role === 'admin')
              return (
                <tr key={m.user_id} className={m.is_active ? '' : 'opacity-50'}>
                  <td className="px-3 py-2">
                    <input defaultValue={m.display_name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== m.display_name) {void update(m, { display_name: v })} }}
                      className="w-36 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-slate-200 hover:border-slate-700 focus:border-violet-500 focus:outline-none" />
                  </td>
                  <td className="px-3 py-2 text-slate-400">{m.email}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {roleEditable ? (
                      <select value={m.role} onChange={(e) => setPending({ kind: 'role', member: m, role: e.target.value as 'outreach' | 'admin' })}
                        className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-200" aria-label={`Role of ${m.display_name}`}>
                        <option value="outreach">outreach (own leads)</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : m.role}
                  </td>
                  <td className="px-3 py-2">
                    <select value={m.works_saturday ? 'sat' : 'fri'} onChange={(e) => void update(m, { works_saturday: e.target.value === 'sat' })} className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-200">
                      <option value="fri">Mon–Fri</option><option value="sat">Mon–Sat</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right"><NumberCell value={m.creators_monthly_target} onSave={(v) => void update(m, { creators_monthly_target: v })} /></td>
                  <td className="px-3 py-2 text-right"><NumberCell value={m.brands_monthly_target} onSave={(v) => void update(m, { brands_monthly_target: v })} /></td>
                  <td className="px-3 py-2 text-right"><NumberCell value={m.dm_daily_warning} min={1} max={500} onSave={(v) => void update(m, { dm_daily_warning: v })} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={m.is_active ? 'text-emerald-300' : 'text-slate-500'}>{m.is_active ? 'Active' : 'Removed'}</span>
                      {isSuper && m.is_active && m.user_id !== me?.user_id && (
                        <button onClick={() => setPending({ kind: 'remove', member: m })} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400" title="Remove from the team" aria-label={`Remove ${m.display_name}`}>
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <DefaultOwnerRules />

      {isSuper ? <AddMember /> : <p className="text-xs text-slate-500">Only a super admin adds or removes team members and changes roles.</p>}

      {pending && (
        <ReasonDialog
          danger={pending.kind === 'remove'}
          title={pending.kind === 'remove'
            ? `Remove ${pending.member.display_name} from the team?`
            : `Make ${pending.member.display_name} ${pending.role === 'outreach' ? 'an outreach member' : 'an admin'}?`}
          description={pending.kind === 'remove'
            ? `Their leads stay and become unassigned, ready to reassign or auto-split.${pending.member.role === 'outreach' ? ' Their role goes back to user. A brand or creator account keeps working as before; an account with no brand or creator profile is deactivated (adding them again here brings it back).' : ' Their admin role stays.'} Default owner rules pointing at them switch off.`
            : pending.role === 'outreach'
              ? 'Outreach members see and work only their own leads, and only in the outreach section. They lose admin pages, deleting leads, assigning and mailbox settings. It applies on their next click.'
              : 'Admins see every lead and every admin page. It applies on their next click.'}
          confirmLabel={pending.kind === 'remove' ? 'Remove' : 'Change role'}
          onConfirm={runPending}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  )
}
