import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'

// GET /api/admin/reports/[id] — detail. Opening an 'open' report moves it
// to 'reviewing' automatically (passive bookkeeping, like marking a
// contact message read on view — not a reason-worthy admin decision, so
// no requireReason()/logAdminAction here, just a plain logActivity entry).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const userIds = [report.reporter_user_id, report.reported_user_id]
    const { data: users } = await supabase.from('users').select('id, email, user_type, is_active').in('id', userIds)
    const userById = new Map((users ?? []).map((u) => [u.id, u]))
    const reportedUser = userById.get(report.reported_user_id)

    let reportedProfileName: string | null = null
    if (reportedUser?.user_type === 'creator') {
      const { data: profile } = await supabase.from('creators').select('display_name, username').eq('user_id', reportedUser.id).single()
      reportedProfileName = profile?.display_name ?? profile?.username ?? null
    } else if (reportedUser?.user_type === 'brand') {
      const { data: profile } = await supabase.from('brands').select('company_name').eq('user_id', reportedUser.id).single()
      reportedProfileName = profile?.company_name ?? null
    }

    if (report.status === 'open') {
      await supabase.from('reports').update({ status: 'reviewing' }).eq('id', params.id)
      report.status = 'reviewing'
      void logActivity({
        userId: request.headers.get('x-user-id'),
        action: 'report_reviewing',
        entityType: 'report',
        entityId: params.id,
        details: {},
      })
    }

    return NextResponse.json({
      report,
      reporter: userById.get(report.reporter_user_id) ?? null,
      reported: reportedUser ?? null,
      reportedProfileName,
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/reports/[id]' })
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
