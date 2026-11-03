import { createServerSupabase } from '@/lib/db'
import {
  karachiDayStart, mailboxDailyLimit, monthPace, monthStart, weekStart, type Pace,
} from '@/lib/outreach/rules'
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

export async function loadMailboxesWithUsage(supabase: Supabase, today: string, usage?: UsageRow[]): Promise<OutreachMailboxWithUsage[]> {
  const { data, error } = await supabase.from('outreach_mailboxes').select('*').order('address')
  if (error) {throw error}
  const rows = usage ?? (await loadTodayUsage(supabase, today))
  const sentByMailbox = new Map<string, number>()
  for (const r of rows) {
    if (r.mailbox_id) {sentByMailbox.set(r.mailbox_id, (sentByMailbox.get(r.mailbox_id) ?? 0) + r.sent)}
  }
  return ((data ?? []) as OutreachMailbox[]).map((m) => ({
    ...m,
    daily_limit: mailboxDailyLimit(m, today),
    sent_today: sentByMailbox.get(m.id) ?? 0,
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
