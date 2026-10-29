import { MetadataRoute } from 'next'
import { createServerSupabase } from '@/lib/db'
import { isCreatorPublic } from '@/lib/creators/visibility'
import { getProfileCompleteness } from '@/lib/profile-completion'

// Every request reads live rows. Without these, Next caches the Supabase
// fetches in its Data Cache (which survives rebuilds), so a creator hidden
// after the last cache fill stayed in the sitemap while their profile
// already returned 404.
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const baseUrl = 'https://infoishai.com'

// Postgrest `in` filters travel in the URL, so look users up in chunks.
const USER_LOOKUP_CHUNK = 200

async function getCampaignRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createServerSupabase()
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, updated_at')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .limit(5000)

    if (!campaigns) {return []}

    return campaigns.map((campaign) => ({
      url: `${baseUrl}/campaigns/${campaign.id}`,
      lastModified: campaign.updated_at ? new Date(campaign.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    return []
  }
}

async function getCreatorRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createServerSupabase()
    const { data: creators } = await supabase
      .from('creators')
      .select('id, username, updated_at, user_id, hidden_from_marketplace, bio, display_name, profile_photo_url')
      .limit(5000)

    if (!creators) {return []}

    // Same rule as the profile page (src/app/creators/[username]/layout.tsx):
    // a URL is listed only if isCreatorPublic() would let its profile render.
    // Verification status doesn't matter; profile completeness does.
    const userIds = Array.from(new Set(creators.map((c) => c.user_id)))
    const owners = new Map<string, { deleted_at: string | null; is_active: boolean }>()
    for (let i = 0; i < userIds.length; i += USER_LOOKUP_CHUNK) {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, deleted_at, is_active')
        .in('id', userIds.slice(i, i + USER_LOOKUP_CHUNK))
      // Fail closed: if visibility can't be confirmed, list no creators.
      if (error) {return []}
      for (const u of users ?? []) {owners.set(u.id, u)}
    }

    const publicCreators = creators.filter((creator) => isCreatorPublic(owners.get(creator.user_id) ?? null, creator))

    // Only complete profiles (getProfileCompleteness().isComplete, the same
    // rule the dashboard checklist and share badge use) go in the sitemap.
    const handlesByCreator = new Map<string, { platform_username: string | null }[]>()
    const creatorIds = publicCreators.map((c) => c.id)
    for (let i = 0; i < creatorIds.length; i += USER_LOOKUP_CHUNK) {
      const { data: platforms, error } = await supabase
        .from('creator_platforms')
        .select('creator_id, platform_username')
        .in('creator_id', creatorIds.slice(i, i + USER_LOOKUP_CHUNK))
      if (error) {return []}
      for (const p of platforms ?? []) {
        handlesByCreator.set(p.creator_id, [...(handlesByCreator.get(p.creator_id) ?? []), p])
      }
    }

    return publicCreators
      .filter((creator) =>
        getProfileCompleteness({ ...creator, creator_platforms: handlesByCreator.get(creator.id) ?? [] }).isComplete
      )
      .map((creator) => ({
      url: `${baseUrl}/creators/${creator.username}`,
      lastModified: creator.updated_at ? new Date(creator.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    // Homepage
    { url: baseUrl, lastModified: today, changeFrequency: 'daily', priority: 1.0 },

    // Core marketplace pages
    { url: `${baseUrl}/pricing`, lastModified: today, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/creators`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/campaigns`, lastModified: today, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/influencers/usa`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/influencers/uk`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/influencers/canada`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/influencers/india`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/influencers/australia`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/influencers/pakistan`, lastModified: today, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/influencers/germany`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/influencers/netherlands`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/influencers/singapore`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: today, changeFrequency: 'monthly', priority: 0.8 },

    // Tools
    { url: `${baseUrl}/tools`, lastModified: today, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/tools/instagram-hashtag-generator`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },

    // Blog
    { url: `${baseUrl}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog/us-tech-influencers-b2b-reviews-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/tech-influencers-complete-guide`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/blog/best-tech-influencers-to-follow-2026`, lastModified: new Date('2026-10-28'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/top-tech-influencers-singapore-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/uk-tech-influencers-b2b-brands-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/indian-tech-influencer-rates-by-city-2026`, lastModified: new Date('2026-10-26'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/top-indian-tech-youtubers-brand-partnerships-2026`, lastModified: new Date('2026-10-28'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/ways-tech-creators-earn-money-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/creator-media-kit-guide-tech-influencers`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/tech-creator-sponsorship-rates-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/first-tech-influencer-campaign-startup-guide-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/how-to-find-tech-youtubers-product-reviews-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/tech-influencer-rates-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/how-to-find-tech-influencers-india-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/b2c-influencer-marketing-strategies-tech-brands-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/b2b-vs-b2c-influencer-marketing-tech-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/tech-creators-guide-how-to-get-brand-deals-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/top-10-benefits-tech-influencer-marketing-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/how-to-find-tech-influencers-b2b-2026`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/free-instagram-profile-analyzer-complete-guide`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/free-instagram-hashtag-generator-2025`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/complete-guide-influencer-marketing-pakistan-2025`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/find-right-pakistani-influencers-brand`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/ai-powered-influencer-marketing-tools-game-changer`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/micro-influencers-pakistan-guide`, lastModified: new Date('2026-10-29'), changeFrequency: 'monthly', priority: 0.7 },

    // Support / info pages
    { url: `${baseUrl}/help`, lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: today, changeFrequency: 'monthly', priority: 0.6 },

    // Note: /login, /signup, /signup/brand, /signup/creator, /terms, /privacy
    // are all set to noindex, so none of them belong in the sitemap.
  ]

  const creatorRoutes = await getCreatorRoutes()
  const campaignRoutes = await getCampaignRoutes()

  return [...staticRoutes, ...creatorRoutes, ...campaignRoutes]
}
