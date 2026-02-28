import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET - List deals for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const creatorId = searchParams.get('creator_id')
    const brandId = searchParams.get('brand_id')
    const status = searchParams.get('status')

    const supabase = createServerSupabase()

    console.log('Fetching deals...', { creatorId, brandId, status })

    // Fetch deals without relations first
    let query = supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })

    if (creatorId) {
      query = query.eq('creator_id', creatorId)
    }

    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: deals, error } = await query

    if (error) {
      console.error('Error fetching deals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch deals', details: error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${deals?.length || 0} deals`)

    if (!deals || deals.length === 0) {
      return NextResponse.json({ deals: [] })
    }

    // Fetch creators for these deals
    const creatorIds = [...new Set(deals.map(d => d.creator_id).filter(Boolean))]
    const brandIds = [...new Set(deals.map(d => d.brand_id).filter(Boolean))]

    let creators: any[] = []
    let brands: any[] = []

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
    } = body

    // Validate required fields
    if (!creator_id || !brand_id || !title || !amount) {
      return NextResponse.json(
        { error: 'creator_id, brand_id, title, and amount are required' },
        { status: 400 }
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