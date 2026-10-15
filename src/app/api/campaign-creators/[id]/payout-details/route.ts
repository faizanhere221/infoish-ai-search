import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow } from '@/lib/campaign-creator-auth'
import { logCampaignCreatorEvent } from '@/lib/campaign-creator-events'
import { decryptPayoutDetails } from '@/lib/payments/crypto'

interface RouteParams {
  params: { id: string }
}

// GET /api/campaign-creators/[id]/payout-details — brand owner only, and
// only once there's a fully_signed contract with this creator AND an open
// payment record on this row (not yet confirmed or cancelled). Masked by
// default; ?reveal=true decrypts the real details. Every view is logged —
// masked and revealed get distinct event types so the activity log shows
// exactly what happened.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (authorized.actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can view payout details' }, { status: 403 })
    }

    const { data: contract } = await supabase
      .from('campaign_contracts')
      .select('id')
      .eq('campaign_creator_id', id)
      .eq('status', 'fully_signed')
      .maybeSingle()

    if (!contract) {
      // 404, not 403 — the brand is a real party on this row (they already
      // know it exists), but there's nothing to return until a contract is
      // fully signed, same framing as the other "not available yet" cases
      // below.
      return NextResponse.json({ error: 'A fully signed contract is required to view payout details' }, { status: 404 })
    }

    const { data: openPayment } = await supabase
      .from('creator_payments')
      .select('id')
      .eq('campaign_creator_id', id)
      .not('status', 'in', '(confirmed,cancelled)')
      .limit(1)
      .maybeSingle()

    if (!openPayment) {
      return NextResponse.json({ error: 'No open payment on this row' }, { status: 404 })
    }

    const { data: method } = await supabase
      .from('payout_methods')
      .select('*')
      .eq('creator_id', authorized.row.creator_id)
      .eq('is_default', true)
      .maybeSingle()

    if (!method) {
      return NextResponse.json({ error: 'The creator has not added a payout method yet' }, { status: 404 })
    }

    const reveal = request.nextUrl.searchParams.get('reveal') === 'true'

    await logCampaignCreatorEvent(supabase, {
      campaignCreatorId: id,
      actorUserId: callerUserId,
      actorType: 'brand',
      eventType: reveal ? 'payout_details_revealed' : 'payout_details_viewed',
      payload: { payout_method_id: method.id },
    })

    if (!reveal) {
      return NextResponse.json({
        method: method.method,
        account_holder_name: method.account_holder_name,
        masked_preview: method.masked_preview,
        currency: method.currency,
        revealed: false,
      })
    }

    const details = decryptPayoutDetails(method.details_encrypted)

    return NextResponse.json({
      method: method.method,
      account_holder_name: method.account_holder_name,
      currency: method.currency,
      details,
      revealed: true,
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/[id]/payout-details' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
