import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'

const CreateConversationSchema = z.object({
  creator_id: z.string().uuid(),
  brand_id: z.string().uuid(),
})

// GET - List conversations for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creator_id')
    const brandId = searchParams.get('brand_id')

    const supabase = createServerSupabase()

    // Scope to caller's own conversations only — ignore any client-supplied
    // id for the caller's own side, forcing it to their authenticated profile.
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    const effectiveCreatorId = callerUserType === 'creator' ? callerProfileId : creatorId
    const effectiveBrandId = callerUserType === 'brand' ? callerProfileId : brandId

    if (!effectiveCreatorId && !effectiveBrandId) {
      return NextResponse.json({ conversations: [] })
    }

    // Build query
    let query = supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (effectiveCreatorId) {
      query = query.eq('creator_id', effectiveCreatorId)
    }

    if (effectiveBrandId) {
      query = query.eq('brand_id', effectiveBrandId)
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // Fetch creators and brands for these conversations
    const creatorIds = [...new Set(conversations.map(c => c.creator_id).filter(Boolean))]
    const brandIds = [...new Set(conversations.map(c => c.brand_id).filter(Boolean))]

    type CreatorSummary = { id: string; username: string; display_name: string; profile_photo_url: string | null }
    type BrandSummary = { id: string; company_name: string; logo_url: string | null; contact_name: string | null }
    let creators: CreatorSummary[] = []
    let brands: BrandSummary[] = []

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
    const parsed = CreateConversationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { creator_id, brand_id } = parsed.data

    // Caller must be one of the two parties in the conversation
    const callerProfileId = request.headers.get('x-profile-id')
    if (callerProfileId !== creator_id && callerProfileId !== brand_id) {
      return NextResponse.json(
        { error: 'You can only start conversations you are a party to' },
        { status: 403 }
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
        { error: 'Failed to create conversation' },
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