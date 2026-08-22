import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

// POST /api/campaigns/[id]/close - Close a published campaign (owner only).
// Stops new applications; existing applications and their statuses are
// unaffected. To bring a closed campaign back, use POST /publish, which
// also accepts a 'closed' starting status (see comment there).
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'You are not authorized to close this campaign' }, { status: 403 })
    }

    if (campaign.status !== 'published') {
      return NextResponse.json(
        { error: `Cannot close a campaign with status: ${campaign.status}` },
        { status: 400 }
      )
    }

    const { data: updatedCampaign, error } = await supabase
      .from('campaigns')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error closing campaign:', error)
      return NextResponse.json({ error: 'Failed to close campaign' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Campaign closed successfully',
      campaign: updatedCampaign,
    })
  } catch (error) {
    console.error('Error closing campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
