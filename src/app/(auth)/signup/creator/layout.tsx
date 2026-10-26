import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Become a Tech Creator | Get Brand Deals',
  description: 'Sign up as a tech creator on Infoishai. Get discovered by AI, SaaS, and developer-tool brands and showcase your portfolio. Payments are made directly between brand and creator. Infoishai keeps the record. Free to join.',
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Become a Tech Creator | Get Brand Deals | Infoishai',
    description: 'Get discovered by tech brands. Payments are made directly between brand and creator. Infoishai keeps the record.',
    url: 'https://infoishai.com/signup/creator',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Become a Tech Creator | Get Brand Deals | Infoishai',
    description: 'Get discovered by tech brands. Payments are made directly between brand and creator. Infoishai keeps the record.',
  },
  alternates: {
    canonical: 'https://infoishai.com/signup/creator',
  },
}

export default function CreatorSignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
