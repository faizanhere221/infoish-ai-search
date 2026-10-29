import { cache } from 'react'
import { createServerSupabase } from '@/lib/db'
import type { Campaign, CampaignBrandSummary, CampaignDeliverable } from '@/types/campaigns'

// Server-side loaders for the public campaign pages (/campaigns and
// /campaigns/[id]). They return exactly what GET /api/campaigns and
// GET /api/campaigns/[id] return to a logged-out caller: published + public
// campaigns only, with client_name stripped. Their output is rendered into
// ISR-cached HTML served to everyone, so they must never see a private,
// draft, or closed campaign — owner and tracked-creator views keep going
// through the authenticated API on the client.

const LIST_LIMIT = 50

function isPubliclyVisible(campaign: { status: string; visibility: string }): boolean {
  return campaign.status === 'published' && campaign.visibility === 'public'
}

// client_name is an internal-only label; it never reaches public HTML.
function stripInternal<T extends { client_name?: unknown }>(row: T): Omit<T, 'client_name'> {
  const { client_name: _clientName, ...rest } = row
  return rest
}

export async function getPublicCampaigns(): Promise<Campaign[]> {
  const supabase = createServerSupabase()
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(0, LIST_LIMIT - 1)

  if (error) {throw error}
  if (!campaigns || campaigns.length === 0) {return []}

  const brandIds = [...new Set(campaigns.map((c) => c.brand_id).filter(Boolean))]
  const { data: brands } = await supabase
    .from('brands')
    .select('id, company_name, logo_url, contact_name, industry')
    .in('id', brandIds)

  return campaigns.filter(isPubliclyVisible).map((campaign) => ({
    ...stripInternal(campaign),
    brand: (brands ?? []).find((b) => b.id === campaign.brand_id) as CampaignBrandSummary | undefined,
  })) as Campaign[]
}

// cache() dedupes the lookup between generateMetadata and the page render.
export const getPublicCampaign = cache(async (id: string): Promise<Campaign | null> => {
  const supabase = createServerSupabase()
  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle()
  if (!campaign || !isPubliclyVisible(campaign)) {return null}

  const [{ data: brand }, { data: deliverables }] = await Promise.all([
    supabase
      .from('brands')
      .select('id, company_name, logo_url, contact_name, industry')
      .eq('id', campaign.brand_id)
      .maybeSingle(),
    supabase.from('campaign_deliverables').select('*').eq('campaign_id', id),
  ])

  return {
    ...stripInternal(campaign),
    brand: (brand ?? undefined) as CampaignBrandSummary | undefined,
    deliverables: (deliverables ?? []) as CampaignDeliverable[],
  } as Campaign
})
