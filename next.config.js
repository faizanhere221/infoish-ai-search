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


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs/config");

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "infoishai",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Routes browser Sentry events through our own domain instead of directly
  // to ingest.us.sentry.io, which our CSP's connect-src (deliberately
  // locked to 'self' + the few third-party domains we actually call) was
  // blocking. /monitoring isn't an app route, so it's unaffected by
  // middleware's auth logic (only /api/* and /admin/* paths are gated) —
  // it just picks up the same security headers as every other path, which
  // is fine since the tunnel endpoint doesn't need auth.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
