import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'

const UpdateBrandSchema = z.object({
  company_name: z.string().min(1).max(200).optional(),
  company_website: z.string().max(500).optional().nullable(),
  logo_url: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  company_size: z.string().max(50).optional().nullable(),
  country: z.string().min(1).max(100).optional(),
  contact_name: z.string().min(1).max(200).optional(),
  contact_role: z.string().max(100).optional().nullable(),
})

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
      .select('id, company_name, logo_url, industry, country, contact_name, contact_role, description, company_website, company_size, verification_status, created_at, updated_at')
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

    const parsed = UpdateBrandSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Verify ownership: caller's user_id must match brand's user_id
    const callerUserId = request.headers.get('x-user-id')
    const { data: existing } = await supabase
      .from('brands')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    if (existing.user_id !== callerUserId) {
      return NextResponse.json(
        { error: 'You are not authorized to update this brand profile' },
        { status: 403 }
      )
    }

    const { data: brand, error } = await supabase
      .from('brands')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
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
