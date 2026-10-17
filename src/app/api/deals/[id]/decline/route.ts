import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { getUserIdFromBrand } from '@/lib/notifications'
import { postDealSystemMessage } from '@/lib/deal-messages'
import { emitEvent } from '@/lib/events/emit'
import { captureError } from '@/lib/error-tracking'

interface RouteParams {
  params: { id: string }
}

// POST /api/deals/[id]/decline - Creator declines deal
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerProfileId || callerUserType !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can decline deals' },
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

    if (deal.creator_id !== callerProfileId) {
      return NextResponse.json(
        { error: 'You are not authorized to decline this deal' },
        { status: 403 }
      )
    }

    if (deal.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot decline deal with status: ${deal.status}` },
        { status: 400 }
      )
    }

    const { data: updatedDeal, error } = await supabase
      .from('deals')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST /api/deals/[id]/decline' })
      return NextResponse.json({ error: 'Failed to decline deal' }, { status: 500 })
    }

    await postDealSystemMessage(supabase, {
      dealId: id,
      creatorId: deal.creator_id,
      brandId: deal.brand_id,
      senderUserId: request.headers.get('x-user-id') ?? deal.creator_id,
      senderType: 'creator',
      content: `❌ Deal declined: "${deal.title}"`,
    })

    const brandUserId = await getUserIdFromBrand(supabase, deal.brand_id)
    await emitEvent(supabase, {
      type: 'deal_declined',
      actorUserId: request.headers.get('x-user-id') ?? deal.creator_id,
      recipientUserIds: [brandUserId],
      relatedType: 'deal',
      relatedId: id,
      data: { dealTitle: deal.title },
    })

    return NextResponse.json({ message: 'Deal declined', deal: updatedDeal })

  } catch (error) {
    captureError(error, { route: 'POST /api/deals/[id]/decline' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
