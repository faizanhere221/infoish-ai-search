import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { DM_CHANNELS, karachiToday } from '@/lib/outreach/rules'
import { outreachFeatures } from '@/lib/outreach/schema'
import { contactedKey, getOutreachCaller, loadContactedInfo, loadTeam, unauthorized, withDncFlags } from '@/lib/outreach/server'
import { loadMailboxesWithUsage, loadTodayUsage, loadUserStats, memberPaces } from '@/lib/outreach/stats'
import type { BrandContact, FollowUpRow, OutreachLead, OutreachLeadRow } from '@/lib/outreach/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const FOLLOW_UP_LIMIT = 200
const NEW_LEADS_LIMIT = 30

// GET /api/admin/outreach/today: the caller's day (Asia/Karachi).
// Follow-ups due (today or overdue), each with how the lead was first
// reached (date, person, mailbox or DM, subject) from its latest contacted
// activity; brands list their contacts due. Oldest new leads assigned to them,
// sends today vs daily target, their mailboxes' remaining capacity and DM
// counts per platform vs their soft warning.
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const supabase = createServerSupabase()
    const today = karachiToday()
    const me = caller.userId

    const features = await outreachFeatures(supabase)
    // Creators: due while still "contacted". Brands: follow_up_date is the
    // earliest due contact (or the brand's own date without contacts), so a
    // brand whose other contact already replied still shows a contact due.
    const followUps = (table: 'outreach_creators' | 'outreach_brands') => {
      const q = supabase.from(table).select('*').eq('owner_user_id', me).is('deleted_at', null)
      return (table === 'outreach_creators' || !features.contacts ? q.eq('status', 'contacted') : q.not('status', 'in', '(won,opted_out,bounced)'))
        .not('follow_up_date', 'is', null).lte('follow_up_date', today)
        .order('follow_up_date').order('lead_id').limit(FOLLOW_UP_LIMIT)
    }
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

    const creatorRows = await withDncFlags(supabase, (fuC.data ?? []) as OutreachLead[])
    const brandRows = await withDncFlags(supabase, (fuB.data ?? []) as OutreachLead[])
    const contacted = await loadContactedInfo(supabase, [...creatorRows, ...brandRows].map((l) => l.lead_id), features)

    // Brand contacts due for a follow-up (active ones only).
    const dueByBrand = new Map<string, BrandContact[]>()
    if (features.contacts && brandRows.length > 0) {
      let q = supabase.from('outreach_brand_contacts').select('*')
        .in('lead_id', brandRows.map((b) => b.lead_id)).eq('status', 'contacted')
        .lte('follow_up_date', today).order('follow_up_date').order('created_at')
      if (features.contactRemoval) {q = q.is('deleted_at', null)}
      const { data: dueContacts, error: dueError } = await q
      if (dueError) {throw dueError}
      for (const c of (dueContacts ?? []) as BrandContact[]) {
        dueByBrand.set(c.lead_id, [...(dueByBrand.get(c.lead_id) ?? []), c])
      }
    }

    const toFollowUp = (lead: OutreachLeadRow): FollowUpRow => {
      const due = dueByBrand.get(lead.lead_id)
      return {
        ...lead,
        contacted: contacted.get(contactedKey(lead.lead_id)) ?? null,
        ...(due ? { due_contacts: due.map((c) => ({ ...c, contacted: contacted.get(contactedKey(lead.lead_id, c.id)) ?? null })) } : {}),
      }
    }
    // With contacts, a brand is due only through a contact that is due.
    const brandFollowUps = brandRows.map(toFollowUp).filter((b) => !features.contacts || b.status === 'contacted' || (b.due_contacts?.length ?? 0) > 0)

    return NextResponse.json({
      today,
      member,
      followUps: {
        creators: creatorRows.map(toFollowUp),
        brands: brandFollowUps,
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
