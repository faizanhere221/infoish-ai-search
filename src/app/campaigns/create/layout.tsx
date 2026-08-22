import { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Create Campaign | Infoishai' },
  description: 'Create a sponsorship campaign and find the right tech creators to promote your brand.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CreateCampaignLayout({ children }: { children: React.ReactNode }) {
  return children
}
