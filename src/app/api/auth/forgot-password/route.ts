import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { rateLimit } from '@/lib/rate-limit'
import { validateEmail } from '@/utils/validateEmail'
import { sendEmail } from '@/lib/email/send'
import { passwordResetTemplate } from '@/lib/email/templates/passwordReset'
import { generateToken, hashToken } from '@/lib/email/tokens'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'

const ForgotPasswordSchema = z.object({ email: z.string().min(1) })

// POST /api/auth/forgot-password — always responds the same way whether or
// not the email exists, so this can never be used to enumerate registered
// addresses. Rate limited per IP; the token itself is still single-use and
// short-lived even if the limit is somehow bypassed.
export async function POST(request: NextRequest) {
  const genericResponse = NextResponse.json({
    message: "If an account exists for that email, we've sent a password reset link.",
  })

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, retryAfterMs } = await rateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = ForgotPasswordSchema.safeParse(body)
    if (!parsed.success || !validateEmail(parsed.data.email).valid) {
      return genericResponse
    }

    const supabase = createServerSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', parsed.data.email.toLowerCase())
      .single()

    if (!user) {
      return genericResponse
    }

    const rawToken = generateToken()
    const { error: tokenError } = await supabase.from('password_reset_tokens').insert({
      user_id: user.id,
      token_hash: hashToken(rawToken),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
    if (tokenError) {
      captureError(tokenError, { route: 'POST /api/auth/forgot-password' })
      return genericResponse
    }

    const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`
    const reset = passwordResetTemplate(resetUrl)
    await sendEmail({
      to: user.email,
      subject: reset.subject,
      html: reset.html,
      text: reset.text,
      category: 'security',
      template: 'password_reset',
      idempotencyKey: `password_reset:${user.id}:${Date.now()}`,
      userId: user.id,
      deferrable: false,
    })

    return genericResponse
  } catch (error) {
    captureError(error, { route: 'POST /api/auth/forgot-password' })
    return genericResponse
  }
}
