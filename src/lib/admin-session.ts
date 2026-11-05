import jwt from 'jsonwebtoken'
import type { NextResponse } from 'next/server'

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
