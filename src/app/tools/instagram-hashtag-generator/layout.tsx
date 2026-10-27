import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Instagram Hashtag Generator',
  description: 'Generate up to 5 relevant hashtags per Instagram post or Reel, plus a larger pool to rotate, with our free AI-powered hashtag generator.',
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
    images: [{ url: 'https://infoishai.com/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai Instagram Hashtag Generator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Instagram Hashtag Generator | AI-Powered Hashtags',
    description: 'Generate relevant, high-engagement hashtags for Instagram Posts, Reels & Stories instantly.',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com/tools/instagram-hashtag-generator',
  },
}

export default function HashtagGeneratorLayout({ children }: { children: React.ReactNode }) {
  return children
}
