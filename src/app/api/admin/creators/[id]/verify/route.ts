import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'

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
    // Real schema values (src/types/database.ts VerificationStatus) — the
    // route this replaces only ever wrote 'verified'/'unverified', which
    // never matched the actual 'pending'/'verified'/'rejected' column (it
    // was never called from anywhere, so this mismatch never mattered
    // until now).
    const VALID_STATUSES = ['pending', 'verified', 'rejected']
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }
    const status = body.status as string

    const supabase = createServerSupabase()

    const { data: before } = await supabase
      .from('creators')
      .select('id, username, verification_status')
      .eq('id', params.id)
      .single()

    if (!before) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const { data: creator, error } = await supabase
      .from('creators')
      .update({ verification_status: status })
      .eq('id', params.id)
      .select('id, username, verification_status')
      .single()

    if (error || !creator) {
      captureError(error ?? new Error('verify: no row returned'), { route: 'POST /api/admin/creators/[id]/verify' })
      return NextResponse.json({ error: 'Failed to verify creator' }, { status: 500 })
    }

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'creator_verified',
      targetType: 'creator',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { verification_status: before.verification_status },
      after: { verification_status: status },
    })

    return NextResponse.json({ success: true, creator })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/creators/[id]/verify' })
    return NextResponse.json({ error: 'Failed to verify creator' }, { status: 500 })
  }
}
