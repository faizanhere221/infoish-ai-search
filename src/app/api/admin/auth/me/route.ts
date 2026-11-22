import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { ADMIN_LOGIN_ROLES } from '@/lib/admin-session'
import { loadLiveAccess } from '@/lib/staff-access'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/admin/auth/me: who the CURRENT admin session belongs to.
// /api/admin/auth/* is on middleware's public list (so this answers for
// outreach and must-change-password tokens too), which means middleware
// injects no identity headers here: the route verifies the auth_token
// cookie itself, the same way middleware does. The admin header, sidebar
// and every role-based button read this, never localStorage.
export async function GET(request: NextRequest) {
  const secret = process.env.JWT_SECRET
  const token = request.cookies.get('auth_token')?.value
  if (!secret || !token) {return NextResponse.json({ error: 'Not signed in' }, { status: 401 })}

  let payload: Record<string, unknown>
  try {
    payload = (await jwtVerify(token, new TextEncoder().encode(secret))).payload as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const userId = payload.userId ? String(payload.userId) : ''
  if (!userId || !(ADMIN_LOGIN_ROLES as readonly string[]).includes(String(payload.role ?? ''))) {
    return NextResponse.json({ error: 'Not an admin session' }, { status: 401 })
  }

  // The token only says who this is. Whether they are still staff, and as
  // what, is the live users row (src/lib/staff-access.ts).
  const live = await loadLiveAccess(userId)
  if (!live) {
    return NextResponse.json({ error: 'Could not check your access. Try again.', code: 'staff_check_failed' }, { status: 503 })
  }
  if (!live.isStaff) {
    return NextResponse.json({ error: 'You no longer have access.', code: 'no_staff_access' }, { status: 403 })
  }
  const role = live.role

  try {
    const supabase = createServerSupabase()
    const [{ data: user, error }, { data: member }] = await Promise.all([
      supabase.from('users').select('id, email, is_active, deleted_at').eq('id', userId).maybeSingle(),
      supabase.from('outreach_team').select('display_name').eq('user_id', userId).maybeSingle(),
    ])
    if (error) {throw error}
    // The account was removed or suspended after this token was issued.
    if (!user || user.deleted_at || user.is_active === false) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const email = String(payload.email ?? user.email ?? '')
    return NextResponse.json({
      user: {
        id: userId,
        email,
        // The live role: what middleware enforces on every staff request.
        role,
        display_name: (member?.display_name as string | undefined) ?? null,
        must_change_password: payload.mustChangePassword === true,
      },
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/auth/me' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
