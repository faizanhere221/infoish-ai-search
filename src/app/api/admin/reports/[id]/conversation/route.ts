import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'

export const dynamic = 'force-dynamic'

// GET /api/admin/reports/[id]/conversation — the ONLY way an admin can
// read conversation content: reached from a report that has a
// conversation_id, never a general conversation browser (per
// instruction — "otherwise no conversation browsing"). Logged with the
// report id, every time, since this is the most sensitive read in the
// whole admin area.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: report } = await supabase.from('reports').select('id, conversation_id').eq('id', params.id).single()
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    if (!report.conversation_id) {
      return NextResponse.json({ error: 'This report has no associated conversation' }, { status: 404 })
    }

    const [{ data: conversation }, { data: messages }] = await Promise.all([
      supabase.from('conversations').select('id, creator_id, brand_id, created_at').eq('id', report.conversation_id).single(),
      supabase.from('messages').select('id, sender_id, content, is_system, created_at').eq('conversation_id', report.conversation_id).order('created_at', { ascending: true }),
    ])

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const [{ data: creator }, { data: brand }] = await Promise.all([
      supabase.from('creators').select('display_name, username').eq('id', conversation.creator_id).single(),
      supabase.from('brands').select('company_name').eq('id', conversation.brand_id).single(),
    ])

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'report_conversation_opened',
      targetType: 'report',
      targetId: params.id,
      reason: 'Opened conversation attached to this report',
      before: null,
      after: { conversation_id: report.conversation_id },
    })

    return NextResponse.json({
      conversation,
      messages: messages ?? [],
      creatorName: creator?.display_name ?? creator?.username ?? null,
      brandName: brand?.company_name ?? null,
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/reports/[id]/conversation' })
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
  }
}
