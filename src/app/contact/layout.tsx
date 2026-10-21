import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Tech Influencer Marketplace',
  description: 'Get in touch with the Infoishai team for support, partnerships, or questions about our B2B tech influencer marketplace.',
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
    images: [{ url: 'https://infoishai.com/og-image.jpg', width: 1200, height: 630, alt: 'Contact Infoishai' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | Infoishai Tech Influencer Marketplace',
    description: 'Get in touch with the Infoishai team for support, partnerships, or general questions.',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
