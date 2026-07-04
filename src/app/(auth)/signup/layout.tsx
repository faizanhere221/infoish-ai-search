import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join Free | Infoishai - Connect Brands & Tech Creators',
  description: 'Join Infoishai for free — the B2B tech influencer marketplace connecting brands with verified AI, SaaS, and developer content creators. Sign up as a brand or creator in minutes.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Join Free | Infoishai - Connect Brands & Tech Creators',
    description: 'Join Infoishai for free — connect brands with verified tech content creators.',
    url: 'https://infoishai.com/signup',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join Free | Infoishai - Connect Brands & Tech Creators',
    description: 'Join Infoishai for free — connect brands with verified tech content creators.',
  },
  alternates: {
    canonical: 'https://infoishai.com/signup',
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
