import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Infoishai Tech Influencer Marketplace',
  description: 'Get in touch with the Infoishai team for support, partnerships, or questions about our B2B tech influencer marketplace connecting brands with verified creators.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Contact Us | Infoishai Tech Influencer Marketplace',
    description: 'Get in touch with the Infoishai team for support, partnerships, or general questions.',
    url: 'https://infoishai.com/contact',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | Infoishai Tech Influencer Marketplace',
    description: 'Get in touch with the Infoishai team for support, partnerships, or general questions.',
  },
  alternates: {
    canonical: 'https://infoishai.com/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
