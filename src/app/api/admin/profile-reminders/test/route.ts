import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { getReminderAudience, sendProfileReminderTest } from '@/lib/creators/profile-reminders'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const TestSchema = z.object({
  creator_user_id: z.string().min(1).max(255),
})

// POST /api/admin/profile-reminders/test — sends the profile reminder, as
// one eligible creator would receive it, to the calling admin's own email.
// The creator is not marked as reminded and still gets their real email.
export async function POST(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const adminId = request.headers.get('x-user-id')
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const parsed = TestSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const [{ data: admin }, audience] = await Promise.all([
      supabase.from('users').select('id, email').eq('id', adminId).single(),
      getReminderAudience(supabase),
    ])
    if (!admin?.email) {
      return NextResponse.json({ error: 'Your admin account has no email address' }, { status: 400 })
    }

    // Only creators the real reminder would go to, so the test shows a real email.
    const recipient = audience.recipients.find((r) => r.userId === parsed.data.creator_user_id)
    if (!recipient) {
      return NextResponse.json({ error: 'That creator is not in the reminder list' }, { status: 404 })
    }

    const result = await sendProfileReminderTest(recipient, { userId: admin.id, email: admin.email })

    logAdminAction({
      request,
      adminId,
      action: 'profile_reminder_test_sent',
      targetType: 'creator',
      targetId: recipient.userId,
      reason: 'Test copy of the profile reminder sent to the admin',
      after: { to: admin.email, creator_username: recipient.username, sent: result.sent, provider_reason: result.reason ?? null },
    })

    if (!result.sent) {
      return NextResponse.json({ error: 'The test email could not be sent' }, { status: 502 })
    }
    return NextResponse.json({ message: 'Test email sent', to: admin.email })
  } catch (error) {
    captureError(error, { route: 'POST /api/admin/profile-reminders/test' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
