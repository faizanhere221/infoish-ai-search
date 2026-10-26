import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const CATEGORIES = ['spam', 'harassment', 'scam', 'inappropriate', 'impersonation', 'other']

const ReportSchema = z.object({
  reported_user_id: z.string().min(1),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  note: z.string().max(2000).optional(),
  message_id: z.string().optional(),
  conversation_id: z.string().optional(),
})

// POST /api/reports — report a message or a user, from the chat thread or
// a public profile. Rate limited (5/hour per reporter) so this can't be
// used to spam the moderation queue.
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const profileId = request.headers.get('x-profile-id')
    const userType = request.headers.get('x-user-type')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allowed, retryAfterMs } = await rateLimit(`report:${userId}`, 5, 60 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many reports. Try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).` },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parsed = ReportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { reported_user_id, category, note, message_id, conversation_id } = parsed.data

    if (reported_user_id === userId) {
      return NextResponse.json({ error: "You can't report yourself" }, { status: 400 })
    }

    const supabase = createServerSupabase()

    // A message report must check out: the message really was sent by the
    // user being reported, it really belongs to the conversation given,
    // and the reporter is actually a party to that conversation — never
    // trust the body for any of this.
    let resolvedConversationId: string | undefined = conversation_id
    if (message_id) {
      const { data: message } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id')
        .eq('id', message_id)
        .single()
      if (!message || message.sender_id !== reported_user_id) {
        return NextResponse.json({ error: 'Invalid message reference' }, { status: 400 })
      }
      resolvedConversationId = message.conversation_id

      const { data: conversation } = await supabase
        .from('conversations')
        .select('creator_id, brand_id')
        .eq('id', message.conversation_id)
        .single()
      if (!conversation) {
        return NextResponse.json({ error: 'Invalid conversation reference' }, { status: 400 })
      }
      const isParty =
        (userType === 'creator' && profileId === conversation.creator_id) ||
        (userType === 'brand' && profileId === conversation.brand_id)
      if (!isParty) {
        return NextResponse.json({ error: 'Not a party to this conversation' }, { status: 403 })
      }
    }

    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        reporter_user_id: userId,
        reported_user_id,
        category,
        note: note ?? null,
        message_id: message_id ?? null,
        conversation_id: resolvedConversationId ?? null,
        status: 'open',
      })
      .select('id')
      .single()

    if (error || !report) {
      captureError(error ?? new Error('report insert returned no row'), { route: 'POST /api/reports' })
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Report submitted', report }, { status: 201 })
  } catch (err) {
    captureError(err, { route: 'POST /api/reports' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
