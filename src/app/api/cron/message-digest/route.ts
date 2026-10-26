import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'
import { sendEmail } from '@/lib/email/send'
import { messageDigestTemplate } from '@/lib/email/templates/messageDigest'
import { signUnsubscribeToken } from '@/lib/email/unsubscribeToken'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'
const BATCH_LIMIT = 50
const UNREAD_MIN_AGE_MS = 15 * 60 * 1000
const DIGEST_THROTTLE_MS = 3 * 60 * 60 * 1000

// GET /api/cron/message-digest — not on Vercel's own cron (Hobby plan
// allows only one invocation a day, reserved for daily-summary). Call this
// one externally every 15 minutes — see docs/NOTIFICATIONS.md for the
// cron-job.org setup. Idempotent and batch-limited: each run only looks at
// conversations unread for 15+ minutes that haven't had a digest in the
// last 3 hours, and only ever sends one digest per conversation per run.
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerSupabase()
    const unreadSince = new Date(Date.now() - UNREAD_MIN_AGE_MS).toISOString()
    const throttleCutoff = new Date(Date.now() - DIGEST_THROTTLE_MS).toISOString()

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, creator_id, brand_id, creator_unread, brand_unread, last_message_at, last_digest_sent_at')
      .lte('last_message_at', unreadSince)
      .or('creator_unread.gt.0,brand_unread.gt.0')
      .or(`last_digest_sent_at.is.null,last_digest_sent_at.lte.${throttleCutoff}`)
      .limit(BATCH_LIMIT)

    if (error) {
      captureError(error, { route: 'GET /api/cron/message-digest' })
      return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 })
    }

    let sent = 0
    for (const convo of conversations ?? []) {
      let anySent = false

      if (convo.creator_unread > 0) {
        const recipientUserId = await getUserIdFromCreator(supabase, convo.creator_id)
        const { data: brand } = await supabase.from('brands').select('company_name').eq('id', convo.brand_id).single()
        const result = await sendDigest(supabase, {
          recipientUserId,
          otherPartyName: brand?.company_name || 'a brand',
          unreadCount: convo.creator_unread,
          conversationId: convo.id,
        })
        if (result) {anySent = true}
      }

      if (convo.brand_unread > 0) {
        const recipientUserId = await getUserIdFromBrand(supabase, convo.brand_id)
        const { data: creator } = await supabase.from('creators').select('display_name').eq('id', convo.creator_id).single()
        const result = await sendDigest(supabase, {
          recipientUserId,
          otherPartyName: creator?.display_name || 'a creator',
          unreadCount: convo.brand_unread,
          conversationId: convo.id,
        })
        if (result) {anySent = true}
      }

      if (anySent) {
        sent += 1
        await supabase.from('conversations').update({ last_digest_sent_at: new Date().toISOString() }).eq('id', convo.id)
      }
    }

    return NextResponse.json({ checked: conversations?.length ?? 0, digestsSent: sent })
  } catch (error) {
    captureError(error, { route: 'GET /api/cron/message-digest' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendDigest(
  supabase: ReturnType<typeof createServerSupabase>,
  params: { recipientUserId: string | null; otherPartyName: string; unreadCount: number; conversationId: string }
): Promise<boolean> {
  if (!params.recipientUserId) {return false}

  const { data: user } = await supabase.from('users').select('email, email_preferences').eq('id', params.recipientUserId).single()
  if (!user?.email) {return false}
  const prefs = (user.email_preferences ?? {}) as Record<string, boolean>
  if (prefs.messages === false) {return false}

  const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?token=${signUnsubscribeToken(params.recipientUserId, 'messages')}`
  const template = messageDigestTemplate({
    otherPartyName: params.otherPartyName,
    unreadCount: params.unreadCount,
    conversationUrl: `${APP_URL}/messages/${params.conversationId}`,
    manageSettingsUrl: `${APP_URL}/settings`,
    unsubscribeUrl,
  })

  // Hour-bucketed key: the 3-hour throttle on conversations.last_digest_sent_at
  // is the real guard against resending; this is just the structural
  // backstop against two overlapping cron runs double-sending the exact
  // same digest.
  const hourBucket = new Date().toISOString().slice(0, 13)
  const result = await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    category: 'messages',
    template: 'message_digest',
    idempotencyKey: `digest:${params.conversationId}:${params.recipientUserId}:${hourBucket}`,
    userId: params.recipientUserId,
    deferrable: true,
    unsubscribeUrl,
  })
  return result.sent
}
