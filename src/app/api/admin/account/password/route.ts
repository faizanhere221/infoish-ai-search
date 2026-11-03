import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { rateLimit } from '@/lib/rate-limit'
import { logActivity } from '@/lib/activity'
import { setAdminSessionCookie, signAdminSession } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const schema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(10, 'Use at least 10 characters').max(200),
})

// POST /api/admin/account/password: any admin-login account (admin,
// super_admin, outreach) sets a new password. The one route middleware
// allows for a token carrying mustChangePassword. Re-issues the session
// cookie without that claim.
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { allowed } = await rateLimit(`admin-password:${userId}`, 5, 15 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
    }

    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { current_password, new_password } = parsed.data
    if (current_password === new_password) {
      return NextResponse.json({ error: 'Choose a password different from the temporary one' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, user_type, role, password_hash, is_active')
      .eq('id', userId)
      .single()
    if (error || !user || !user.is_active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const valid = await bcrypt.compare(current_password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is wrong' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(new_password, 12)
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash, must_change_password: false, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (updateError) {
      captureError(updateError, { route: 'POST /api/admin/account/password' })
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    void logActivity({
      userId,
      action: 'admin_password_changed',
      entityType: 'user',
      entityId: userId,
      details: { email: user.email },
    })

    const token = signAdminSession({ ...user, must_change_password: false })
    const response = NextResponse.json({ message: 'Password updated', role: user.role })
    setAdminSessionCookie(response, token)
    return response
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/account/password' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
