import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { teamUpdateSchema } from '@/lib/outreach/schemas'
import { adminOnly, getOutreachCaller, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// PATCH (admin): name, working days, monthly targets, DM warning, active.
export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}

  try {
    const parsed = teamUpdateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const updates = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined))
    if (Object.keys(updates).length === 0) {return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })}

    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('outreach_team')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', params.userId)
      .select('*')
      .maybeSingle()
    if (error) {
      captureError(error, { route: 'PATCH /api/admin/outreach/team/[userId]' })
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
    }
    if (!data) {return NextResponse.json({ error: 'Team member not found' }, { status: 404 })}

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_team_member_updated', targetType: 'user',
      targetId: params.userId, reason: 'outreach team settings', after: updates,
    })
    return NextResponse.json({ member: data })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/outreach/team/[userId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
