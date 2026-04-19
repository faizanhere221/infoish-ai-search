import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'

const UpdateCreatorSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(2000).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  website_url: z.string().url().max(500).optional().nullable(),
  is_available: z.boolean().optional(),
  min_rate: z.number().nonnegative().optional().nullable(),
  max_rate: z.number().nonnegative().optional().nullable(),
  categories: z.array(z.string()).optional(),
  profile_photo_url: z.string().url().max(500).optional().nullable(),
})

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
    const supabase = createServerSupabase()

    // Validate and whitelist input fields
    const body = await request.json()
    const parsed = UpdateCreatorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Verify ownership: the caller's user_id must match the creator's user_id
    const callerUserId = request.headers.get('x-user-id')
    const { data: existing } = await supabase
      .from('creators')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (existing.user_id !== callerUserId) {
      return NextResponse.json(
        { error: 'You are not authorized to update this profile' },
        { status: 403 }
      )
    }

    const { data: creator, error } = await supabase
      .from('creators')
      .update({
        ...parsed.data,
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