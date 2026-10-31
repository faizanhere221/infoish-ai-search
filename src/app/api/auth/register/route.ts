import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { rateLimit } from '@/lib/rate-limit'
import { logActivity } from '@/lib/activity'
import { validateEmail } from '@/utils/validateEmail'
import { emitEvent } from '@/lib/events/emit'
import { captureError } from '@/lib/error-tracking'
import { sendEmail } from '@/lib/email/send'
import { welcomeEmail } from '@/lib/email/templates/welcome'
import { verifyEmailTemplate } from '@/lib/email/templates/verifyEmail'
import { generateToken, hashToken } from '@/lib/email/tokens'
import { onBrandRegistered } from '@/lib/founder-emails'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, retryAfterMs } = await rateLimit(`register:${ip}`, 50, 60 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json()
    const { email, password, user_type } = body

    // Validate required fields
    if (!email || !password || !user_type) {
      return NextResponse.json(
        { error: 'Email, password, and user_type are required' },
        { status: 400 }
      )
    }

    // Validate user_type
    if (!['creator', 'brand'].includes(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user_type. Must be "creator" or "brand"' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one letter and one number' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        user_type,
        email_verified: false,
        is_active: true,
      })
      .select()
      .single()

    if (userError) {
      captureError(userError, { route: 'POST /api/auth/register' })
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    void logActivity({
      userId: user.id,
      action: 'register',
      entityType: 'user',
      entityId: user.id,
      details: { email: user.email, user_type },
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    // 'system' is never written anywhere FK-constrained (no campaignCreatorId
    // here, and notifications.user_id has no FK) — it only needs to not
    // equal the recipient, since emitEvent never notifies its own actor.
    await emitEvent(supabase, {
      type: 'account_created',
      actorUserId: 'system',
      recipientUserIds: [user.id],
      relatedType: 'account',
      relatedId: user.id,
      data: { userType: user_type },
    })

    // Welcome + verification emails are fire-and-forget — a failure here
    // must never turn into a failed registration (the account already
    // exists at this point). Brands get the founder welcome instead of the
    // generic one: queued here, sent once the company profile is saved
    // (src/lib/founder-emails).
    try {
      if (user_type === 'brand') {
        await onBrandRegistered(supabase, user.id)
      } else {
        const welcome = welcomeEmail('creator')
        await sendEmail({
          to: user.email,
          subject: welcome.subject,
          html: welcome.html,
          text: welcome.text,
          category: 'security',
          template: 'welcome_creator',
          idempotencyKey: `welcome:${user.id}`,
          userId: user.id,
          deferrable: false,
        })
      }

      const rawToken = generateToken()
      const { error: tokenError } = await supabase.from('email_verification_tokens').insert({
        user_id: user.id,
        token_hash: hashToken(rawToken),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      if (tokenError) {
        captureError(tokenError, { route: 'POST /api/auth/register', context: 'verification token' })
      } else {
        const verifyUrl = `${APP_URL}/verify-email?token=${rawToken}`
        const verify = verifyEmailTemplate(verifyUrl)
        await sendEmail({
          to: user.email,
          subject: verify.subject,
          html: verify.html,
          text: verify.text,
          category: 'security',
          template: 'verify_email',
          idempotencyKey: `verify_email:${user.id}:initial`,
          userId: user.id,
          deferrable: false,
        })
      }
    } catch (emailError) {
      captureError(emailError, { route: 'POST /api/auth/register', context: 'welcome/verification email' })
    }

    // Return user without sensitive data
    const { password_hash: _, ...safeUser } = user

    return NextResponse.json({
      message: 'User registered successfully',
      user: safeUser,
      emailWarning: emailCheck.warning ?? null,
    }, { status: 201 })

  } catch (error) {
    captureError(error, { route: 'POST /api/auth/register' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}