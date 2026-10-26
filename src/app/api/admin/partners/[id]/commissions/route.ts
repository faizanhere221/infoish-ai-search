import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'
import { getEnrichedCommissions, formatCents } from '@/lib/referral'
import { emitEvent } from '@/lib/events/emit'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET - All commissions for a given partner (admin only, enforced by middleware)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const commissions = await getEnrichedCommissions(supabase, params.id)
    return NextResponse.json({ commissions, total: commissions.length })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/partners/[id]/commissions' })
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
  }
}

const UpdateCommissionSchema = z.object({
  commissionId: z.string().min(1),
  status: z.enum(['approved', 'cancelled']),
})

// PUT - Approve or cancel a pending commission (admin only, enforced by middleware)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const parsed = UpdateCommissionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { commissionId, status } = parsed.data

    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { data: commission, error } = await supabase
      .from('referral_commissions')
      .select('*')
      .eq('id', commissionId)
      .eq('partner_id', params.id)
      .single()

    if (error || !commission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 })
    }

    if (commission.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot update a commission with status: ${commission.status}` },
        { status: 400 }
      )
    }

    const { data: updated, error: updateError } = await supabase
      .from('referral_commissions')
      .update({ status })
      .eq('id', commissionId)
      .select()
      .single()

    if (updateError) {
      captureError(updateError, { route: 'PUT /api/admin/partners/[id]/commissions' })
      return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 })
    }

    logAdminAction({
      request,
      adminId: request.headers.get('x-user-id'),
      action: 'partner_commission_updated',
      targetType: 'partner',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { commission_id: commissionId, status: commission.status },
      after: { commission_id: commissionId, status },
    })

    // Notify the partner on approval (best-effort)
    if (status === 'approved') {
      const { data: partner } = await supabase.from('referral_partners').select('user_id').eq('id', params.id).single()
      if (partner?.user_id) {
        await emitEvent(supabase, {
          type: 'referral_commission_approved',
          actorUserId: request.headers.get('x-user-id') ?? partner.user_id,
          recipientUserIds: [partner.user_id],
          relatedType: 'partner',
          data: { amountFormatted: formatCents(commission.commission_amount_cents) },
        })
      }
    }

    return NextResponse.json({ commission: updated })
  } catch (err) {
    captureError(err, { route: 'PUT /api/admin/partners/[id]/commissions' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
