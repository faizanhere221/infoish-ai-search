import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// POST - Increment a creator's public profile view count (public, no auth).
// Fire-and-forget from the client; failures are non-fatal to the caller.
// Best-effort: if profile_views doesn't exist yet (migration not applied),
// this silently no-ops rather than 500ing.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    return NextResponse.json({ tracked: true })
  } catch (error) {
    console.error('Profile view tracking error:', error)
    return NextResponse.json({ tracked: false })
  }
}
