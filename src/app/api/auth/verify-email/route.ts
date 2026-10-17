import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { hashToken } from '@/lib/email/tokens'
import { z } from 'zod'

const VerifySchema = z.object({ token: z.string().min(1) })

// POST /api/auth/verify-email — consumes a verification token (single use,
// 24h expiry). No auth required: the token itself, not a session, is the
// credential — the link works even from a different browser/device than
// the one that registered.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = VerifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const tokenHash = hashToken(parsed.data.token)

    const { data: tokenRow } = await supabase
      .from('email_verification_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .single()

    if (!tokenRow) {
      return NextResponse.json({ error: 'This verification link is invalid' }, { status: 400 })
    }
    if (tokenRow.used_at) {
      return NextResponse.json({ error: 'This verification link has already been used' }, { status: 400 })
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This verification link has expired' }, { status: 400 })
    }

    // Conditional UPDATE (WHERE used_at IS NULL) so two simultaneous
    // requests with the same token can't both succeed — the loser matches
    // zero rows instead of double-processing.
    const { data: claimed } = await supabase
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)
      .is('used_at', null)
      .select('id')
      .maybeSingle()

    if (!claimed) {
      return NextResponse.json({ error: 'This verification link has already been used' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ email_verified: true, email_verified_at: new Date().toISOString() })
      .eq('id', tokenRow.user_id)

    if (updateError) {
      captureError(updateError, { route: 'POST /api/auth/verify-email' })
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Email verified' })
  } catch (error) {
    captureError(error, { route: 'POST /api/auth/verify-email' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
