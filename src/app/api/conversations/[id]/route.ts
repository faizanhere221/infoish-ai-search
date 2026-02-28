import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET - Get conversation by ID with messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    // Fetch conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Fetch creator and brand
    const { data: creator } = await supabase
      .from('creators')
      .select('id, username, display_name, profile_photo_url')
      .eq('id', conversation.creator_id)
      .single()

    const { data: brand } = await supabase
      .from('brands')
      .select('id, company_name, logo_url, contact_name')
      .eq('id', conversation.brand_id)
      .single()

    // Fetch messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      conversation: {
        ...conversation,
        creator,
        brand,
        messages: messages || [],
      },
    })

  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Conversation deleted' })

  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}