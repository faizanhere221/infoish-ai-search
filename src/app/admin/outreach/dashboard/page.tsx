'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { CHANNEL_LABELS, STATUS_LABELS, type Channel, type Pace } from '@/lib/outreach/rules'
import type { Capacity, MemberPace } from '@/lib/outreach/stats'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { Card, formatPct, ProgressBar } from '@/components/admin/outreach/ui'

const METRICS = ['contacted', 'followed_up', 'replied', 'signed_up', 'call_booked', 'won', 'bounced', 'opted_out'] as const
type Period = 'today' | 'week' | 'month'

interface Person {
  user_id: string
  display_name: string
  is_active: boolean
  counts: Record<string, Record<Period, number>>
}

interface RateRow {
  contacted: number
  replied: number
  bounced: number
  replyRate: number | null
  bounceRate: number | null
  flagged: boolean
}

interface DashboardData {
  today: string
  people: Person[]
  paces: MemberPace[]
  byMailbox: (RateRow & { mailbox_id: string; address: string; is_active: boolean })[]
  byChannel: (RateRow & { channel: string })[]
  rateWindowDays: number
  capacity: Capacity
}

function PaceRow({ label, pace }: { label: string; pace: Pace }) {
  if (pace.target === 0) {return null}
  const state = pace.onTrack ? 'ok' : 'warn'
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className={pace.onTrack ? 'text-emerald-300' : 'text-amber-300'}>
          {pace.done.toLocaleString()} / {pace.target.toLocaleString()} · {pace.onTrack ? 'on track' : `behind by ${(pace.expectedByNow - pace.done).toLocaleString()}`}
        </span>
      </div>
      <ProgressBar value={pace.done} max={pace.target} state={state} />
      <p className="mt-1 text-xs text-slate-500">
        {pace.workingDaysLeft} of {pace.workingDaysTotal} working days left · {pace.perDayNeeded.toLocaleString()}/day needed
      </p>
    </div>
  )
}

function RateTable({ title, rows, label, windowDays }: { title: string; rows: (RateRow & { key: string; name: string })[]; label: string; windowDays: number }) {
  return (
    <Card title={`${title} (last ${windowDays} days)`}>
      {rows.length === 0 ? <p className="text-sm text-slate-500">No sends yet.</p> : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="py-1.5">{label}</th><th className="py-1.5 text-right">Contacted</th><th className="py-1.5 text-right">Reply rate</th><th className="py-1.5 text-right">Bounce rate</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="max-w-[220px] truncate py-1.5 text-slate-200">{r.name}</td>
                <td className="py-1.5 text-right text-slate-300">{r.contacted.toLocaleString()}</td>
                <td className="py-1.5 text-right text-slate-300">{formatPct(r.replyRate)}</td>
                <td className={`py-1.5 text-right ${r.flagged ? 'font-semibold text-red-300' : 'text-slate-300'}`}>
                  {r.flagged && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}{formatPct(r.bounceRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-2 text-xs text-slate-500">Rates use first contacts as the base. Bounce rate above 3% is flagged.</p>
    </Card>
  )
}

export default function OutreachDashboardPage() {
  useDocumentTitle('Outreach dashboard')
  const { toast, version } = useOutreach()
  const [data, setData] = useState<DashboardData | null>(null)
  const [period, setPeriod] = useState<Period>('today')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/outreach/dashboard')
    const d = await readJson<DashboardData>(res)
    if (!res.ok) {
      toast('error', d.error ?? 'Failed to load the dashboard')
      return
    }
    setData(d)
  }, [toast])

  useEffect(() => { void load() }, [load, version])

  if (!data) {return <p className="text-sm text-slate-500">Loading…</p>}

  const totals = Object.fromEntries(METRICS.map((m) => [m, data.people.reduce((s, p) => s + (p.counts[m]?.[period] ?? 0), 0)]))
  const short = data.capacity.sendsNeededPerDay - data.capacity.mailboxCapacityToday

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">Outreach dashboard</h1>
        <div className="flex gap-1 rounded-lg border border-slate-800 p-1">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`rounded-md px-3 py-1 text-sm ${period === p ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This week' : 'This month'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Person</th>
              {METRICS.map((m) => <th key={m} className="whitespace-nowrap px-3 py-2 text-right">{STATUS_LABELS[m]}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {data.people.map((p) => (
              <tr key={p.user_id} className={p.is_active ? '' : 'opacity-50'}>
                <td className="whitespace-nowrap px-3 py-2 text-slate-200">{p.display_name}</td>
                {METRICS.map((m) => <td key={m} className="px-3 py-2 text-right text-slate-300">{(p.counts[m]?.[period] ?? 0).toLocaleString()}</td>)}
              </tr>
            ))}
            <tr className="bg-slate-800/40 font-medium">
              <td className="px-3 py-2 text-white">Total</td>
              {METRICS.map((m) => <td key={m} className="px-3 py-2 text-right text-white">{totals[m].toLocaleString()}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.paces.map((p) => (
          <Card key={p.user_id} title={`${p.display_name}: this month`}>
            <div className="space-y-3">
              <PaceRow label="Creators contacted" pace={p.creators} />
              <PaceRow label="Brands contacted" pace={p.brands} />
              {p.creators.target === 0 && p.brands.target === 0 && <p className="text-sm text-slate-500">No targets set.</p>}
            </div>
          </Card>
        ))}
      </div>

      <Card title="Capacity">
        <p className="text-sm text-slate-300">
          Mailboxes send up to <span className="font-semibold text-white">{data.capacity.mailboxCapacityToday.toLocaleString()}</span> emails today.
          Targets need about <span className="font-semibold text-white">{data.capacity.sendsNeededPerDay.toLocaleString()}</span> sends per working day
          ({data.capacity.firstContactsNeededPerDay.toLocaleString()} first contacts plus follow-ups).
          {short > 0
            ? <span className="text-amber-300"> Email covers {short.toLocaleString()} fewer sends per day than needed; DMs or more mailboxes close the gap.</span>
            : <span className="text-emerald-300"> Capacity covers the targets.</span>}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <RateTable
          title="By mailbox"
          label="Mailbox"
          windowDays={data.rateWindowDays}
          rows={data.byMailbox.map((r) => ({ ...r, key: r.mailbox_id, name: r.address }))}
        />
        <RateTable
          title="By channel"
          label="Channel"
          windowDays={data.rateWindowDays}
          rows={data.byChannel.map((r) => ({ ...r, key: r.channel, name: CHANNEL_LABELS[r.channel as Channel] ?? r.channel }))}
        />
      </div>
    </div>
  )
}
