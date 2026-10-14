import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { CAMPAIGN_CREATOR_STATUSES } from '@/types/campaigns'

// GET /api/campaign-creators - the calling creator's own tracker rows across
// every campaign, with campaign + brand details joined in. Mirrors
// /api/applications (same "my own X" shape). Strips charge_amount,
// brand_notes, and client_name server-side via an explicit field list —
// never relies on the frontend to hide them. Supports ?status=.
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators can view this' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    const supabase = createServerSupabase()

    let query = supabase
      .from('campaign_creators')
      .select('id, campaign_id, status, planned_date, posted_at, posted_url, payout_amount, currency', { count: 'exact' })
      .eq('creator_id', callerProfileId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && (CAMPAIGN_CREATOR_STATUSES as readonly string[]).includes(status)) {
      query = query.eq('status', status)
    }

    const { data: rows, error, count } = await query

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators' })
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ campaign_creators: [], total: count ?? 0, limit, offset })
    }

    const campaignIds = [...new Set(rows.map((r) => r.campaign_id))]
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, title, brand_id')
      .in('id', campaignIds)

    const brandIds = [...new Set((campaigns || []).map((c) => c.brand_id))]
    const { data: brands } = brandIds.length > 0
      ? await supabase.from('brands').select('id, company_name, logo_url, contact_name').in('id', brandIds)
      : { data: [] }

    const withRelations = rows.map((row) => {
      const campaign = campaigns?.find((c) => c.id === row.campaign_id)
      const brand = campaign ? brands?.find((b) => b.id === campaign.brand_id) : null
      return {
        id: row.id,
        campaign_id: row.campaign_id,
        status: row.status,
        planned_date: row.planned_date,
        posted_at: row.posted_at,
        posted_url: row.posted_url,
        payout_amount: row.payout_amount,
        currency: row.currency,
        campaign: campaign ? { id: campaign.id, title: campaign.title } : null,
        brand: brand || null,
      }
    })

    return NextResponse.json({ campaign_creators: withRelations, total: count ?? withRelations.length, limit, offset })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
