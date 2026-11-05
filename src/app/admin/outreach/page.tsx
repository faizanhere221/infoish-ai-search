'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { CHANNEL_LABELS, karachiSlotLabel, mailboxState, type Pace } from '@/lib/outreach/rules'
import type { OutreachBrand, OutreachCreator, OutreachLeadRow, OutreachMailboxWithUsage, OutreachTeamMember } from '@/lib/outreach/types'
import { readJson, useOutreach } from '@/components/admin/outreach/OutreachContext'
import { LeadActions } from '@/components/admin/outreach/LeadActions'
import { Card, DncBadge, ExternalLink, formatCount, ghostButtonClass, mailboxStateClass, ProgressBar, StatusBadge } from '@/components/admin/outreach/ui'

interface TodayData {
  today: string
  member: OutreachTeamMember | null
  followUps: { creators: OutreachLeadRow[]; brands: OutreachLeadRow[] }
  newLeads: { creators: OutreachLeadRow[]; brands: OutreachLeadRow[]; totalCreators: number; totalBrands: number }
  sends: { total: number; contacted: number; followedUp: number; dailyTarget: number }
  pace: { creators: Pace; brands: Pace; dailyTarget: number } | null
  mailboxes: OutreachMailboxWithUsage[]
  dm: { channel: keyof typeof CHANNEL_LABELS; sent: number; limit: number }[]
}

function leadLabel(lead: OutreachLeadRow): { title: string; href: string | null; sub: string } {
  if (lead.lead_id.startsWith('C-')) {
    const c = lead as OutreachCreator & { dnc: boolean }
    return { title: c.name || c.profile_url || '(no name)', href: c.profile_url, sub: [c.niche, c.country, c.subscribers ? `${formatCount(c.subscribers)} subs` : null].filter(Boolean).join(' · ') }
  }
  const b = lead as OutreachBrand & { dnc: boolean }
  return { title: b.company || b.domain || '(no name)', href: b.website || b.domain, sub: [b.contact_name, b.country, b.score !== null ? `score ${b.score}` : null].filter(Boolean).join(' · ') }
}

function LeadList({ leads, empty, showDue }: { leads: OutreachLeadRow[]; empty: string; showDue?: boolean }) {
  if (leads.length === 0) {return <p className="text-sm text-slate-500">{empty}</p>}
  return (
    <ul className="divide-y divide-slate-800">
      {leads.map((lead) => {
        const { title, href, sub } = leadLabel(lead)
        return (
          <li key={lead.lead_id} className="flex items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-500">{lead.lead_id}</span>
                <ExternalLink href={href} className="truncate text-sm">{title}</ExternalLink>
                {lead.dnc && <DncBadge />}
              </div>
              <div className="truncate text-xs text-slate-500">
                {sub}
                {lead.email ? ` · ${lead.email}` : ''}
                {showDue && lead.follow_up_date ? ` · due ${lead.follow_up_date}` : ''}
              </div>
            </div>
            <StatusBadge status={lead.status} />
            <LeadActions lead={lead} leadType={lead.lead_id.startsWith('C-') ? 'creator' : 'brand'} />
          </li>
        )
      })}
    </ul>
  )
}

export default function OutreachTodayPage() {
  useDocumentTitle('Outreach today')
  const { version, toast, me } = useOutreach()
  const [data, setData] = useState<TodayData | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/outreach/today')
    const d = await readJson<TodayData>(res)
    if (!res.ok) {
      toast('error', d.error ?? 'Failed to load today')
      return
    }
    setData(d)
  }, [toast])

  useEffect(() => { void load() }, [load, version])

  if (!data) {return <p className="text-sm text-slate-500">Loading…</p>}

  const followUps = [...data.followUps.creators, ...data.followUps.brands]
    .sort((a, b) => (a.follow_up_date ?? '').localeCompare(b.follow_up_date ?? ''))
  const newLeads = [...data.newLeads.creators, ...data.newLeads.brands]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const target = data.sends.dailyTarget
  const firstState = target > 0 && data.sends.contacted >= target ? 'ok' : 'warn'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Today</h1>
          <p className="text-sm text-slate-400">
            {data.today} (Asia/Karachi){data.member ? ` · ${data.member.display_name}` : ''}
          </p>
        </div>
        <a href="/api/admin/outreach/export/already-in-sheet" className={ghostButtonClass}>
          <Download className="h-4 w-4" /> already_in_sheet.txt
        </a>
      </div>

      {!data.member && (
        <div className="rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          You aren&apos;t on the outreach team yet, so no targets or leads are assigned to you.
          {me?.is_super_admin ? <> Add yourself on the <Link href="/admin/outreach/team" className="underline">Team</Link> page.</> : ' Ask a super admin to add you.'}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="My sends today">
          <div className="space-y-3 text-sm">
            <div>
              <div className="mb-1 flex justify-between text-slate-300">
                <span>First contacts</span>
                <span className="font-medium text-white">{data.sends.contacted} / {target}</span>
              </div>
              <ProgressBar value={data.sends.contacted} max={Math.max(target, 1)} state={firstState} />
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Follow-ups sent</span>
              <span className="font-medium text-white">{data.sends.followedUp} (due now: {followUps.length})</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>All sends</span>
              <span className="font-medium text-white">{data.sends.total}</span>
            </div>
            {data.pace && (
              <p className="text-xs text-slate-500">
                Month: {data.pace.creators.done}/{data.pace.creators.target} creators, {data.pace.brands.done}/{data.pace.brands.target} brands.
                {' '}{data.pace.creators.workingDaysLeft} working days left.
              </p>
            )}
          </div>
        </Card>

        <Card title="My mailboxes">
          {data.mailboxes.length === 0 ? (
            <p className="text-sm text-slate-500">No mailboxes assigned to you.</p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {data.mailboxes.map((m) => {
                const state = mailboxState(m.sent_today, m.daily_limit)
                return (
                  <li key={m.id}>
                    <div className="mb-1 flex justify-between gap-2">
                      <span className="truncate text-slate-300">{m.address}</span>
                      <span className={mailboxStateClass(state)}>
                        {state === 'full' && karachiSlotLabel(m.next_free_at) ? `Full until ${karachiSlotLabel(m.next_free_at)}` : `${Math.max(m.daily_limit - m.sent_today, 0)} left${m.window_hours ? ` in ${m.window_hours} h` : ''}`}
                      </span>
                    </div>
                    <ProgressBar value={m.sent_today} max={m.daily_limit} state={state === 'full' ? 'bad' : state === 'warn' ? 'warn' : 'ok'} />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card title="My DMs today">
          <ul className="space-y-2 text-sm">
            {data.dm.map((d) => (
              <li key={d.channel} className="flex justify-between">
                <span className="text-slate-300">{CHANNEL_LABELS[d.channel]}</span>
                <span className={d.sent >= d.limit ? 'font-medium text-amber-300' : 'text-white'}>{d.sent} / {d.limit}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">A soft limit per platform. Going over shows a warning and nothing is blocked.</p>
        </Card>
      </div>

      <Card title={`Follow-ups due (${followUps.length})`}>
        <LeadList leads={followUps} showDue empty="No follow-ups due today." />
      </Card>

      <Card
        title={`New leads assigned to me (${(data.newLeads.totalCreators + data.newLeads.totalBrands).toLocaleString()})`}
        actions={
          <div className="flex gap-3 text-xs">
            <Link href="/admin/outreach/creators?owner=me&status=found" className="text-violet-300 hover:text-violet-200">All my new creators</Link>
            <Link href="/admin/outreach/brands?owner=me&status=found" className="text-violet-300 hover:text-violet-200">All my new brands</Link>
          </div>
        }
      >
        <LeadList leads={newLeads} empty="No new leads assigned to you." />
      </Card>
    </div>
  )
}
