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

const VALID_SORT = new Set(['created_at', 'name', 'total_referrals', 'total_paid_cents', 'commission_rate'])

// GET - List all referral partners (admin only, enforced by middleware)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? ''
    const search = searchParams.get('search') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const sortBy = VALID_SORT.has(searchParams.get('sort_by') ?? '') ? (searchParams.get('sort_by') as string) : 'created_at'
    const sortAsc = searchParams.get('sort_order') === 'asc'

    const supabase = createServerSupabase()

    let query = supabase
      .from('referral_partners')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortAsc })
      .range((page - 1) * limit, page * limit - 1)

    if (status) {query = query.eq('status', status)}
    if (search) {query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,referral_code.ilike.%${search}%`)}

    const { data: partners, count, error } = await query
    if (error) {throw error}

    // Live earnings per partner (sum of approved/paid commissions), same
    // definition used everywhere else — referral_partners.total_earnings_cents
    // is never written to, so it can't be trusted as a source of truth.
    let earningsByPartner = new Map<string, number>()
    const partnerIds = (partners ?? []).map((p) => p.id)
    if (partnerIds.length > 0) {
      const { data: commissions } = await supabase
        .from('referral_commissions')
        .select('partner_id, commission_amount_cents')
        .in('partner_id', partnerIds)
        .in('status', ['approved', 'paid'])

      earningsByPartner = (commissions ?? []).reduce((acc, c) => {
        acc.set(c.partner_id, (acc.get(c.partner_id) ?? 0) + (c.commission_amount_cents || 0))
        return acc
      }, new Map<string, number>())
    }

    const enriched = (partners ?? []).map((p) => ({
      ...p,
      total_earnings_cents: earningsByPartner.get(p.id) ?? 0,
    }))

    // Summary bar reflects ALL partners, not just the current filtered page.
    const [{ count: totalPartners }, { count: activePartners }, { data: allPartnerTotals }] = await Promise.all([
      supabase.from('referral_partners').select('id', { count: 'exact', head: true }),
      supabase.from('referral_partners').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('referral_partners').select('total_referrals, total_paid_cents'),
    ])

    const summary = {
      total_partners: totalPartners ?? 0,
      active_partners: activePartners ?? 0,
      total_referrals: (allPartnerTotals ?? []).reduce((sum, p) => sum + (p.total_referrals || 0), 0),
      total_paid_cents: (allPartnerTotals ?? []).reduce((sum, p) => sum + (p.total_paid_cents || 0), 0),
    }

    return NextResponse.json({ partners: enriched, total: count ?? 0, page, limit, summary })
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
