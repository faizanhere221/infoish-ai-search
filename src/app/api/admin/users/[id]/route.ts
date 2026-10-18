import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, user_type, role, is_active, email_verified, created_at, last_login_at, deleted_at')
      .eq('id', params.id)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch profile
    let profile: Record<string, unknown> | null = null
    if (user.user_type === 'creator') {
      const { data } = await supabase
        .from('creators')
        .select('id, username, display_name, country, niches, total_followers, avg_rating, completed_deals, verification_status, is_available')
        .eq('user_id', user.id)
        .single()
      profile = data
    } else if (user.user_type === 'brand') {
      const { data } = await supabase
        .from('brands')
        .select('id, company_name, company_website, industry, company_size, country, total_deals, total_spent, verification_status')
        .eq('user_id', user.id)
        .single()
      profile = data
    }

    // Fetch recent deals
    let deals: unknown[] = []
    if (profile?.id) {
      const field = user.user_type === 'creator' ? 'creator_id' : 'brand_id'
      const { data } = await supabase
        .from('deals')
        .select('id, title, status, amount, currency, created_at')
        .eq(field, String(profile.id))
        .order('created_at', { ascending: false })
        .limit(5)
      deals = data ?? []
    }

    return NextResponse.json({ user, profile, deals })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/users/[id]' })
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PATCH — is_active is deliberately rejected here: use the dedicated,
// logged /activate or /suspend routes instead (so "suspend a user" has
// exactly one path, not this generic PATCH as a second, unlogged one).
// role changes stay here (no dedicated route exists for just that) but now
// require a reason and are logged.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const callerRole = request.headers.get('x-user-role') ?? 'user'
    const adminId = request.headers.get('x-user-id')
    const body = await request.json().catch(() => ({}))

    if ('is_active' in body) {
      return NextResponse.json(
        { error: 'Use POST /api/admin/users/[id]/activate or /suspend instead — this endpoint no longer accepts is_active directly.' },
        { status: 400 }
      )
    }

    if (!('role' in body)) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    if (callerRole !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
    }

    const newRole = body.role as string
    if (!['user', 'admin', 'super_admin'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role value' }, { status: 400 })
    }

    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const { data: before } = await supabase.from('users').select('id, email, role').eq('id', params.id).single()
    if (!before) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', params.id)
      .select('id, email, user_type, role, is_active')
      .single()

    if (error) {
      captureError(error, { route: 'PATCH /api/admin/users/[id]' })
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    logAdminAction({
      request,
      adminId,
      action: 'user_role_changed',
      targetType: 'user',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { role: before.role },
      after: { role: newRole },
    })

    return NextResponse.json({ user: data })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/users/[id]' })
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

interface BlockingCheck {
  blocked: boolean
  reasons: string[]
}

// "Unsettled payment" / "active contract" for a creator or brand profile —
// shared by the two branches below. An active contract is any non-void
// contract whose campaign_creators row hasn't reached a terminal state
// (completed/dropped); an unsettled payment is any creator_payments row
// that hasn't reached confirmed or cancelled. Legacy `deals` still open
// (not completed/cancelled/declined) count too — those are real
// commitments regardless of which flow created them.
async function checkDeletionBlockers(
  supabase: ReturnType<typeof createServerSupabase>,
  profileType: 'creator' | 'brand',
  profileId: string
): Promise<BlockingCheck> {
  const reasons: string[] = []

  let campaignCreatorRows: { id: string; status: string }[] = []
  if (profileType === 'creator') {
    const { data } = await supabase.from('campaign_creators').select('id, status').eq('creator_id', profileId)
    campaignCreatorRows = data ?? []
  } else {
    const { data: brandCampaigns } = await supabase.from('campaigns').select('id').eq('brand_id', profileId)
    const campaignIds = (brandCampaigns ?? []).map((c) => c.id)
    if (campaignIds.length > 0) {
      const { data } = await supabase.from('campaign_creators').select('id, status').in('campaign_id', campaignIds)
      campaignCreatorRows = data ?? []
    }
  }

  const rowIds = (campaignCreatorRows ?? []).map((r) => r.id as string)
  const activeRowIds = (campaignCreatorRows ?? [])
    .filter((r) => !['completed', 'dropped'].includes(r.status as string))
    .map((r) => r.id as string)

  if (rowIds.length > 0) {
    const { count: unsettledPayments } = await supabase
      .from('creator_payments')
      .select('id', { count: 'exact', head: true })
      .in('campaign_creator_id', rowIds)
      .not('status', 'in', '(confirmed,cancelled)')
    if ((unsettledPayments ?? 0) > 0) {
      reasons.push(`${unsettledPayments} unsettled payment(s) on the campaign workflow`)
    }
  }

  if (activeRowIds.length > 0) {
    const { count: activeContracts } = await supabase
      .from('campaign_contracts')
      .select('id', { count: 'exact', head: true })
      .in('campaign_creator_id', activeRowIds)
      .neq('status', 'void')
    if ((activeContracts ?? 0) > 0) {
      reasons.push(`${activeContracts} active contract(s) on an engagement that hasn't concluded`)
    }
  }

  const dealField = profileType === 'creator' ? 'creator_id' : 'brand_id'
  const { count: activeDeals } = await supabase
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq(dealField, profileId)
    .not('status', 'in', '(completed,cancelled,declined)')
  if ((activeDeals ?? 0) > 0) {
    reasons.push(`${activeDeals} active legacy deal(s)`)
  }

  return { blocked: reasons.length > 0, reasons }
}

// DELETE — super_admin only, reason required, logged. Soft-delete +
// anonymization, not a hard DELETE: email/name/avatar/payout methods are
// removed; everything else (messages, deliverables, payments, deals) stays
// — those are financial/audit records, not the deleted person's data to
// erase. Blocked entirely if the profile has an unsettled payment or an
// active contract (checkDeletionBlockers above), and blocked for
// self-deletion or deleting the last super_admin.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const callerRole = request.headers.get('x-user-role') ?? 'user'
    const adminId = request.headers.get('x-user-id')

    if (callerRole !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
    }
    if (params.id === adminId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { data: target } = await supabase
      .from('users')
      .select('id, email, user_type, role, deleted_at')
      .eq('id', params.id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (target.deleted_at) {
      return NextResponse.json({ error: 'This user has already been deleted' }, { status: 400 })
    }

    if (target.role === 'super_admin') {
      const { count: otherSuperAdmins } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .is('deleted_at', null)
        .neq('id', target.id)
      if ((otherSuperAdmins ?? 0) === 0) {
        return NextResponse.json({ error: 'Cannot delete the last super admin' }, { status: 400 })
      }
    }

    let profile: { id: string; name: string } | null = null
    if (target.user_type === 'creator') {
      const { data } = await supabase.from('creators').select('id, display_name, username').eq('user_id', target.id).single()
      if (data) {profile = { id: data.id, name: data.display_name }}
    } else if (target.user_type === 'brand') {
      const { data } = await supabase.from('brands').select('id, company_name').eq('user_id', target.id).single()
      if (data) {profile = { id: data.id, name: data.company_name }}
    }

    if (profile && (target.user_type === 'creator' || target.user_type === 'brand')) {
      const blockers = await checkDeletionBlockers(supabase, target.user_type, profile.id)
      if (blockers.blocked) {
        return NextResponse.json(
          { error: `Cannot delete: ${blockers.reasons.join('; ')}. Resolve these first.` },
          { status: 400 }
        )
      }
    }

    const anonymizedEmail = `deleted-${target.id}@deleted.invalid`
    const unusablePasswordHash = await bcrypt.hash(randomUUID(), 12)

    const { error: userError } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        email: anonymizedEmail,
        password_hash: unusablePasswordHash,
      })
      .eq('id', target.id)

    if (userError) {
      captureError(userError, { route: 'DELETE /api/admin/users/[id]' })
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    if (profile && target.user_type === 'creator') {
      await supabase
        .from('creators')
        .update({ display_name: 'Deleted user', username: `deleted-${profile.id}`, profile_photo_url: null, bio: null })
        .eq('id', profile.id)
      await supabase.from('payout_methods').delete().eq('creator_id', profile.id)
    } else if (profile && target.user_type === 'brand') {
      await supabase
        .from('brands')
        .update({ company_name: 'Deleted user', logo_url: null })
        .eq('id', profile.id)
    }

    logAdminAction({
      request,
      adminId,
      action: 'user_deleted',
      targetType: 'user',
      targetId: target.id,
      reason: reasonCheck.reason,
      before: { email: target.email, user_type: target.user_type, role: target.role, profile_name: profile?.name ?? null },
      after: { email: anonymizedEmail, profile_name: 'Deleted user' },
    })

    return NextResponse.json({ message: 'User deleted' })
  } catch (err) {
    captureError(err, { route: 'DELETE /api/admin/users/[id]' })
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
