import { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Tech Influencer Campaigns | Find Brand Deals | Infoishai' },
  description:
    'Browse sponsorship campaigns from tech, AI, and SaaS brands. Apply directly and land your next brand deal — free to join.',
  keywords: [
    'tech influencer campaigns',
    'brand deals for creators',
    'sponsorship campaigns',
    'tech creator sponsorships',
    'influencer marketing campaigns',
    'apply to brand campaigns',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Tech Influencer Campaigns | Find Brand Deals | Infoishai',
    description:
      'Browse sponsorship campaigns from tech, AI, and SaaS brands. Apply directly and land your next brand deal — free to join.',
    url: 'https://infoishai.com/campaigns',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai - Tech Influencer Campaigns' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech Influencer Campaigns | Find Brand Deals | Infoishai',
    description:
      'Browse sponsorship campaigns from tech, AI, and SaaS brands. Apply directly and land your next brand deal — free to join.',
  },
  alternates: {
    canonical: 'https://infoishai.com/campaigns',
  },
}

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return children
}
