import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data: before } = await supabase
      .from('contact_messages')
      .select('id, name, email, subject')
      .eq('id', id)
      .single()
    if (!before) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id)

    if (error) { throw error }

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'contact_submission_deleted',
      targetType: 'contact_message',
      targetId: id,
      reason: reasonCheck.reason,
      before,
      after: null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    captureError(error, { route: 'POST /api/admin/contact-submissions/delete' })
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
