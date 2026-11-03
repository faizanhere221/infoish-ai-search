'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { OutreachTeamMember } from '@/lib/outreach/types'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, Card, inputClass, selectClass } from '@/components/admin/outreach/ui'

interface NewMember {
  email: string
  display_name: string
  role: 'outreach' | 'admin'
  temp_password: string
  works_saturday: boolean
  creators_monthly_target: string
  brands_monthly_target: string
  reason: string
}

const EMPTY: NewMember = {
  email: '', display_name: '', role: 'outreach', temp_password: '', works_saturday: false,
  creators_monthly_target: '1000', brands_monthly_target: '0', reason: '',
}

function NumberCell({ value, onSave, min = 0, max = 100000 }: { value: number; onSave: (v: number) => void; min?: number; max?: number }) {
  return (
    <input type="number" min={min} max={max} defaultValue={value}
      onBlur={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== value) {onSave(v)} }}
      className="w-24 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-right text-xs text-white" />
  )
}

export default function OutreachTeamPage() {
  useDocumentTitle('Outreach team')
  const { me, team, toast, refreshTeam, bump } = useOutreach()
  const [form, setForm] = useState<NewMember>(EMPTY)
  const [saving, setSaving] = useState(false)

  if (me && !me.is_admin) {return <p className="text-sm text-slate-400">Only admins manage the team.</p>}

  const update = async (m: OutreachTeamMember, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/outreach/team/${encodeURIComponent(m.user_id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await readJson<{ member: unknown }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Save failed')
      return
    }
    toast('success', `${m.display_name} saved`)
    await refreshTeam()
    bump()
  }

  const add = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/outreach/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        temp_password: form.temp_password || undefined,
        creators_monthly_target: Number(form.creators_monthly_target) || 0,
        brands_monthly_target: Number(form.brands_monthly_target) || 0,
      }),
    })
    const data = await readJson<{ message: string; fields?: Record<string, string[]> }>(res)
    setSaving(false)
    if (!res.ok) {
      const fieldError = data.fields ? Object.entries(data.fields).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ') : ''
      toast('error', fieldError || data.error || 'Failed to add')
      return
    }
    toast('success', data.message)
    setForm(EMPTY)
    await refreshTeam()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Outreach team</h1>
        <p className="text-sm text-slate-400">Monthly targets count first contacts. Working days drive the on-track and behind status.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Works</th><th className="px-3 py-2 text-right">Creators/month</th>
              <th className="px-3 py-2 text-right">Brands/month</th><th className="px-3 py-2 text-right">DM warning/day</th>
              <th className="px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {team.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">No team members yet.</td></tr>
            ) : team.map((m) => (
              <tr key={m.user_id} className={m.is_active ? '' : 'opacity-50'}>
                <td className="px-3 py-2">
                  <input defaultValue={m.display_name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== m.display_name) {void update(m, { display_name: v })} }}
                    className="w-36 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-slate-200 hover:border-slate-700 focus:border-violet-500 focus:outline-none" />
                </td>
                <td className="px-3 py-2 text-slate-400">{m.email}</td>
                <td className="px-3 py-2 text-slate-400">{m.role}</td>
                <td className="px-3 py-2">
                  <select value={m.works_saturday ? 'sat' : 'fri'} onChange={(e) => void update(m, { works_saturday: e.target.value === 'sat' })} className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-200">
                    <option value="fri">Mon–Fri</option><option value="sat">Mon–Sat</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-right"><NumberCell value={m.creators_monthly_target} onSave={(v) => void update(m, { creators_monthly_target: v })} /></td>
                <td className="px-3 py-2 text-right"><NumberCell value={m.brands_monthly_target} onSave={(v) => void update(m, { brands_monthly_target: v })} /></td>
                <td className="px-3 py-2 text-right"><NumberCell value={m.dm_daily_warning} min={1} max={500} onSave={(v) => void update(m, { dm_daily_warning: v })} /></td>
                <td className="px-3 py-2"><input type="checkbox" checked={m.is_active} onChange={() => void update(m, { is_active: !m.is_active })} aria-label={`Active ${m.display_name}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {me?.is_super_admin ? (
        <Card title="Add a team member">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs text-slate-400">Email
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="va@infoishai.com" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">Name
              <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as NewMember['role'] })} className={selectClass}>
                <option value="outreach">Outreach (this section only)</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">Temporary password
              <input type="text" value={form.temp_password} onChange={(e) => setForm({ ...form, temp_password: e.target.value })} className={inputClass} placeholder="New accounts, 10+ characters" autoComplete="off" />
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
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              An email with no account gets a new one with the temporary password. They set their own password on first login at /admin/login.
              An existing admin account joins the team with its current role.
            </p>
            <button onClick={add} disabled={saving || !form.email || !form.display_name || form.reason.trim().length < 3} className={buttonClass}>
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </Card>
      ) : (
        <p className="text-xs text-slate-500">Only a super admin adds team members.</p>
      )}
    </div>
  )
}
