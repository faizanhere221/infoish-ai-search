import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'
import { generateReferralCode, isValidReferralCode } from '@/lib/referral'

const CreatePartnerSchema = z.object({
  user_id: z.string().max(255).optional().nullable(),
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  referral_code: z.string().min(5).max(30).optional(),
  commission_rate: z.number().min(0).max(100).optional(),
})

// GET - List all referral partners (admin only, enforced by middleware)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? ''
    const search = searchParams.get('search') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))

    const supabase = createServerSupabase()

    let query = supabase
      .from('referral_partners')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) {query = query.eq('status', status)}
    if (search) {query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,referral_code.ilike.%${search}%`)}

    const { data: partners, count, error } = await query
    if (error) {throw error}

    return NextResponse.json({ partners: partners ?? [], total: count ?? 0, page, limit })
  } catch (err) {
    console.error('Admin partners list error:', err)
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
  }
}

// POST - Create a new referral partner (admin only, enforced by middleware)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreatePartnerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { user_id, name, email, commission_rate } = parsed.data
    const supabase = createServerSupabase()

    // Resolve a unique referral code: use the caller's choice if valid and
    // free, otherwise generate one and retry on the rare collision.
    let referralCode = parsed.data.referral_code?.toLowerCase().trim()
    if (referralCode && !isValidReferralCode(referralCode)) {
      return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 })
    }

    if (referralCode) {
      const { data: existing } = await supabase
        .from('referral_partners')
        .select('id')
        .eq('referral_code', referralCode)
        .single()
      if (existing) {
        return NextResponse.json({ error: 'Referral code is already taken' }, { status: 409 })
      }
    } else {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateReferralCode(name)
        const { data: existing } = await supabase
          .from('referral_partners')
          .select('id')
          .eq('referral_code', candidate)
          .single()
        if (!existing) {
          referralCode = candidate
          break
        }
      }
      if (!referralCode) {
        return NextResponse.json({ error: 'Could not generate a unique referral code, try again' }, { status: 500 })
      }
    }

    const { data: partner, error } = await supabase
      .from('referral_partners')
      .insert({
        user_id: user_id || null,
        name,
        email,
        referral_code: referralCode,
        commission_rate: commission_rate ?? 20.0,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating referral partner:', error)
      return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Partner created successfully', partner }, { status: 201 })
  } catch (err) {
    console.error('Admin partner creation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
