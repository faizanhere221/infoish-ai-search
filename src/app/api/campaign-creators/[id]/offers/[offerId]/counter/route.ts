import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'
import { formatMoney } from '@/components/campaigns/utils'
import { z } from 'zod'

interface RouteParams {
  params: { id: string; offerId: string }
}

const CounterOfferSchema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  currency: z.string().min(3).max(10).optional(),
  deliverables_summary: z.string().max(2000).optional().nullable(),
  publish_by: z.string().optional().nullable(),
  revisions_included: z.number().int().min(0).max(20).optional(),
  usage_rights: z.string().max(500).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  expires_at: z.string().optional().nullable(),
})

// POST /api/campaign-creators/[id]/offers/[offerId]/counter — only the party
// that did NOT send the current pending offer may counter it. Marks the old
// offer 'countered' and creates a new pending one from the countering party.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, offerId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = CounterOfferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { row, actorType } = authorized

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
      return NextResponse.json({ error: 'You cannot counter your own offer' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('campaign_offers')
      .update({ status: 'countered', responded_at: new Date().toISOString() })
      .eq('id', offerId)

    if (updateError) {
      captureError(updateError, { route: 'POST /api/campaign-creators/[id]/offers/[offerId]/counter' })
      return NextResponse.json({ error: 'Failed to counter offer' }, { status: 500 })
    }

    const { data: newOffer, error: insertError } = await supabase
      .from('campaign_offers')
      .insert({
        campaign_creator_id: id,
        from_party: actorType,
        amount: parsed.data.amount,
        currency: parsed.data.currency || offer.currency || 'USD',
        deliverables_summary: parsed.data.deliverables_summary ?? offer.deliverables_summary,
        publish_by: parsed.data.publish_by ?? offer.publish_by,
        revisions_included: parsed.data.revisions_included ?? offer.revisions_included,
        usage_rights: parsed.data.usage_rights ?? offer.usage_rights,
        message: parsed.data.message || null,
        expires_at: parsed.data.expires_at || null,
      })
      .select()
      .single()

    if (insertError || !newOffer) {
      captureError(insertError ?? new Error('counter insert returned no row'), {
        route: 'POST /api/campaign-creators/[id]/offers/[offerId]/counter',
      })
      return NextResponse.json({ error: 'Failed to create counter offer' }, { status: 500 })
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
      eventType: 'offer_countered',
      payload: { previous_offer_id: offer.id, new_offer_id: newOffer.id, amount: newOffer.amount, currency: newOffer.currency },
      systemMessage: `🔄 Countered with ${formatMoney(newOffer.amount, newOffer.currency)}`,
      notification: {
        recipientUserId,
        type: 'offer_countered',
        title: 'Offer countered',
        content: `${actorType === 'brand' ? 'The brand' : 'The creator'} countered with ${formatMoney(newOffer.amount, newOffer.currency)}`,
      },
    })

    return NextResponse.json({ message: 'Counter offer sent', offer: newOffer }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST /api/campaign-creators/[id]/offers/[offerId]/counter' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
