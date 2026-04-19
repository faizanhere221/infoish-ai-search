import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'

const CreateNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum([
    'deal_created', 'deal_accepted', 'deal_declined',
    'deal_delivered', 'deal_approved', 'deal_completed', 'new_message',
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  link: z.string().max(500).optional().nullable(),
})

const MarkReadSchema = z.object({
  id: z.string().uuid().optional(),   // single notification; omit to mark all
  all: z.boolean().optional(),        // explicit flag to mark all
})

// GET /api/notifications — paginated list for the authenticated user
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 50)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)
  const unreadOnly = searchParams.get('unread') === 'true'

  const supabase = createServerSupabase()

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data: notifications, error, count } = await query

  if (error) {
    console.error('Error fetching notifications:', error.message)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }

  const unreadCount = unreadOnly
    ? (count ?? 0)
    : await getUnreadCount(supabase, userId)

  return NextResponse.json({
    notifications: notifications ?? [],
    unread_count: unreadCount,
    pagination: {
      limit,
      offset,
      total: count ?? 0,
      has_more: offset + limit < (count ?? 0),
    },
  })
}

// POST /api/notifications — internal use: create a notification for any user
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateNotificationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = createServerSupabase()
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: parsed.data.user_id,
      type: parsed.data.type,
      title: parsed.data.title,
      message: parsed.data.message,
      link: parsed.data.link ?? null,
      is_read: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error.message)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }

  return NextResponse.json({ notification }, { status: 201 })
}

// PATCH /api/notifications — mark one or all notifications as read
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = MarkReadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = createServerSupabase()
  const readAt = new Date().toISOString()

  if (parsed.data.id) {
    // Mark single notification — verify ownership
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', parsed.data.id)
      .eq('user_id', userId) // ownership enforced here
    if (error) {
      console.error('Error marking notification read:', error.message)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Notification marked as read' })
  }

  // Mark all unread notifications for this user
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications read:', error.message)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }

  return NextResponse.json({ message: 'All notifications marked as read' })
}

async function getUnreadCount(supabase: ReturnType<typeof createServerSupabase>, userId: string) {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  return count ?? 0
}
