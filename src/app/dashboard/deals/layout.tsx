import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Deals',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DealsDashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
