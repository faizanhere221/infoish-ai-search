import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { getDeferrableBudgetRemaining } from '@/lib/email/send'
import { getReminderAudience, sendProfileReminders } from '@/lib/creators/profile-reminders'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
// Sends run one after another (up to the daily quota), well past the default timeout.
export const maxDuration = 60

function isAdmin(request: NextRequest): boolean {
  const role = request.headers.get('x-user-role')
  return role === 'admin' || role === 'super_admin'
}

// GET /api/admin/profile-reminders — preview: how many creators would get
// the one-time "finish your profile" email, and how many fit in today's quota.
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const supabase = createServerSupabase()
    const [audience, budgetRemaining] = await Promise.all([getReminderAudience(supabase), getDeferrableBudgetRemaining()])
    return NextResponse.json({
      preview: {
        eligible: audience.recipients.length,
        sendableToday: Math.min(audience.recipients.length, budgetRemaining),
        budgetRemaining,
        incomplete: audience.incomplete,
        optedOut: audience.optedOut,
        alreadySent: audience.alreadySent,
      },
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/admin/profile-reminders' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/profile-reminders — sends the reminder to everyone
// eligible, capped at today's remaining quota. Body: { reason }.
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

    const supabase = createServerSupabase()
    const audience = await getReminderAudience(supabase)
    const result = await sendProfileReminders(audience.recipients)

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'profile_reminders_sent',
      targetType: 'email',
      targetId: 'profile_reminder',
      reason: reasonCheck.reason,
      before: { eligible: audience.recipients.length },
      after: result,
    })

    return NextResponse.json({ message: 'Profile reminders processed', result })
  } catch (error) {
    captureError(error, { route: 'POST /api/admin/profile-reminders' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
