/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Google OAuth profile pictures
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Supabase storage (creator/brand avatars, portfolio media, etc.)
      { protocol: 'https', hostname: 'ypdspiwxsojwjzbagaip.supabase.co' },
    ],
  },
}

module.exports = nextConfig
