import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Campaign Progress',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children
}
