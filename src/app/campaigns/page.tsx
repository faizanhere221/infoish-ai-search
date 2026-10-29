import { getPublicCampaigns } from '@/lib/campaigns/public'
import { captureError } from '@/lib/error-tracking'
import type { Campaign } from '@/types/campaigns'
import CampaignsClient from './CampaignsClient'

// ISR (revalidate = 3600 in layout.tsx), purged on publish/close/edit/
// delete by revalidateCampaignPublicSurfaces().
export const revalidate = 3600

export default async function CampaignsPage() {
  let campaigns: Campaign[] | null = null
  try {
    campaigns = await getPublicCampaigns()
  } catch (error) {
    // Fall back to the client-side fetch rather than failing the page.
    captureError(error, { route: '/campaigns (server load)' })
  }

  return <CampaignsClient initialCampaigns={campaigns} />
}
