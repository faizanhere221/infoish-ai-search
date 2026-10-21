import { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Create Campaign | Infoishai' },
  description: 'Create a sponsorship campaign and find the right tech creators to promote your brand.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://infoishai.com/campaigns/create',
  },
}

export default function CreateCampaignLayout({ children }: { children: React.ReactNode }) {
  return children
}
