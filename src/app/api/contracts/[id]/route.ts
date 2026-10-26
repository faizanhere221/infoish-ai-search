import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string }
}

// GET /api/contracts/[id] — the two parties on the row, or an admin. Backs
// the print-styled /contracts/[id] page. Everyone else gets 404, not 403 —
// a stranger shouldn't be able to confirm a contract id exists.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    const callerUserRole = request.headers.get('x-user-role')

    const supabase = createServerSupabase()

    const { data: contract } = await supabase
      .from('campaign_contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (!contract) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: row } = await supabase
      .from('campaign_creators')
      .select('id, campaign_id, creator_id')
      .eq('id', contract.campaign_creator_id)
      .single()

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, title, brand_id')
      .eq('id', row.campaign_id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const isAdmin = callerUserRole === 'admin' || callerUserRole === 'super_admin'
    const isBrandParty = callerUserType === 'brand' && callerProfileId === campaign.brand_id
    const isCreatorParty = callerUserType === 'creator' && callerProfileId === row.creator_id

    if (!isAdmin && !isBrandParty && !isCreatorParty) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: brand } = await supabase
      .from('brands')
      .select('company_name')
      .eq('id', campaign.brand_id)
      .single()

    const { data: creator } = await supabase
      .from('creators')
      .select('display_name, username')
      .eq('id', row.creator_id)
      .single()

    return NextResponse.json({
      contract: {
        id: contract.id,
        version: contract.version,
        status: contract.status,
        body_snapshot: contract.body_snapshot,
        body_hash: contract.body_hash,
        brand_signer_name: contract.brand_signer_name,
        brand_signed_at: contract.brand_signed_at,
        creator_signer_name: contract.creator_signer_name,
        creator_signed_at: contract.creator_signed_at,
        voided_reason: contract.voided_reason,
        sent_at: contract.sent_at,
        created_at: contract.created_at,
      },
      campaign: { title: campaign.title },
      brand: { company_name: brand?.company_name || null },
      creator: { display_name: creator?.display_name || null, username: creator?.username || null },
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/contracts/[id]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
