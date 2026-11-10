import { MetadataRoute } from 'next'

// Private and per-user areas. Repeated in every "allowed" group below: a
// crawler that matches a named group ignores the '*' group entirely, so a
// group with only `allow: '/'` would let that bot into /api/ and the rest.
const PRIVATE_PATHS = [
  '/api/',
  '/admin/',
  '/dashboard/',
  '/messages/',
  '/settings/',
  '/notifications/',
  '/share/',
  '/contracts/',
  '/invoices/',
  '/auth/callback',
  '/campaigns/create',
  '/creators?*',
  '/monitoring',
]

// AI search / answer engines: allowed, so they can cite us.
const AI_SEARCH_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-SearchBot',
  'Claude-User',
  'Applebot',
  'Google-Extended',
]

// Blocked: AI training crawlers (no traffic back to us) and SEO/backlink
// tools, which crawl every URL over and over and are the heaviest
// non-human load on the site. Google (Googlebot) and Bing (bingbot) fall
// under '*' and stay allowed. Well-behaved bots obey this; the rest
// (Bytespider, scrapers with fake user agents) are stopped by Vercel
// Firewall rules, which block before any function runs.
const BLOCKED_BOTS = [
  // AI training
  'GPTBot',
  'CCBot',
  'ClaudeBot',
  'anthropic-ai',
  'Bytespider',
  'Amazonbot',
  'Applebot-Extended',
  'meta-externalagent',
  'FacebookBot',
  'cohere-ai',
  'cohere-training-data-crawler',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
  'omgili',
  'Timpibot',
  'AI2Bot',
  'PanguBot',
  'PetalBot',
  'YouBot',
  // SEO / backlink crawlers
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'BLEXBot',
  'DataForSeoBot',
  'SeekportBot',
  'serpstatbot',
  'Barkrowler',
  'MegaIndex',
  'ZoominfoBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: AI_SEARCH_BOTS, allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: BLOCKED_BOTS, disallow: '/' },
    ],
    sitemap: 'https://infoishai.com/sitemap.xml',
  }
}
