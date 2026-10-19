import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

// GET /api/admin/users/export — the real server-side export (up to 10,000
// rows, not just whatever page is loaded in the table). Exporting a bulk
// user list counts as "every admin view of sensitive data" per
// instruction, so it's logged (no reason needed for a read).
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)
    const callerRole = request.headers.get('x-user-role') ?? 'user'
    const search = searchParams.get('search') ?? ''
    const userType = searchParams.get('user_type') ?? ''
    const status   = searchParams.get('status')    ?? 'all'

    if (status === 'deleted' && callerRole !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
    }

    let query = supabase
      .from('users')
      .select('id, email, user_type, is_active, deleted_at, email_verified, role, created_at, last_login_at')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (search) {query = query.ilike('email', `%${search}%`)}
    if (userType) {query = query.eq('user_type', userType)}
    // Deleted accounts are excluded from every export by default — only
    // the super_admin-only status=deleted view (gated above) includes them.
    if (status === 'deleted') {
      query = query.not('deleted_at', 'is', null)
    } else {
      query = query.is('deleted_at', null)
      if (status === 'active')    {query = query.eq('is_active', true)}
      if (status === 'suspended') {query = query.eq('is_active', false)}
    }

    const { data: users, error } = await query
    if (error) {throw error}

    void logActivity({
      userId: request.headers.get('x-user-id'),
      action: 'users_exported',
      entityType: 'user',
      details: { count: users?.length ?? 0, search, user_type: userType, status },
    })

    const headers = ['ID', 'Email', 'Type', 'Status', 'Verified', 'Role', 'Created', 'Last Login']
    const rows = (users ?? []).map(u => [
      u.id,
      u.email,
      u.user_type,
      u.deleted_at ? 'deleted' : u.is_active ? 'active' : 'suspended',
      u.email_verified ? 'yes' : 'no',
      u.role ?? 'user',
      u.created_at ? new Date(u.created_at).toISOString() : '',
      u.last_login_at ? new Date(u.last_login_at).toISOString() : '',
    ])

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/users/export' })
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
