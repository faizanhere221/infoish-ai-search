import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Join Infoishai as a brand or a tech creator. Free for brands and creators, with no platform fees.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://infoishai.com/signup',
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
