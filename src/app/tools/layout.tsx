import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Marketing Tools for Tech Creators',
  description: 'Free AI Instagram Hashtag Generator for posts and Reels. No signup required. Get up to 5 hashtags per post plus a pool to rotate.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Free Marketing Tools for Tech Creators | Infoishai',
    description: 'Free AI Instagram Hashtag Generator for posts and Reels. No signup required.',
    url: 'https://infoishai.com/tools',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai Free Marketing Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Marketing Tools for Tech Creators | Infoishai',
    description: 'Free AI Instagram Hashtag Generator for posts and Reels. No signup required.',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com/tools',
  },
}

const webApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Infoishai Free Marketing Tools',
  description: 'Free AI Instagram Hashtag Generator for influencer marketing',
  url: 'https://infoishai.com/tools',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'All tools are free with no signup required',
  },
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
      />
      {children}
    </>
  )
}
