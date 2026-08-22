import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

// POST /api/campaigns/[id]/publish - Publish a draft campaign (owner only)
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
      return NextResponse.json({ error: 'You are not authorized to publish this campaign' }, { status: 403 })
    }

    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { error: `Cannot publish a campaign with status: ${campaign.status}` },
        { status: 400 }
      )
    }

    // Required fields before a campaign can go live
    const missing: string[] = []
    if (!campaign.title) missing.push('title')
    if (!campaign.description) missing.push('description')
    if (!campaign.category) missing.push('category')
    if (!campaign.objective) missing.push('objective')
    if (!campaign.platforms || campaign.platforms.length === 0) missing.push('platforms')

    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'Campaign is missing required fields for publishing', missing },
        { status: 400 }
      )
    }

    const { data: updatedCampaign, error } = await supabase
      .from('campaigns')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error publishing campaign:', error)
      return NextResponse.json({ error: 'Failed to publish campaign' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Campaign published successfully',
      campaign: updatedCampaign,
    })
  } catch (error) {
    console.error('Error publishing campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
