import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { mailboxUpdateSchema } from '@/lib/outreach/schemas'
import { adminOnly, getOutreachCaller, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// PATCH (admin): edit a mailbox (owner, start date, personal, active,
// custom limit). Mailboxes are paused, not deleted, so history stays.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}

  try {
    const parsed = mailboxUpdateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const updates = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined))
    if (Object.keys(updates).length === 0) {return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })}

    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('outreach_mailboxes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('*')
      .maybeSingle()
    if (error) {
      if (error.code === '23505') {return NextResponse.json({ error: 'This mailbox already exists' }, { status: 409 })}
      captureError(error, { route: 'PATCH /api/admin/outreach/mailboxes/[id]' })
      return NextResponse.json({ error: 'Failed to update mailbox' }, { status: 500 })
    }
    if (!data) {return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })}

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_mailbox_updated', targetType: 'outreach_mailbox',
      targetId: params.id, reason: 'mailbox updated', after: updates,
    })
    return NextResponse.json({ mailbox: data })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/outreach/mailboxes/[id]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
