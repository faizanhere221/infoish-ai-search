import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { logActivity } from '@/lib/activity'

function isSuperAdmin(request: NextRequest) {
  return request.headers.get('x-user-role') === 'super_admin'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  const adminId = request.headers.get('x-user-id') ?? undefined
  if (params.id === adminId) {
    return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const supabase = createServerSupabase()

    const ALLOWED = new Set(['role', 'is_active'])
    const updates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k)) updates[k] = v
    }

    if ('role' in updates && !['admin', 'super_admin'].includes(String(updates.role))) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    const { data: admin, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', params.id)
      .in('role', ['admin', 'super_admin'])
      .select('id, email, role, is_active')
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    void logActivity({
      userId: adminId,
      action: updates.is_active === false ? 'admin_revoked' : 'admin_updated',
      entityType: 'user',
      entityId: params.id,
      details: { updates, email: admin.email },
    })

    return NextResponse.json({ admin })
  } catch (err) {
    console.error('Update admin error:', err)
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
  }
}
