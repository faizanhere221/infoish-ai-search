/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep only the page extensions you're using
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
  output: 'standalone', // Good for deployment
  
  // Image optimization settings
  images: {
    domains: ['localhost'], // Add your production domains later
    unoptimized: false,
  },
}

module.exports = nextConfig