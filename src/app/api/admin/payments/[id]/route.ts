import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/admin/payments/[id] — detail: context (campaign/brand/creator),
// a merged history (campaign_creator_events for this payment + any admin
// notes/actions logged to activity_logs), and the creator's payout
// method(s) as MASKED PREVIEW ONLY — never the decrypted details. Viewing
// this counts as "every admin view of sensitive data" per instruction, so
// it's logged (no reason needed for a read, just an audit trail).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: payment, error } = await supabase
      .from('creator_payments')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const { data: cc } = await supabase
      .from('campaign_creators')
      .select('id, campaign_id, creator_id')
      .eq('id', payment.campaign_creator_id)
      .single()

    let campaign: { id: string; title: string; brand_id: string } | null = null
    let creator: { id: string; username: string; display_name: string; user_id: string } | null = null
    let brand: { id: string; company_name: string } | null = null
    let payoutMethods: { id: string; method: string; masked_preview: string | null; currency: string; is_default: boolean }[] = []

    if (cc) {
      const [{ data: campaignData }, { data: creatorData }] = await Promise.all([
        supabase.from('campaigns').select('id, title, brand_id').eq('id', cc.campaign_id).single(),
        supabase.from('creators').select('id, username, display_name, user_id').eq('id', cc.creator_id).single(),
      ])
      campaign = campaignData
      creator = creatorData
      if (campaign) {
        const { data: brandData } = await supabase.from('brands').select('id, company_name').eq('id', campaign.brand_id).single()
        brand = brandData
      }
      const { data: methods } = await supabase
        .from('payout_methods')
        .select('id, method, masked_preview, currency, is_default')
        .eq('creator_id', cc.creator_id)
      payoutMethods = methods ?? []
    }

    // History: workflow events tied to this payment + any admin
    // notes/actions logged against it, merged and sorted newest-first.
    const [{ data: events }, { data: logs }] = await Promise.all([
      cc
        ? supabase.from('campaign_creator_events').select('id, event_type, actor_type, payload, created_at')
            .eq('campaign_creator_id', cc.id).eq('payload->>payment_id', params.id)
        : Promise.resolve({ data: [] }),
      supabase.from('activity_logs').select('id, action, details, created_at, user_id')
        .eq('entity_type', 'payment').eq('entity_id', params.id),
    ])

    const history = [
      ...(events ?? []).map((e) => ({ kind: 'event' as const, type: e.event_type, actor: e.actor_type, payload: e.payload, created_at: e.created_at })),
      ...(logs ?? []).map((l) => ({ kind: 'admin_action' as const, type: l.action, actor: 'admin', payload: l.details, created_at: l.created_at })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    void logActivity({
      userId: request.headers.get('x-user-id'),
      action: 'payment_viewed',
      entityType: 'payment',
      entityId: params.id,
      details: { campaign_creator_id: payment.campaign_creator_id },
    })

    return NextResponse.json({
      payment,
      context: {
        campaign_creator_id: cc?.id ?? null,
        campaign_title: campaign?.title ?? null,
        creator_name: creator?.display_name ?? creator?.username ?? null,
        brand_name: brand?.company_name ?? null,
      },
      history,
      payoutMethods,
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/payments/[id]' })
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
  }
}
