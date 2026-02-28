import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// GET - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const { searchParams } = new URL(request.url)
    const markAsRead = searchParams.get('mark_as_read')
    const userId = searchParams.get('user_id')
    
    const supabase = createServerSupabase()

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // If markAsRead is true and userId is provided, mark messages as read
    if (markAsRead === 'true' && userId) {
      // Mark all messages from OTHER users as read
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false)

      // Reset unread count for this user
      const { data: conversation } = await supabase
        .from('conversations')
        .select('creator_id, brand_id')
        .eq('id', conversationId)
        .single()

      if (conversation) {
        // Get user type
        const { data: creator } = await supabase
          .from('creators')
          .select('user_id')
          .eq('user_id', userId)
          .single()

        if (creator) {
          // User is a creator, reset creator_unread
          await supabase
            .from('conversations')
            .update({ creator_unread: 0 })
            .eq('id', conversationId)
        } else {
          // User is a brand, reset brand_unread
          await supabase
            .from('conversations')
            .update({ brand_unread: 0 })
            .eq('id', conversationId)
        }
      }
    }

    return NextResponse.json({ messages: messages || [] })

  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const body = await request.json()
    const { sender_id, content, sender_type } = body

    if (!sender_id || !content) {
      return NextResponse.json(
        { error: 'sender_id and content are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id,
        content,
        attachments: [],
        is_read: false,
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { error: 'Failed to send message', details: messageError.message },
        { status: 500 }
      )
    }

    // Get conversation to update unread counts
    const { data: conversation } = await supabase
      .from('conversations')
      .select('creator_id, brand_id, creator_unread, brand_unread')
      .eq('id', conversationId)
      .single()

    if (conversation) {
      // Determine sender type by checking if sender is a creator
      const { data: creator } = await supabase
        .from('creators')
        .select('user_id')
        .eq('user_id', sender_id)
        .single()

      let updateData: any = {
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
        updated_at: new Date().toISOString(),
      }

      if (creator) {
        // Sender is creator, increment brand's unread count
        updateData.brand_unread = (conversation.brand_unread || 0) + 1
      } else {
        // Sender is brand, increment creator's unread count
        updateData.creator_unread = (conversation.creator_unread || 0) + 1
      }

      await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId)

      console.log('Updated conversation unread counts:', updateData)
    }

    return NextResponse.json({
      message: 'Message sent successfully',
      data: message,
    }, { status: 201 })

  } catch (error) {
    console.error('Message creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}