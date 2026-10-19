import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { revalidatePublicSurfacesForUser } from '@/lib/creators/revalidate'

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
      return NextResponse.json({ error: 'This user has been deleted and cannot be reactivated' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', params.id)
      .select('id, email, role')
      .single()

    if (error || !user) {
      captureError(error ?? new Error('activate: no row'), { route: 'POST /api/admin/users/[id]/activate' })
      return NextResponse.json({ error: 'Failed to activate user' }, { status: 500 })
    }

    await revalidatePublicSurfacesForUser(supabase, params.id)

    logAdminAction({
      request,
      adminId,
      action: 'user_activated',
      targetType: 'user',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { is_active: before.is_active },
      after: { is_active: true },
    })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/users/[id]/activate' })
    return NextResponse.json({ error: 'Failed to activate user' }, { status: 500 })
  }
}
