import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { createNotification, getUserIdFromCreator } from '@/lib/notifications'
import { z } from 'zod'

const CreateDealSchema = z.object({
  creator_id: z.string().uuid(),
  brand_id: z.string().uuid(),
  service_id: z.string().uuid().optional().nullable(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional().nullable(),
  content_type: z.string().max(100).optional().nullable(),
  platform: z.string().max(100).optional().nullable(),
  requirements: z.string().max(5000).optional().nullable(),
  deliverables: z.array(z.object({
    id: z.string(),
    description: z.string(),
    is_completed: z.boolean(),
  })).optional(),
  amount: z.number().positive().max(1_000_000),
  deadline: z.string().datetime().optional().nullable(),
  delivery_days: z.number().int().min(1).max(365).optional(),
  revisions_allowed: z.number().int().min(0).max(10).optional(),
})

// GET - List deals for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creator_id')
    const brandId = searchParams.get('brand_id')
    const status = searchParams.get('status')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    // Caller must scope the query to their own profile — prevents fetching all deals
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    const effectiveCreatorId = callerUserType === 'creator' ? callerProfileId : creatorId
    const effectiveBrandId = callerUserType === 'brand' ? callerProfileId : brandId

    if (!effectiveCreatorId && !effectiveBrandId) {
      return NextResponse.json(
        { error: 'creator_id or brand_id filter is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Fetch deals without relations first
    let query = supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (effectiveCreatorId) {
      query = query.eq('creator_id', effectiveCreatorId)
    }

    if (effectiveBrandId) {
      query = query.eq('brand_id', effectiveBrandId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: deals, error } = await query

    if (error) {
      console.error('Error fetching deals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch deals' },
        { status: 500 }
      )
    }

    if (!deals || deals.length === 0) {
      return NextResponse.json({ deals: [] })
    }

    // Fetch creators for these deals
    const creatorIds = [...new Set(deals.map(d => d.creator_id).filter(Boolean))]
    const brandIds = [...new Set(deals.map(d => d.brand_id).filter(Boolean))]

    type CreatorRow = { id: string; username: string; display_name: string; profile_photo_url: string | null }
    type BrandRow = { id: string; company_name: string; logo_url: string | null }
    let creators: CreatorRow[] = []
    let brands: BrandRow[] = []

    if (creatorIds.length > 0) {
      const { data } = await supabase
        .from('creators')
        .select('id, username, display_name, profile_photo_url')
        .in('id', creatorIds)
      creators = data || []
    }

    if (brandIds.length > 0) {
      const { data } = await supabase
        .from('brands')
        .select('id, company_name, logo_url')
        .in('id', brandIds)
      brands = data || []
    }

    // Combine data
    const dealsWithRelations = deals.map(deal => ({
      ...deal,
      creator: creators.find(c => c.id === deal.creator_id) || null,
      brand: brands.find(b => b.id === deal.brand_id) || null,
    }))

    return NextResponse.json({ deals: dealsWithRelations })

  } catch (error) {
    console.error('Deals fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new deal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateDealSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      creator_id,
      brand_id,
      service_id,
      title,
      description,
      content_type,
      platform,
      requirements,
      deliverables,
      amount,
      deadline,
      delivery_days,
      revisions_allowed,
    } = parsed.data

    // Ensure the authenticated brand is creating the deal for themselves
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    if (callerUserType !== 'brand' || callerProfileId !== brand_id) {
      return NextResponse.json(
        { error: 'You can only create deals as your own brand' },
        { status: 403 }
      )
    }

    const supabase = createServerSupabase()

    // Calculate platform fee (10%)
    const platformFee = amount * 0.10
    const creatorPayout = amount - platformFee

    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        creator_id,
        brand_id,
        service_id: service_id || null,
        title,
        description: description || null,
        content_type: content_type || null,
        platform: platform || null,
        requirements: requirements || null,
        deliverables: deliverables || [],
        amount,
        platform_fee: platformFee,
        creator_payout: creatorPayout,
        currency: 'USD',
        deadline: deadline || null,
        delivery_days: delivery_days || 7,
        revisions_allowed: revisions_allowed || 1,
        revisions_used: 0,
        status: 'pending',
        status_updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating deal:', error)
      return NextResponse.json(
        { error: 'Failed to create deal' },
        { status: 500 }
      )
    }

    // Notify the creator that they have a new deal offer
    const creatorUserId = await getUserIdFromCreator(supabase, creator_id)
    if (creatorUserId) {
      await createNotification(supabase, {
        userId: creatorUserId,
        type: 'deal_created',
        title: 'New deal offer',
        message: `You received a new deal offer: "${title}"`,
        link: `/dashboard/deals/${deal.id}`,
      })
    }

    return NextResponse.json({
      message: 'Deal created successfully',
      deal,
    }, { status: 201 })

  } catch (error) {
    console.error('Deal creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
