import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { getUserIdFromCreator } from '@/lib/notifications'
import { calculateReferralCommission } from '@/lib/referral-commissions'
import { postDealSystemMessage } from '@/lib/deal-messages'
import { emitEvent } from '@/lib/events/emit'
import { captureError, captureMessage } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string }
}

// POST /api/deals/[id]/approve - Brand approves delivery
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    // Get authenticated brand's profile ID from middleware-injected header
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerProfileId || callerUserType !== 'brand') {
      return NextResponse.json(
        { error: 'Only brands can approve deals' },
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

    // Verify the authenticated user is the brand on this deal
    if (deal.brand_id !== callerProfileId) {
      return NextResponse.json(
        { error: 'You are not authorized to approve this deal' },
        { status: 403 }
      )
    }

    // Verify deal is in delivered status
    if (deal.status !== 'delivered') {
      return NextResponse.json(
        { error: `Cannot approve deal with status: ${deal.status}` },
        { status: 400 }
      )
    }

    // Update deal status
    const { data: updatedDeal, error } = await supabase
      .from('deals')
      .update({
        status: 'completed',
        approved_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST /api/deals/[id]/approve' })
      return NextResponse.json(
        { error: 'Failed to approve deal' },
        { status: 500 }
      )
    }

    // Referral commission (if this creator was referred by an active
    // partner) — best-effort, never blocks deal completion.
    try {
      const commissionResult = await calculateReferralCommission(supabase, {
        dealId: id,
        creatorId: deal.creator_id,
        dealAmountCents: deal.amount_cents || 0,
      })
      if (commissionResult.created) {
        captureMessage(`Referral commission created for deal ${id}: ${commissionResult.commissionAmountCents} cents to partner ${commissionResult.partnerId}`, 'info')
      } else if (commissionResult.error) {
        captureError(commissionResult.error, { route: 'POST /api/deals/[id]/approve', context: 'referral commission' })
      }
    } catch (commissionError) {
      captureError(commissionError, { route: 'POST /api/deals/[id]/approve', context: 'referral commission (unexpected throw)' })
    }

    // Update creator stats
    const { data: creator } = await supabase
      .from('creators')
      .select('total_deals_completed, total_earnings')
      .eq('id', deal.creator_id)
      .single()

    if (creator) {
      await supabase
        .from('creators')
        .update({
          total_deals_completed: (creator.total_deals_completed || 0) + 1,
          total_earnings: (creator.total_earnings || 0) + (deal.creator_payout_cents || 0),
        })
        .eq('id', deal.creator_id)
    }

    // Update brand stats
    const { data: brand } = await supabase
      .from('brands')
      .select('total_deals, total_spent')
      .eq('id', deal.brand_id)
      .single()

    if (brand) {
      await supabase
        .from('brands')
        .update({
          total_deals: (brand.total_deals || 0) + 1,
          total_spent: (brand.total_spent || 0) + (deal.amount_cents || 0),
        })
        .eq('id', deal.brand_id)
    }

    await postDealSystemMessage(supabase, {
      dealId: id,
      creatorId: deal.creator_id,
      brandId: deal.brand_id,
      senderUserId: request.headers.get('x-user-id') ?? deal.brand_id,
      senderType: 'brand',
      content: `✅ Deal completed! "${deal.title}" has been approved.`,
    })

    // Notify the creator that the deal is approved and completed
    const creatorUserId = await getUserIdFromCreator(supabase, deal.creator_id)
    await emitEvent(supabase, {
      type: 'deal_approved',
      actorUserId: request.headers.get('x-user-id') ?? deal.brand_id,
      recipientUserIds: [creatorUserId],
      relatedType: 'deal',
      relatedId: id,
      data: { dealTitle: deal.title },
    })

    return NextResponse.json({
      message: 'Deal approved and completed',
      deal: updatedDeal,
    })

  } catch (error) {
    captureError(error, { route: 'POST /api/deals/[id]/approve' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
