/** @type {import('next').NextConfig} */
const nextConfig = {
  // Page extensions
  pageExtensions: ['tsx', 'ts'],
  
  // Disable ESLint during builds for faster deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during builds for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ensure clean URLs
  trailingSlash: false,
  
  // Environment variable support
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Configure for production builds
  output: 'standalone',
  
  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // localhost allowed in development only
      ...(process.env.NODE_ENV === 'development' ? [{ protocol: 'http', hostname: 'localhost' }] : []),
    ],
  },

  // Redirect www to non-www (backup in case Vercel redirect fails)
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.infoishai.com',
          },
        ],
        destination: 'https://infoishai.com/:path*',
        permanent: true, // 301 redirect
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Link', value: '<https://infoishai.com/>; rel="canonical"' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://api.dicebear.com https://images.unsplash.com https://avatars.githubusercontent.com",
              "connect-src 'self' https://*.supabase.co https://accounts.google.com",
              "frame-src https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig