import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free AI Humanizer Tool | Make AI Text Sound Human | Infoishai',
  description: 'Turn AI-generated text into natural, human-sounding content instantly. Free AI humanizer tool that bypasses AI detectors while keeping your original meaning.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Free AI Humanizer Tool | Make AI Text Sound Human',
    description: 'Turn AI-generated text into natural, human-sounding content instantly. Free tool.',
    url: 'https://infoishai.com/tools/ai-humanizer',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Humanizer Tool | Make AI Text Sound Human',
    description: 'Turn AI-generated text into natural, human-sounding content instantly. Free tool.',
  },
  alternates: {
    canonical: 'https://infoishai.com/tools/ai-humanizer',
  },
}

export default function AiHumanizerLayout({ children }: { children: React.ReactNode }) {
  return children
}
