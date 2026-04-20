import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { createNotification, getUserIdFromCreator } from '@/lib/notifications'

interface RouteParams {
  params: { id: string }
}

// POST /api/deals/[id]/revision - Brand requests a revision
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    let message: string | undefined
    try {
      const body = await request.json()
      message = typeof body?.message === 'string' ? body.message : undefined
    } catch {
      // body is optional
    }

    if (message && message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerProfileId || callerUserType !== 'brand') {
      return NextResponse.json(
        { error: 'Only brands can request revisions' },
        { status: 403 }
      )
    }

    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    if (deal.brand_id !== callerProfileId) {
      return NextResponse.json(
        { error: 'You are not authorized to request a revision on this deal' },
        { status: 403 }
      )
    }

    if (deal.status !== 'delivered') {
      return NextResponse.json(
        { error: `Cannot request revision on deal with status: ${deal.status}` },
        { status: 400 }
      )
    }

    const currentRevisions = deal.revision_count || 0
    const maxRevisions = deal.max_revisions || 2

    if (currentRevisions >= maxRevisions) {
      return NextResponse.json(
        { error: 'Maximum revisions reached for this deal' },
        { status: 400 }
      )
    }

    const { data: updatedDeal, error } = await supabase
      .from('deals')
      .update({
        status: 'revision',
        revision_count: currentRevisions + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error requesting revision:', error)
      return NextResponse.json({ error: 'Failed to request revision' }, { status: 500 })
    }

    if (deal.conversation_id) {
      const systemMsg = message
        ? `🔄 Revision requested for "${deal.title}"\n\nFeedback: ${message}`
        : `🔄 Revision requested for "${deal.title}". Please review the feedback and resubmit.`

      await supabase.from('messages').insert({
        conversation_id: deal.conversation_id,
        sender_id: deal.brand_id,
        sender_type: 'brand',
        content: systemMsg,
        is_system_message: true,
        attachments: [],
      })
    }

    const creatorUserId = await getUserIdFromCreator(supabase, deal.creator_id)
    if (creatorUserId) {
      await createNotification(supabase, {
        userId: creatorUserId,
        type: 'deal_revision',
        title: 'Revision requested',
        message: `"${deal.title}" requires a revision. Please check the feedback.`,
        link: `/dashboard/deals/${id}`,
      })
    }

    return NextResponse.json({ message: 'Revision requested', deal: updatedDeal })

  } catch (error) {
    console.error('Error requesting revision:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
