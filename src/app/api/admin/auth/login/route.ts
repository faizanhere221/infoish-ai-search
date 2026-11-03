import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { rateLimit } from '@/lib/rate-limit'
import { logActivity } from '@/lib/activity'
import { ADMIN_LOGIN_ROLES, setAdminSessionCookie, signAdminSession } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, retryAfterMs } = await rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    // Identical error message to prevent user enumeration
    const invalid = () => NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    if (error || !user) {return invalid()}
    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    const role: string = user.role ?? 'user'
    if (!(ADMIN_LOGIN_ROLES as readonly string[]).includes(role)) {
      return invalid()
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {return invalid()}

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    const token = signAdminSession({ ...user, role })

    void logActivity({
      userId: user.id,
      action: 'admin_login',
      entityType: 'user',
      entityId: user.id,
      details: { email: user.email, role },
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    const { password_hash: _, ...safeUser } = user
    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: { ...safeUser, role },
      must_change_password: user.must_change_password === true,
    })

    setAdminSessionCookie(response, token)

    return response
  } catch (err) {
    console.error('Admin login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
