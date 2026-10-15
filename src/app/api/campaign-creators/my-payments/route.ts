import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { refreshDuePayments } from '@/lib/payments/engine'

// GET /api/campaign-creators/my-payments — creator only. Every payment
// record of theirs across every campaign, joined with campaign/brand info.
// Never includes charge/profit — creator_payments only ever carries payout
// amounts in the first place.
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators have earnings here' }, { status: 403 })
    }

    const supabase = createServerSupabase()

    const { data: rows } = await supabase
      .from('campaign_creators')
      .select('id, campaign_id')
      .eq('creator_id', callerProfileId)

    const rowIds = (rows || []).map((r) => r.id)
    if (rowIds.length === 0) {
      return NextResponse.json({ payments: [] })
    }

    await Promise.all(rowIds.map((rowId) => refreshDuePayments(supabase, rowId)))

    const { data: payments, error } = await supabase
      .from('creator_payments')
      .select('*')
      .in('campaign_creator_id', rowIds)
      .order('due_date', { ascending: true, nullsFirst: false })

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators/my-payments' })
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    const campaignIds = [...new Set((rows || []).map((r) => r.campaign_id))]
    const { data: campaigns } = campaignIds.length > 0
      ? await supabase.from('campaigns').select('id, title, brand_id').in('id', campaignIds)
      : { data: [] }
    const brandIds = [...new Set((campaigns || []).map((c) => c.brand_id))]
    const { data: brands } = brandIds.length > 0
      ? await supabase.from('brands').select('id, company_name').in('id', brandIds)
      : { data: [] }

    const rowToCampaign: Record<string, string> = {}
    for (const r of rows || []) {rowToCampaign[r.id] = r.campaign_id}

    const enriched = (payments || []).map((p) => {
      const campaignId = rowToCampaign[p.campaign_creator_id]
      const campaign = campaigns?.find((c) => c.id === campaignId)
      const brand = campaign ? brands?.find((b) => b.id === campaign.brand_id) : null
      return {
        id: p.id,
        campaign_creator_id: p.campaign_creator_id,
        amount: p.amount,
        currency: p.currency,
        type: p.type,
        status: p.status,
        due_date: p.due_date,
        method: p.method,
        reference: p.reference,
        marked_paid_at: p.marked_paid_at,
        confirmed_at: p.confirmed_at,
        dispute_reason: p.dispute_reason,
        campaign_title: campaign?.title ?? null,
        brand_name: brand?.company_name ?? null,
      }
    })

    return NextResponse.json({ payments: enriched })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/my-payments' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
