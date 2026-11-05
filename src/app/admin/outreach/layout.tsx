import type { Metadata } from 'next'
import { OutreachShell } from '@/components/admin/outreach/OutreachShell'

export const metadata: Metadata = {
  title: 'Outreach',
  description: 'Track manual creator and brand outreach.',
  robots: { index: false, follow: false },
}

export default function OutreachLayout({ children }: { children: React.ReactNode }) {
  return <OutreachShell>{children}</OutreachShell>
}
