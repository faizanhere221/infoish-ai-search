import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { checkDeletionBlockers, checkLinkedRecords } from '@/lib/admin-user-deletion'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/admin/users/[id]/deletion-preview — super_admin only, read-only.
// Runs the exact same checks DELETE /api/admin/users/[id] itself runs, so
// the admin delete dialog can show which mode will actually apply —
// blocked, hard delete, or soft delete + anonymization — before the admin
// confirms anything. Never used to decide anything on its own; the DELETE
// route always re-checks from scratch rather than trusting this response.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const callerRole = request.headers.get('x-user-role') ?? 'user'
    if (callerRole !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
    }

    const supabase = createServerSupabase()

    const { data: target } = await supabase
      .from('users')
      .select('id, user_type, deleted_at')
      .eq('id', params.id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (target.deleted_at) {
      return NextResponse.json({ error: 'This user has already been deleted' }, { status: 400 })
    }

    let profile: { id: string } | null = null
    if (target.user_type === 'creator') {
      const { data } = await supabase.from('creators').select('id').eq('user_id', target.id).single()
      profile = data
    } else if (target.user_type === 'brand') {
      const { data } = await supabase.from('brands').select('id').eq('user_id', target.id).single()
      profile = data
    }

    const linkedProfile = profile && (target.user_type === 'creator' || target.user_type === 'brand')
      ? { type: target.user_type as 'creator' | 'brand', id: profile.id }
      : null

    const blockers = linkedProfile
      ? await checkDeletionBlockers(supabase, linkedProfile.type, linkedProfile.id)
      : { blocked: false, reasons: [] }

    const linked = await checkLinkedRecords(supabase, target.id, linkedProfile)

    return NextResponse.json({
      blocked: blockers.blocked,
      blockingReasons: blockers.reasons,
      mode: blockers.blocked ? null : linked.hasAny ? 'soft' : 'hard',
      linkedRecords: linked.details,
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/users/[id]/deletion-preview' })
    return NextResponse.json({ error: 'Failed to preview deletion' }, { status: 500 })
  }
}
