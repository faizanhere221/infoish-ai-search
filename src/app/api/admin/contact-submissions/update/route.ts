import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

// Not treated as a reason-worthy admin action (unlike suspend/delete/verify):
// this fires automatically when an admin opens or replies to a message, not
// from a deliberate confirm click, so a reason prompt would fire on every
// view. Still logged for an audit trail, just without requireReason().
export async function POST(request: NextRequest) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('contact_messages')
      .update({ is_read: status !== 'new' })
      .eq('id', id)

    if (error) { throw error }

    void logActivity({
      userId: request.headers.get('x-user-id'),
      action: 'contact_submission_updated',
      entityType: 'contact_message',
      entityId: id,
      details: { status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    captureError(error, { route: 'POST /api/admin/contact-submissions/update' })
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}
