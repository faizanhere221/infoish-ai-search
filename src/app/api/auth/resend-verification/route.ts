import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/send'
import { verifyEmailTemplate } from '@/lib/email/templates/verifyEmail'
import { generateToken, hashToken } from '@/lib/email/tokens'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'

// POST /api/auth/resend-verification — the logged-in user only, so a
// stranger can't use this to spam someone else's inbox. Rate limited per
// user, not just per IP, since the "verify your email" banner's resend
// button is the only caller.
//
// /api/auth/* is a public prefix in middleware, so middleware never injects
// x-user-id here (and strips any client-supplied one). Verify the JWT in the
// route itself instead. Reading the raw x-user-id header used to let anyone
// trigger verification emails for any user id.
async function verifiedUserId(request: NextRequest): Promise<string | null> {
  const secret = process.env.JWT_SECRET
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : request.cookies.get('auth_token')?.value
  if (!token || !secret) {return null}
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return payload.userId ? String(payload.userId) : null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifiedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { allowed, retryAfterMs } = await rateLimit(`resend-verification:${userId}`, 3, 15 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const supabase = createServerSupabase()
    const { data: user } = await supabase.from('users').select('id, email, email_verified').eq('id', userId).single()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (user.email_verified) {
      return NextResponse.json({ message: 'Email is already verified' })
    }

    const rawToken = generateToken()
    const { error: tokenError } = await supabase.from('email_verification_tokens').insert({
      user_id: user.id,
      token_hash: hashToken(rawToken),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    if (tokenError) {
      captureError(tokenError, { route: 'POST /api/auth/resend-verification' })
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }

    const verifyUrl = `${APP_URL}/verify-email?token=${rawToken}`
    const verify = verifyEmailTemplate(verifyUrl)
    await sendEmail({
      to: user.email,
      subject: verify.subject,
      html: verify.html,
      text: verify.text,
      category: 'security',
      template: 'verify_email',
      idempotencyKey: `verify_email:${user.id}:${Date.now()}`,
      userId: user.id,
      deferrable: false,
    })

    return NextResponse.json({ message: 'Verification email sent' })
  } catch (error) {
    captureError(error, { route: 'POST /api/auth/resend-verification' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
