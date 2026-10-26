import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/admin/payments/[id]/note — purely internal: logged to
// activity_logs (shows up in the payment detail's History panel), never
// surfaced to the brand or creator, so this does NOT call emitEvent unlike
// resolve-dispute/cancel below.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data: payment } = await supabase.from('creator_payments').select('id').eq('id', params.id).single()
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'payment_note_added',
      targetType: 'payment',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: null,
      after: null,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/payments/[id]/note' })
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}
