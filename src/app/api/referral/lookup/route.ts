import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { isValidReferralCode } from '@/lib/referral'

// GET - Look up a referral partner by code (public, used to validate a
// referral link/cookie before showing "referred by X" messaging at signup)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = (searchParams.get('code') || '').toLowerCase().trim()

    if (!code || !isValidReferralCode(code)) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { data: partner, error } = await supabase
      .from('referral_partners')
      .select('name, referral_code')
      .eq('referral_code', code)
      .eq('status', 'active')
      .single()

    if (error || !partner) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      partner: { name: partner.name, referral_code: partner.referral_code },
    })
  } catch (error) {
    console.error('Referral lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
