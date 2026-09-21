import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Join Infoishai as a brand or a tech creator. Free to start, no credit card required.',
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
