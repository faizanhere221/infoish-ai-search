import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | Infoishai Tech Influencer Marketplace',
  description: 'Sign in to Infoishai to manage your tech creator sponsorships, browse verified influencers, and track deals with escrow payment protection.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Login | Infoishai Tech Influencer Marketplace',
    description: 'Sign in to Infoishai to manage your tech creator sponsorships and deals.',
    url: 'https://infoishai.com/login',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Login | Infoishai Tech Influencer Marketplace',
    description: 'Sign in to Infoishai to manage your tech creator sponsorships and deals.',
  },
  alternates: {
    canonical: 'https://infoishai.com/login',
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
