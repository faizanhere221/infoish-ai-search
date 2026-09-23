import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'
import { getPartnerStats, isValidReferralCode } from '@/lib/referral'

const UpdatePartnerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  referral_code: z.string().min(5).max(30).optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  status: z.enum(['active', 'paused', 'deactivated']).optional(),
  user_id: z.string().max(255).nullable().optional(),
})

// GET - Partner detail, with recent referrals (admin only, enforced by middleware)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: partner, error } = await supabase
      .from('referral_partners')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const [{ data: recentSignups }, stats] = await Promise.all([
      supabase
        .from('referral_signups')
        .select('id, referred_name, referred_email, status, signup_date')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(10),
      getPartnerStats(supabase, partner),
    ])

    return NextResponse.json({ partner, recent_signups: recentSignups ?? [], stats })
  } catch (err) {
    console.error('Admin partner detail error:', err)
    return NextResponse.json({ error: 'Failed to fetch partner' }, { status: 500 })
  }
}

// PUT - Update partner fields (admin only, enforced by middleware)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const parsed = UpdatePartnerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    if (parsed.data.referral_code) {
      const code = parsed.data.referral_code.toLowerCase().trim()
      if (!isValidReferralCode(code)) {
        return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 })
      }
      const { data: existing } = await supabase
        .from('referral_partners')
        .select('id')
        .eq('referral_code', code)
        .neq('id', params.id)
        .single()
      if (existing) {
        return NextResponse.json({ error: 'Referral code is already taken' }, { status: 409 })
      }
      parsed.data.referral_code = code
    }

    if (parsed.data.user_id) {
      const { data: existing } = await supabase
        .from('referral_partners')
        .select('id')
        .eq('user_id', parsed.data.user_id)
        .neq('id', params.id)
        .single()
      if (existing) {
        return NextResponse.json({ error: 'That user is already linked to another partner' }, { status: 409 })
      }
    }

    const { data: partner, error } = await supabase
      .from('referral_partners')
      .update(parsed.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating referral partner:', error)
      return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
    }

    return NextResponse.json({ partner })
  } catch (err) {
    console.error('Admin partner update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Deactivate a partner (soft delete: sets status = 'deactivated'
// rather than removing the row, so referral/commission/payout history is
// preserved instead of being cascade-deleted)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: partner, error } = await supabase
      .from('referral_partners')
      .update({ status: 'deactivated' })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Partner deactivated', partner })
  } catch (err) {
    console.error('Admin partner deactivation error:', err)
    return NextResponse.json({ error: 'Failed to deactivate partner' }, { status: 500 })
  }
}
