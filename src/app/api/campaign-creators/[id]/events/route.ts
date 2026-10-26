import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow } from '@/lib/campaign-creator-auth'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string }
}

// GET /api/campaign-creators/[id]/events — activity timeline, either party.
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

    const { data: events, error } = await supabase
      .from('campaign_creator_events')
      .select('*')
      .eq('campaign_creator_id', id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators/[id]/events' })
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/[id]/events' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
