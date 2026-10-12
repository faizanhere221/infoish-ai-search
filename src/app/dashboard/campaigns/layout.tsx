import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Campaigns',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CampaignsDashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
