import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'
import { isValidReferralCode } from '@/lib/referral'

const TrackReferralSchema = z.object({
  referral_code: z.string().min(1).max(30),
  user_id: z.string().max(255).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  name: z.string().max(255).optional().nullable(),
})

// POST - Record a referral signup against a partner's referral code (public,
// called from the signup flow). Bumps referral_partners.total_referrals via
// the referral_signups_count_sync trigger, not here — keeps the count
// correct under concurrent signups.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = TrackReferralSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const code = parsed.data.referral_code.toLowerCase().trim()
    if (!isValidReferralCode(code)) {
      return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 })
    }

    const { user_id, email, name } = parsed.data
    const supabase = createServerSupabase()

    const { data: partner, error: partnerError } = await supabase
      .from('referral_partners')
      .select('id, status')
      .eq('referral_code', code)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    if (partner.status !== 'active') {
      return NextResponse.json({ error: 'Referral partner is not active' }, { status: 400 })
    }

    const { data: signup, error: signupError } = await supabase
      .from('referral_signups')
      .insert({
        partner_id: partner.id,
        referred_user_id: user_id || null,
        referred_email: email || null,
        referred_name: name || null,
        referral_code: code,
        status: 'signed_up',
      })
      .select()
      .single()

    if (signupError) {
      console.error('Error creating referral signup:', signupError)
      return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Referral tracked successfully', signup }, { status: 201 })
  } catch (error) {
    console.error('Referral track error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
