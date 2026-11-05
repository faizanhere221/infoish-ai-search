import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { addDays, BOUNCE_RATE_FLAG, karachiDayStart, karachiToday } from '@/lib/outreach/rules'
import { getOutreachCaller, loadTeam, unauthorized } from '@/lib/outreach/server'
import { capacitySummary, loadListStats, loadMailboxesWithUsage, loadUserStats, memberPaces } from '@/lib/outreach/stats'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const METRICS = ['contacted', 'followed_up', 'replied', 'signed_up', 'call_booked', 'won', 'bounced', 'opted_out'] as const
const RATE_WINDOW_DAYS = 30

interface RateRow {
  mailbox_id: string | null
  channel: string | null
  contacted: number
  followed_up: number
  replied: number
  bounced: number
}

// GET /api/admin/outreach/dashboard: per person today/week/month counts,
// month pace vs targets, reply and bounce rates by mailbox and channel
// (last 30 days), mailbox capacity vs what targets need, and results per
// list (and per list per person).
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const supabase = createServerSupabase()
    const today = karachiToday()
    const [team, stats, mailboxes, ratesRes, lists] = await Promise.all([
      loadTeam(supabase),
      loadUserStats(supabase, today),
      loadMailboxesWithUsage(supabase, today),
      supabase.rpc('outreach_channel_stats', { p_from: karachiDayStart(addDays(today, -RATE_WINDOW_DAYS + 1)).toISOString() }),
      loadListStats(supabase, today),
    ])
    if (ratesRes.error) {throw ratesRes.error}

    const people = team.map((t) => {
      const counts = Object.fromEntries(
        METRICS.map((m) => {
          const rows = stats.filter((s) => s.user_id === t.user_id && s.action === m)
          return [m, {
            today: rows.reduce((s, r) => s + r.today, 0),
            week: rows.reduce((s, r) => s + r.week, 0),
            month: rows.reduce((s, r) => s + r.month, 0),
          }]
        }),
      )
      return { user_id: t.user_id, display_name: t.display_name, works_saturday: t.works_saturday, is_active: t.is_active, counts }
    })

    const paces = memberPaces(team, stats, today)
    const rateRows = ((ratesRes.data ?? []) as RateRow[]).map((r) => ({
      ...r,
      contacted: Number(r.contacted), followed_up: Number(r.followed_up), replied: Number(r.replied), bounced: Number(r.bounced),
    }))
    const rate = (n: number, d: number) => (d > 0 ? n / d : null)

    const byMailbox = mailboxes.map((m) => {
      const rows = rateRows.filter((r) => r.mailbox_id === m.id)
      const contacted = rows.reduce((s, r) => s + r.contacted, 0)
      const replied = rows.reduce((s, r) => s + r.replied, 0)
      const bounced = rows.reduce((s, r) => s + r.bounced, 0)
      const bounceRate = rate(bounced, contacted)
      return {
        mailbox_id: m.id, address: m.address, is_active: m.is_active, contacted, replied, bounced,
        replyRate: rate(replied, contacted), bounceRate, flagged: bounceRate !== null && bounceRate > BOUNCE_RATE_FLAG,
      }
    })

    const channels = [...new Set(rateRows.map((r) => r.channel ?? 'unknown'))]
    const byChannel = channels.map((channel) => {
      const rows = rateRows.filter((r) => (r.channel ?? 'unknown') === channel)
      const contacted = rows.reduce((s, r) => s + r.contacted, 0)
      const replied = rows.reduce((s, r) => s + r.replied, 0)
      const bounced = rows.reduce((s, r) => s + r.bounced, 0)
      const bounceRate = rate(bounced, contacted)
      return { channel, contacted, replied, bounced, replyRate: rate(replied, contacted), bounceRate, flagged: bounceRate !== null && bounceRate > BOUNCE_RATE_FLAG }
    })

    return NextResponse.json({
      today,
      people,
      paces,
      byMailbox,
      byChannel,
      rateWindowDays: RATE_WINDOW_DAYS,
      capacity: capacitySummary(mailboxes, paces),
      lists, // per list results (null before the contacts/lists migration)
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/dashboard' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
