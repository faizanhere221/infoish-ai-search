import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'

export const dynamic = 'force-dynamic'

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

    const adminId = request.headers.get('x-user-id')
    if (params.id === adminId) {
      return NextResponse.json({ error: 'You cannot suspend your own account' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { data: before } = await supabase
      .from('users')
      .select('id, email, is_active, deleted_at')
      .eq('id', params.id)
      .single()

    if (!before) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (before.deleted_at) {
      return NextResponse.json({ error: 'This user has already been deleted' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', params.id)
      .select('id, email, role')
      .single()

    if (error || !user) {
      captureError(error ?? new Error('suspend: no row'), { route: 'POST /api/admin/users/[id]/suspend' })
      return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
    }

    // Suspension is checked at login (and at the top of every JWT-verified
    // request that reads is_active server-side) — it does NOT invalidate a
    // JWT already issued before this moment. See docs/ADMIN_AUDIT.md for
    // why (stateless auth, no middleware change made here) and the options
    // for closing that window.
    logAdminAction({
      request,
      adminId,
      action: 'user_suspended',
      targetType: 'user',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { is_active: before.is_active },
      after: { is_active: false },
    })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/users/[id]/suspend' })
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
  }
}
