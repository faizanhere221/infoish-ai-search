import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'

const CreatePayoutSchema = z.object({
  amount_cents: z.number().int().positive(),
  payment_method: z.string().max(100).optional().nullable(),
  payment_reference: z.string().max(255).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
})

// GET - List payouts for a partner (admin only, enforced by middleware)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: payouts, error } = await supabase
      .from('referral_payouts')
      .select('*')
      .eq('partner_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching partner payouts:', error)
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
    }

    return NextResponse.json({ payouts: payouts ?? [], total: payouts?.length ?? 0 })
  } catch (err) {
    console.error('Admin partner payouts fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Record a new payout for a partner (admin only, enforced by middleware).
// referral_partners.total_paid_cents is kept in sync by the
// referral_payouts_paid_sync trigger once status = 'completed', not here.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const parsed = CreatePayoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: partner } = await supabase
      .from('referral_partners')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const { amount_cents, payment_method, payment_reference, notes, status } = parsed.data

    const { data: payout, error } = await supabase
      .from('referral_payouts')
      .insert({
        partner_id: params.id,
        amount_cents,
        payment_method: payment_method || null,
        payment_reference: payment_reference || null,
        notes: notes || null,
        status: status || 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating referral payout:', error)
      return NextResponse.json({ error: 'Failed to record payout' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Payout recorded successfully', payout }, { status: 201 })
  } catch (err) {
    console.error('Admin partner payout creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
