import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/admin/contracts/[id] — full detail, including the body
// snapshot. Logged: a contract body can include special_terms a brand
// considers confidential, so an admin reading it counts as viewing
// sensitive data per instruction.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()

    const { data: contract, error } = await supabase
      .from('campaign_contracts')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    const { data: cc } = await supabase
      .from('campaign_creators')
      .select('id, campaign_id, creator_id')
      .eq('id', contract.campaign_creator_id)
      .single()

    let campaign: { id: string; title: string; brand_id: string } | null = null
    let creator: { id: string; username: string; display_name: string } | null = null
    let brand: { id: string; company_name: string } | null = null

    if (cc) {
      const [{ data: campaignData }, { data: creatorData }] = await Promise.all([
        supabase.from('campaigns').select('id, title, brand_id').eq('id', cc.campaign_id).single(),
        supabase.from('creators').select('id, username, display_name').eq('id', cc.creator_id).single(),
      ])
      campaign = campaignData
      creator = creatorData
      if (campaign) {
        const { data: brandData } = await supabase.from('brands').select('id, company_name').eq('id', campaign.brand_id).single()
        brand = brandData
      }
    }

    void logActivity({
      userId: request.headers.get('x-user-id'),
      action: 'contract_viewed',
      entityType: 'contract',
      entityId: params.id,
      details: { campaign_creator_id: contract.campaign_creator_id },
    })

    return NextResponse.json({
      contract,
      context: {
        campaign_creator_id: cc?.id ?? null,
        campaign_title: campaign?.title ?? null,
        creator_name: creator?.display_name ?? creator?.username ?? null,
        brand_name: brand?.company_name ?? null,
      },
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/contracts/[id]' })
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
  }
}
