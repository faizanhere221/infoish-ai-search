import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { teamCreateSchema } from '@/lib/outreach/schemas'
import { getOutreachCaller, loadTeam, superAdminOnly, unauthorized } from '@/lib/outreach/server'

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

// POST (super admin): add a team member. A new email gets a users row
// (user_type 'admin', role 'outreach' or 'admin') with a temporary password
// and must_change_password = true. An existing admin/outreach account is
// added to the team as is (its role stays; change roles in /admin/admins).
export async function POST(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isSuperAdmin) {return superAdminOnly()}

  try {
    const parsed = teamCreateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { email, display_name, role, temp_password, works_saturday, creators_monthly_target, brands_monthly_target, reason } = parsed.data

    const supabase = createServerSupabase()
    const { data: existing } = await supabase.from('users').select('id, role').eq('email', email).maybeSingle()

    let userId: string
    let created = false
    if (existing) {
      if (!['admin', 'super_admin', 'outreach'].includes(existing.role)) {
        return NextResponse.json({ error: 'This email belongs to a creator or brand account. Use a different email.' }, { status: 409 })
      }
      const { data: member } = await supabase.from('outreach_team').select('user_id').eq('user_id', existing.id).maybeSingle()
      if (member) {return NextResponse.json({ error: 'Already on the team' }, { status: 409 })}
      userId = existing.id
    } else {
      if (!temp_password) {
        return NextResponse.json({ error: 'Set a temporary password (at least 10 characters) for the new account' }, { status: 400 })
      }
      const password_hash = await bcrypt.hash(temp_password, 12)
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email,
          password_hash,
          user_type: 'admin',
          role,
          is_active: true,
          email_verified: true,
          must_change_password: true,
        })
        .select('id')
        .single()
      if (error || !user) {
        captureError(error ?? new Error('team create: no user row'), { route: 'POST /api/admin/outreach/team' })
        return NextResponse.json({ error: 'Failed to create the account' }, { status: 500 })
      }
      userId = user.id
      created = true
    }

    const { error: teamError } = await supabase.from('outreach_team').insert({
      user_id: userId, display_name, works_saturday, creators_monthly_target, brands_monthly_target,
    })
    if (teamError) {
      if (created) {await supabase.from('users').delete().eq('id', userId)}
      captureError(teamError, { route: 'POST /api/admin/outreach/team' })
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
    }

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_team_member_added', targetType: 'user', targetId: userId,
      reason, before: null, after: { email, display_name, role: created ? role : existing?.role, new_account: created },
    })
    return NextResponse.json({
      message: created
        ? 'Team member added. Share the temporary password with them. They set a new one on first login.'
        : 'Existing account added to the team.',
      user_id: userId,
    }, { status: 201 })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/team' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
