import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'

const CATEGORIES = ['messages', 'offers', 'contracts', 'work', 'payments', 'account'] as const

const MarkSchema = z.object({
  id: z.string().min(1).optional(), // single notification; omit + all:true for bulk
  all: z.boolean().optional(),
  read: z.boolean().optional(), // defaults to true — PATCH exists to mark read/archived, not unread
  archived: z.boolean().optional(),
})

// Cursor is "<created_at ISO timestamp>|<id>", same composite-cursor
// convention as GET /api/conversations/[id]/messages — unambiguous even
// when two notifications share a created_at timestamp.
function parseCursor(raw: string | null): { createdAt: string; id: string } | null {
  if (!raw) {return null}
  const sep = raw.lastIndexOf('|')
  if (sep === -1) {return null}
  const createdAt = raw.slice(0, sep)
  const id = raw.slice(sep + 1)
  if (!createdAt || !id) {return null}
  return { createdAt, id }
}

// GET /api/notifications — cursor-paginated list for the authenticated
// user. ?category=offers|contracts|work|payments|messages|account,
// ?priority=action, ?archived=true (defaults to false — archived
// notifications are hidden from the normal list), ?unread=true,
// ?before=<cursor> for infinite scroll.
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 50)
  const unreadOnly = searchParams.get('unread') === 'true'
  const showArchived = searchParams.get('archived') === 'true'
  const category = searchParams.get('category')
  const priority = searchParams.get('priority')
  const before = parseCursor(searchParams.get('before'))

  const supabase = createServerSupabase()

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  query = showArchived ? query.not('archived_at', 'is', null) : query.is('archived_at', null)
  if (unreadOnly) {query = query.eq('is_read', false)}
  if (category && (CATEGORIES as readonly string[]).includes(category)) {query = query.eq('category', category)}
  if (priority === 'action' || priority === 'info') {query = query.eq('priority', priority)}
  if (before) {
    query = query.or(`created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id})`)
  }

  const { data: notifications, error } = await query

  if (error) {
    captureError(error, { route: 'GET /api/notifications' })
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }

  const rows = notifications ?? []
  const unreadCount = await getUnreadCount(supabase, userId)
  const nextCursor = rows.length === limit ? `${rows[rows.length - 1].created_at}|${rows[rows.length - 1].id}` : null

  return NextResponse.json({
    notifications: rows,
    unread_count: unreadCount,
    has_more: rows.length === limit,
    next_cursor: nextCursor,
  })
}

// PATCH /api/notifications — mark one/all as read, or archive one.
// { id, archived: true }        -> archive a single notification
// { id }  /  { id, read: true } -> mark a single notification read
// { all: true }                 -> mark every unread notification read
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = MarkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = createServerSupabase()

  if (parsed.data.id) {
    const updates: Record<string, unknown> = {}
    if (parsed.data.archived !== undefined) {
      updates.archived_at = parsed.data.archived ? new Date().toISOString() : null
    }
    if (parsed.data.archived === undefined || parsed.data.read !== undefined) {
      const markRead = parsed.data.read ?? true
      updates.is_read = markRead
      updates.read_at = markRead ? new Date().toISOString() : null
    }

    const { error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', parsed.data.id)
      .eq('user_id', userId) // ownership enforced here
    if (error) {
      captureError(error, { route: 'PATCH /api/notifications' })
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Notification updated' })
  }

  if (parsed.data.all) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      captureError(error, { route: 'PATCH /api/notifications' })
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }
    return NextResponse.json({ message: 'All notifications marked as read' })
  }

  return NextResponse.json({ error: 'Must provide either id or all:true' }, { status: 400 })
}

async function getUnreadCount(supabase: ReturnType<typeof createServerSupabase>, userId: string) {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .is('archived_at', null)
  return count ?? 0
}
