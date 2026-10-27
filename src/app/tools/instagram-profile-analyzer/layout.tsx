import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Instagram Profile Analyzer',
  description: 'Analyze any public Instagram profile for free — engagement rate, consistency score, best posts, and follower tier classification in seconds.',
  // noindex until the analyzer has a working backend again. The page stays reachable by URL.
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Free Instagram Profile Analyzer | Engagement & Analytics',
    description: 'Analyze any public Instagram profile for free — engagement rate, consistency score, and more.',
    url: 'https://infoishai.com/tools/instagram-profile-analyzer',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai Instagram Profile Analyzer' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Instagram Profile Analyzer | Engagement & Analytics',
    description: 'Analyze any public Instagram profile for free — engagement rate, consistency score, and more.',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com/tools/instagram-profile-analyzer',
  },
}

export default function ProfileAnalyzerLayout({ children }: { children: React.ReactNode }) {
  return children
}
