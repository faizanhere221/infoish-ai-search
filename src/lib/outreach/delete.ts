import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { leadIdsSchema } from '@/lib/outreach/schemas'
import { adminOnly, getOutreachCaller, leadTypeFromSegment, mapDbError, unauthorized } from '@/lib/outreach/server'

// Soft delete and restore (admin only). The rows stay, so their keys keep
// blocking duplicates and appear in already_in_sheet.txt, and their
// activity keeps dashboard stats unchanged. outreach_delete_leads() /
// outreach_restore_leads() log one 'deleted' / 'restored' activity row per
// lead and skip leads already in that state, so a retry changes nothing.

export async function setLeadsDeleted(
  request: NextRequest,
  segment: string,
  deleted: boolean,
): Promise<NextResponse> {
  const route = `POST /api/admin/outreach/leads/${deleted ? 'delete' : 'restore'}`
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}
  const leadType = leadTypeFromSegment(segment)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const parsed = leadIdsSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const ids = [...new Set(parsed.data.lead_ids)]

    const supabase = createServerSupabase()
    const { data, error } = await supabase.rpc(deleted ? 'outreach_delete_leads' : 'outreach_restore_leads', {
      p_lead_type: leadType,
      p_lead_ids: ids,
      p_user_id: caller.userId,
    })
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {return NextResponse.json({ error: mapped.message }, { status: mapped.status })}
      captureError(error, { route })
      return NextResponse.json({ error: deleted ? 'Failed to delete leads' : 'Failed to restore leads' }, { status: 500 })
    }

    const count = Number(data ?? 0)
    const noun = count === 1 ? 'lead' : 'leads'
    return NextResponse.json({
      message: deleted ? `${count} ${noun} deleted` : `${count} ${noun} restored`,
      [deleted ? 'deleted' : 'restored']: count,
      skipped: ids.length - count,
    })
  } catch (err) {
    captureError(err, { route })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
