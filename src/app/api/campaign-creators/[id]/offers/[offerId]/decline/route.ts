import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow, expireStaleOffers } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'
import { formatMoney } from '@/components/campaigns/utils'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string; offerId: string }
}

// POST /api/campaign-creators/[id]/offers/[offerId]/decline — only the
// party that did NOT send this offer may decline it.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, offerId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { row, actorType } = authorized

    await expireStaleOffers(supabase, id)

    const { data: offer } = await supabase
      .from('campaign_offers')
      .select('*')
      .eq('id', offerId)
      .eq('campaign_creator_id', id)
      .single()

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }
    if (offer.status !== 'pending') {
      return NextResponse.json({ error: `This offer is ${offer.status}, not pending` }, { status: 400 })
    }
    if (offer.from_party === actorType) {
      return NextResponse.json({ error: 'You cannot decline your own offer — withdraw it instead' }, { status: 400 })
    }

    const { error } = await supabase
      .from('campaign_offers')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', offerId)

    if (error) {
      captureError(error, { route: 'POST /api/campaign-creators/[id]/offers/[offerId]/decline' })
      return NextResponse.json({ error: 'Failed to decline offer' }, { status: 500 })
    }

    const senderUserId = offer.from_party === 'brand'
      ? await getUserIdFromBrand(supabase, row.brand_id)
      : await getUserIdFromCreator(supabase, row.creator_id)

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      actorUserId: callerUserId,
      actorType,
      eventType: 'offer_declined',
      payload: { offer_id: offer.id },
      systemMessage: `❌ Offer declined: ${formatMoney(offer.amount, offer.currency)}`,
      notification: {
        recipientUserId: senderUserId,
        type: 'offer_declined',
        title: 'Offer declined',
        content: `Your offer of ${formatMoney(offer.amount, offer.currency)} was declined`,
      },
    })

    return NextResponse.json({ message: 'Offer declined' })
  } catch (error) {
    captureError(error, { route: 'POST /api/campaign-creators/[id]/offers/[offerId]/decline' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
