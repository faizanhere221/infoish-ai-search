import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow, expireStaleOffers } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'
import { formatMoney } from '@/components/campaigns/utils'

interface RouteParams {
  params: { id: string; offerId: string }
}

// POST /api/campaign-creators/[id]/offers/[offerId]/accept — only the party
// that did NOT send this offer may accept it.
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
      return NextResponse.json({ error: 'You cannot accept your own offer' }, { status: 400 })
    }

    const { data: result, error } = await supabase
      .rpc('accept_campaign_offer', { p_offer_id: offerId })
      .single<{ campaign_creator_id: string; deliverable_id: string }>()

    if (error || !result) {
      captureError(error ?? new Error('accept_campaign_offer returned no row'), {
        route: 'POST /api/campaign-creators/[id]/offers/[offerId]/accept',
      })
      return NextResponse.json({ error: 'Failed to accept offer' }, { status: 500 })
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
      eventType: 'offer_accepted',
      payload: { offer_id: offer.id, amount: offer.amount, currency: offer.currency },
      systemMessage: `✅ Offer accepted: ${formatMoney(offer.amount, offer.currency)}. Deliverable created.`,
      notification: {
        recipientUserId: senderUserId,
        type: 'offer_accepted',
        title: 'Offer accepted',
        content: `Your offer of ${formatMoney(offer.amount, offer.currency)} was accepted`,
      },
    })

    return NextResponse.json({
      message: 'Offer accepted',
      campaign_creator_id: result.campaign_creator_id,
      deliverable_id: result.deliverable_id,
    })
  } catch (error) {
    captureError(error, { route: 'POST /api/campaign-creators/[id]/offers/[offerId]/accept' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
