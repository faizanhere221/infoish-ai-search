import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Marketing Tools for Tech Creators | Infoishai',
  description: 'Free tools for influencer marketing: Instagram Profile Analyzer and Instagram Hashtag Generator. No signup required.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Free Marketing Tools for Tech Creators | Infoishai',
    description: 'Free tools for influencer marketing: Instagram Profile Analyzer and Instagram Hashtag Generator.',
    url: 'https://infoishai.com/tools',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Marketing Tools for Tech Creators | Infoishai',
    description: 'Free tools for influencer marketing: Instagram Profile Analyzer and Instagram Hashtag Generator.',
  },
  alternates: {
    canonical: 'https://infoishai.com/tools',
  },
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children
}
