import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Groups backing the admin/activity page's "ACTION_GROUPS" filter. Not
// declared anywhere else — inferred from the page's own group labels
// (Authentication/Deals/Profile/Admin) since no backing route existed
// before this one. Extend this whenever a new `action` string is
// introduced elsewhere (grep logActivity/logAdminAction call sites).
const ACTION_GROUPS: Record<string, string[]> = {
  auth: ['login', 'logout', 'register', 'admin_login'],
  deals: ['deal_created', 'deal_accepted', 'deal_declined', 'deal_delivered', 'deal_approved', 'deal_revision', 'deal_completed', 'deal_cancelled', 'deal_updated'],
  profile: ['profile_updated', 'creator_verified', 'creator_featured', 'creator_availability_changed', 'brand_verified'],
  admin: [
    'user_activated', 'user_suspended', 'user_deleted', 'user_role_changed', 'impersonation_blocked',
    'admin_created', 'admin_updated', 'admin_revoked',
    'contact_submission_updated', 'contact_submission_deleted', 'newsletter_subscriber_deleted',
    'settings_updated',
    'partner_created', 'partner_updated', 'partner_deleted', 'partner_payout_recorded', 'partner_commission_updated',
    'email_resent',
  ],
  payments: [
    'payment_viewed', 'payment_proof_viewed', 'payment_note_added',
    'payment_dispute_resolved', 'payment_admin_cancelled',
    'contract_viewed', 'contract_voided_by_admin',
  ],
  moderation: ['report_reviewing', 'report_resolved', 'report_conversation_opened'],
}

const PAGE_SIZE_MAX = 100

// GET /api/admin/activity/entries — the real backing route for
// src/app/admin/activity/page.tsx, which previously called
// /api/admin/activity/logs — a path that never existed (the fix here
// updates the page to match this route, not the other way around; "logs"
// as a literal directory name collides with .gitignore's bare `logs`
// entry, meant for log *files*, so this one route picked a different name
// instead of fighting that). /api/admin/activity (a different, simpler
// aggregated feed used by the dashboard widget) and /api/admin/activity/export
// (never called by anything) are separate, unrelated routes — left alone here.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(PAGE_SIZE_MAX, Math.max(1, parseInt(searchParams.get('limit') ?? '50') || 50))
    const search = searchParams.get('search')?.trim()
    const group = searchParams.get('group')?.trim()
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const supabase = createServerSupabase()

    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (group && ACTION_GROUPS[group]) {
      query = query.in('action', ACTION_GROUPS[group])
    }
    // Searches action/entity_type directly — not the joined user's email
    // (that would need a separate lookup-then-filter pass; out of scope
    // for this fix, which is about the route existing and working at all).
    if (search) {
      query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`)
    }
    if (dateFrom) {query = query.gte('created_at', dateFrom)}
    if (dateTo) {query = query.lte('created_at', dateTo)}

    const { data: logs, count, error } = await query

    if (error) {
      // Defensive — activity_logs exists live as of this writing, but keep
      // the same graceful-degrade pattern /api/admin/settings and
      // /api/admin/users/[id]/activity already use, in case that ever
      // changes again.
      if ((error as { code?: string }).code === '42P01') {
        return NextResponse.json({ logs: [], total: 0, missing_table: true })
      }
      captureError(error, { route: 'GET /api/admin/activity/logs' })
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
    }

    const userIds = [...new Set((logs ?? []).map((l) => l.user_id).filter(Boolean))]
    const { data: users } = userIds.length > 0
      ? await supabase.from('users').select('id, email, user_type').in('id', userIds)
      : { data: [] }
    const userById = new Map((users ?? []).map((u) => [u.id, u]))

    const enriched = (logs ?? []).map((log) => ({
      ...log,
      users: log.user_id ? userById.get(log.user_id) ?? null : null,
    }))

    return NextResponse.json({ logs: enriched, total: count ?? 0 })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/activity/logs' })
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
  }
}
