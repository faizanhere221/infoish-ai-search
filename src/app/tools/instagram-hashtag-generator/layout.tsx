import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Instagram Hashtag Generator | AI-Powered Hashtags | Infoishai',
  description: 'Generate 5-15 relevant, high-engagement hashtags for Instagram Posts, Reels & Stories instantly with our free AI-powered hashtag generator.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Free Instagram Hashtag Generator | AI-Powered Hashtags',
    description: 'Generate relevant, high-engagement hashtags for Instagram Posts, Reels & Stories instantly.',
    url: 'https://infoishai.com/tools/instagram-hashtag-generator',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Instagram Hashtag Generator | AI-Powered Hashtags',
    description: 'Generate relevant, high-engagement hashtags for Instagram Posts, Reels & Stories instantly.',
  },
  alternates: {
    canonical: 'https://infoishai.com/tools/instagram-hashtag-generator',
  },
}

export default function HashtagGeneratorLayout({ children }: { children: React.ReactNode }) {
  return children
}
