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

    const { data: deal, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const [{ data: brand }, { data: creator }] = await Promise.all([
      supabase.from('brands').select('id, company_name, logo_url').eq('id', deal.brand_id).single(),
      supabase.from('creators').select('id, username, display_name, profile_picture_url').eq('id', deal.creator_id).single(),
    ])

    return NextResponse.json({ deal, brand, creator })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/deals/[id]' })
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 })
  }
}

// Not currently called from any admin UI (per docs/ADMIN_AUDIT.md) — brought
// up to the same reason+logging standard as every other admin mutation so
// it's correct if/when a UI is wired to it, rather than left as a silent gap.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))

    const ALLOWED = new Set(['status', 'amount', 'currency', 'notes'])
    const updates: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k)) {updates[k] = v}
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const { data: before } = await supabase
      .from('deals')
      .select('id, status, amount, currency, notes')
      .eq('id', params.id)
      .single()
    if (!before) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const { data: deal, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', params.id)
      .select('id, status, title, amount, currency, notes')
      .single()

    if (error || !deal) {
      captureError(error ?? new Error('deal update: no row returned'), { route: 'PATCH /api/admin/deals/[id]' })
      return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
    }

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'deal_updated',
      targetType: 'deal',
      targetId: params.id,
      reason: reasonCheck.reason,
      before,
      after: { ...before, ...updates },
    })

    return NextResponse.json({ deal })
  } catch (err) {
    captureError(err, { route: 'PATCH /api/admin/deals/[id]' })
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }
}
