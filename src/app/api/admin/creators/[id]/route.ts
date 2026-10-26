import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import { revalidateCreatorPublicSurfaces } from '@/lib/creators/revalidate'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const [{ data: user }, { data: platforms }, { data: services }, { data: deals }] = await Promise.all([
      supabase.from('users').select('id, email, is_active, last_login_at, role, created_at').eq('id', creator.user_id).single(),
      supabase.from('creator_platforms').select('*').eq('creator_id', creator.id),
      supabase.from('creator_services').select('id, title, platform, price, currency, is_active').eq('creator_id', creator.id),
      supabase.from('deals').select('id, title, status, amount, currency, created_at').eq('creator_id', creator.id).order('created_at', { ascending: false }).limit(5),
    ])

    return NextResponse.json({ creator, user, platforms, services, deals })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/creators/[id]' })
    return NextResponse.json({ error: 'Failed to fetch creator' }, { status: 500 })
  }
}

// PATCH — is_featured, verification_status, and hidden_from_marketplace
// are rejected here: use the dedicated, logged /feature, /verify, and
// /hide routes. is_active is rejected too: use POST
// /api/admin/users/[userId]/activate or /suspend (the same one path every
// user type goes through, not a creator-specific second one). Only
// is_available is handled directly here, since nothing else owns that
// field — it still requires a reason and still logs.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))

    const rejected = ['is_featured', 'verification_status', 'is_active', 'hidden_from_marketplace'].filter((k) => k in body)
    if (rejected.length > 0) {
      return NextResponse.json(
        { error: `${rejected.join(', ')} must be changed via their dedicated endpoint (/feature, /verify, /hide, or the user-level /activate|/suspend), not this generic PATCH.` },
        { status: 400 }
      )
    }

    if (!('is_available' in body)) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data: before } = await supabase.from('creators').select('id, is_available').eq('id', params.id).single()
    if (!before) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const isAvailable = Boolean(body.is_available)
    const { data: creator, error } = await supabase
      .from('creators')
      .update({ is_available: isAvailable })
      .eq('id', params.id)
      .select('id, username, verification_status, is_available, is_featured')
      .single()

    if (error) {
      captureError(error, { route: 'PATCH /api/admin/creators/[id]' })
      return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 })
    }

    revalidateCreatorPublicSurfaces(creator.username)

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'creator_availability_changed',
      targetType: 'creator',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { is_available: before.is_available },
      after: { is_available: isAvailable },
    })

    return NextResponse.json({ creator })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/creators/[id]' })
    return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 })
  }
}
