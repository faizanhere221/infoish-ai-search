import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string }
}

interface LineItem {
  creator_name: string
  amount: number
  deliverables: string[]
}

// GET /api/campaigns/[id]/invoice — brand owner only. Charge amounts only —
// payout and profit never appear here, structurally: this route never
// selects payout_amount at all. One line per campaign_creators row, priced
// at that row's actual charge_amount (never invented by splitting it across
// deliverables) — the row's deliverables are listed under the line as
// context, with no per-deliverable amount, since charge was never tracked
// at that granularity.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, title, client_name, currency, brand_id, default_payment_terms_days')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: brand } = await supabase
      .from('brands')
      .select('company_name, payment_instructions')
      .eq('id', campaign.brand_id)
      .single()

    const { data: rows } = await supabase
      .from('campaign_creators')
      .select('id, creator_id, charge_amount')
      .eq('campaign_id', id)
      .not('charge_amount', 'is', null)
      .gt('charge_amount', 0)

    const rowIds = (rows || []).map((r) => r.id)

    const { data: creators } = rowIds.length > 0
      ? await supabase.from('creators').select('id, display_name').in('id', [...new Set((rows || []).map((r) => r.creator_id))])
      : { data: [] }

    const { data: deliverables } = rowIds.length > 0
      ? await supabase.from('creator_deliverables').select('campaign_creator_id, title').in('campaign_creator_id', rowIds)
      : { data: [] as { campaign_creator_id: string; title: string }[] }

    const deliverablesByRow = new Map<string, { title: string }[]>()
    for (const d of deliverables || []) {
      const list = deliverablesByRow.get(d.campaign_creator_id) || []
      list.push({ title: d.title })
      deliverablesByRow.set(d.campaign_creator_id, list)
    }

    const lineItems: LineItem[] = (rows || []).map((row) => {
      const creator = creators?.find((c) => c.id === row.creator_id)
      const rowDeliverables = deliverablesByRow.get(row.id) || []
      return {
        creator_name: creator?.display_name || 'Creator',
        amount: row.charge_amount as number,
        deliverables: rowDeliverables.map((d) => d.title),
      }
    })

    const total = lineItems.reduce((sum, item) => sum + item.amount, 0)
    const today = new Date()
    const dueDate = new Date(today.getTime() + (campaign.default_payment_terms_days || 14) * 24 * 60 * 60 * 1000)

    return NextResponse.json({
      invoice_number: `INV-${id.slice(0, 8).toUpperCase()}`,
      date: today.toISOString().slice(0, 10),
      due_date: dueDate.toISOString().slice(0, 10),
      currency: campaign.currency,
      campaign: { title: campaign.title },
      client_name: campaign.client_name,
      brand: { company_name: brand?.company_name || null },
      payment_instructions: brand?.payment_instructions || null,
      line_items: lineItems,
      total,
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaigns/[id]/invoice' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
