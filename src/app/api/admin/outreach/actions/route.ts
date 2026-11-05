import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { BRAND_ACTIONS, CREATOR_ACTIONS, DM_CHANNELS, karachiDayStart, karachiToday, type Channel } from '@/lib/outreach/rules'
import { DB_OFFER_ACTIONS } from '@/lib/outreach/database'
import { dbMembership } from '@/lib/outreach/database-server'
import { actionSchema } from '@/lib/outreach/schemas'
import { getOutreachCaller, leadTypeFromId, loadTeam, mapDbError, unauthorized } from '@/lib/outreach/server'
import type { ActionResult } from '@/lib/outreach/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/admin/outreach/actions: one-click action on a lead.
// Body: { lead_id, action, mailbox_id?, channel? }. The status change,
// mailbox limit check and activity row all happen in outreach_log_action()
// (one transaction, mailbox row locked). Response includes a DM warning
// once the caller passes their soft daily limit for that platform, and
// `dbOffer` after replied (creators) / call booked or won (brands) when the
// lead isn't in the Database yet, so the UI offers "Add to Database".
export async function POST(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const parsed = actionSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { lead_id, action, mailbox_id, channel } = parsed.data
    const leadType = leadTypeFromId(lead_id)
    if (!leadType) {return NextResponse.json({ error: 'Lead not found' }, { status: 404 })}
    const allowed: readonly string[] = leadType === 'creator' ? CREATOR_ACTIONS : BRAND_ACTIONS
    if (!allowed.includes(action)) {
      return NextResponse.json({ error: 'This action does not apply to this lead.' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data, error } = await supabase.rpc('outreach_log_action', {
      p_lead_type: leadType,
      p_lead_id: lead_id,
      p_user_id: caller.userId,
      p_action: action,
      p_mailbox_id: mailbox_id ?? null,
      p_channel: channel ?? null,
    })
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {return NextResponse.json({ error: mapped.message, code: mapped.code, detail: mapped.detail }, { status: mapped.status })}
      captureError(error, { route: 'POST /api/admin/outreach/actions' })
      return NextResponse.json({ error: 'Failed to log action' }, { status: 500 })
    }
    const result = data as ActionResult

    let dmWarning: { channel: Channel; sent: number; limit: number } | null = null
    const usedChannel = (channel ?? null) as Channel | null
    if ((action === 'contacted' || action === 'followed_up') && usedChannel && DM_CHANNELS.includes(usedChannel)) {
      const team = await loadTeam(supabase)
      const limit = team.find((t) => t.user_id === caller.userId)?.dm_daily_warning ?? 25
      const { count } = await supabase
        .from('outreach_activity')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', caller.userId)
        .eq('channel', usedChannel)
        .in('action', ['contacted', 'followed_up'])
        .is('undone_at', null)
        .gte('created_at', karachiDayStart(karachiToday()).toISOString())
      if ((count ?? 0) >= limit) {dmWarning = { channel: usedChannel, sent: count ?? 0, limit }}
    }

    const dbOffer = DB_OFFER_ACTIONS[leadType].includes(action)
      && !(await dbMembership(supabase, leadType, [lead_id])).has(lead_id)

    return NextResponse.json({ result, dmWarning, dbOffer })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/actions' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
