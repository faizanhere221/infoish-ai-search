import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Influencer Marketing Tips & Guides | Infoishai',
  description: 'Guides and insights on influencer marketing, tech creator sponsorships, and growing your brand with content creators — from the Infoishai team.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Blog | Influencer Marketing Tips & Guides | Infoishai',
    description: 'Guides and insights on influencer marketing and tech creator sponsorships.',
    url: 'https://infoishai.com/blog',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Influencer Marketing Tips & Guides | Infoishai',
    description: 'Guides and insights on influencer marketing and tech creator sponsorships.',
  },
  alternates: {
    canonical: 'https://infoishai.com/blog',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
