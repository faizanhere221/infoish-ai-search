import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://infoishai.com'
  const today = new Date().toISOString()
  
  return [
    // Homepage
    {
      url: baseUrl,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    
    // Tools Landing Page
    {
      url: `${baseUrl}/tools`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    
    // Instagram Hashtag Generator Tool
    {
      url: `${baseUrl}/tools/instagram-hashtag-generator`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    
    // Hashtag Generator Blog Post
    {
      url: `${baseUrl}/blog/free-instagram-hashtag-generator-complete-guide`,
      lastModified: new Date('2024-12-01').toISOString(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    
    // Instagram Profile Analyzer Tool
    {
      url: `${baseUrl}/tools/instagram-profile-analyzer`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    
    // Profile Analyzer Blog Post
    {
      url: `${baseUrl}/blog/free-instagram-profile-analyzer-complete-guide`,
      lastModified: new Date('2024-11-29').toISOString(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    
    // Blog Landing Page
    {
      url: `${baseUrl}/blog`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    
    // Blog Post 1
    {
      url: `${baseUrl}/blog/complete-guide-influencer-marketing-pakistan-2025`,
      lastModified: new Date('2024-11-20').toISOString(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    
    // Blog Post 2
    {
      url: `${baseUrl}/blog/find-right-pakistani-influencers-brand`,
      lastModified: new Date('2024-11-20').toISOString(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    
    // Blog Post 3
    {
      url: `${baseUrl}/blog/ai-powered-influencer-marketing-tools-game-changer`,
      lastModified: new Date('2024-11-20').toISOString(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    
    // Search Page
    {
      url: `${baseUrl}/search`,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    
    // Pricing Page
    {
      url: `${baseUrl}/pricing`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    
    // About Page
    {
      url: `${baseUrl}/about`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}