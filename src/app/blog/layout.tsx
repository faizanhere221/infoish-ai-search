import { Metadata } from 'next'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Blog | Influencer Marketing Tips & Guides',
  description: 'Guides on tech influencer marketing, creator sponsorship rates, and B2B campaign strategies. Data-backed articles updated weekly. Free tools and templates.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Blog | Influencer Marketing Tips & Guides | Infoishai',
    description: 'Guides on tech influencer marketing, creator sponsorship rates, and B2B campaign strategies. Data-backed articles updated weekly.',
    url: 'https://infoishai.com/blog',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Influencer Marketing Tips & Guides | Infoishai',
    description: 'Guides on tech influencer marketing, creator sponsorship rates, and B2B campaign strategies.',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com/blog',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
