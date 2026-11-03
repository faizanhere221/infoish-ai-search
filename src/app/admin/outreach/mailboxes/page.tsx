'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { karachiToday, mailboxState, MAILBOX_MAX_LIMIT } from '@/lib/outreach/rules'
import type { OutreachMailboxWithUsage } from '@/lib/outreach/types'
import type { Capacity } from '@/lib/outreach/stats'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { buttonClass, Card, inputClass, mailboxStateClass, ProgressBar, selectClass } from '@/components/admin/outreach/ui'

interface MailboxForm {
  address: string
  owner_user_id: string
  start_date: string
  is_personal: boolean
  custom_limit: string
}

function warmupLabel(m: OutreachMailboxWithUsage, today: string): string {
  if (m.custom_limit) {return `Custom ${m.custom_limit}/day`}
  if (m.is_personal) {return 'Personal, 30/day'}
  const days = Math.round((Date.parse(today) - Date.parse(m.start_date)) / 86_400_000)
  if (days < 0) {return 'Not started'}
  const week = Math.floor(days / 7) + 1
  return week >= 4 ? 'Warmed up' : `Warm-up week ${week}`
}

export default function OutreachMailboxesPage() {
  useDocumentTitle('Outreach mailboxes')
  const { me, team, ownerName, toast, refreshMailboxes, version } = useOutreach()
  const [mailboxes, setMailboxes] = useState<OutreachMailboxWithUsage[]>([])
  const [capacity, setCapacity] = useState<Capacity | null>(null)
  const [today, setToday] = useState('')
  const [form, setForm] = useState<MailboxForm>({ address: '', owner_user_id: '', start_date: karachiToday(), is_personal: false, custom_limit: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/outreach/mailboxes')
    const data = await readJson<{ mailboxes: OutreachMailboxWithUsage[]; capacity: Capacity; today: string }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Failed to load mailboxes')
      return
    }
    setMailboxes(data.mailboxes)
    setCapacity(data.capacity)
    setToday(data.today)
  }, [toast])

  useEffect(() => { void load() }, [load, version])

  const save = async (id: string | null, body: Record<string, unknown>) => {
    const res = await fetch(id ? `/api/admin/outreach/mailboxes/${encodeURIComponent(id)}` : '/api/admin/outreach/mailboxes', {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await readJson<{ message?: string }>(res)
    if (!res.ok) {
      toast('error', data.error ?? 'Save failed')
      return false
    }
    toast('success', data.message ?? 'Saved')
    await load()
    void refreshMailboxes()
    return true
  }

  const add = async () => {
    setSaving(true)
    const ok = await save(null, {
      address: form.address,
      owner_user_id: form.owner_user_id || null,
      start_date: form.start_date,
      is_personal: form.is_personal,
      custom_limit: form.custom_limit ? Number(form.custom_limit) : null,
    })
    setSaving(false)
    if (ok) {setForm({ ...form, address: '', custom_limit: '' })}
  }

  const isAdmin = !!me?.is_admin
  const short = capacity ? capacity.sendsNeededPerDay - capacity.mailboxCapacityToday : 0

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-white">Mailboxes</h1>

      {capacity && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Email capacity today">
            <p className="text-2xl font-semibold text-white">{capacity.mailboxCapacityToday.toLocaleString()}</p>
            <p className="text-xs text-slate-500">sends/day across {capacity.activeMailboxes} active mailboxes</p>
          </Card>
          <Card title="Targets need">
            <p className="text-2xl font-semibold text-white">{capacity.sendsNeededPerDay.toLocaleString()}</p>
            <p className="text-xs text-slate-500">
              sends per working day: {capacity.firstContactsNeededPerDay.toLocaleString()} first contacts plus up to the same in follow-ups
            </p>
          </Card>
          <Card title="Gap">
            <p className={`text-2xl font-semibold ${short > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
              {short > 0 ? `${short.toLocaleString()} short` : 'Covered'}
            </p>
            <p className="text-xs text-slate-500">Counts email only. DMs on LinkedIn, X, Instagram and TikTok cover part of the gap.</p>
          </Card>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Mailbox</th><th className="px-3 py-2">Owner</th><th className="px-3 py-2">Start</th>
              <th className="px-3 py-2">Schedule</th><th className="w-56 px-3 py-2">Today</th>
              {isAdmin && <th className="px-3 py-2">Custom limit</th>}
              <th className="px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {mailboxes.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">No mailboxes yet.</td></tr>
            ) : mailboxes.map((m) => {
              const state = mailboxState(m.sent_today, m.daily_limit)
              return (
                <tr key={m.id} className={m.is_active ? '' : 'opacity-50'}>
                  <td className="px-3 py-2 text-slate-200">{m.address}{m.is_personal && <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">personal</span>}</td>
                  <td className="px-3 py-2">
                    {isAdmin ? (
                      <select value={m.owner_user_id ?? ''} onChange={(e) => void save(m.id, { owner_user_id: e.target.value || null })} className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-200">
                        <option value="">No owner</option>
                        {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
                      </select>
                    ) : <span className="text-slate-300">{ownerName(m.owner_user_id)}</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-400">{m.start_date}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-400">{warmupLabel(m, today)}</td>
                  <td className="px-3 py-2">
                    <div className={`mb-1 text-xs ${mailboxStateClass(state)}`}>{m.sent_today} / {m.daily_limit}{state === 'warn' ? ' · over 80%' : state === 'full' ? ' · limit reached' : ''}</div>
                    <ProgressBar value={m.sent_today} max={m.daily_limit} state={state === 'full' ? 'bad' : state === 'warn' ? 'warn' : 'ok'} />
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2">
                      <input type="number" min={1} max={MAILBOX_MAX_LIMIT} defaultValue={m.custom_limit ?? ''} placeholder="Auto"
                        onBlur={(e) => {
                          const v = e.target.value ? Number(e.target.value) : null
                          if (v !== m.custom_limit) {void save(m.id, { custom_limit: v })}
                        }}
                        className="w-20 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white" />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={m.is_active} disabled={!isAdmin} onChange={() => void save(m.id, { is_active: !m.is_active })} aria-label={`Active ${m.address}`} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Warm-up: week 1 = 10/day, week 2 = 15, week 3 = 25, week 4+ = 30. A custom limit (max {MAILBOX_MAX_LIMIT}) replaces the schedule.
        Personal mailboxes skip warm-up: 30/day unless a custom limit is set. Contacted and followed up both count. A warning shows at 80% and sends stop at the limit.
      </p>

      {isAdmin && (
        <Card title="Add a mailbox">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-xs text-slate-400">
              Address
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="name@yourdomain.com" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Owner
              <select value={form.owner_user_id} onChange={(e) => setForm({ ...form, owner_user_id: e.target.value })} className={selectClass}>
                <option value="">No owner</option>
                {team.map((t) => <option key={t.user_id} value={t.user_id}>{t.display_name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Start date
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              Custom limit
              <input type="number" min={1} max={MAILBOX_MAX_LIMIT} value={form.custom_limit} onChange={(e) => setForm({ ...form, custom_limit: e.target.value })} placeholder="Auto" className={`${inputClass} w-24`} />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.is_personal} onChange={(e) => setForm({ ...form, is_personal: e.target.checked })} /> Personal
            </label>
            <button onClick={add} disabled={saving || !form.address.trim()} className={buttonClass}><Plus className="h-4 w-4" /> Add</button>
          </div>
        </Card>
      )}
    </div>
  )
}
