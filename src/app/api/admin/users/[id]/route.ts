import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { logActivity } from '@/lib/activity'
import { revalidateCreatorPublicSurfaces } from '@/lib/creators/revalidate'
import { checkDeletionBlockers, checkLinkedRecords, hardDeleteUser } from '@/lib/admin-user-deletion'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/admin/users/[id] — detail. Beyond the account/profile basics,
// this surfaces everything Phase 7B asked the users page to roll up for a
// single person: their campaign-workflow footprint (tracker rows,
// contracts, payments — grouped by currency, never summed across them,
// same rule as the payments dashboard), any reports involving them (as
// reporter or reported), and a merged recent-activity feed. Viewing this
// counts as "every admin view of sensitive data" per instruction, so it's
// logged, same pattern as the payment/contract detail GETs.
export async function GET(
  request: NextRequest,
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
        .select('id, username, display_name, country, niches, total_followers, avg_rating, completed_deals, verification_status, is_available, is_featured')
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

    // Fetch recent deals (legacy 1:1 flow)
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

    // Campaign workflow footprint: tracker rows (campaign_creators), then
    // contracts/payments that hang off those rows. For a creator, rows are
    // theirs directly; for a brand, rows come via their campaigns.
    let ccRows: { id: string; campaign_id: string; creator_id: string; status: string; updated_at: string }[] = []
    let campaigns: { id: string; title: string; status: string; brand_id: string }[] = []

    if (profile?.id && user.user_type === 'creator') {
      const { data } = await supabase
        .from('campaign_creators')
        .select('id, campaign_id, creator_id, status, updated_at')
        .eq('creator_id', String(profile.id))
        .order('updated_at', { ascending: false })
      ccRows = data ?? []
      const campaignIds = [...new Set(ccRows.map((r) => r.campaign_id))]
      if (campaignIds.length > 0) {
        const { data: c } = await supabase.from('campaigns').select('id, title, status, brand_id').in('id', campaignIds)
        campaigns = c ?? []
      }
    } else if (profile?.id && user.user_type === 'brand') {
      const { data: c } = await supabase
        .from('campaigns')
        .select('id, title, status, brand_id')
        .eq('brand_id', String(profile.id))
        .order('created_at', { ascending: false })
      campaigns = c ?? []
      const campaignIds = campaigns.map((c) => c.id)
      if (campaignIds.length > 0) {
        const { data } = await supabase
          .from('campaign_creators')
          .select('id, campaign_id, creator_id, status, updated_at')
          .in('campaign_id', campaignIds)
          .order('updated_at', { ascending: false })
        ccRows = data ?? []
      }
    }

    const campaignById = new Map(campaigns.map((c) => [c.id, c]))
    const rowIds = ccRows.map((r) => r.id)

    // "Other party" names for display — brand names when viewing a
    // creator, creator names when viewing a brand.
    let otherNameByRowId = new Map<string, string>()
    if (user.user_type === 'creator') {
      const brandIds = [...new Set(campaigns.map((c) => c.brand_id))]
      const { data: brands } = brandIds.length > 0
        ? await supabase.from('brands').select('id, company_name').in('id', brandIds)
        : { data: [] }
      const brandNameById = new Map((brands ?? []).map((b) => [b.id, b.company_name]))
      otherNameByRowId = new Map(ccRows.map((r) => [r.id, brandNameById.get(campaignById.get(r.campaign_id)?.brand_id ?? '') ?? '—']))
    } else if (user.user_type === 'brand') {
      const creatorIds = [...new Set(ccRows.map((r) => r.creator_id))]
      const { data: creators } = creatorIds.length > 0
        ? await supabase.from('creators').select('id, username, display_name').in('id', creatorIds)
        : { data: [] }
      const creatorNameById = new Map((creators ?? []).map((c) => [c.id, c.display_name ?? c.username]))
      otherNameByRowId = new Map(ccRows.map((r) => [r.id, creatorNameById.get(r.creator_id) ?? '—']))
    }

    const rowStatusCounts: Record<string, number> = {}
    for (const r of ccRows) {rowStatusCounts[r.status] = (rowStatusCounts[r.status] ?? 0) + 1}

    const rows = ccRows.slice(0, 5).map((r) => ({
      id: r.id,
      campaign_title: campaignById.get(r.campaign_id)?.title ?? '—',
      other_name: otherNameByRowId.get(r.id) ?? '—',
      status: r.status,
      updated_at: r.updated_at,
    }))

    // Contracts across those rows
    let contracts: { id: string; campaign_creator_id: string; version: number; status: string; created_at: string }[] = []
    const contractStatusCounts: Record<string, number> = {}
    if (rowIds.length > 0) {
      const { data } = await supabase
        .from('campaign_contracts')
        .select('id, campaign_creator_id, version, status, created_at')
        .in('campaign_creator_id', rowIds)
        .order('created_at', { ascending: false })
      contracts = data ?? []
      for (const c of contracts) {contractStatusCounts[c.status] = (contractStatusCounts[c.status] ?? 0) + 1}
    }
    const contractItems = contracts.slice(0, 5).map((c) => ({
      id: c.id,
      version: c.version,
      status: c.status,
      created_at: c.created_at,
      campaign_title: campaignById.get(ccRows.find((r) => r.id === c.campaign_creator_id)?.campaign_id ?? '')?.title ?? '—',
      other_name: otherNameByRowId.get(c.campaign_creator_id) ?? '—',
    }))

    // Payments across those rows — totals grouped by currency then status,
    // never summed across currencies.
    let payments: { id: string; campaign_creator_id: string; amount: number; currency: string; status: string; due_date: string | null; created_at: string }[] = []
    const paymentTotals: Record<string, Record<string, number>> = {}
    if (rowIds.length > 0) {
      const { data } = await supabase
        .from('creator_payments')
        .select('id, campaign_creator_id, amount, currency, status, due_date, created_at')
        .in('campaign_creator_id', rowIds)
        .order('created_at', { ascending: false })
      payments = data ?? []
      for (const p of payments) {
        paymentTotals[p.currency] ??= {}
        paymentTotals[p.currency][p.status] = (paymentTotals[p.currency][p.status] ?? 0) + Number(p.amount)
      }
    }
    const paymentItems = payments.slice(0, 5).map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      due_date: p.due_date,
      created_at: p.created_at,
      campaign_title: campaignById.get(ccRows.find((r) => r.id === p.campaign_creator_id)?.campaign_id ?? '')?.title ?? '—',
      other_name: otherNameByRowId.get(p.campaign_creator_id) ?? '—',
    }))

    // Reports involving this user, either side
    const { data: reportRows } = await supabase
      .from('reports')
      .select('id, reporter_user_id, reported_user_id, category, status, created_at')
      .or(`reporter_user_id.eq.${user.id},reported_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(10)
    const counterpartIds = [...new Set((reportRows ?? []).map((r) => (r.reporter_user_id === user.id ? r.reported_user_id : r.reporter_user_id)))]
    const { data: counterpartUsers } = counterpartIds.length > 0
      ? await supabase.from('users').select('id, email').in('id', counterpartIds)
      : { data: [] }
    const counterpartEmailById = new Map((counterpartUsers ?? []).map((u) => [u.id, u.email]))
    const reports = (reportRows ?? []).map((r) => ({
      id: r.id,
      role: r.reporter_user_id === user.id ? 'reporter' as const : 'reported' as const,
      counterpart_email: counterpartEmailById.get(r.reporter_user_id === user.id ? r.reported_user_id : r.reporter_user_id) ?? '—',
      category: r.category,
      status: r.status,
      created_at: r.created_at,
    }))
    const openReportCount = (reportRows ?? []).filter((r) => r.status === 'open' || r.status === 'reviewing').length

    // Recent activity — merge admin-logged actions (by or against this
    // user) with campaign-workflow events on their tracker rows.
    const [{ data: logs }, { data: events }] = await Promise.all([
      supabase
        .from('activity_logs')
        .select('id, action, entity_type, created_at')
        .or(`user_id.eq.${user.id},entity_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10),
      rowIds.length > 0
        ? supabase.from('campaign_creator_events').select('id, campaign_creator_id, event_type, created_at').in('campaign_creator_id', rowIds).order('created_at', { ascending: false }).limit(10)
        : Promise.resolve({ data: [] as { id: string; campaign_creator_id: string; event_type: string; created_at: string }[] }),
    ])
    const recentActivity = [
      ...(logs ?? []).map((l) => ({ id: l.id, label: l.action, created_at: l.created_at })),
      ...(events ?? []).map((e) => ({ id: e.id, label: e.event_type, created_at: e.created_at })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    void logActivity({
      userId: request.headers.get('x-user-id'),
      action: 'user_detail_viewed',
      entityType: 'user',
      entityId: user.id,
      details: {},
    })

    return NextResponse.json({
      user,
      profile,
      deals,
      workflow: { rows, rowStatusCounts, totalRows: ccRows.length },
      contracts: { items: contractItems, statusCounts: contractStatusCounts, total: contracts.length },
      payments: { items: paymentItems, totals: paymentTotals, total: payments.length },
      reports: { items: reports, openCount: openReportCount },
      recentActivity,
    })
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

// DELETE — super_admin only, reason required, logged. Two modes, decided
// automatically by checkLinkedRecords (src/lib/admin-user-deletion.ts):
//   - Zero linked records anywhere (never sent a message, never had a
//     conversation/campaign/application/deal/review/report/referral) →
//     a real hard delete. Nothing worth preserving exists, so just remove
//     the row entirely.
//   - Anything at all → the original soft-delete + anonymization:
//     email/name/avatar/bio/location/niches/languages/payout
//     methods/platform handles/portfolio/services are all removed;
//     everything else (messages, deliverables, payments, deals) stays —
//     those are financial/audit records, not the deleted person's data
//     to erase.
// Either way, every public-facing surface (marketplace, search, sitemap)
// must also stop returning this creator at all — see
// src/lib/creators/visibility.ts — and every mutation revalidates those
// surfaces so an ISR cache doesn't keep serving the old page. Blocked
// entirely (before either mode runs) if the profile has an unsettled
// payment or an active contract (checkDeletionBlockers), and blocked for
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

    let profile: { id: string; name: string; username?: string } | null = null
    if (target.user_type === 'creator') {
      const { data } = await supabase.from('creators').select('id, display_name, username').eq('user_id', target.id).single()
      if (data) {profile = { id: data.id, name: data.display_name, username: data.username }}
    } else if (target.user_type === 'brand') {
      const { data } = await supabase.from('brands').select('id, company_name').eq('user_id', target.id).single()
      if (data) {profile = { id: data.id, name: data.company_name }}
    }

    const linkedProfile = profile && (target.user_type === 'creator' || target.user_type === 'brand')
      ? { type: target.user_type, id: profile.id }
      : null

    if (linkedProfile) {
      const blockers = await checkDeletionBlockers(supabase, linkedProfile.type, linkedProfile.id)
      if (blockers.blocked) {
        return NextResponse.json(
          { error: `Cannot delete: ${blockers.reasons.join('; ')}. Resolve these first.` },
          { status: 400 }
        )
      }
    }

    const linked = await checkLinkedRecords(supabase, target.id, linkedProfile)

    if (!linked.hasAny) {
      // Nothing worth preserving exists for this account anywhere — a
      // real hard delete instead of soft-delete + anonymizing a record
      // that has no history to protect.
      await hardDeleteUser(supabase, target.id, linkedProfile)

      if (profile?.username) {revalidateCreatorPublicSurfaces(profile.username)}

      logAdminAction({
        request,
        adminId,
        action: 'user_hard_deleted',
        targetType: 'user',
        targetId: target.id,
        reason: reasonCheck.reason,
        before: { email: target.email, user_type: target.user_type, role: target.role, profile_name: profile?.name ?? null },
        after: null,
      })

      return NextResponse.json({ message: 'User permanently deleted', mode: 'hard' })
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
        .update({
          display_name: 'Deleted user',
          username: `deleted-${profile.id}`,
          profile_photo_url: null,
          bio: null,
          country: null,
          city: null,
          niches: [],
          languages: [],
        })
        .eq('id', profile.id)
      await supabase.from('payout_methods').delete().eq('creator_id', profile.id)
      await supabase.from('creator_platforms').delete().eq('creator_id', profile.id)
      await supabase.from('creator_portfolio').delete().eq('creator_id', profile.id)
      await supabase.from('creator_services').delete().eq('creator_id', profile.id)

      // Avatar files live under avatars/<creatorId>/<timestamp>.<ext> (see
      // POST /api/creators/[id]/avatar) — upload uses upsert on a
      // timestamped path, so an old avatar is never overwritten by a new
      // one; there can be more than one file here to remove.
      const { data: avatarFiles } = await supabase.storage.from('avatars').list(profile.id)
      if (avatarFiles && avatarFiles.length > 0) {
        await supabase.storage.from('avatars').remove(avatarFiles.map((f) => `${profile.id}/${f.name}`))
      }

      // Revalidate the OLD username path too, not just the new one — the
      // old path's ISR cache still has the live profile rendered and
      // would keep serving it until its own window expires otherwise.
      revalidateCreatorPublicSurfaces(profile.username)
      revalidateCreatorPublicSurfaces(`deleted-${profile.id}`)
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

    return NextResponse.json({ message: 'User deleted', mode: 'soft' })
  } catch (err) {
    captureError(err, { route: 'DELETE /api/admin/users/[id]' })
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
