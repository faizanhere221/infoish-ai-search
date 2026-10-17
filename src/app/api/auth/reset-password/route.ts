import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { hashToken } from '@/lib/email/tokens'
import { rateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
})

// POST /api/auth/reset-password — single-use (conditional UPDATE WHERE
// used_at IS NULL, same double-click-safe pattern used throughout the
// campaign workflow), 1h expiry, no auth required (the token is the
// credential).
//
// Does NOT invalidate other already-issued JWTs. This app's auth is
// stateless (no session table — see CLAUDE.md's Auth section); doing that
// would mean either a per-request DB lookup in src/middleware.ts (a real
// performance cost on every authenticated request, for every user, not
// just the rare password-reset case) or a token-version claim threaded
// through login/middleware/every JWT issuance. Both are real middleware
// changes, which CLAUDE.md flags as high-risk ("a bug here locks everyone
// out or lets everyone in"). Existing sessions remain valid until they
// expire naturally (7 days) — a known, accepted limitation, not an
// oversight.
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, retryAfterMs } = await rateLimit(`reset-password:${ip}`, 10, 15 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = ResetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    if (!/[a-zA-Z]/.test(parsed.data.password) || !/[0-9]/.test(parsed.data.password)) {
      return NextResponse.json({ error: 'Password must contain at least one letter and one number' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const tokenHash = hashToken(parsed.data.token)

    const { data: tokenRow } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .single()

    if (!tokenRow) {
      return NextResponse.json({ error: 'This reset link is invalid' }, { status: 400 })
    }
    if (tokenRow.used_at) {
      return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 })
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired' }, { status: 400 })
    }

    const { data: claimed } = await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)
      .is('used_at', null)
      .select('id')
      .maybeSingle()

    if (!claimed) {
      return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(parsed.data.password, 12)
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', tokenRow.user_id)

    if (updateError) {
      captureError(updateError, { route: 'POST /api/auth/reset-password' })
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    captureError(error, { route: 'POST /api/auth/reset-password' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
