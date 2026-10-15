import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/messages/',
          '/settings/',
          '/notifications/',
          '/share/',
          '/contracts/',
          '/auth/callback',
          '/campaigns/create',
          '/creators?*',
        ],
      },
      // AI search crawlers - allow for citation
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Perplexity-User', allow: '/' },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'Applebot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      // AI training crawlers - block
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
    ],
    sitemap: 'https://infoishai.com/sitemap.xml',
  }
}
