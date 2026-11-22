import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import {
  BRAND_ACTIONS, cleanSubject, CREATOR_ACTIONS, DM_CHANNELS, karachiDayStart, karachiSlotLabel, karachiToday, parseMailboxFullDetail, type Channel,
} from '@/lib/outreach/rules'
import { isMissingSchema, NEEDS_FOLLOWUPS_MIGRATION, NEEDS_MIGRATION, outreachFeatures } from '@/lib/outreach/schema'
import { DB_OFFER_ACTIONS } from '@/lib/outreach/database'
import { dbMembership } from '@/lib/outreach/database-server'
import { actionSchema } from '@/lib/outreach/schemas'
import {
  applyInterestedRule, getOutreachCaller, leadAccess, leadNotFound, leadTypeFromId, loadTeam, mapDbError, unauthorized,
} from '@/lib/outreach/server'
import type { ActionResult } from '@/lib/outreach/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/admin/outreach/actions: one-click action on a lead.
// Body: { lead_id, action, mailbox_id?, channel?, contact_id?, subject? }
// (subject: "Mark contacted" only, after outreach_followups_migration.sql). The status change,
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
    const { lead_id, action, mailbox_id, channel, contact_id } = parsed.data
    const subject = action === 'contacted' ? cleanSubject(parsed.data.subject) : null
    const leadType = leadTypeFromId(lead_id)
    if (!leadType) {return NextResponse.json({ error: 'Lead not found' }, { status: 404 })}
    const allowed: readonly string[] = leadType === 'creator' ? CREATOR_ACTIONS : BRAND_ACTIONS
    if (!allowed.includes(action)) {
      return NextResponse.json({ error: 'This action does not apply to this lead.' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    // Members act on their own leads only.
    if (!(await leadAccess(supabase, caller, leadType, lead_id))) {return leadNotFound()}
    const { data, error } = await supabase.rpc('outreach_log_action', {
      p_lead_type: leadType,
      p_lead_id: lead_id,
      p_user_id: caller.userId,
      p_action: action,
      p_mailbox_id: mailbox_id ?? null,
      p_channel: channel ?? null,
      // Only sent when given, so this route works before the contacts migration.
      ...(contact_id ? { p_contact_id: contact_id } : {}),
      // Same: only when typed, so the route works before the follow-ups migration.
      ...(subject ? { p_subject: subject } : {}),
    })
    if (error) {
      if (subject && isMissingSchema(error)) {return NextResponse.json(NEEDS_FOLLOWUPS_MIGRATION, { status: 409 })}
      if (contact_id && isMissingSchema(error)) {return NextResponse.json(NEEDS_MIGRATION, { status: 409 })}
      const mapped = mapDbError(error)
      if (mapped) {
        let message = mapped.message
        // Rolling window: say when the next slot frees up.
        const full = mapped.code === 'outreach_mailbox_full' ? parseMailboxFullDetail(mapped.detail) : null
        const at = karachiSlotLabel(full?.nextFreeAt)
        if (at) {message = `This mailbox is full (${full?.sent}/${full?.limit}). The next slot frees at ${at} (Karachi). Use another mailbox or wait.`}
        return NextResponse.json({ error: message, code: mapped.code, detail: mapped.detail, next_free_at: full?.nextFreeAt ?? null }, { status: mapped.status })
      }
      captureError(error, { route: 'POST /api/admin/outreach/actions' })
      return NextResponse.json({ error: 'Failed to log action' }, { status: 500 })
    }
    const result = data as ActionResult

    // Interested (creators: replied; brands: replied or call booked) hands
    // the lead to the Interested owner. Best effort: the action itself is
    // saved either way. Undo puts the old owner back (undo route).
    let reassignedTo: string | null = null
    if ((await outreachFeatures(supabase)).assignment) {
      try {
        reassignedTo = await applyInterestedRule(supabase, leadType, [lead_id], result.status, caller.userId)
      } catch (ruleError) {
        captureError(ruleError, { route: 'POST /api/admin/outreach/actions', step: 'interested rule', lead_id })
      }
    }

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

    const reassigned = reassignedTo
      ? { user_id: reassignedTo, display_name: (await loadTeam(supabase)).find((t) => t.user_id === reassignedTo)?.display_name ?? null }
      : null
    return NextResponse.json({ result, dmWarning, dbOffer, reassigned })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/actions' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
