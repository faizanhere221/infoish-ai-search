import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET - Get creator by ID or username
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    console.log('Fetching creator:', id)

    // Check if it's a UUID or username
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    let creator = null

    if (isUUID) {
      // Try user_id first
      const { data: byUserId } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', id)
        .single()
      
      if (byUserId) {
        creator = byUserId
      } else {
        // Try id
        const { data: byId } = await supabase
          .from('creators')
          .select('*')
          .eq('id', id)
          .single()
        
        if (byId) {
          creator = byId
        }
      }
    } else {
      // Try username
      const { data: byUsername } = await supabase
        .from('creators')
        .select('*')
        .eq('username', id.toLowerCase())
        .single()
      
      if (byUsername) {
        creator = byUsername
      }
    }

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Fetch platforms separately
    const { data: platforms } = await supabase
      .from('creator_platforms')
      .select('*')
      .eq('creator_id', creator.id)

    // Fetch services separately
    const { data: services } = await supabase
      .from('creator_services')
      .select('*')
      .eq('creator_id', creator.id)
      .eq('is_active', true)

    console.log('Found creator:', creator.username)
    console.log('Found platforms:', platforms?.length || 0)
    console.log('Found services:', services?.length || 0)

    // Combine the data
    const creatorWithRelations = {
      ...creator,
      creator_platforms: platforms || [],
      creator_services: services || [],
    }

    return NextResponse.json({ creator: creatorWithRelations })

  } catch (error) {
    console.error('Error fetching creator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update creator profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const supabase = createServerSupabase()

    const { data: creator, error } = await supabase
      .from('creators')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating creator:', error)
      return NextResponse.json(
        { error: 'Failed to update creator' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Creator updated successfully',
      creator,
    })

  } catch (error) {
    console.error('Error updating creator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}