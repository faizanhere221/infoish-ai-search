import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { revalidateCreatorPublicSurfaces } from '@/lib/creators/revalidate'

export const dynamic = 'force-dynamic'

// POST /api/admin/creators/[id]/hide — toggle creators.hidden_from_marketplace.
// For internal test accounts: hides a creator from every public surface
// (marketplace listing/search, profile page, sitemap, roster, campaign
// discovery) without suspending or deleting the account — the creator can
// still log in and use their dashboard normally.
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
    const hidden = body.hidden !== false

    const supabase = createServerSupabase()

    const { data: before } = await supabase
      .from('creators')
      .select('id, username, hidden_from_marketplace')
      .eq('id', params.id)
      .single()

    if (!before) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const { data: creator, error } = await supabase
      .from('creators')
      .update({ hidden_from_marketplace: hidden })
      .eq('id', params.id)
      .select('id, username, hidden_from_marketplace')
      .single()

    if (error || !creator) {
      captureError(error ?? new Error('hide: no row returned'), { route: 'POST /api/admin/creators/[id]/hide' })
      return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 })
    }

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'creator_hidden_from_marketplace',
      targetType: 'creator',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { hidden_from_marketplace: before.hidden_from_marketplace },
      after: { hidden_from_marketplace: hidden },
    })

    revalidateCreatorPublicSurfaces(creator.username)

    return NextResponse.json({ success: true, creator })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/creators/[id]/hide' })
    return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 })
  }
}
