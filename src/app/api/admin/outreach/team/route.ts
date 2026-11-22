import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { teamCreateSchema } from '@/lib/outreach/schemas'
import { getOutreachCaller, loadTeam, superAdminOnly, unauthorized } from '@/lib/outreach/server'
import { checkAccount } from '@/lib/outreach/team'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET: the outreach team (names for owner pickers, targets) plus who the
// caller is. Everyone on the team sees it; only admins edit it.
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const supabase = createServerSupabase()
    const team = await loadTeam(supabase)
    return NextResponse.json({
      team,
      me: { user_id: caller.userId, role: caller.role, is_admin: caller.isAdmin, is_super_admin: caller.isSuperAdmin },
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/team' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST (super admin): add a team member. Only an EXISTING account, found by
// email; no account or password is ever created here (see
// src/lib/outreach/team.ts). Any active account can join, whatever its
// user_type or profile: role 'user' becomes 'outreach'; an admin / super
// admin / outreach account keeps its role. Only users.role (and, for an
// account this page deactivated on removal, is_active) changes; user_type
// and brand / creator rows are never touched, so a brand or creator keeps
// using its own dashboard. A removed member comes back the same way (their
// team row is reactivated). Role changes go to the admin activity log.
export async function POST(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isSuperAdmin) {return superAdminOnly()}

  try {
    const parsed = teamCreateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { email, display_name, works_saturday, creators_monthly_target, brands_monthly_target, reason } = parsed.data

    const supabase = createServerSupabase()
    const check = await checkAccount(supabase, email)
    if (!check.ok) {return NextResponse.json({ error: check.error, account: check.account ?? null }, { status: check.status })}
    const { account, promote, reactivate } = check

    if (promote || reactivate) {
      // Guarded on the current role, so a concurrent change can't be overwritten.
      const { data: promoted, error: promoteError } = await supabase
        .from('users')
        .update({
          ...(promote ? { role: 'outreach' } : {}),
          ...(reactivate ? { is_active: true } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.user_id)
        .eq('role', account.role)
        .select('id')
      if (promoteError) {throw promoteError}
      if (!promoted || promoted.length === 0) {
        return NextResponse.json({ error: 'This account changed while you were adding it. Reload and try again.' }, { status: 409 })
      }
    }

    const team = { display_name, works_saturday, creators_monthly_target, brands_monthly_target, is_active: true, updated_at: new Date().toISOString() }
    const { error: teamError } = account.on_team
      ? await supabase.from('outreach_team').update(team).eq('user_id', account.user_id)
      : await supabase.from('outreach_team').insert({ user_id: account.user_id, ...team })
    if (teamError) {
      if (promote || reactivate) {
        await supabase.from('users').update({ role: account.role, is_active: account.is_active }).eq('id', account.user_id)
      }
      captureError(teamError, { route: 'POST /api/admin/outreach/team' })
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
    }

    if (promote || reactivate) {
      logAdminAction({
        request, adminId: caller.userId, action: 'outreach_role_changed', targetType: 'user', targetId: account.user_id, reason,
        before: { role: account.role, is_active: account.is_active },
        after: { role: promote ? 'outreach' : account.role, is_active: true },
      })
    }
    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_team_member_added', targetType: 'user', targetId: account.user_id,
      reason, before: null,
      after: { email: account.email, display_name, role: promote ? 'outreach' : account.role, account: account.account_label, rejoined: account.on_team },
    })
    const hasOwnArea = account.user_type === 'brand' || account.user_type === 'creator'
    return NextResponse.json({
      message: promote
        ? `${display_name} is now an outreach team member. They open the outreach section at /admin/login with their own password${hasOwnArea ? `, and keep using their ${account.user_type} account as before` : ''}.`
        : `${display_name} joined the team as ${account.role}.`,
      user_id: account.user_id,
    }, { status: 201 })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/team' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
