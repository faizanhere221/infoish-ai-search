import { revalidatePath } from 'next/cache'
import type { createServerSupabase } from '@/lib/db'

type Supabase = ReturnType<typeof createServerSupabase>

// /campaigns and /campaigns/[id] are ISR (revalidate = 3600) and render
// published + public campaigns into their HTML. Call after any write that
// could change what those pages show: publish, close, edit, delete.
// Without it a closed or edited campaign keeps its old public page for up
// to an hour.
export function revalidateCampaignPublicSurfaces(campaignId: string): void {
  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${campaignId}`)
  revalidatePath('/sitemap.xml')
}

// Campaign pages show the brand's company name and logo, so a brand edit
// to either must purge the listing and every one of that brand's campaign
// pages. Best-effort: a failed lookup still purges the listing.
export async function revalidateBrandCampaignSurfaces(supabase: Supabase, brandId: string): Promise<void> {
  revalidatePath('/campaigns')
  const { data: campaigns } = await supabase.from('campaigns').select('id').eq('brand_id', brandId)
  for (const c of campaigns ?? []) {revalidatePath(`/campaigns/${c.id}`)}
}
