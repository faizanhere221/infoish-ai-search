import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

// GET /api/applications/[id] - Get a single application (owning creator only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { data: application, error } = await supabase
      .from('campaign_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    if (callerUserType !== 'creator' || callerProfileId !== application.creator_id) {
      // Don't distinguish "doesn't exist" from "not visible to you"
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', application.campaign_id)
      .single()

    let brand = null
    if (campaign) {
      const { data } = await supabase
        .from('brands')
        .select('id, company_name, logo_url, contact_name, industry')
        .eq('id', campaign.brand_id)
        .single()
      brand = data
    }

    return NextResponse.json({
      application: {
        ...application,
        campaign: campaign ? { ...campaign, brand } : null,
      },
    })
  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/applications/[id] - Withdraw an application (owning creator
// only, and only while it's still 'submitted' — once a brand has acted on
// it, withdrawing would be misleading).
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { data: application } = await supabase
      .from('campaign_applications')
      .select('id, creator_id, status')
      .eq('id', id)
      .single()

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    if (callerUserType !== 'creator' || callerProfileId !== application.creator_id) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Only a submitted application can be withdrawn' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('campaign_applications').delete().eq('id', id)

    if (error) {
      console.error('Error withdrawing application:', error)
      return NextResponse.json({ error: 'Failed to withdraw application' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Application withdrawn' })
  } catch (error) {
    console.error('Error withdrawing application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
