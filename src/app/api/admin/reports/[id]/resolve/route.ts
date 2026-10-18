import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { emitEvent } from '@/lib/events/emit'

const VALID_ACTIONS = ['warned', 'suspended', 'dismissed']

// POST /api/admin/reports/[id]/resolve — action is one of:
//  - 'warned': sends the reported user an 'admin_warning' notification here.
//  - 'suspended': does NOT suspend here — the admin UI calls the existing,
//    already-logged POST /api/admin/users/[userId]/suspend first (the one
//    path every suspension goes through, per Phase 7A), then this route
//    just records that outcome on the report.
//  - 'dismissed': no side effect, just records the outcome.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    if (!VALID_ACTIONS.includes(body.action)) {
      return NextResponse.json({ error: `action must be one of: ${VALID_ACTIONS.join(', ')}` }, { status: 400 })
    }
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { data: before } = await supabase.from('reports').select('*').eq('id', params.id).single()
    if (!before) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    if (before.status === 'resolved' || before.status === 'dismissed') {
      return NextResponse.json({ error: `This report is already ${before.status}` }, { status: 400 })
    }

    const adminId = request.headers.get('x-user-id')

    if (body.action === 'warned') {
      await emitEvent(supabase, {
        type: 'admin_warning',
        actorUserId: adminId ?? '',
        recipientUserIds: [before.reported_user_id],
        data: { note: reasonCheck.reason },
      })
    }

    const newStatus = body.action === 'dismissed' ? 'dismissed' : 'resolved'

    const { data: report, error } = await supabase
      .from('reports')
      .update({
        status: newStatus,
        admin_id: adminId,
        resolution_action: body.action,
        resolution_note: reasonCheck.reason,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !report) {
      captureError(error ?? new Error('report resolve: no row returned'), { route: 'POST /api/admin/reports/[id]/resolve' })
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    logAdminAction({
      request,
      adminId,
      action: 'report_resolved',
      targetType: 'report',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { status: before.status },
      after: { status: newStatus, resolution_action: body.action },
    })

    return NextResponse.json({ report })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/reports/[id]/resolve' })
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }
}
