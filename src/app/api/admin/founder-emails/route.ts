import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { getDeferrableBudgetRemaining } from '@/lib/email/send'
import { FOUNDER_EMAIL_KINDS, backfillFounderEmails, getFounderAudience, type FounderEmailKind } from '@/lib/founder-emails'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
// Sends run one after another (up to the daily quota), well past the default timeout.
export const maxDuration = 60

const KindSchema = z.enum(FOUNDER_EMAIL_KINDS as [FounderEmailKind, ...FounderEmailKind[]])

function isAdmin(request: NextRequest): boolean {
  const role = request.headers.get('x-user-role')
  return role === 'admin' || role === 'super_admin'
}

// GET /api/admin/founder-emails?kind=creator_welcome — preview: how many
// existing accounts would get the founder email, and how many fit in
// today's quota.
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const kind = KindSchema.safeParse(request.nextUrl.searchParams.get('kind'))
  if (!kind.success) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }
  try {
    const supabase = createServerSupabase()
    const [audience, budgetRemaining] = await Promise.all([getFounderAudience(supabase, kind.data), getDeferrableBudgetRemaining()])
    return NextResponse.json({
      preview: {
        eligible: audience.userIds.length,
        sendableToday: Math.min(audience.userIds.length, budgetRemaining),
        budgetRemaining,
        alreadyHandled: audience.alreadyHandled,
        contacted: audience.contacted,
        optedOut: audience.optedOut,
      },
    })
  } catch (error) {
    if ((error as { code?: string }).code === '42P01' || (error as { code?: string }).code === 'PGRST205') {
      return NextResponse.json({ error: 'Run supabase/founder_emails_migration.sql first' }, { status: 503 })
    }
    captureError(error, { route: 'GET /api/admin/founder-emails' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/founder-emails — queues the founder email for every
// eligible existing account and sends what today's quota allows. The rest
// go out on the next daily-summary cron run. Body: { kind, reason }.
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await request.json().catch(() => ({}))
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }
    const kind = KindSchema.safeParse((body as { kind?: unknown }).kind)
    if (!kind.success) {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const audience = await getFounderAudience(supabase, kind.data)
    const result = await backfillFounderEmails(supabase, kind.data, audience.userIds)

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'founder_emails_backfilled',
      targetType: 'email',
      targetId: kind.data,
      reason: reasonCheck.reason,
      before: { eligible: audience.userIds.length },
      after: result,
    })

    return NextResponse.json({ message: 'Founder emails processed', result })
  } catch (error) {
    captureError(error, { route: 'POST /api/admin/founder-emails' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
