import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Tech Influencers | YouTube & LinkedIn',
  description: 'Browse 2,000+ verified tech influencers. Filter by niche, platform, location & price. Find your creator match.',
  keywords: [
    'tech influencer marketplace',
    'find tech influencers',
    'tech creator platform',
    'search tech creators',
    'youtube tech influencers',
    'twitter tech influencers',
    'linkedin tech influencers',
    'hire tech youtubers',
    'B2B influencer marketing',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Search Tech Influencers | YouTube & LinkedIn Creators | Infoishai',
    description: 'Browse 2,000+ verified tech influencers. Filter by niche, platform, location & price. Find your creator match.',
    url: 'https://infoishai.com/creators',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai - Search Tech Creators' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Tech Influencers | YouTube & LinkedIn Creators | Infoishai',
    description: 'Browse 2,000+ verified tech influencers. Filter by niche, platform, location & price. Find your creator match.',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com/creators',
  },
}

export default function CreatorsLayout({ children }: { children: React.ReactNode }) {
  return children
}
