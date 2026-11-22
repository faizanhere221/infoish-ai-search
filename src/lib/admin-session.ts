import jwt from 'jsonwebtoken'
import type { NextResponse } from 'next/server'
import type { createServerSupabase } from '@/lib/db'

// Admin-login sessions (admin, super_admin, outreach). Shared by
// /api/admin/auth/login and /api/admin/account/password, which re-issues the
// token without the mustChangePassword claim once a new password is set.
// middleware.ts reads both `role` and `mustChangePassword` from this token.

export const ADMIN_LOGIN_ROLES = ['admin', 'super_admin', 'outreach'] as const
const SESSION_SECONDS = 60 * 60 * 4

interface SessionUser {
  id: string
  email: string
  user_type: string
  role: string
  must_change_password?: boolean | null
  // Set for brand / creator accounts that also hold a staff role, so their
  // own dashboard keeps working while this cookie is the active session.
  profileId?: string | null
}

type Supabase = ReturnType<typeof createServerSupabase>

// The brand / creator profile id of an account, or null (admin-only
// accounts, or a brand / creator that hasn't created its profile yet).
// Same lookup as /api/auth/login.
export async function loadProfileId(supabase: Supabase, userId: string, userType: string): Promise<string | null> {
  const table = userType === 'creator' ? 'creators' : userType === 'brand' ? 'brands' : null
  if (!table) {return null}
  const { data } = await supabase.from(table).select('id').eq('user_id', userId).maybeSingle()
  return (data?.id as string | undefined) ?? null
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {throw new Error('JWT_SECRET is required')}
  return secret
}

export function signAdminSession(user: SessionUser): string {
  const claims: Record<string, unknown> = {
    userId: user.id,
    email: user.email,
    userType: user.user_type,
    role: user.role,
  }
  if (user.must_change_password) {claims.mustChangePassword = true}
  if (user.profileId) {claims.profileId = user.profileId}
  return jwt.sign(claims, getJwtSecret(), { expiresIn: SESSION_SECONDS })
}

export function setAdminSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_SECONDS,
    path: '/',
  })
}
