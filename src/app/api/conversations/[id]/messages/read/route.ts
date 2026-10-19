import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedConversation } from '@/lib/conversations'

export const dynamic = 'force-dynamic'

// POST - Mark all of the OTHER party's messages in this conversation as read
// for the authenticated caller, and zero the caller's own unread counter.
// A dedicated endpoint (not a GET side effect) so loading messages is a pure
// read and marking as read is an explicit, idempotent action.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
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

    const { error: messagesError } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', callerUserId)
      .eq('is_read', false)

    if (messagesError) {
      captureError(messagesError, { route: 'POST /api/conversations/[id]/messages/read' })
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
    }

    if (callerUserType === 'creator') {
      await supabase.from('conversations').update({ creator_unread: 0 }).eq('id', conversationId)
    } else if (callerUserType === 'brand') {
      await supabase.from('conversations').update({ brand_unread: 0 }).eq('id', conversationId)
    }

    return NextResponse.json({ message: 'Messages marked as read' })

  } catch (error) {
    captureError(error, { route: 'POST /api/conversations/[id]/messages/read' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
