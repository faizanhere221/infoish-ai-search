import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

// Contact info detection patterns
const CONTACT_PATTERNS = [
  /\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi, // Email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone
  /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|t\.me|wa\.me|calendly\.com)\/\S+/gi, // External platforms
]

function containsContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some(pattern => pattern.test(text))
}

// GET /api/messages - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const conversationId = searchParams.get('conversation_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const before = searchParams.get('before') // cursor for pagination
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabase()
    
    // Build query
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (before) {
      query = query.lt('created_at', before)
    }
    
    const { data: messages, error } = await query
    
    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }
    
    // Reverse to get chronological order
    const sortedMessages = (messages || []).reverse()
    
    return NextResponse.json({
      messages: sortedMessages,
      hasMore: messages?.length === limit,
    })
    
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      conversation_id,
      sender_id,
      sender_type,
      content,
      attachments,
    } = body
    
    // Validate required fields
    if (!conversation_id || !sender_id || !sender_type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate sender_type
    if (!['creator', 'brand'].includes(sender_type)) {
      return NextResponse.json(
        { error: 'Invalid sender_type' },
        { status: 400 }
      )
    }
    
    // Check for contact info (warning only, still allow)
    const hasContactInfo = containsContactInfo(content)
    
    const supabase = createServerSupabase()
    
    // Verify conversation exists and user is part of it
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .single()
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }
    
    // Verify sender is part of conversation
    const isCreator = sender_type === 'creator' && sender_id === conversation.creator_id
    const isBrand = sender_type === 'brand' && sender_id === conversation.brand_id
    
    if (!isCreator && !isBrand) {
      return NextResponse.json(
        { error: 'Unauthorized to send messages in this conversation' },
        { status: 403 }
      )
    }
    
    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id,
        sender_type,
        content,
        attachments: attachments || [],
        is_read: false,
        is_system_message: false,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error sending message:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }
    
    // Update conversation
    const unreadField = sender_type === 'creator' 
      ? 'brand_unread_count' 
      : 'creator_unread_count'
    
    const currentUnread = sender_type === 'creator'
      ? conversation.brand_unread_count
      : conversation.creator_unread_count
    
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
        [unreadField]: (currentUnread || 0) + 1,
      })
      .eq('id', conversation_id)
    
    // TODO: Send push notification / email to recipient
    
    return NextResponse.json({
      message,
      warning: hasContactInfo ? 'Contact information detected. Remember to keep transactions on-platform for secure payments.' : null,
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/messages - Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation_id, reader_type } = body
    
    if (!conversation_id || !reader_type) {
      return NextResponse.json(
        { error: 'conversation_id and reader_type are required' },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabase()
    
    // Mark messages as read
    const { error: messagesError } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversation_id)
      .neq('sender_type', reader_type)
      .eq('is_read', false)
    
    if (messagesError) {
      console.error('Error marking messages as read:', messagesError)
    }
    
    // Reset unread count
    const unreadField = reader_type === 'creator' 
      ? 'creator_unread_count' 
      : 'brand_unread_count'
    
    await supabase
      .from('conversations')
      .update({ [unreadField]: 0 })
      .eq('id', conversation_id)
    
    return NextResponse.json({
      message: 'Messages marked as read',
    })
    
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}