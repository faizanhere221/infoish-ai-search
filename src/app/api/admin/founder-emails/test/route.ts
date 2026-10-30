import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction } from '@/lib/admin-action'
import { FOUNDER_EMAIL_KINDS, sendFounderTest, type FounderEmailKind } from '@/lib/founder-emails'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const TestSchema = z.object({
  kind: z.enum(FOUNDER_EMAIL_KINDS as [FounderEmailKind, ...FounderEmailKind[]]),
  // The account whose email to preview. Omitted: sample data.
  user_id: z.string().min(1).max(255).optional(),
})

// POST /api/admin/founder-emails/test — sends a founder email to the
// calling admin's own address. The target account's real email is not
// affected and still goes out once.
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
    const { data: admin } = await supabase.from('users').select('id, email').eq('id', adminId).single()
    if (!admin?.email) {
      return NextResponse.json({ error: 'Your admin account has no email address' }, { status: 400 })
    }

    const targetUserId = parsed.data.user_id ?? null
    const result = await sendFounderTest(supabase, parsed.data.kind, { userId: admin.id, email: admin.email }, targetUserId)
    if (result.notFound) {
      return NextResponse.json({ error: 'That account has no profile for this email' }, { status: 404 })
    }

    logAdminAction({
      request,
      adminId,
      action: 'founder_email_test_sent',
      targetType: 'user',
      targetId: targetUserId ?? 'sample',
      reason: `Test copy of the ${parsed.data.kind} founder email sent to the admin`,
      after: { to: admin.email, sent: result.sent, provider_reason: result.reason ?? null },
    })

    if (!result.sent) {
      return NextResponse.json({ error: 'The test email could not be sent' }, { status: 502 })
    }
    return NextResponse.json({ message: 'Test email sent', to: admin.email })
  } catch (error) {
    captureError(error, { route: 'POST /api/admin/founder-emails/test' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
