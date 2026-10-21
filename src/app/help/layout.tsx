import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center | Tech Influencer Marketplace',
  description: 'Get answers about creating an account, finding tech influencers, creator profiles, deals, and payment tracking on Infoishai.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Help Center | Infoishai Tech Influencer Marketplace',
    description: 'Get answers about accounts, finding tech influencers, deals, and payments on Infoishai.',
    url: 'https://infoishai.com/help',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai Help Center' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help Center | Infoishai Tech Influencer Marketplace',
    description: 'Get answers about accounts, finding tech influencers, deals, and payments on Infoishai.',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com/help',
  },
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children
}
