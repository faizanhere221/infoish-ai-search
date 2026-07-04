import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password | Infoishai',
  description: 'Reset your Infoishai account password.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://infoishai.com/forgot-password',
  },
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
