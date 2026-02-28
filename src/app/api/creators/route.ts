import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET - List/Search creators
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const niche = searchParams.get('niche')
    const platform = searchParams.get('platform')
    const minFollowers = searchParams.get('minFollowers')
    const maxFollowers = searchParams.get('maxFollowers')
    const country = searchParams.get('country')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServerSupabase()

    console.log('Fetching creators...')

    // First, fetch creators without relations
    let query = supabase
      .from('creators')
      .select('*', { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    if (niche) {
      query = query.contains('niches', [niche])
    }

    if (country) {
      query = query.eq('country', country)
    }

    if (minFollowers) {
      query = query.gte('total_followers', parseInt(minFollowers))
    }

    if (maxFollowers) {
      query = query.lte('total_followers', parseInt(maxFollowers))
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)
    
    // Order by created_at (newest first) as a fallback
    query = query.order('created_at', { ascending: false })

    const { data: creators, error, count } = await query

    if (error) {
      console.error('Error fetching creators:', error)
      return NextResponse.json(
        { error: 'Failed to fetch creators', details: error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${creators?.length || 0} creators`)

    // If no creators found, return empty array
    if (!creators || creators.length === 0) {
      return NextResponse.json({
        creators: [],
        total: 0,
        limit,
        offset,
      })
    }

    // Fetch platforms for all creators
    const creatorIds = creators.map(c => c.id)
    
    const { data: platforms } = await supabase
      .from('creator_platforms')
      .select('*')
      .in('creator_id', creatorIds)

    // Fetch services for all creators
    const { data: services } = await supabase
      .from('creator_services')
      .select('*')
      .in('creator_id', creatorIds)
      .eq('is_active', true)

    // Combine data
    const creatorsWithRelations = creators.map(creator => ({
      ...creator,
      creator_platforms: platforms?.filter(p => p.creator_id === creator.id) || [],
      creator_services: services?.filter(s => s.creator_id === creator.id) || [],
    }))

    console.log(`Returning ${creatorsWithRelations.length} creators with relations`)

    return NextResponse.json({
      creators: creatorsWithRelations,
      total: count,
      limit,
      offset,
    })

  } catch (error) {
    console.error('Creators fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create creator profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      username,
      display_name,
      bio,
      country,
      city,
      niches,
      languages,
      platforms,
    } = body

    // Validate required fields
    if (!user_id || !username || !display_name) {
      return NextResponse.json(
        { error: 'user_id, username, and display_name are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Check if username is taken
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (existingCreator) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    // Create creator profile
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .insert({
        user_id,
        username: username.toLowerCase(),
        display_name,
        bio: bio || null,
        country: country || null,
        city: city || null,
        niches: niches || [],
        languages: languages || [],
        verification_status: 'pending',
        is_available: true,
        total_followers: 0,
        completed_deals: 0,
        total_reviews: 0,
      })
      .select()
      .single()

    if (creatorError) {
      console.error('Error creating creator profile:', creatorError)
      return NextResponse.json(
        { error: 'Failed to create creator profile' },
        { status: 500 }
      )
    }

    // Add platforms if provided
    if (platforms && platforms.length > 0) {
      const platformRecords = platforms.map((p: any) => ({
        creator_id: creator.id,
        platform: p.platform,
        platform_username: p.username || null,
        platform_url: p.url || null,
        followers: p.followers || 0,
      }))

      const { error: platformError } = await supabase
        .from('creator_platforms')
        .insert(platformRecords)

      if (platformError) {
        console.error('Error adding platforms:', platformError)
        // Don't fail the whole request, just log it
      }
    }

    return NextResponse.json({
      message: 'Creator profile created successfully',
      creator,
    }, { status: 201 })

  } catch (error) {
    console.error('Creator creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}