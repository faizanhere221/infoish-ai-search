import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'

interface RouteParams {
  params: { id: string; applicationId: string }
}

const StartConversationSchema = z.object({
  // Optional opening message — if provided, it's sent immediately in the
  // conversation using the existing messaging system.
  message: z.string().min(1).max(5000).optional(),
})

// POST /api/campaigns/[id]/applications/[applicationId]/message
// Start (or reuse) a conversation with the applicant, using the existing
// messaging system (campaign owner only).
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, applicationId } = params
    // Body is optional — an opening message is a nice-to-have, not required
    const body = await request.json().catch(() => ({}))
    const parsed = StartConversationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')
    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'You are not authorized to message this applicant' }, { status: 403 })
    }

    const { data: application } = await supabase
      .from('campaign_applications')
      .select('id, creator_id')
      .eq('id', applicationId)
      .eq('campaign_id', id)
      .single()

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const creatorId = application.creator_id
    const brandId = campaign.brand_id

    // Find or create the conversation (same find-or-create logic as
    // POST /api/conversations)
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('brand_id', brandId)
      .single()

    let conversation = existing
    let created = false

    if (!conversation) {
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          creator_id: creatorId,
          brand_id: brandId,
          creator_unread: 0,
          brand_unread: 0,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 })
      }

      conversation = newConversation
      created = true
    }

    // Optionally send the opening message right away
    if (parsed.data.message && callerUserId) {
      const { error: messageError } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: callerUserId,
        content: parsed.data.message,
        attachments: [],
        is_read: false,
      })
      if (messageError) {
        console.error('Error sending opening message:', messageError.message)
      }
    }

    return NextResponse.json(
      {
        message: 'Conversation ready',
        conversation_id: conversation.id,
        conversation,
        created,
      },
      { status: created ? 201 : 200 }
    )
  } catch (error) {
    console.error('Error starting conversation with applicant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
