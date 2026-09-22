import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'
import { getEnrichedCommissions, formatCents } from '@/lib/referral'
import { createNotification } from '@/lib/notifications'

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
    console.error('Admin partner commissions fetch error:', err)
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
      console.error('Error updating commission status:', updateError)
      return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 })
    }

    // Notify the partner on approval (best-effort)
    if (status === 'approved') {
      const { data: partner } = await supabase.from('referral_partners').select('user_id').eq('id', params.id).single()
      if (partner?.user_id) {
        await createNotification(supabase, {
          userId: partner.user_id,
          type: 'referral_commission_approved',
          title: 'Commission approved',
          message: `Your ${formatCents(commission.commission_amount_cents)} commission has been approved and added to your balance.`,
          link: '/dashboard/partner',
        })
      }
    }

    return NextResponse.json({ commission: updated })
  } catch (err) {
    console.error('Admin commission status update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
