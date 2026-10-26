import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribeToken'
import { PREFERENCE_CATEGORIES } from '@/lib/email/send'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'

// Applies the unsubscribe: flips the token's own category to false, or
// every category if it was signed with 'all'. The token carries its own
// userId — there's no other identity on this request, by design (it works
// without logging in), so there's nothing a caller could substitute to
// affect a different user's preferences; verifyUnsubscribeToken is the only
// thing that produces a userId here, and it only accepts tokens this app
// itself signed.
async function applyUnsubscribe(token: string): Promise<{ ok: boolean; category?: string }> {
  const decoded = verifyUnsubscribeToken(token)
  if (!decoded) {return { ok: false }}

  const supabase = createServerSupabase()
  const { data: user } = await supabase.from('users').select('email_preferences').eq('id', decoded.userId).single()
  if (!user) {return { ok: false }}

  const prefs = { ...(user.email_preferences ?? {}) }
  if (decoded.category === 'all') {
    for (const cat of PREFERENCE_CATEGORIES) {prefs[cat] = false}
  } else {
    prefs[decoded.category] = false
  }

  const { error } = await supabase.from('users').update({ email_preferences: prefs }).eq('id', decoded.userId)
  if (error) {
    captureError(error, { route: 'unsubscribe', userId: decoded.userId })
    return { ok: false }
  }
  return { ok: true, category: decoded.category }
}

// GET — a person clicking the "Unsubscribe" link in an email footer.
// Redirects to a confirmation page rather than returning JSON, since a
// browser navigated here directly.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const result = await applyUnsubscribe(token)
  const url = new URL('/email-unsubscribed', APP_URL)
  if (result.ok && result.category) {url.searchParams.set('category', result.category)}
  if (!result.ok) {url.searchParams.set('error', '1')}
  return NextResponse.redirect(url)
}

// POST — RFC 8058 one-click unsubscribe (List-Unsubscribe-Post header),
// fired automatically by the email client, not a person. Returns a bare
// 200/400, never a redirect.
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const result = await applyUnsubscribe(token)
  return result.ok
    ? NextResponse.json({ message: 'Unsubscribed' })
    : NextResponse.json({ error: 'Invalid or expired unsubscribe link' }, { status: 400 })
}
