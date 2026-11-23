import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { ASSIGN_SETTING_KEYS } from '@/lib/outreach/rules'
import { NEEDS_ASSIGNMENT_MIGRATION, outreachFeatures } from '@/lib/outreach/schema'
import { teamRemoveSchema, teamUpdateSchema } from '@/lib/outreach/schemas'
import {
  adminOnly, assignLeads, fetchAllRows, getOutreachCaller, leadTable, superAdminOnly, unauthorized,
} from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Params = { params: { userId: string } }

// PATCH (admin): name, working days, monthly targets, DM warning.
// role (super admin): 'outreach' <-> 'admin'. Never a super_admin's role,
// never your own. Logged to the admin activity log with before / after.
// (Removing someone is DELETE below; adding / re-adding is POST /team.)
export async function PATCH(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isAdmin) {return adminOnly()}

  try {
    const parsed = teamUpdateSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { role, reason, ...rest } = parsed.data
    const updates = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined))
    if (Object.keys(updates).length === 0 && role === undefined) {return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })}

    const supabase = createServerSupabase()
    const { data: member, error: memberError } = await supabase.from('outreach_team').select('user_id').eq('user_id', params.userId).maybeSingle()
    if (memberError) {throw memberError}
    if (!member) {return NextResponse.json({ error: 'Team member not found' }, { status: 404 })}

    if (role !== undefined) {
      if (!caller.isSuperAdmin) {return superAdminOnly()}
      if (params.userId === caller.userId) {return NextResponse.json({ error: 'You can not change your own role' }, { status: 400 })}
      if (!reason) {return NextResponse.json({ error: 'Give a reason for the role change', fields: { reason: ['Required'] } }, { status: 400 })}
      const { data: user, error: userError } = await supabase.from('users').select('role').eq('id', params.userId).maybeSingle()
      if (userError) {throw userError}
      if (!user) {return NextResponse.json({ error: 'Team member not found' }, { status: 404 })}
      if (!['outreach', 'admin'].includes(user.role)) {
        return NextResponse.json({ error: 'Only outreach and admin roles change here' }, { status: 409 })
      }
      if (user.role !== role) {
        const { data: changed, error: roleError } = await supabase
          .from('users').update({ role, updated_at: new Date().toISOString() })
          .eq('id', params.userId).eq('role', user.role).select('id')
        if (roleError) {throw roleError}
        if (!changed || changed.length === 0) {
          return NextResponse.json({ error: 'This account changed in the meantime. Reload and try again.' }, { status: 409 })
        }
        logAdminAction({
          request, adminId: caller.userId, action: 'outreach_role_changed', targetType: 'user', targetId: params.userId,
          reason, before: { role: user.role }, after: { role },
        })
      }
    }

    let data: unknown = member
    if (Object.keys(updates).length > 0) {
      const res = await supabase
        .from('outreach_team')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', params.userId)
        .select('*')
        .maybeSingle()
      if (res.error) {
        captureError(res.error, { route: 'PATCH /api/admin/outreach/team/[userId]' })
        return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
      }
      data = res.data
      logAdminAction({
        request, adminId: caller.userId, action: 'outreach_team_member_updated', targetType: 'user',
        targetId: params.userId, reason: 'outreach team settings', after: updates,
      })
    }
    return NextResponse.json({
      member: data,
      message: role !== undefined
        ? `Role set to ${role}. It applies on their next request.`
        : 'Saved',
    })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/outreach/team/[userId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE (super admin): remove from the team, softly.
//   - the team row stays, is_active = false
//   - an outreach account: role back to 'user'. Its brand / creator account
//     and profile are untouched and keep working. Only an account with no
//     brand / creator profile at all is also deactivated (re-adding it on
//     the Team page brings it back). An admin / super admin keeps its role:
//     leaving the outreach team isn't leaving the admin.
//   - their leads stay and become unassigned (one owner_changed row each,
//     rule 'member_removed'), for an admin to reassign or auto-split
//   - default owner rules pointing at them are switched off
// Body: { reason }.
export async function DELETE(request: NextRequest, { params }: Params) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}
  if (!caller.isSuperAdmin) {return superAdminOnly()}

  try {
    const parsed = teamRemoveSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Give a reason', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    if (params.userId === caller.userId) {return NextResponse.json({ error: 'You can not remove yourself' }, { status: 400 })}

    const supabase = createServerSupabase()
    if (!(await outreachFeatures(supabase)).assignment) {return NextResponse.json(NEEDS_ASSIGNMENT_MIGRATION, { status: 409 })}

    const [{ data: member, error: memberError }, { data: user, error: userError }] = await Promise.all([
      supabase.from('outreach_team').select('user_id, display_name, is_active').eq('user_id', params.userId).maybeSingle(),
      supabase.from('users').select('role, is_active').eq('id', params.userId).maybeSingle(),
    ])
    if (memberError) {throw memberError}
    if (userError) {throw userError}
    if (!member) {return NextResponse.json({ error: 'Team member not found' }, { status: 404 })}

    // Their leads first: the assign function needs nothing from the team row,
    // and leaving the team before unassigning would hide no lead.
    let unassigned = 0
    for (const leadType of ['creator', 'brand'] as const) {
      const rows = await fetchAllRows<{ lead_id: string }>(
        (from, to) => supabase.from(leadTable(leadType)).select('lead_id')
          .eq('owner_user_id', params.userId).is('deleted_at', null).order('lead_id').range(from, to),
        100_000,
      )
      if (rows.length > 0) {
        unassigned += (await assignLeads(supabase, leadType, rows.map((r) => r.lead_id), null, caller.userId, 'member_removed')).updated
      }
    }

    const { error: teamError } = await supabase.from('outreach_team')
      .update({ is_active: false, updated_at: new Date().toISOString() }).eq('user_id', params.userId)
    if (teamError) {throw teamError}

    // The outreach role goes back to 'user'. A brand / creator account keeps
    // working exactly as before (user_type and profile rows are never
    // touched). Only an account with NO brand / creator profile is also
    // deactivated: it has nothing left to sign in to; re-adding it on the
    // Team page reactivates it.
    let deactivated = false
    if (user?.role === 'outreach') {
      const [creator, brand] = await Promise.all([
        supabase.from('creators').select('id').eq('user_id', params.userId).limit(1),
        supabase.from('brands').select('id').eq('user_id', params.userId).limit(1),
      ])
      if (creator.error) {throw creator.error}
      if (brand.error) {throw brand.error}
      deactivated = (creator.data ?? []).length === 0 && (brand.data ?? []).length === 0
      const { error: roleError } = await supabase.from('users')
        .update({ role: 'user', ...(deactivated ? { is_active: false } : {}), updated_at: new Date().toISOString() })
        .eq('id', params.userId).eq('role', 'outreach')
      if (roleError) {throw roleError}
      logAdminAction({
        request, adminId: caller.userId, action: 'outreach_role_changed', targetType: 'user', targetId: params.userId,
        reason: parsed.data.reason, before: { role: 'outreach', is_active: user.is_active },
        after: { role: 'user', is_active: deactivated ? false : user.is_active },
      })
    }

    // Rules pointing at them stop (imports then use the preview's owner).
    const { data: rules } = await supabase.from('outreach_settings').select('key, value').in('key', Object.values(ASSIGN_SETTING_KEYS))
    const pointing = (rules ?? []).filter((r) => r.value === params.userId).map((r) => r.key as string)
    if (pointing.length > 0) {
      // Off = no row (value is JSONB NOT NULL; a null upsert failed silently here).
      const { error: rulesError } = await supabase.from('outreach_settings').delete().in('key', pointing)
      if (rulesError) {captureError(rulesError, { route: 'DELETE /api/admin/outreach/team/[userId]', step: 'clear_owner_rules' })}
    }

    logAdminAction({
      request, adminId: caller.userId, action: 'outreach_team_member_removed', targetType: 'user', targetId: params.userId,
      reason: parsed.data.reason, before: { is_active: member.is_active, role: user?.role ?? null },
      after: { is_active: false, leads_unassigned: unassigned, rules_cleared: pointing, account_deactivated: deactivated },
    })
    const accountNote = user?.role !== 'outreach'
      ? ` Their ${user?.role ?? ''} role stays.`
      : deactivated ? ' Their account had no brand or creator profile, so it was deactivated.' : ' Their brand / creator account keeps working as before.'
    return NextResponse.json({
      message: `${member.display_name} removed. ${unassigned} leads are now unassigned.${pointing.length > 0 ? ' Their default owner rules were switched off.' : ''}${accountNote}`,
      unassigned,
      account_deactivated: deactivated,
    })
  } catch (err) {
    captureError(err, { route: 'DELETE /api/admin/outreach/team/[userId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
