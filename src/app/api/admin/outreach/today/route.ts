import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { DM_CHANNELS, karachiToday } from '@/lib/outreach/rules'
import { getOutreachCaller, loadTeam, unauthorized, withDncFlags } from '@/lib/outreach/server'
import { loadMailboxesWithUsage, loadTodayUsage, loadUserStats, memberPaces } from '@/lib/outreach/stats'
import type { OutreachLead } from '@/lib/outreach/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const FOLLOW_UP_LIMIT = 200
const NEW_LEADS_LIMIT = 30

// GET /api/admin/outreach/today: the caller's day (Asia/Karachi).
// Follow-ups due (today or overdue), oldest new leads assigned to them,
// sends today vs daily target, their mailboxes' remaining capacity and DM
// counts per platform vs their soft warning.
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const supabase = createServerSupabase()
    const today = karachiToday()
    const me = caller.userId

    const followUps = (table: 'outreach_creators' | 'outreach_brands') =>
      supabase.from(table).select('*').eq('owner_user_id', me).eq('status', 'contacted').is('deleted_at', null)
        .lte('follow_up_date', today).order('follow_up_date').order('lead_id').limit(FOLLOW_UP_LIMIT)
    const newLeads = (table: 'outreach_creators' | 'outreach_brands') =>
      supabase.from(table).select('*', { count: 'exact' }).eq('owner_user_id', me).eq('status', 'found').is('deleted_at', null)
        .order('created_at').order('lead_id').limit(NEW_LEADS_LIMIT)

    const [fuC, fuB, newC, newB, team, usage, stats] = await Promise.all([
      followUps('outreach_creators'),
      followUps('outreach_brands'),
      newLeads('outreach_creators'),
      newLeads('outreach_brands'),
      loadTeam(supabase),
      loadTodayUsage(supabase, today),
      loadUserStats(supabase, today),
    ])
    for (const r of [fuC, fuB, newC, newB]) {if (r.error) {throw r.error}}

    const mailboxes = (await loadMailboxesWithUsage(supabase, today, usage)).filter((m) => m.owner_user_id === me && m.is_active)
    const member = team.find((t) => t.user_id === me) ?? null
    const pace = member ? memberPaces([member], stats, today)[0] ?? null : null

    const mine = usage.filter((u) => u.user_id === me)
    const dmLimit = member?.dm_daily_warning ?? 25
    const dm = DM_CHANNELS.map((channel) => ({
      channel,
      sent: mine.filter((u) => u.channel === channel).reduce((s, u) => s + u.sent, 0),
      limit: dmLimit,
    }))
    const myToday = (action: string) => stats.filter((s) => s.user_id === me && s.action === action).reduce((s, r) => s + r.today, 0)

    return NextResponse.json({
      today,
      member,
      followUps: {
        creators: await withDncFlags(supabase, (fuC.data ?? []) as OutreachLead[]),
        brands: await withDncFlags(supabase, (fuB.data ?? []) as OutreachLead[]),
      },
      newLeads: {
        creators: await withDncFlags(supabase, (newC.data ?? []) as OutreachLead[]),
        brands: await withDncFlags(supabase, (newB.data ?? []) as OutreachLead[]),
        totalCreators: newC.count ?? 0,
        totalBrands: newB.count ?? 0,
      },
      sends: {
        total: mine.reduce((s, u) => s + u.sent, 0),
        contacted: myToday('contacted'),
        followedUp: myToday('followed_up'),
        dailyTarget: pace?.dailyTarget ?? 0,
      },
      pace,
      mailboxes,
      dm,
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/today' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
