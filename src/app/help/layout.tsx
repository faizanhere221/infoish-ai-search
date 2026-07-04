import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center | Infoishai Tech Influencer Marketplace',
  description: 'Get answers about creating an account, finding tech influencers, creator profiles, deals, and escrow payments on Infoishai — the B2B tech influencer marketplace.',
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Help Center | Infoishai Tech Influencer Marketplace',
    description: 'Get answers about accounts, finding tech influencers, deals, and payments on Infoishai.',
  },
  alternates: {
    canonical: 'https://infoishai.com/help',
  },
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children
}
