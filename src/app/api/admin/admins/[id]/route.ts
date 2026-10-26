import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function isSuperAdmin(request: NextRequest) {
  return request.headers.get('x-user-role') === 'super_admin'
}

// is_active is rejected here: use POST /api/admin/users/[userId]/activate or
// /suspend (the same one path every user type, admins included, goes
// through). Only role is handled directly — there's no dedicated endpoint
// for it elsewhere, and demoting the last super_admin is blocked the same
// way deleting the last super_admin is blocked in users/[id]/route.ts.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  const adminId = request.headers.get('x-user-id')
  if (params.id === adminId) {
    return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({}))

    if ('is_active' in body) {
      return NextResponse.json(
        { error: 'is_active must be changed via the user-level /activate or /suspend endpoint, not this generic PATCH.' },
        { status: 400 }
      )
    }

    if (!('role' in body) || !['admin', 'super_admin'].includes(String(body.role))) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    const role = body.role as string

    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { data: before } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', params.id)
      .in('role', ['admin', 'super_admin'])
      .single()

    if (!before) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (before.role === 'super_admin' && role !== 'super_admin') {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('is_active', true)
        .neq('id', params.id)
      if (!count) {
        return NextResponse.json({ error: 'Cannot demote the last active super admin' }, { status: 400 })
      }
    }

    const { data: admin, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', params.id)
      .select('id, email, role, is_active')
      .single()

    if (error || !admin) {
      captureError(error ?? new Error('admin update: no row returned'), { route: 'PATCH /api/admin/admins/[id]' })
      return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
    }

    logAdminAction({
      request,
      adminId,
      action: 'admin_updated',
      targetType: 'user',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { role: before.role },
      after: { role },
    })

    return NextResponse.json({ admin })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/admins/[id]' })
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
  }
}
