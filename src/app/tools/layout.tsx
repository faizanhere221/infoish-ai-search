import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Marketing Tools | Instagram Analyzer, Hashtag Generator, AI Humanizer',
  description: 'Free tools for influencer marketing: Instagram Profile Analyzer, Instagram Hashtag Generator, and AI Humanizer. No signup required.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Free Marketing Tools | Infoishai',
    description: 'Free tools for influencer marketing: Instagram Profile Analyzer, Hashtag Generator, and AI Humanizer.',
    url: 'https://infoishai.com/tools',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Marketing Tools | Infoishai',
    description: 'Free tools for influencer marketing: Instagram Profile Analyzer, Hashtag Generator, and AI Humanizer.',
  },
  alternates: {
    canonical: 'https://infoishai.com/tools',
  },
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children
}
