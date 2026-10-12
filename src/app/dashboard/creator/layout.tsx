import { Metadata } from 'next'
import CreatorDashboardShell from '@/components/dashboard/CreatorDashboardShell'

export const metadata: Metadata = {
  title: 'Creator Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CreatorDashboardLayout({ children }: { children: React.ReactNode }) {
  return <CreatorDashboardShell>{children}</CreatorDashboardShell>
}
