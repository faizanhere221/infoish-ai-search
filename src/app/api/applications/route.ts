import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { APPLICATION_STATUSES } from '@/types/campaigns'

// GET /api/applications - List the calling creator's own applications, with
// campaign (+ brand) details joined in. Supports ?status= and ?campaign_id=
// filters.
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators can view their applications' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const campaignId = searchParams.get('campaign_id')

    const supabase = createServerSupabase()

    let query = supabase
      .from('campaign_applications')
      .select('*')
      .eq('creator_id', callerProfileId)
      .order('created_at', { ascending: false })

    if (status && (APPLICATION_STATUSES as readonly string[]).includes(status)) {
      query = query.eq('status', status)
    }

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ applications: [] })
    }

    const campaignIds = [...new Set(applications.map((a) => a.campaign_id).filter(Boolean))]
    const { data: campaigns } = await supabase.from('campaigns').select('*').in('id', campaignIds)

    const brandIds = [...new Set((campaigns || []).map((c) => c.brand_id).filter(Boolean))]
    let brands: { id: string; company_name: string; logo_url: string | null; contact_name: string | null; industry: string | null }[] = []
    if (brandIds.length > 0) {
      const { data } = await supabase
        .from('brands')
        .select('id, company_name, logo_url, contact_name, industry')
        .in('id', brandIds)
      brands = data || []
    }

    const applicationsWithRelations = applications.map((application) => {
      const campaign = campaigns?.find((c) => c.id === application.campaign_id)
      return {
        ...application,
        campaign: campaign
          ? { ...campaign, brand: brands.find((b) => b.id === campaign.brand_id) || null }
          : null,
      }
    })

    return NextResponse.json({ applications: applicationsWithRelations })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
