import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow, expireStaleOffers } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { getUserIdFromBrand, getUserIdFromCreator } from '@/lib/notifications'
import { formatMoney } from '@/components/campaigns/utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string }
}

const CreateOfferSchema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  currency: z.string().min(3).max(10).optional(),
  deliverables_summary: z.string().max(2000).optional().nullable(),
  publish_by: z.string().optional().nullable(),
  revisions_included: z.number().int().min(0).max(20).optional(),
  usage_rights: z.string().max(500).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  expires_at: z.string().optional().nullable(),
})

// Statuses where the engagement is already over — no new offers either way.
const CLOSED_STATUSES = ['completed', 'dropped']
// Statuses a creator-initiated offer is allowed from (per spec: "propose
// their rate on a shortlisted/contacted row").
const CREATOR_OFFER_STATUSES = ['shortlisted', 'contacted', 'negotiating']

// GET /api/campaign-creators/[id]/offers — either party on the row
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await expireStaleOffers(supabase, id)

    const { data: offers, error } = await supabase
      .from('campaign_offers')
      .select('*')
      .eq('campaign_creator_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators/[id]/offers' })
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
    }

    return NextResponse.json({ offers: offers || [] })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/[id]/offers' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaign-creators/[id]/offers — either party; rejected if a
// pending offer already exists (also enforced by a DB partial unique index)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = CreateOfferSchema.safeParse(body)
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

    if (CLOSED_STATUSES.includes(row.status)) {
      return NextResponse.json({ error: 'This engagement is already closed — no new offers can be made' }, { status: 400 })
    }
    if (actorType === 'creator' && !CREATOR_OFFER_STATUSES.includes(row.status)) {
      return NextResponse.json(
        { error: 'You can only propose a rate while this is shortlisted, contacted, or in negotiation' },
        { status: 400 }
      )
    }

    await expireStaleOffers(supabase, id)

    const { data: existingPending } = await supabase
      .from('campaign_offers')
      .select('id')
      .eq('campaign_creator_id', id)
      .eq('status', 'pending')
      .single()

    if (existingPending) {
      return NextResponse.json({ error: 'There is already a pending offer on this row' }, { status: 409 })
    }

    const { data: offer, error } = await supabase
      .from('campaign_offers')
      .insert({
        campaign_creator_id: id,
        from_party: actorType,
        amount: parsed.data.amount,
        currency: parsed.data.currency || row.currency || 'USD',
        deliverables_summary: parsed.data.deliverables_summary || null,
        publish_by: parsed.data.publish_by || null,
        revisions_included: parsed.data.revisions_included ?? 0,
        usage_rights: parsed.data.usage_rights || null,
        message: parsed.data.message || null,
        expires_at: parsed.data.expires_at || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'There is already a pending offer on this row' }, { status: 409 })
      }
      captureError(error, { route: 'POST /api/campaign-creators/[id]/offers' })
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
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
      eventType: 'offer_sent',
      payload: { offer_id: offer.id, amount: offer.amount, currency: offer.currency },
      systemMessage: `💰 ${actorType === 'brand' ? 'Brand' : 'Creator'} sent an offer: ${formatMoney(offer.amount, offer.currency)}`,
      notification: {
        recipientUserId,
        type: 'offer_received',
        title: 'New offer',
        content: `You received an offer for ${formatMoney(offer.amount, offer.currency)}`,
      },
    })

    return NextResponse.json({ message: 'Offer sent', offer }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST /api/campaign-creators/[id]/offers' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
