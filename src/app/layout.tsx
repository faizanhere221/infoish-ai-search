import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import * as Sentry from '@sentry/nextjs'
import './globals.css'
import { GA_BOOTSTRAP_SCRIPT } from '@/lib/analytics'
import { OrganizationJsonLd, WebSiteJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import CookieConsent from '@/components/CookieConsent'
import { NavigationTracker } from '@/components/NavigationTracker'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
}

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL('https://infoishai.com'),
    title: {
      default: 'Infoishai - Tech Creator Sponsorship Marketplace',
      template: '%s | Infoishai',
    },
    description: 'The marketplace where AI, SaaS, and tech brands find verified content creators for authentic sponsorships. 100+ creators. Free to start.',
    applicationName: 'Infoishai',
    keywords: [
      'tech creator marketplace',
      'influencer sponsorship platform',
      'SaaS marketing',
      'developer content creators',
      'tech YouTubers',
      'AI influencers',
      'B2B influencer marketing',
      'creator sponsorships',
    ],
    authors: [{ name: 'Infoishai', url: 'https://infoishai.com' }],
    creator: 'Infoishai',
    publisher: 'Infoishai',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://infoishai.com',
      siteName: 'Infoishai',
      title: 'Infoishai - Tech Creator Sponsorship Marketplace',
      description: 'Connect with 100+ verified tech creators for authentic sponsorships. Free to start.',
      images: [
        {
          url: 'https://infoishai.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Infoishai - Tech Creator Marketplace',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Infoishai - Tech Creator Sponsorship Marketplace',
      description: 'Connect with 100+ verified tech creators for authentic sponsorships.',
      site: '@infoishai',
      creator: '@infoishai',
      images: ['https://infoishai.com/twitter-image.jpg'],
    },
    alternates: {
      canonical: 'https://infoishai.com',
    },
    category: 'technology',
    verification: {
      google: 'google9b21ca159a20a693',
    },
    other: {
      ...Sentry.getTraceData(),
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // GA4 consent is decided client-side: GA_BOOTSTRAP_SCRIPT sets Consent Mode
  // defaults to denied and loads gtag.js on every page load for a returning
  // visitor whose cookie_consent is 'all'. CookieConsent.tsx loads it on
  // accept. Deciding this server-side would require calling cookies() in the
  // root layout, which opts every page out of static rendering.
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-white text-gray-900 antialiased`}>
        <Script id="ga-bootstrap" strategy="beforeInteractive">
          {GA_BOOTSTRAP_SCRIPT}
        </Script>
        <CookieConsent />
        <NavigationTracker />

        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <SoftwareApplicationJsonLd />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-lg"
        >
          Skip to main content
        </a>
        
        <div id="main-content">
          {children}
        </div>
        
        <div id="toast-container" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" />
        <div id="modal-root" />
      </body>
    </html>
  )
}