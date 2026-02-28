import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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

export const metadata: Metadata = {
  title: {
    default: 'Infoishai - Tech Creator Sponsorship Marketplace',
    template: '%s | Infoishai',
  },
  description: 'The marketplace where AI, SaaS, and tech brands find verified content creators for authentic sponsorships. Escrow payment protection. 2,000+ creators. Free to start.',
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
    description: 'Connect with 2,000+ verified tech creators for authentic sponsorships. Escrow protection. Free to start.',
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
    description: 'Connect with 2,000+ verified tech creators for authentic sponsorships.',
    site: '@infoishai',
    creator: '@infoishai',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com',
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-white text-gray-900 antialiased`}>
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