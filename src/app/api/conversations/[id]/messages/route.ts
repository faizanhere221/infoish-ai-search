import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

// Loads the conversation and checks the caller (from trusted auth headers,
// never from a client-supplied id) is one of its two parties. Returns null
// if not found OR not a party — callers should respond 404 either way, so a
// stranger can't use the response to confirm a conversation id exists.
async function loadAuthorizedConversation(
  supabase: ReturnType<typeof createServerSupabase>,
  conversationId: string,
  callerProfileId: string | null
) {
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, creator_id, brand_id, creator_unread, brand_unread')
    .eq('id', conversationId)
    .single()

  if (!conversation) {return null}
  if (callerProfileId !== conversation.creator_id && callerProfileId !== conversation.brand_id) {
    return null
  }
  return conversation
}

// GET - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const callerProfileId = request.headers.get('x-profile-id')
    const supabase = createServerSupabase()

    const conversation = await loadAuthorizedConversation(supabase, conversationId, callerProfileId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      captureError(error, { route: 'GET /api/conversations/[id]/messages' })
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Mark-as-read side effect, scoped to the AUTHENTICATED caller only
    // (never a client-supplied user_id). Still a GET side effect for now —
    // Phase 1 step 3 moves this to a dedicated POST endpoint.
    const markAsRead = new URL(request.url).searchParams.get('mark_as_read')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')
    if (markAsRead === 'true' && callerUserId) {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', callerUserId)
        .eq('is_read', false)

      if (callerUserType === 'creator') {
        await supabase.from('conversations').update({ creator_unread: 0 }).eq('id', conversationId)
      } else if (callerUserType === 'brand') {
        await supabase.from('conversations').update({ brand_unread: 0 }).eq('id', conversationId)
      }
    }

    return NextResponse.json({ messages: messages || [] })

  } catch (error) {
    captureError(error, { route: 'GET /api/conversations/[id]/messages' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const MAX_MESSAGE_LENGTH = 5000

// POST - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const body = await request.json().catch(() => null)
    const content = typeof body?.content === 'string' ? body.content.trim() : ''

    if (!content || content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `content is required and must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
        { status: 400 }
      )
    }

    // Identity comes ONLY from the trusted auth headers, never the body —
    // otherwise any caller could send a message as any other user.
    const callerUserId = request.headers.get('x-user-id')
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    if (!callerUserId || !callerProfileId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = createServerSupabase()

    const conversation = await loadAuthorizedConversation(supabase, conversationId, callerProfileId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: callerUserId,
        content,
        attachments: [],
        is_read: false,
      })
      .select()
      .single()

    if (messageError) {
      captureError(messageError, { route: 'POST /api/conversations/[id]/messages' })
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    const updateData: {
      last_message_at: string
      last_message_preview: string
      updated_at: string
      brand_unread?: number
      creator_unread?: number
    } = {
      last_message_at: new Date().toISOString(),
      last_message_preview: content.substring(0, 100),
      updated_at: new Date().toISOString(),
    }

    if (callerUserType === 'creator') {
      updateData.brand_unread = (conversation.brand_unread || 0) + 1
    } else {
      updateData.creator_unread = (conversation.creator_unread || 0) + 1
    }

    await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)

    return NextResponse.json({
      message: 'Message sent successfully',
      data: message,
    }, { status: 201 })

  } catch (error) {
    captureError(error, { route: 'POST /api/conversations/[id]/messages' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}