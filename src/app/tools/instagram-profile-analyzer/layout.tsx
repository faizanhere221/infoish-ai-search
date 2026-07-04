import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Instagram Profile Analyzer | Engagement & Analytics | Infoishai',
  description: 'Analyze any public Instagram profile for free — engagement rate, consistency score, best posts, and follower tier classification in seconds.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Free Instagram Profile Analyzer | Engagement & Analytics',
    description: 'Analyze any public Instagram profile for free — engagement rate, consistency score, and more.',
    url: 'https://infoishai.com/tools/instagram-profile-analyzer',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Instagram Profile Analyzer | Engagement & Analytics',
    description: 'Analyze any public Instagram profile for free — engagement rate, consistency score, and more.',
  },
  alternates: {
    canonical: 'https://infoishai.com/tools/instagram-profile-analyzer',
  },
}

export default function ProfileAnalyzerLayout({ children }: { children: React.ReactNode }) {
  return children
}
