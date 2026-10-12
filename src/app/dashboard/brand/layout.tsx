import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brand Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

export default function BrandDashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
