import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Footer from '@/components/footer'


const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Infoishai - Global Influencer Discovery Platform | AI-Powered Search',
  description: 'Discover verified influencers worldwide using AI-powered search. 1,800+ Pakistani creators on Instagram, YouTube, TikTok. Free campaign management system included.',
  keywords: [
    'infoishai',
    'influencer search platform',
    'ai influencer discovery',
    'find influencers online',
    'influencer marketing platform',
    'creator search tool',
    'influencer database',
    'social media influencer finder',
    'instagram influencer search',
    'youtube creator finder',
    'tiktok influencer database',
    'pakistani influencers',
    'influencer marketing pakistan',
    'campaign management',
    'influencer analytics',
    'micro influencers',
    'nano influencers',
    'free campaign tools'
  ],
  authors: [{ name: 'Infoishai Team' }],
  creator: 'Infoishai',
  publisher: 'Infoishai',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://infoishai.com'),
  alternates: {
    canonical: 'https://infoishai.com/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Infoishai - Global Influencer Discovery Platform',
    description: 'AI-powered influencer search across Instagram, YouTube & TikTok. 1,800+ verified creators. Free campaign management system included.',
    url: 'https://infoishai.com',
    siteName: 'Infoishai',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Infoishai - Global Influencer Discovery Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Infoishai - Global Influencer Discovery Platform',
    description: 'AI-powered search for influencers worldwide. 1,800+ verified creators. Free campaign management included.',
    images: ['/twitter-image.jpg'],
    creator: '@infoishai',
  },
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
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#3B82F6" />
        <meta name="color-scheme" content="light dark" />
        
        {/* Viewport meta tag for responsive design */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://infoish-ai-search-production.up.railway.app" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://infoish-ai-search-production.up.railway.app" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* Progressive Web App meta tags */}
        <meta name="application-name" content="Infoishai" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Infoishai" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        
        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Infoishai",
              "alternateName": "Infoishai - Global Influencer Discovery Platform",
              "description": "AI-powered global influencer discovery platform. Search verified creators across Instagram, YouTube, and TikTok. 1,800+ verified Pakistani influencers with free campaign management system.",
              "url": "https://infoishai.com",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "availableLanguage": ["en", "ur"],
              "areaServed": {
                "@type": "Country",
                "name": "Pakistan"
              },
              "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "PKR",
                "lowPrice": "0",
                "highPrice": "6999",
                "offerCount": "3"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "256"
              },
              "provider": {
                "@type": "Organization",
                "name": "Infoishai",
                "url": "https://infoishai.com",
                "logo": "https://infoishai.com/logo.png",
                "sameAs": [
                  "https://twitter.com/infoishai",
                  "https://linkedin.com/company/infoishai",
                  "https://instagram.com/infoishai",
                  "https://youtube.com/@kakayrao"
                ],
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Multan",
                  "addressCountry": "PK"
                }
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://infoishai.com/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
        >
          Skip to main content
        </a>

        {/* Global loading indicator */}
        <div id="global-loading" className="hidden">
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading...</p>
            </div>
          </div>
        </div>

        {/* Main content wrapper */}
        <div className="min-h-screen flex flex-col">
          <main id="main-content" className="flex-1">
            {children}
          </main>

          {/* Footer Component */}
          <Footer />
        </div>

        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-Y97NRDZSBB"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Y97NRDZSBB', {
                page_path: window.location.pathname,
              });
            `
          }}
        />

        {/* Global scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handler
              window.addEventListener('error', function(e) {
                console.error('Global error:', e.error);
              });
              
              // Performance monitoring
              if ('performance' in window) {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart);
                  }, 0);
                });
              }
              
              // Service Worker registration (if available)
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(error) {
                    console.log('ServiceWorker registration failed: ', error);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  )
}