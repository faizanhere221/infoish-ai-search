import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow } from '@/lib/campaign-creator-auth'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

// GET /api/campaign-creators/[id] — either party on the row. The bare row
// only (no sub-resource) — used by the .../go/[campaignCreatorId] deep-link
// resolver to find which campaign a row belongs to, since a chat message or
// notification only ever stores the row id, never the campaign id.
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

    return NextResponse.json({
      campaign_creator: {
        id: authorized.row.id,
        campaign_id: authorized.row.campaign_id,
        creator_id: authorized.row.creator_id,
        status: authorized.row.status,
      },
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/[id]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
