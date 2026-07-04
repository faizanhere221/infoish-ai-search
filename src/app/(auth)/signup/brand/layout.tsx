import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Tech Influencers for Your Brand | Infoishai',
  description: 'Sign up as a brand on Infoishai to find and hire verified tech influencers across YouTube, Twitter, and LinkedIn. Escrow payment protection. Free to start.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Find Tech Influencers for Your Brand | Infoishai',
    description: 'Find and hire verified tech influencers for your brand. Escrow payment protection. Free to start.',
    url: 'https://infoishai.com/signup/brand',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tech Influencers for Your Brand | Infoishai',
    description: 'Find and hire verified tech influencers for your brand. Escrow payment protection. Free to start.',
  },
  alternates: {
    canonical: 'https://infoishai.com/signup/brand',
  },
}

export default function BrandSignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
