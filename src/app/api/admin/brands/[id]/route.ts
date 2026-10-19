import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: brand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const [{ data: user }, { data: deals }] = await Promise.all([
      supabase.from('users').select('id, email, is_active, last_login_at, role, created_at').eq('id', brand.user_id).single(),
      supabase.from('deals').select('id, title, status, amount, currency, created_at').eq('brand_id', brand.id).order('created_at', { ascending: false }).limit(5),
    ])

    return NextResponse.json({ brand, user, deals })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/brands/[id]' })
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 })
  }
}

// PATCH — is_active is rejected here: use POST /api/admin/users/[userId]/activate
// or /suspend (the same one path every user type goes through). There is no
// dedicated /verify route for brands (unlike creators), so verification_status
// is handled directly here, but still requires a reason and still logs.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))

    if ('is_active' in body) {
      return NextResponse.json(
        { error: 'is_active must be changed via the user-level /activate or /suspend endpoint, not this generic PATCH.' },
        { status: 400 }
      )
    }

    const VALID_STATUSES = ['pending', 'verified', 'rejected']
    if (!('verification_status' in body) || !VALID_STATUSES.includes(body.verification_status)) {
      return NextResponse.json({ error: `verification_status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }

    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }
    const verificationStatus = body.verification_status as string

    const supabase = createServerSupabase()
    const { data: before } = await supabase.from('brands').select('id, verification_status').eq('id', params.id).single()
    if (!before) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const { data: brand, error } = await supabase
      .from('brands')
      .update({ verification_status: verificationStatus })
      .eq('id', params.id)
      .select('id, verification_status')
      .single()

    if (error || !brand) {
      captureError(error ?? new Error('brand verify: no row returned'), { route: 'PATCH /api/admin/brands/[id]' })
      return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
    }

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'brand_verified',
      targetType: 'brand',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { verification_status: before.verification_status },
      after: { verification_status: verificationStatus },
    })

    return NextResponse.json({ brand })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/brands/[id]' })
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
  }
}
