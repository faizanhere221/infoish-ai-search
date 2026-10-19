import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { getUserIdFromBrand } from '@/lib/notifications'
import { postDealSystemMessage } from '@/lib/deal-messages'
import { emitEvent } from '@/lib/events/emit'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

// POST /api/deals/[id]/deliver - Creator submits delivery
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const body = await request.json()
    const { message } = body // Optional delivery message

    const supabase = createServerSupabase()

    // Verify caller is a creator
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    if (!callerProfileId || callerUserType !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can submit deliveries' },
        { status: 403 }
      )
    }

    // Get the deal
    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    // Verify caller owns this deal
    if (deal.creator_id !== callerProfileId) {
      return NextResponse.json(
        { error: 'You are not authorized to deliver this deal' },
        { status: 403 }
      )
    }

    // Verify deal is in correct status
    if (!['in_progress', 'revision'].includes(deal.status)) {
      return NextResponse.json(
        { error: `Cannot deliver deal with status: ${deal.status}` },
        { status: 400 }
      )
    }

    // Define deliverable type
    interface DeliverableItem {
      id: string
      description: string
      is_completed: boolean
      completed_at?: string
    }

    // Check all deliverables are marked complete
    const deliverables = (deal.deliverables || []) as DeliverableItem[]
    const incompleteDeliverables = deliverables.filter((d: DeliverableItem) => !d.is_completed)

    if (incompleteDeliverables.length > 0) {
      return NextResponse.json(
        { error: 'All deliverables must be marked as complete before submitting' },
        { status: 400 }
      )
    }

    // Update deal status
    const { data: updatedDeal, error } = await supabase
      .from('deals')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST /api/deals/[id]/deliver' })
      return NextResponse.json(
        { error: 'Failed to submit delivery' },
        { status: 500 }
      )
    }

    const deliveryMessage = message
      ? `📦 Delivery submitted for "${deal.title}"\n\nMessage: ${message}`
      : `📦 Delivery submitted for "${deal.title}". Please review and approve.`

    await postDealSystemMessage(supabase, {
      dealId: id,
      creatorId: deal.creator_id,
      brandId: deal.brand_id,
      senderUserId: request.headers.get('x-user-id') ?? deal.creator_id,
      senderType: 'creator',
      content: deliveryMessage,
    })

    // Notify the brand that the delivery is ready for review
    const brandUserId = await getUserIdFromBrand(supabase, deal.brand_id)
    await emitEvent(supabase, {
      type: 'deal_delivered',
      actorUserId: request.headers.get('x-user-id') ?? deal.creator_id,
      recipientUserIds: [brandUserId],
      relatedType: 'deal',
      relatedId: id,
      data: { dealTitle: deal.title },
    })

    return NextResponse.json({
      message: 'Delivery submitted successfully',
      deal: updatedDeal,
    })

  } catch (error) {
    captureError(error, { route: 'POST /api/deals/[id]/deliver' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
