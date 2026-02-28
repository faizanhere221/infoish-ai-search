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
      {
        protocol: 'http',
        hostname: 'localhost',
      },
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

  // Set canonical base URL
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: '<https://infoishai.com/>; rel="canonical"',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig