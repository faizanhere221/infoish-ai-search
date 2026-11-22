// Live staff access. Staff powers (admin, super_admin, outreach) never come
// from the role inside a JWT alone: a token lives for hours (admin login)
// or days (normal login), and someone removed from the team, demoted or
// suspended must lose access on their very next request.
//
// middleware.ts calls loadLiveAccess() on every /api/admin/* request, every
// /admin/* page, and any request whose token claims a staff role, and then
// overwrites x-user-role with the LIVE role (or 'user'). So every route
// check that reads x-user-role (getOutreachCaller(), requireSuperAdmin(),
// the admin route pattern) is a live database check. /api/admin/auth/me and
// the /admin index page call it themselves.
//
// Edge-safe on purpose (middleware runs on the edge): plain fetch to
// PostgREST with the service-role key, no supabase-js, no Node APIs.

export const STAFF_ROLES = ['admin', 'super_admin', 'outreach'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

export interface LiveAccess {
  // The role that counts right now: the users.role value when the account
  // exists, is active and isn't deleted; otherwise 'user'.
  role: string
  isStaff: boolean
  active: boolean
}

// null = the lookup itself failed (network, config). Callers fail CLOSED for
// staff decisions: no staff access when we can't confirm it.
export async function loadLiveAccess(userId: string): Promise<LiveAccess | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || !userId) {return null}
  try {
    const res = await fetch(
      `${url}/rest/v1/users?select=role,is_active,deleted_at&id=eq.${encodeURIComponent(userId)}&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' },
    )
    if (!res.ok) {return null}
    const rows = (await res.json()) as { role: string | null; is_active: boolean | null; deleted_at: string | null }[]
    const row = rows[0]
    const active = !!row && row.is_active !== false && !row.deleted_at
    const role = active ? (row.role ?? 'user') : 'user'
    return { role, isStaff: isStaffRole(role), active }
  } catch {
    return null
  }
}
