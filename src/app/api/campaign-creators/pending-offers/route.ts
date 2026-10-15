import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

// GET /api/campaign-creators/pending-offers — creator-only: every pending
// offer sent BY a brand that this creator hasn't responded to yet, across
// every campaign. Drives the "Offer waiting" surfacing on the creator
// dashboard home and the My Campaigns list — a pending offer otherwise only
// showed up if the creator happened to open that specific row's Offer tab.
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators have pending offers here' }, { status: 403 })
    }

    const supabase = createServerSupabase()

    const { data: rows } = await supabase
      .from('campaign_creators')
      .select('id, campaign_id')
      .eq('creator_id', callerProfileId)

    const rowIds = (rows || []).map((r) => r.id)
    if (rowIds.length === 0) {
      return NextResponse.json({ pending_offers: [] })
    }

    // Doesn't lazily expire every row here (this fans out across every
    // campaign the creator has) — just excludes anything already past its
    // expires_at from the widget. The authoritative expiry happens on the
    // offer's own GET/action routes via expireStaleOffers().
    const { data: offers, error } = await supabase
      .from('campaign_offers')
      .select('id, campaign_creator_id, amount, currency, created_at')
      .in('campaign_creator_id', rowIds)
      .eq('status', 'pending')
      .eq('from_party', 'brand')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators/pending-offers' })
      return NextResponse.json({ error: 'Failed to fetch pending offers' }, { status: 500 })
    }

    if (!offers || offers.length === 0) {
      return NextResponse.json({ pending_offers: [] })
    }

    const rowToCampaign: Record<string, string> = {}
    for (const r of rows || []) {rowToCampaign[r.id] = r.campaign_id}

    const campaignIds = [...new Set(offers.map((o) => rowToCampaign[o.campaign_creator_id]).filter(Boolean))]
    const { data: campaigns } = campaignIds.length > 0
      ? await supabase.from('campaigns').select('id, title, brand_id').in('id', campaignIds)
      : { data: [] }

    const brandIds = [...new Set((campaigns || []).map((c) => c.brand_id))]
    const { data: brands } = brandIds.length > 0
      ? await supabase.from('brands').select('id, company_name').in('id', brandIds)
      : { data: [] }

    const pendingOffers = offers.map((offer) => {
      const campaignId = rowToCampaign[offer.campaign_creator_id]
      const campaign = campaigns?.find((c) => c.id === campaignId)
      const brand = campaign ? brands?.find((b) => b.id === campaign.brand_id) : null
      return {
        offer_id: offer.id,
        campaign_creator_id: offer.campaign_creator_id,
        campaign_title: campaign?.title ?? null,
        brand_name: brand?.company_name ?? null,
        amount: offer.amount,
        currency: offer.currency,
        created_at: offer.created_at,
      }
    })

    return NextResponse.json({ pending_offers: pendingOffers })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/pending-offers' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
