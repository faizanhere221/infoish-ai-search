import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/admin/campaign-creators/[id] — read-only full detail: the row
// itself, offers, every contract version, deliverables + their results,
// the events timeline, and payments. Admin-only visibility into the
// whole Campaign Workflow (CLAUDE.md) for one brand/creator pairing.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: row, error } = await supabase
      .from('campaign_creators')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !row) {
      return NextResponse.json({ error: 'Workflow row not found' }, { status: 404 })
    }

    const [{ data: campaign }, { data: creator }] = await Promise.all([
      supabase.from('campaigns').select('id, title, brand_id, status, objective').eq('id', row.campaign_id).single(),
      supabase.from('creators').select('id, username, display_name, user_id').eq('id', row.creator_id).single(),
    ])

    const brand = campaign
      ? (await supabase.from('brands').select('id, company_name').eq('id', campaign.brand_id).single()).data
      : null

    const [
      { data: offers },
      { data: contracts },
      { data: deliverables },
      { data: events },
      { data: payments },
    ] = await Promise.all([
      supabase.from('campaign_offers').select('*').eq('campaign_creator_id', row.id).order('created_at', { ascending: false }),
      supabase.from('campaign_contracts').select('*').eq('campaign_creator_id', row.id).order('version', { ascending: false }),
      supabase.from('creator_deliverables').select('*').eq('campaign_creator_id', row.id).order('created_at', { ascending: true }),
      supabase.from('campaign_creator_events').select('*').eq('campaign_creator_id', row.id).order('created_at', { ascending: false }).limit(100),
      supabase.from('creator_payments').select('*').eq('campaign_creator_id', row.id).order('created_at', { ascending: true }),
    ])

    const deliverableIds = (deliverables ?? []).map((d) => d.id)
    const { data: results } = deliverableIds.length > 0
      ? await supabase.from('deliverable_results').select('*').in('deliverable_id', deliverableIds).order('captured_at', { ascending: false })
      : { data: [] }

    const resultsByDeliverable = new Map<string, unknown[]>()
    for (const r of results ?? []) {
      const list = resultsByDeliverable.get(r.deliverable_id) ?? []
      list.push(r)
      resultsByDeliverable.set(r.deliverable_id, list)
    }
    const deliverablesWithResults = (deliverables ?? []).map((d) => ({
      ...d,
      results: resultsByDeliverable.get(d.id) ?? [],
    }))

    return NextResponse.json({
      row,
      campaign,
      creator,
      brand,
      offers: offers ?? [],
      contracts: contracts ?? [],
      deliverables: deliverablesWithResults,
      events: events ?? [],
      payments: payments ?? [],
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/campaign-creators/[id]' })
    return NextResponse.json({ error: 'Failed to fetch workflow row' }, { status: 500 })
  }
}
