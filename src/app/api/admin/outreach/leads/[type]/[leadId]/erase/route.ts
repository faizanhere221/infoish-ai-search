import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { adminOnly, getOutreachCaller, leadTypeFromSegment, mapDbError, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { type: string; leadId: string } }

// POST (admin): "Delete personal data". outreach_erase_lead() puts the
// lead's email/profile URL on the DNC list first, then clears the personal
// fields. The lead id, status and stats stay.
export async function POST(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}
  const leadType = leadTypeFromSegment(params.type)
  if (!leadType) {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  try {
    const body = await request.json().catch(() => null)
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {return NextResponse.json({ error: reasonCheck.error }, { status: 400 })}

    const supabase = createServerSupabase()
    const { error } = await supabase.rpc('outreach_erase_lead', {
      p_lead_type: leadType, p_lead_id: params.leadId, p_user_id: caller.userId,
    })
    if (error) {
      const mapped = mapDbError(error)
      if (mapped) {return NextResponse.json({ error: mapped.message }, { status: mapped.status })}
      captureError(error, { route: 'POST /api/admin/outreach/leads/[leadId]/erase' })
      return NextResponse.json({ error: 'Failed to delete personal data' }, { status: 500 })
    }

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_lead_erased', targetType: `outreach_${leadType}`,
      targetId: params.leadId, reason: reasonCheck.reason,
    })
    return NextResponse.json({ message: 'Personal data deleted. The do-not-contact entry stays.' })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/leads/[leadId]/erase' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
