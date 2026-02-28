import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET - List conversations for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creator_id')
    const brandId = searchParams.get('brand_id')
    const userId = searchParams.get('user_id')

    const supabase = createServerSupabase()

    console.log('Fetching conversations...', { creatorId, brandId, userId })

    // Build query
    let query = supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (creatorId) {
      query = query.eq('creator_id', creatorId)
    }

    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations', details: error.message },
        { status: 500 }
      )
    }

    console.log(`Found ${conversations?.length || 0} conversations`)

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // Fetch creators and brands for these conversations
    const creatorIds = [...new Set(conversations.map(c => c.creator_id).filter(Boolean))]
    const brandIds = [...new Set(conversations.map(c => c.brand_id).filter(Boolean))]

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
        .select('id, company_name, logo_url, contact_name')
        .in('id', brandIds)
      brands = data || []
    }

    // Combine data
    const conversationsWithRelations = conversations.map(conv => ({
      ...conv,
      creator: creators.find(c => c.id === conv.creator_id) || null,
      brand: brands.find(b => b.id === conv.brand_id) || null,
    }))

    return NextResponse.json({ conversations: conversationsWithRelations })

  } catch (error) {
    console.error('Conversations fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or get existing conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { creator_id, brand_id } = body

    if (!creator_id || !brand_id) {
      return NextResponse.json(
        { error: 'creator_id and brand_id are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('creator_id', creator_id)
      .eq('brand_id', brand_id)
      .single()

    if (existing) {
      // Fetch creator and brand info
      const { data: creator } = await supabase
        .from('creators')
        .select('id, username, display_name, profile_photo_url')
        .eq('id', creator_id)
        .single()

      const { data: brand } = await supabase
        .from('brands')
        .select('id, company_name, logo_url, contact_name')
        .eq('id', brand_id)
        .single()

      return NextResponse.json({
        conversation: {
          ...existing,
          creator,
          brand,
        },
        created: false,
      })
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        creator_id,
        brand_id,
        creator_unread: 0,
        brand_unread: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return NextResponse.json(
        { error: 'Failed to create conversation', details: error.message },
        { status: 500 }
      )
    }

    // Fetch creator and brand info
    const { data: creator } = await supabase
      .from('creators')
      .select('id, username, display_name, profile_photo_url')
      .eq('id', creator_id)
      .single()

    const { data: brand } = await supabase
      .from('brands')
      .select('id, company_name, logo_url, contact_name')
      .eq('id', brand_id)
      .single()

    return NextResponse.json({
      conversation: {
        ...conversation,
        creator,
        brand,
      },
      created: true,
    }, { status: 201 })

  } catch (error) {
    console.error('Conversation creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}