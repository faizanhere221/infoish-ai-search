import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET - List brands
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServerSupabase()

    const { data: brands, error, count } = await supabase
      .from('brands')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching brands:', error)
      return NextResponse.json(
        { error: 'Failed to fetch brands' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      brands,
      total: count,
      limit,
      offset,
    })

  } catch (error) {
    console.error('Brands fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create brand profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Creating brand with data:', body)

    const {
      user_id,
      company_name,
      company_website,
      logo_url,
      description,
      industry,
      company_size,
      country,
      contact_name,
      contact_role,
    } = body

    // Validate required fields
    if (!user_id || !company_name || !country || !contact_name) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, company_name, country, contact_name' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Create brand profile
    const { data: brand, error } = await supabase
      .from('brands')
      .insert({
        user_id,
        company_name,
        company_website: company_website || null,
        logo_url: logo_url || null,
        description: description || null,
        industry: industry || null,
        company_size: company_size || null,
        country,
        contact_name,
        contact_role: contact_role || null,
        verification_status: 'pending',
        total_deals: 0,
        total_spent: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating brand:', error)
      return NextResponse.json(
        { error: 'Failed to create brand profile', details: error.message },
        { status: 500 }
      )
    }

    console.log('Brand created successfully:', brand)

    return NextResponse.json({
      message: 'Brand profile created successfully',
      brand,
    }, { status: 201 })

  } catch (error) {
    console.error('Brand creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}