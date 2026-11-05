import { NextRequest, NextResponse } from 'next/server'

// Role checks for /api/admin/* routes. middleware.ts already limits these
// routes to admin, super_admin (and outreach, inside its own section), and
// injects a trusted x-user-role header. Actions that change who sees a
// marketplace account (hide/unhide, suspend/activate, delete), roles,
// impersonation, settings and admin management are super_admin only.

export function isSuperAdminRequest(request: NextRequest): boolean {
  return request.headers.get('x-user-role') === 'super_admin'
}

// Returns a 403 response for anyone but a super admin, or null to go on.
export function requireSuperAdmin(request: NextRequest): NextResponse | null {
  if (isSuperAdminRequest(request)) {return null}
  return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
}
