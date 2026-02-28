import { Metadata } from 'next'
import { 
  Navigation, 
  HeroSection, 
  ProblemSection, 
  HowItWorksSection, 
  FeaturesSection, 
  PricingSection, 
  CreatorCTASection, 
  TestimonialsSection, 
  FinalCTASection, 
  Footer 
} from '@/components/landing'

// ============================================================================
// SEO METADATA
// ============================================================================
export const metadata: Metadata = {
  title: 'Infoishai - Tech Creator Sponsorship Marketplace | Connect Brands with Creators',
  description: 'The marketplace where AI, SaaS, and tech brands find verified content creators for authentic sponsorships. Escrow payment protection. 2,000+ creators. Free to start.',
  keywords: [
    'tech creator marketplace',
    'influencer sponsorship platform',
    'SaaS marketing',
    'developer content creators',
    'tech YouTubers',
    'AI influencers',
    'B2B influencer marketing',
    'creator sponsorships',
    'tech brand partnerships',
    'content creator platform'
  ],
  authors: [{ name: 'Infoishai' }],
  creator: 'Infoishai',
  publisher: 'Infoishai',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://infoishai.com',
    siteName: 'Infoishai',
    title: 'Infoishai - Tech Creator Sponsorship Marketplace',
    description: 'Connect with 2,000+ verified tech creators for authentic sponsorships. Escrow protection. Free to start.',
    images: [
      {
        url: 'https://infoishai.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Infoishai - Tech Creator Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Infoishai - Tech Creator Sponsorship Marketplace',
    description: 'Connect with 2,000+ verified tech creators for authentic sponsorships.',
    site: '@infoishai',
    creator: '@infoishai',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com',
  },
  category: 'technology',
}

// ============================================================================
// STRUCTURED DATA (JSON-LD)
// ============================================================================
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Infoishai',
  description: 'Tech creator sponsorship marketplace connecting brands with verified content creators',
  url: 'https://infoishai.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free to join for brands and creators',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '500',
    bestRating: '5',
    worstRating: '1',
  },
  provider: {
    '@type': 'Organization',
    name: 'Infoishai',
    url: 'https://infoishai.com',
    logo: 'https://infoishai.com/logo.png',
    sameAs: [
      'https://twitter.com/infoishai',
      'https://linkedin.com/company/infoishai',
      'https://youtube.com/@infoishai',
    ],
  },
}

const organizationData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Infoishai',
  url: 'https://infoishai.com',
  logo: 'https://infoishai.com/logo.png',
  description: 'The marketplace connecting tech brands with authentic content creators for sponsorships that convert.',
  foundingDate: '2024',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@infoishai.com',
  },
  sameAs: [
    'https://twitter.com/infoishai',
    'https://linkedin.com/company/infoishai',
    'https://youtube.com/@infoishai',
  ],
}

const faqData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does Infoishai cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Infoishai is free to join for both brands and creators. Brands only pay a 10% platform fee on completed deals. Creators keep 100% of their earnings.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the escrow payment system work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When a deal is agreed upon, the brand deposits funds into our secure escrow system. The money is held safely until the creator delivers the work and the brand approves it. This protects both parties.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of creators are on Infoishai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Infoishai focuses exclusively on tech content creators including AI/ML educators, SaaS reviewers, developer tools experts, DevOps specialists, and more across YouTube, Twitter, LinkedIn, newsletters, and podcasts.',
      },
    },
  ],
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function HomePage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />

      <main className="min-h-screen">
        <Navigation />
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PricingSection />
        <CreatorCTASection />
        <TestimonialsSection />
        <FinalCTASection />
        <Footer />
      </main>
    </>
  )
}