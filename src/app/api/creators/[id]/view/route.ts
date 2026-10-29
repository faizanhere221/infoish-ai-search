import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { captureMessage } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Referral sources recorded in creator_referral_visits. Anything else in
// the body is ignored, so this can't be used to write arbitrary labels.
const TRACKED_REFS = new Set(['badge'])

// POST - Increment a creator's public profile view count (public, no auth).
// Fire-and-forget from the client; failures are non-fatal to the caller.
// Best-effort: if profile_views doesn't exist yet (migration not applied),
// this silently no-ops rather than 500ing.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { allowed } = await rateLimit(`creator-view:${ip}`, 30, 60 * 1000)
    if (!allowed) {
      return NextResponse.json({ tracked: false }, { status: 429 })
    }

    const supabase = createServerSupabase()

    const { data: creator } = await supabase
      .from('creators')
      .select('id, profile_views')
      .eq('id', params.id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const currentViews = typeof creator.profile_views === 'number' ? creator.profile_views : 0

    const { error } = await supabase
      .from('creators')
      .update({ profile_views: currentViews + 1 })
      .eq('id', params.id)

    if (error) {
      // Most likely cause: profile_views column doesn't exist yet.
      console.error('Error incrementing profile_views (migration applied?):', error.message)
      return NextResponse.json({ tracked: false })
    }

    // A visit through the creator's shared badge or link (?ref=badge) is
    // also recorded per creator, so admin analytics shows who sends
    // traffic. Best-effort: a missing table (badge_referrals_migration.sql
    // not run yet) never fails the view count.
    const body = await request.json().catch(() => ({}))
    const ref = (body as { ref?: unknown })?.ref
    if (typeof ref === 'string' && TRACKED_REFS.has(ref)) {
      const { error: refError } = await supabase.from('creator_referral_visits').insert({ creator_id: params.id, ref })
      if (refError) {captureMessage(`creator_referral_visits insert failed: ${refError.message}`, 'warning')}
    }

    return NextResponse.json({ tracked: true })
  } catch (error) {
    console.error('Profile view tracking error:', error)
    return NextResponse.json({ tracked: false })
  }
}
