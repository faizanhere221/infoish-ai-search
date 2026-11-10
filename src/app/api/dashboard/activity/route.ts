import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Conversations read per call. A profile with more than this still gets a
// correct "something changed" signal from the newest rows; the unread sum
// would then undercount, which only affects the header number.
const CONVERSATION_CAP = 500

// GET /api/dashboard/activity
// The cheap "anything new?" check behind every poll in the logged-in app
// (header badges, notification bell, inbox list). Two small indexed reads,
// run in parallel:
//   - conversations: unread columns + last_message_at for the caller's side
//     (index on (creator_id|brand_id, last_message_at DESC))
//   - notifications: unread count + newest unread created_at
//     (partial index on (user_id, created_at DESC) WHERE is_read = FALSE)
// The client compares `messages.version` / `notifications.version` with
// what it already holds and fetches the full list only when one changed.
// ?badges=1 adds the nav count (brand: published campaigns, creator:
// applications); the client asks for it once per page, not on every poll.
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const profileId = request.headers.get('x-profile-id')
    const userType = request.headers.get('x-user-type')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isParty = Boolean(profileId) && (userType === 'brand' || userType === 'creator')
    const withBadges = new URL(request.url).searchParams.get('badges') === '1'
    const supabase = createServerSupabase()

    const conversationsQuery = isParty
      ? supabase
          .from('conversations')
          .select('creator_unread, brand_unread, last_message_at')
          .eq(userType === 'brand' ? 'brand_id' : 'creator_id', profileId as string)
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .limit(CONVERSATION_CAP)
      : null

    const notificationsQuery = supabase
      .from('notifications')
      .select('created_at', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(1)

    const badgeQuery = withBadges && isParty
      ? userType === 'brand'
        ? supabase
            .from('campaigns')
            .select('id', { count: 'exact', head: true })
            .eq('brand_id', profileId as string)
            .eq('status', 'published')
        : supabase
            .from('campaign_applications')
            .select('id', { count: 'exact', head: true })
            .eq('creator_id', profileId as string)
      : null

    const [conversationsRes, notificationsRes, badgeRes] = await Promise.all([
      conversationsQuery,
      notificationsQuery,
      badgeQuery,
    ])

    if (conversationsRes?.error || notificationsRes.error || badgeRes?.error) {
      captureError(conversationsRes?.error ?? notificationsRes.error ?? badgeRes?.error, {
        route: 'GET /api/dashboard/activity',
      })
      return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 })
    }

    const conversations = conversationsRes?.data ?? []
    const unreadMessages = conversations.reduce(
      (sum, c) => sum + ((userType === 'brand' ? c.brand_unread : c.creator_unread) || 0),
      0
    )
    const unreadNotifications = notificationsRes.count ?? 0
    const newestUnread = notificationsRes.data?.[0]?.created_at ?? ''

    return NextResponse.json({
      activity: {
        messages: {
          unread: unreadMessages,
          version: `${conversations.length}:${conversations[0]?.last_message_at ?? ''}:${unreadMessages}`,
        },
        notifications: {
          unread: unreadNotifications,
          version: `${unreadNotifications}:${newestUnread}`,
        },
        ...(badgeRes ? { campaign_badge: badgeRes.count ?? 0 } : {}),
      },
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/dashboard/activity' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
