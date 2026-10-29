import { revalidatePath } from 'next/cache'

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
