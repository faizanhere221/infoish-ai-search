import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { bulkSchema, brandStatusSchema, creatorStatusSchema } from '@/lib/outreach/schemas'
import { adminOnly, getOutreachCaller, leadTable, leadTypeFromSegment, loadTeam, unauthorized } from '@/lib/outreach/server'

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
      if (!team.some((t) => t.user_id === owner_user_id)) {
        return NextResponse.json({ error: 'Owner must be a team member' }, { status: 400 })
      }
    }

    const updates: Record<string, unknown> = {}
    if (owner_user_id !== undefined) {updates.owner_user_id = owner_user_id}
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
      ...(owner_user_id !== undefined ? [{ lead_type: leadType, lead_id: l.lead_id, user_id: caller.userId, action: 'owner_changed' }] : []),
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

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_bulk_update', targetType: `outreach_${leadType}`,
      targetId: `${updated.length} leads`, reason, before: null, after: { ...updates, lead_ids: updated.map((l) => l.lead_id) },
    })

    return NextResponse.json({ message: `${updated.length} leads updated`, updated: updated.length })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/leads/bulk' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
