import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedConversation } from '@/lib/conversations'

const BUCKET = 'chat-attachments'
const SIGNED_URL_TTL_SECONDS = 300 // 5 minutes

// GET /api/conversations/[id]/attachments/sign?path=<storage path>
// Returns a short-lived signed URL for an attachment, after checking the
// caller is a party to the conversation AND that the path actually belongs
// to it (paths are namespaced "<conversationId>/...", so this also blocks a
// member of one conversation from guessing paths into another).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const callerProfileId = request.headers.get('x-profile-id')

    if (!callerProfileId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const path = request.nextUrl.searchParams.get('path')
    if (!path || !path.startsWith(`${conversationId}/`) || path.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const conversation = await loadAuthorizedConversation(supabase, conversationId, callerProfileId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

    if (error || !data) {
      captureError(error ?? new Error('createSignedUrl returned no data'), {
        route: 'GET /api/conversations/[id]/attachments/sign',
      })
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({ url: data.signedUrl, expires_in: SIGNED_URL_TTL_SECONDS })

  } catch (error) {
    captureError(error, { route: 'GET /api/conversations/[id]/attachments/sign' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
