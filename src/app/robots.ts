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
          '/auth/callback',
        ],
      },
    ],
    sitemap: 'https://infoishai.com/sitemap.xml',
  }
}
