import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Tech Influencers | YouTube, Twitter & LinkedIn Creators | Infoishai',
  description: 'Browse 2,000+ verified tech influencers. Filter by niche (AI, SaaS, Dev), platform (YouTube, Twitter, LinkedIn), location & price. Find your perfect creator match.',
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
    title: 'Search Tech Influencers | YouTube, Twitter & LinkedIn Creators | Infoishai',
    description: 'Browse 2,000+ verified tech influencers. Filter by niche (AI, SaaS, Dev), platform (YouTube, Twitter, LinkedIn), location & price. Find your perfect creator match.',
    url: 'https://infoishai.com/creators',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai - Search Tech Creators' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Tech Influencers | YouTube, Twitter & LinkedIn Creators | Infoishai',
    description: 'Browse 2,000+ verified tech influencers. Filter by niche (AI, SaaS, Dev), platform (YouTube, Twitter, LinkedIn), location & price. Find your perfect creator match.',
  },
  alternates: {
    canonical: 'https://infoishai.com/creators',
  },
}

export default function CreatorsLayout({ children }: { children: React.ReactNode }) {
  return children
}
