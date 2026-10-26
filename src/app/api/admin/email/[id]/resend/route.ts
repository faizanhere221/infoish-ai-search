import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { sendEmail } from '@/lib/email/send'
import { welcomeEmail } from '@/lib/email/templates/welcome'
import { verifyEmailTemplate } from '@/lib/email/templates/verifyEmail'
import { passwordResetTemplate } from '@/lib/email/templates/passwordReset'
import { generateToken, hashToken } from '@/lib/email/tokens'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'
const RESENDABLE_TEMPLATES = new Set(['welcome_creator', 'welcome_brand', 'verify_email', 'password_reset'])

// POST /api/admin/email/[id]/resend — only for a failed account/security
// email (welcome, verify-email, password-reset). Re-runs the same
// template + sendEmail() call the original route used — never a generic
// "replay the stored email" since email_log doesn't store the rendered
// body, only metadata.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data: logRow } = await supabase.from('email_log').select('*').eq('id', params.id).single()
    if (!logRow) {
      return NextResponse.json({ error: 'Email log entry not found' }, { status: 404 })
    }
    if (logRow.status !== 'failed') {
      return NextResponse.json({ error: `Only a failed send can be resent (current status: ${logRow.status})` }, { status: 400 })
    }
    if (!logRow.user_id || !RESENDABLE_TEMPLATES.has(logRow.template)) {
      return NextResponse.json({ error: 'This email type cannot be resent from here' }, { status: 400 })
    }

    const { data: user } = await supabase.from('users').select('id, email, user_type, email_verified').eq('id', logRow.user_id).single()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (logRow.template === 'welcome_creator' || logRow.template === 'welcome_brand') {
      const welcome = welcomeEmail(user.user_type as 'creator' | 'brand')
      await sendEmail({
        to: user.email,
        subject: welcome.subject,
        html: welcome.html,
        text: welcome.text,
        category: 'security',
        template: logRow.template,
        idempotencyKey: `welcome:${user.id}:resend:${Date.now()}`,
        userId: user.id,
        deferrable: false,
      })
    } else if (logRow.template === 'verify_email') {
      if (user.email_verified) {
        return NextResponse.json({ error: 'This user already verified their email' }, { status: 400 })
      }
      const rawToken = generateToken()
      await supabase.from('email_verification_tokens').insert({
        user_id: user.id,
        token_hash: hashToken(rawToken),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      const verify = verifyEmailTemplate(`${APP_URL}/verify-email?token=${rawToken}`)
      await sendEmail({
        to: user.email,
        subject: verify.subject,
        html: verify.html,
        text: verify.text,
        category: 'security',
        template: 'verify_email',
        idempotencyKey: `verify_email:${user.id}:resend:${Date.now()}`,
        userId: user.id,
        deferrable: false,
      })
    } else if (logRow.template === 'password_reset') {
      const rawToken = generateToken()
      await supabase.from('password_reset_tokens').insert({
        user_id: user.id,
        token_hash: hashToken(rawToken),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      const reset = passwordResetTemplate(`${APP_URL}/reset-password?token=${rawToken}`)
      await sendEmail({
        to: user.email,
        subject: reset.subject,
        html: reset.html,
        text: reset.text,
        category: 'security',
        template: 'password_reset',
        idempotencyKey: `password_reset:${user.id}:resend:${Date.now()}`,
        userId: user.id,
        deferrable: false,
      })
    }

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'email_resent',
      targetType: 'email_log',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { status: logRow.status, template: logRow.template },
      after: { resent_to: user.email },
    })

    return NextResponse.json({ message: 'Email resent' })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/email/[id]/resend' })
    return NextResponse.json({ error: 'Failed to resend email' }, { status: 500 })
  }
}
