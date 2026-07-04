import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Become a Tech Creator | Get Brand Deals | Infoishai',
  description: 'Sign up as a tech creator on Infoishai. Get discovered by AI, SaaS, and developer-tool brands, showcase your portfolio, and get paid securely through escrow. Free to join.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Become a Tech Creator | Get Brand Deals | Infoishai',
    description: 'Get discovered by tech brands, showcase your portfolio, and get paid securely through escrow.',
    url: 'https://infoishai.com/signup/creator',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Become a Tech Creator | Get Brand Deals | Infoishai',
    description: 'Get discovered by tech brands, showcase your portfolio, and get paid securely through escrow.',
  },
  alternates: {
    canonical: 'https://infoishai.com/signup/creator',
  },
}

export default function CreatorSignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
