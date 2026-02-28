import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET - Get brand by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { data: brand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ brand })

  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update brand profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const supabase = createServerSupabase()

    const { data: brand, error } = await supabase
      .from('brands')
      .update({
        company_name: body.company_name,
        company_website: body.company_website,
        logo_url: body.logo_url,
        description: body.description,
        industry: body.industry,
        company_size: body.company_size,
        country: body.country,
        contact_name: body.contact_name,
        contact_role: body.contact_role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating brand:', error)
      return NextResponse.json(
        { error: 'Failed to update brand' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Brand updated successfully',
      brand,
    })

  } catch (error) {
    console.error('Error updating brand:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}