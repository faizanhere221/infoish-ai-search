import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { adminOnly, getOutreachCaller, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// DELETE (admin): remove a DNC entry. Requires a reason.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}

  try {
    const reasonCheck = requireReason(await request.json().catch(() => null))
    if (!reasonCheck.ok) {return NextResponse.json({ error: reasonCheck.error }, { status: 400 })}

    const supabase = createServerSupabase()
    const { data, error } = await supabase.from('outreach_dnc').delete().eq('id', params.id).select('*').maybeSingle()
    if (error) {
      captureError(error, { route: 'DELETE /api/admin/outreach/dnc/[id]' })
      return NextResponse.json({ error: 'Failed to remove entry' }, { status: 500 })
    }
    if (!data) {return NextResponse.json({ error: 'Entry not found' }, { status: 404 })}

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_dnc_removed', targetType: 'outreach_dnc',
      targetId: params.id, reason: reasonCheck.reason, before: data, after: null,
    })
    return NextResponse.json({ message: 'Removed from the do-not-contact list' })
  } catch (err) {
    captureError(err, { route: 'DELETE /api/admin/outreach/dnc/[id]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
