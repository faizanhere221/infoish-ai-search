import { MetadataRoute } from 'next'
import { createServerSupabase } from '@/lib/db'

const baseUrl = 'https://infoishai.com'

async function getCreatorRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createServerSupabase()
    const { data: creators } = await supabase
      .from('creators')
      .select('username, updated_at')
      .eq('verification_status', 'verified')
      .limit(5000)

    if (!creators) return []

    return creators.map((creator) => ({
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
    { url: `${baseUrl}/creators`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: today, changeFrequency: 'monthly', priority: 0.8 },

    // Tools
    { url: `${baseUrl}/tools`, lastModified: today, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/tools/instagram-hashtag-generator`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tools/instagram-profile-analyzer`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tools/ai-humanizer`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },

    // Blog
    { url: `${baseUrl}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog/ai-humanizer-tool-make-ai-text-human-2025`, lastModified: new Date('2025-11-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/free-instagram-profile-analyzer-complete-guide`, lastModified: new Date('2025-11-29'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/free-instagram-hashtag-generator-2025`, lastModified: new Date('2025-12-01'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/complete-guide-influencer-marketing-pakistan-2025`, lastModified: new Date('2024-11-20'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/find-right-pakistani-influencers-brand`, lastModified: new Date('2024-11-20'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/ai-powered-influencer-marketing-tools-game-changer`, lastModified: new Date('2024-11-20'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog/micro-influencers-pakistan-guide`, lastModified: new Date('2024-11-20'), changeFrequency: 'monthly', priority: 0.7 },

    // Support / info pages
    { url: `${baseUrl}/help`, lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },

    // Auth / onboarding
    { url: `${baseUrl}/login`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/signup`, lastModified: today, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/signup/creator`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/signup/brand`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
  ]

  const creatorRoutes = await getCreatorRoutes()

  return [...staticRoutes, ...creatorRoutes]
}
