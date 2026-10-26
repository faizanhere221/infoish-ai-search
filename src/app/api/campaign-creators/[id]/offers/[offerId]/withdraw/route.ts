import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow, expireStaleOffers } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'
import { formatMoney } from '@/components/campaigns/utils'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string; offerId: string }
}

// POST /api/campaign-creators/[id]/offers/[offerId]/withdraw — only the
// original sender, only while pending.
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
    if (offer.from_party !== actorType) {
      return NextResponse.json({ error: 'Only the sender can withdraw an offer' }, { status: 403 })
    }

    const { error } = await supabase
      .from('campaign_offers')
      .update({ status: 'withdrawn', responded_at: new Date().toISOString() })
      .eq('id', offerId)

    if (error) {
      captureError(error, { route: 'POST /api/campaign-creators/[id]/offers/[offerId]/withdraw' })
      return NextResponse.json({ error: 'Failed to withdraw offer' }, { status: 500 })
    }

    const recipientUserId = actorType === 'brand'
      ? await getUserIdFromCreator(supabase, row.creator_id)
      : await getUserIdFromBrand(supabase, row.brand_id)

    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: row.creator_id,
      brandId: row.brand_id,
      actorUserId: callerUserId,
      actorType,
      eventType: 'offer_withdrawn',
      payload: { offer_id: offer.id },
      systemMessage: `↩️ Offer withdrawn: ${formatMoney(offer.amount, offer.currency)}`,
      notification: {
        recipientUserId,
        type: 'offer_withdrawn',
        title: 'Offer withdrawn',
        content: `An offer of ${formatMoney(offer.amount, offer.currency)} was withdrawn`,
      },
    })

    return NextResponse.json({ message: 'Offer withdrawn' })
  } catch (error) {
    captureError(error, { route: 'POST /api/campaign-creators/[id]/offers/[offerId]/withdraw' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
