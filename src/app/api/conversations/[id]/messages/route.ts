import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedConversation } from '@/lib/conversations'
import { getUserIdFromCreator, getUserIdFromBrand } from '@/lib/notifications'
import { emitNewMessageNotification } from '@/lib/events/emit'
import type { Attachment } from '@/types/marketplace'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100
const MAX_MESSAGE_LENGTH = 5000

// Cursors are "<created_at ISO timestamp>|<message id>" — the pair makes the
// ordering unambiguous even when two messages share a created_at timestamp.
function parseCursor(raw: string | null): { createdAt: string; id: string } | null {
  if (!raw) {return null}
  const sep = raw.lastIndexOf('|')
  if (sep === -1) {return null}
  const createdAt = raw.slice(0, sep)
  const id = raw.slice(sep + 1)
  if (!createdAt || !id) {return null}
  return { createdAt, id }
}

// GET - Paginated messages for a conversation.
// - No cursor: newest `limit` messages (initial load).
// - `before`: messages strictly older than the cursor (load older history).
// - `after`: messages strictly newer than the cursor (poll for new messages).
// Never an unbounded select — every path is capped at `limit`.
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

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT, 1), MAX_LIMIT)
    const before = parseCursor(searchParams.get('before'))
    const after = parseCursor(searchParams.get('after'))

    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)

    if (after) {
      // Strictly newer than the cursor — ascending, so new messages arrive
      // in order during polling.
      query = query
        .or(`created_at.gt.${after.createdAt},and(created_at.eq.${after.createdAt},id.gt.${after.id})`)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(limit)
    } else if (before) {
      // Strictly older than the cursor — fetch descending (closest-to-cursor
      // first) then reverse below so the response is always chronological.
      query = query
        .or(`created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id})`)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit)
    } else {
      // Initial load — newest page, reversed to chronological below.
      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit)
    }

    const { data, error } = await query

    if (error) {
      captureError(error, { route: 'GET /api/conversations/[id]/messages' })
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    const rows = data || []
    // after-mode is already ascending; before/initial were fetched newest-first
    // and need reversing to chronological order.
    const messages = after ? rows : [...rows].reverse()

    const hasMore = !after && rows.length === limit
    const nextBeforeCursor = messages.length > 0 ? `${messages[0].created_at}|${messages[0].id}` : null
    const nextAfterCursor = messages.length > 0
      ? `${messages[messages.length - 1].created_at}|${messages[messages.length - 1].id}`
      : (after ? `${after.createdAt}|${after.id}` : null)

    return NextResponse.json({
      messages,
      has_more: hasMore,
      next_before_cursor: nextBeforeCursor,
      next_after_cursor: nextAfterCursor,
    })

  } catch (error) {
    captureError(error, { route: 'GET /api/conversations/[id]/messages' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Send a new message. Insert + conversation preview/unread update
// happen atomically in a single Postgres function (send_conversation_message,
// see supabase/phase1_messaging_migration.sql) so concurrent sends from both
// sides of a conversation can never lose an unread-count increment to a
// read-modify-write race.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const body = await request.json().catch(() => null)
    const content = typeof body?.content === 'string' ? body.content.trim() : ''
    const attachments: Attachment[] = Array.isArray(body?.attachments) ? body.attachments : []

    if ((!content && attachments.length === 0) || content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `content (or at least one attachment) is required; content must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
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
    if (callerUserType !== 'creator' && callerUserType !== 'brand') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = createServerSupabase()

    const conversation = await loadAuthorizedConversation(supabase, conversationId, callerProfileId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: message, error: rpcError } = await supabase
      .rpc('send_conversation_message', {
        p_conversation_id: conversationId,
        p_sender_id: callerUserId,
        p_content: content,
        p_sender_type: callerUserType,
        p_attachments: attachments,
      })
      .single()

    if (rpcError || !message) {
      // Full Postgres/PostgREST error detail server-side (code/message/
      // details/hint) — e.g. "42883 operator does not exist: character
      // varying = uuid" is how a parameter-type mismatch in the
      // send_conversation_message() function (see
      // supabase/phase4_fixes_migration.sql) actually surfaces. The
      // client-facing message stays generic; this is what you'd check in
      // the server terminal/Sentry, not in the browser.
      captureError(rpcError ?? new Error('send_conversation_message returned no row'), {
        route: 'POST /api/conversations/[id]/messages',
        code: rpcError?.code,
        details: rpcError?.details,
        hint: rpcError?.hint,
        pgMessage: rpcError?.message,
      })
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    const recipientUserId = callerProfileId === conversation.creator_id
      ? await getUserIdFromBrand(supabase, conversation.brand_id)
      : await getUserIdFromCreator(supabase, conversation.creator_id)
    await emitNewMessageNotification(supabase, {
      conversationId,
      senderUserId: callerUserId,
      recipientUserId,
      preview: content ? content.substring(0, 100) : 'Sent an attachment',
    })

    return NextResponse.json({
      message: 'Message sent successfully',
      data: message,
    }, { status: 201 })

  } catch (error) {
    captureError(error, { route: 'POST /api/conversations/[id]/messages' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
