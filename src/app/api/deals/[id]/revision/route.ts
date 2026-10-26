import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { getUserIdFromCreator } from '@/lib/notifications'
import { postDealSystemMessage } from '@/lib/deal-messages'
import { emitEvent } from '@/lib/events/emit'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

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

    const currentRevisions = deal.revisions_used || 0
    const maxRevisions = deal.revisions_allowed || 2

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
        revisions_used: currentRevisions + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST /api/deals/[id]/revision' })
      return NextResponse.json({ error: 'Failed to request revision' }, { status: 500 })
    }

    const systemMsg = message
      ? `🔄 Revision requested for "${deal.title}"\n\nFeedback: ${message}`
      : `🔄 Revision requested for "${deal.title}". Please review the feedback and resubmit.`

    await postDealSystemMessage(supabase, {
      dealId: id,
      creatorId: deal.creator_id,
      brandId: deal.brand_id,
      senderUserId: request.headers.get('x-user-id') ?? deal.brand_id,
      senderType: 'brand',
      content: systemMsg,
    })

    const creatorUserId = await getUserIdFromCreator(supabase, deal.creator_id)
    await emitEvent(supabase, {
      type: 'deal_revision',
      actorUserId: request.headers.get('x-user-id') ?? deal.brand_id,
      recipientUserIds: [creatorUserId],
      relatedType: 'deal',
      relatedId: id,
      data: { dealTitle: deal.title },
    })

    return NextResponse.json({ message: 'Revision requested', deal: updatedDeal })

  } catch (error) {
    captureError(error, { route: 'POST /api/deals/[id]/revision' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
