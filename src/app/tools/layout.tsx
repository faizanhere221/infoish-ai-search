import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Marketing Tools for Tech Creators | Infoishai',
  description: 'Free Instagram Profile Analyzer, AI Hashtag Generator, and more marketing tools. No signup required. Get instant audience insights and content ideas.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Free Marketing Tools for Tech Creators | Infoishai',
    description: 'Free Instagram Profile Analyzer, AI Hashtag Generator, and more marketing tools. No signup required.',
    url: 'https://infoishai.com/tools',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Marketing Tools for Tech Creators | Infoishai',
    description: 'Free Instagram Profile Analyzer, AI Hashtag Generator, and more marketing tools. No signup required.',
  },
  alternates: {
    canonical: 'https://infoishai.com/tools',
  },
}

const webApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Infoishai Free Marketing Tools',
  description: 'Free Instagram Profile Analyzer and AI Hashtag Generator for influencer marketing',
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
