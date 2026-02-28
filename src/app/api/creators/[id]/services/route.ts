import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// PUT - Update creator services
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { services } = await request.json()
    
    console.log('Updating services for creator:', id)
    console.log('Services to save:', JSON.stringify(services, null, 2))
    
    const supabase = createServerSupabase()

    // Delete existing services for this creator
    const { error: deleteError } = await supabase
      .from('creator_services')
      .delete()
      .eq('creator_id', id)

    if (deleteError) {
      console.error('Error deleting existing services:', deleteError)
      // Continue anyway - table might be empty
    }

    // Insert new services if any
    if (services && services.length > 0) {
      const serviceRecords = services.map((s: any) => ({
        creator_id: id,
        title: s.title || 'Untitled Service',
        description: s.description || null,
        content_type: s.content_type || null,
        platform: s.platform || null,
        price: parseFloat(s.price) || 0,
        currency: 'USD',
        delivery_days: parseInt(s.delivery_days) || 7,
        revisions_included: parseInt(s.revisions_included) || 1,
        is_active: s.is_active !== false,
      }))

      console.log('Inserting service records:', JSON.stringify(serviceRecords, null, 2))

      const { data, error } = await supabase
        .from('creator_services')
        .insert(serviceRecords)
        .select()

      if (error) {
        console.error('Error inserting services:', error)
        return NextResponse.json(
          { error: 'Failed to save services', details: error.message, code: error.code },
          { status: 500 }
        )
      }

      console.log('Services saved successfully:', data)
    }

    return NextResponse.json({
      message: 'Services updated successfully',
    })

  } catch (error) {
    console.error('Error in services API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get services for a creator
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { data: services, error } = await supabase
      .from('creator_services')
      .select('*')
      .eq('creator_id', id)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      )
    }

    return NextResponse.json({ services: services || [] })

  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}