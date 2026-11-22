import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { bulkSchema, brandStatusSchema, creatorStatusSchema } from '@/lib/outreach/schemas'
import { outreachFeatures } from '@/lib/outreach/schema'
import {
  adminOnly, applyInterestedRule, assignLeads, getOutreachCaller, leadTable, leadTypeFromSegment, loadTeam, mapDbError, unauthorized,
} from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string } }

// POST (admin): set owner and/or status on up to 500 leads at once.
// Deleted leads are skipped (restore them first).
// Bulk status changes have no undo and skip the mailbox count; they're for
// cleanup, not for logging sends.
export async function POST(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const parsed = bulkSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { lead_ids, owner_user_id, status, reason } = parsed.data
    if (owner_user_id === undefined && status === undefined) {
      return NextResponse.json({ error: 'Pick an owner or a status' }, { status: 400 })
    }
    if (status !== undefined) {
      const ok = (leadType === 'creator' ? creatorStatusSchema : brandStatusSchema).safeParse(status).success
      if (!ok) {return NextResponse.json({ error: 'Invalid status for this lead type' }, { status: 400 })}
    }

    const supabase = createServerSupabase()
    if (owner_user_id) {
      const team = await loadTeam(supabase)
      if (!team.some((t) => t.user_id === owner_user_id && t.is_active)) {
        return NextResponse.json({ error: 'Owner must be an active team member' }, { status: 400 })
      }
    }
    const { assignment } = await outreachFeatures(supabase)

    // After the assignment migration the owner moves through
    // outreach_assign_leads() (assigned_at / assigned_by, one owner_changed
    // row per lead with old -> new). Before it, the old plain update below.
    let assigned: number | null = null
    if (owner_user_id !== undefined && assignment) {
      try {
        assigned = (await assignLeads(supabase, leadType, lead_ids, owner_user_id ?? null, caller.userId)).updated
      } catch (assignError) {
        const mapped = mapDbError(assignError as { message?: string; code?: string })
        if (mapped) {return NextResponse.json({ error: mapped.message }, { status: mapped.status })}
        throw assignError
      }
      if (status === undefined) {
        logAdminAction({
          request, adminId: caller.userId, action: 'outreach_bulk_update', targetType: `outreach_${leadType}`,
          targetId: `${assigned} leads`, reason, before: null, after: { owner_user_id, lead_ids },
        })
        return NextResponse.json({ message: `${assigned} leads updated`, updated: assigned })
      }
    }

    const updates: Record<string, unknown> = {}
    if (owner_user_id !== undefined && !assignment) {updates.owner_user_id = owner_user_id}
    if (status !== undefined) {
      updates.status = status
      if (status !== 'contacted') {updates.follow_up_date = null}
    }

    const { data, error } = await supabase
      .from(leadTable(leadType))
      .update(updates)
      .in('lead_id', lead_ids)
      .is('deleted_at', null)
      .select(leadType === 'creator' ? 'lead_id, email_norm, profile_url_norm' : 'lead_id, email_norm')
    if (error) {
      captureError(error, { route: 'POST /api/admin/outreach/leads/bulk' })
      return NextResponse.json({ error: 'Failed to update leads' }, { status: 500 })
    }
    const updated = (data ?? []) as unknown as { lead_id: string; email_norm: string | null; profile_url_norm?: string | null }[]

    const activity = updated.flatMap((l) => [
      ...(status !== undefined ? [{ lead_type: leadType, lead_id: l.lead_id, user_id: caller.userId, action: 'status_changed' }] : []),
      ...(owner_user_id !== undefined && !assignment ? [{ lead_type: leadType, lead_id: l.lead_id, user_id: caller.userId, action: 'owner_changed' }] : []),
    ])
    if (activity.length > 0) {await supabase.from('outreach_activity').insert(activity)}

    // Opting out in bulk blocks the same keys a one-click opt-out does.
    if (status === 'opted_out') {
      const dnc = updated.flatMap((l) => [
        ...(l.email_norm ? [{ key_type: 'email', key_value: l.email_norm }] : []),
        ...(l.profile_url_norm ? [{ key_type: 'profile_url', key_value: l.profile_url_norm }] : []),
      ]).map((d) => ({ ...d, reason: 'opted_out', created_by: caller.userId }))
      if (dnc.length > 0) {
        await supabase.from('outreach_dnc').upsert(dnc, { onConflict: 'key_type,key_value', ignoreDuplicates: true })
      }
    }

    // Set to Interested in bulk: the Interested rule applies too, unless an
    // owner was picked in the same change.
    if (status !== undefined && owner_user_id === undefined && assignment) {
      await applyInterestedRule(supabase, leadType, updated.map((l) => l.lead_id), status, caller.userId)
    }

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_bulk_update', targetType: `outreach_${leadType}`,
      targetId: `${updated.length} leads`, reason, before: null,
      after: { ...updates, ...(owner_user_id !== undefined ? { owner_user_id } : {}), lead_ids: updated.map((l) => l.lead_id) },
    })

    const count = Math.max(updated.length, assigned ?? 0)
    return NextResponse.json({ message: `${count} leads updated`, updated: count })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/leads/bulk' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
