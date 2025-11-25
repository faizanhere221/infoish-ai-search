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
  title: 'Infoishai - AI-Powered Pakistani Influencer Search Platform',
  description: 'Discover and connect with 1,800+ verified Pakistani influencers and content creators. AI-powered search across Instagram, YouTube, and TikTok. Find the perfect creators for your brand in seconds.',
  keywords: [
    'infoishai',
    'pakistani influencers',
    'influencer marketing pakistan',
    'pakistani content creators',
    'ai influencer search',
    'creator discovery pakistan',
    'instagram influencers pakistan',
    'youtube creators pakistan',
    'tiktok influencers pakistan',
    'brand partnerships pakistan',
    'social media marketing pakistan',
    'karachi influencers',
    'lahore influencers',
    'islamabad influencers',
    'influencer database pakistan',
    'find influencers pakistan'
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
    canonical: '/',
  },
  openGraph: {
    title: 'Infoishai - AI-Powered Pakistani Influencer Search',
    description: 'Discover 1,800+ verified Pakistani influencers. AI-powered search, real-time analytics, instant results.',
    url: 'https://infoishai.com',
    siteName: 'Infoishai',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Infoishai - Pakistani Influencer Search Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Infoishai - AI-Powered Pakistani Influencer Search',
    description: 'Discover 1,800+ verified Pakistani influencers with AI-powered search.',
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
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
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
              "alternateName": "Infoishai - Pakistani Influencer Search",
              "description": "AI-powered influencer discovery platform for Pakistani creators. Search 1,800+ verified influencers across Instagram, YouTube, and TikTok.",
              "url": "https://infoishai.com",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
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
                "reviewCount": "150"
              },
              "provider": {
                "@type": "Organization",
                "name": "Infoishai",
                "url": "https://infoishai.com",
                "logo": "https://infoishai.com/logo.png",
                "sameAs": [
                  "https://twitter.com/infoishai",
                  "https://linkedin.com/company/infoishai"
                ],
                "address": {
                  "@type": "PostalAddress",
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