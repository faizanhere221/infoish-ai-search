import { createServerSupabase } from '@/lib/db'
import {
  karachiDayStart, mailboxDailyLimit, monthPace, monthStart, weekStart, type Pace,
} from '@/lib/outreach/rules'
import { isMissingSchema } from '@/lib/outreach/schema'
import type { OutreachMailbox, OutreachMailboxWithUsage, OutreachTeamMember } from '@/lib/outreach/types'

type Supabase = ReturnType<typeof createServerSupabase>

export interface UsageRow {
  user_id: string | null
  mailbox_id: string | null
  channel: string | null
  sent: number
}

// Sends (contacted + followed up) today, grouped by person/mailbox/channel.
export async function loadTodayUsage(supabase: Supabase, today: string): Promise<UsageRow[]> {
  const { data, error } = await supabase.rpc('outreach_today_usage', { p_day_start: karachiDayStart(today).toISOString() })
  if (error) {throw error}
  return ((data ?? []) as UsageRow[]).map((r) => ({ ...r, sent: Number(r.sent) }))
}

// Mailboxes with their usage. After the contacts/lists migration a send
// counts for N hours (outreach_mailbox_usage(), the same count
// outreach_log_action() enforces); before it, since Karachi midnight.
export async function loadMailboxesWithUsage(supabase: Supabase, today: string, usage?: UsageRow[]): Promise<OutreachMailboxWithUsage[]> {
  const { data, error } = await supabase.from('outreach_mailboxes').select('*').order('address')
  if (error) {throw error}
  const windowed = await supabase.rpc('outreach_mailbox_usage')
  if (!windowed.error) {
    const byId = new Map(((windowed.data ?? []) as { mailbox_id: string; sent: number; daily_limit: number; window_hours: number; next_free_at: string | null }[])
      .map((u) => [u.mailbox_id, u]))
    return ((data ?? []) as OutreachMailbox[]).map((m) => {
      const u = byId.get(m.id)
      return {
        ...m,
        daily_limit: u ? Number(u.daily_limit) : mailboxDailyLimit(m, today),
        sent_today: u ? Number(u.sent) : 0,
        window_hours: u ? Number(u.window_hours) : null,
        next_free_at: u?.next_free_at ?? null,
      }
    })
  }
  if (!isMissingSchema(windowed.error)) {throw windowed.error}
  const rows = usage ?? (await loadTodayUsage(supabase, today))
  const sentByMailbox = new Map<string, number>()
  for (const r of rows) {
    if (r.mailbox_id) {sentByMailbox.set(r.mailbox_id, (sentByMailbox.get(r.mailbox_id) ?? 0) + r.sent)}
  }
  return ((data ?? []) as OutreachMailbox[]).map((m) => ({
    ...m,
    daily_limit: mailboxDailyLimit(m, today),
    sent_today: sentByMailbox.get(m.id) ?? 0,
    window_hours: null,
    next_free_at: null,
  }))
}

export interface UserStatRow {
  user_id: string | null
  lead_type: 'creator' | 'brand'
  action: string
  today: number
  week: number
  month: number
}

export async function loadUserStats(supabase: Supabase, today: string): Promise<UserStatRow[]> {
  const { data, error } = await supabase.rpc('outreach_user_stats', {
    p_today_start: karachiDayStart(today).toISOString(),
    p_week_start: karachiDayStart(weekStart(today)).toISOString(),
    p_month_start: karachiDayStart(monthStart(today)).toISOString(),
  })
  if (error) {throw error}
  return ((data ?? []) as UserStatRow[]).map((r) => ({ ...r, today: Number(r.today), week: Number(r.week), month: Number(r.month) }))
}

// ─── Results per list ────────────────────────────────────────────────────────

export const LIST_METRICS = ['leads', 'contacted', 'replied', 'call_booked', 'won', 'signed_up'] as const
export type ListMetric = (typeof LIST_METRICS)[number]
export type ListPeriod = 'today' | 'week' | 'month'
export type ListCounts = Record<ListPeriod, Record<ListMetric, number> & { reply_rate: number | null }>

export interface ListResult {
  lead_type: 'creator' | 'brand'
  list: string
  totals: ListCounts
  people: { user_id: string | null; counts: ListCounts }[]
}

function emptyCounts(): ListCounts {
  const one = () => ({ leads: 0, contacted: 0, replied: 0, call_booked: 0, won: 0, signed_up: 0, reply_rate: null as number | null })
  return { today: one(), week: one(), month: one() }
}

// Leads, contacted, replied, reply rate, calls booked, won / signed up per
// list for today / week / month, plus the same per person. Counts are
// distinct leads (a brand with three contacts emailed counts once). null
// before outreach_contacts_lists_migration.sql.
export async function loadListStats(supabase: Supabase, today: string): Promise<ListResult[] | null> {
  const { data, error } = await supabase.rpc('outreach_list_stats', {
    p_today_start: karachiDayStart(today).toISOString(),
    p_week_start: karachiDayStart(weekStart(today)).toISOString(),
    p_month_start: karachiDayStart(monthStart(today)).toISOString(),
  })
  if (error) {
    if (isMissingSchema(error)) {return null}
    throw error
  }
  const results = new Map<string, ListResult>()
  for (const r of (data ?? []) as { lead_type: 'creator' | 'brand'; list: string; user_id: string | null; is_total: boolean; metric: string; today: number; week: number; month: number }[]) {
    if (!(LIST_METRICS as readonly string[]).includes(r.metric)) {continue}
    const key = `${r.lead_type}:${r.list}`
    let res = results.get(key)
    if (!res) {
      res = { lead_type: r.lead_type, list: r.list, totals: emptyCounts(), people: [] }
      results.set(key, res)
    }
    let target = res.totals
    if (!r.is_total) {
      let person = res.people.find((p) => p.user_id === r.user_id)
      if (!person) {
        person = { user_id: r.user_id, counts: emptyCounts() }
        res.people.push(person)
      }
      target = person.counts
    }
    for (const p of ['today', 'week', 'month'] as const) {target[p][r.metric as ListMetric] = Number(r[p])}
  }
  const withRates = (c: ListCounts) => {
    for (const p of ['today', 'week', 'month'] as const) {c[p].reply_rate = c[p].contacted > 0 ? c[p].replied / c[p].contacted : null}
  }
  for (const res of results.values()) {
    withRates(res.totals)
    res.people.forEach((p) => withRates(p.counts))
  }
  return [...results.values()].sort((a, b) => a.lead_type.localeCompare(b.lead_type) || a.list.localeCompare(b.list))
}

export function contactedThisMonth(stats: UserStatRow[], userId: string, leadType: 'creator' | 'brand'): number {
  return stats
    .filter((s) => s.user_id === userId && s.lead_type === leadType && s.action === 'contacted')
    .reduce((sum, s) => sum + s.month, 0)
}

export interface MemberPace {
  user_id: string
  display_name: string
  creators: Pace
  brands: Pace
  dailyTarget: number // first contacts per working day to finish the month on target
}

export function memberPaces(team: OutreachTeamMember[], stats: UserStatRow[], today: string): MemberPace[] {
  return team
    .filter((t) => t.is_active)
    .map((t) => {
      const creators = monthPace(t.creators_monthly_target, contactedThisMonth(stats, t.user_id, 'creator'), today, t.works_saturday)
      const brands = monthPace(t.brands_monthly_target, contactedThisMonth(stats, t.user_id, 'brand'), today, t.works_saturday)
      return {
        user_id: t.user_id,
        display_name: t.display_name,
        creators,
        brands,
        dailyTarget: creators.perDayNeeded + brands.perDayNeeded,
      }
    })
}

export interface Capacity {
  mailboxCapacityToday: number
  firstContactsNeededPerDay: number
  // Every first contact gets one follow-up 4 days later, so sends needed
  // per day are at most double the first contacts.
  sendsNeededPerDay: number
  activeMailboxes: number
}

export function capacitySummary(mailboxes: OutreachMailboxWithUsage[], paces: MemberPace[]): Capacity {
  const active = mailboxes.filter((m) => m.is_active)
  const first = paces.reduce((sum, p) => sum + p.dailyTarget, 0)
  return {
    mailboxCapacityToday: active.reduce((sum, m) => sum + m.daily_limit, 0),
    firstContactsNeededPerDay: first,
    sendsNeededPerDay: first * 2,
    activeMailboxes: active.length,
  }
}
