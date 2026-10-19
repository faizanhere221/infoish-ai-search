import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'

export const dynamic = 'force-dynamic'

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
    const featured = body.featured !== false

    const supabase = createServerSupabase()

    const { data: before } = await supabase
      .from('creators')
      .select('id, username, is_featured')
      .eq('id', params.id)
      .single()

    if (!before) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const { data: creator, error } = await supabase
      .from('creators')
      .update({ is_featured: featured })
      .eq('id', params.id)
      .select('id, username, is_featured')
      .single()

    if (error || !creator) {
      // Previously this branch also caught a missing-column error and
      // mislabeled it as 404 "Creator not found" — is_featured is live now
      // (checked beforehand above, same as every other route), so a real
      // error here means a real failure, not a schema gap.
      captureError(error ?? new Error('feature: no row returned'), { route: 'POST /api/admin/creators/[id]/feature' })
      return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 })
    }

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'creator_featured',
      targetType: 'creator',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { is_featured: before.is_featured },
      after: { is_featured: featured },
    })

    return NextResponse.json({ success: true, creator })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/creators/[id]/feature' })
    return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 })
  }
}
