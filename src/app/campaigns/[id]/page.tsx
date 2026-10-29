import { getPublicCampaign } from '@/lib/campaigns/public'
import CampaignDetailClient from './CampaignDetailClient'

// ISR: renders on first request, cached for an hour, purged on publish/
// close/edit/delete by revalidateCampaignPublicSurfaces(). This HTML is
// shared by every visitor, so it may only ever contain a published +
// public campaign; getPublicCampaign() returns null for anything else.
export const revalidate = 3600

// No campaigns are prebuilt; returning [] opts this dynamic segment into
// on-demand ISR instead of a fresh render on every request.
export async function generateStaticParams() {
  return []
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const campaign = await getPublicCampaign(params.id)
  return <CampaignDetailClient campaignId={params.id} initialCampaign={campaign} />
}
