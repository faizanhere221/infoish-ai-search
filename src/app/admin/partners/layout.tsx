import { Metadata } from 'next'

export const metadata: Metadata = {
  // The root layout applies a '%s | Infoishai' title template, and nothing
  // in the admin layout tree overrides it (admin/layout.tsx is a client
  // component with no metadata export), so it stays active here — the
  // suffix is appended automatically, not included in this string.
  title: 'Manage Partners | Admin',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPartnersLayout({ children }: { children: React.ReactNode }) {
  return children
}
