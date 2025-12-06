import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://infoishai.com'
  const today = new Date().toISOString().split('T')[0]
  
  return [
    // Homepage
    {
      url: baseUrl,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Tools
    {
      url: `${baseUrl}/tools`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Instagram Hashtag Generator
    {
      url: `${baseUrl}/tools/instagram-hashtag-generator`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Hashtag Generator Blog
    {
      url: `${baseUrl}/tools/instagram-hashtag-generator/blog`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Instagram Profile Analyzer
    {
      url: `${baseUrl}/tools/instagram-profile-analyzer`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Profile Analyzer Blog
    {
      url: `${baseUrl}/blog/free-instagram-profile-analyzer-complete-guide`,
      lastModified: '2024-12-05',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Blog Index
    {
      url: `${baseUrl}/blog`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Blog Posts
    {
      url: `${baseUrl}/blog/complete-guide-influencer-marketing-pakistan-2025`,
      lastModified: '2024-11-20',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/find-right-pakistani-influencers-brand`,
      lastModified: '2024-11-20',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/ai-powered-influencer-marketing-tools-game-changer`,
      lastModified: '2024-11-20',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Main Pages
    {
      url: `${baseUrl}/search`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}