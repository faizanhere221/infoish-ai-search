import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'

const CreateBrandSchema = z.object({
  user_id: z.string().uuid(),
  company_name: z.string().min(1).max(200),
  company_website: z.string().max(500).optional().nullable(),
  logo_url: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  company_size: z.string().max(50).optional().nullable(),
  country: z.string().min(1).max(100),
  contact_name: z.string().min(1).max(200),
  contact_role: z.string().max(100).optional().nullable(),
})

// Public fields safe to expose in list views
const PUBLIC_BRAND_FIELDS = 'id, company_name, logo_url, industry, country, contact_name, verification_status, created_at'

// GET - List brands (public fields only, capped limit)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    const supabase = createServerSupabase()

    const { data: brands, error, count } = await supabase
      .from('brands')
      .select(PUBLIC_BRAND_FIELDS, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching brands:', error)
      return NextResponse.json(
        { error: 'Failed to fetch brands' },
        { status: 500 }
      )
    }

    return NextResponse.json({ brands, total: count, limit, offset })

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
    const parsed = CreateBrandSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

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
    } = parsed.data

    // Verify caller is creating their own brand profile
    const callerUserId = request.headers.get('x-user-id')
    if (callerUserId !== user_id) {
      return NextResponse.json(
        { error: 'You can only create a brand profile for your own account' },
        { status: 403 }
      )
    }

    const supabase = createServerSupabase()

    const { data: brand, error } = await supabase
      .from('brands')
      .insert({
        user_id,
        company_name,
        company_website: company_website ?? null,
        logo_url: logo_url ?? null,
        description: description ?? null,
        industry: industry ?? null,
        company_size: company_size ?? null,
        country,
        contact_name,
        contact_role: contact_role ?? null,
        verification_status: 'pending',
        total_deals: 0,
        total_spent: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating brand:', error)
      return NextResponse.json(
        { error: 'Failed to create brand profile' },
        { status: 500 }
      )
    }

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
