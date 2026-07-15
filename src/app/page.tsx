import { Metadata } from 'next'
import {
  Navigation,
  HeroSection,
  AboutSection,
  HowInfoishaiWorksSection,
  TrustedBySection,
  ProblemSection,
  SolutionSection,
  PlatformSection,
  CategoriesSection,
  HowItWorksSection,
  WhyMarketplaceSection,
  ComparisonSection,
  UseCasesSection,
  FAQSection,
  FinalCTASection,
  NewsletterSection,
  Footer
} from '@/components/landing'

// ============================================================================
// SEO METADATA - Optimized for "find tech influencers marketplace"
// ============================================================================
export const metadata: Metadata = {
  title: 'Tech Influencer Marketplace | Find 2,000+ Verified Creators Free',
  description: 'Search 2,000+ verified tech influencers by niche, platform, and budget. AI, SaaS, developer creators on YouTube, Twitter, LinkedIn. Free to join. No subscription.',
  keywords: [
    'find tech influencers',
    'tech influencer marketplace',
    'tech creator marketplace',
    'ai influencers',
    'saas influencers',
    'developer influencers',
    'startup influencers',
    'youtube tech influencers',
    'twitter tech influencers',
    'b2b influencer marketing',
    'hire tech youtubers',
    'tech content creators',
    'influencer marketing platform',
    'pakistani tech influencers',
    'find tech creators',
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
    title: 'Tech Influencer Marketplace | Find 2,000+ Verified Creators Free',
    description: 'Search 2,000+ verified tech influencers by niche, platform, and budget. AI, SaaS, developer creators on YouTube, Twitter, LinkedIn. Free to join. No subscription.',
    images: [
      {
        url: 'https://infoishai.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Infoishai - Find Tech Influencers Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech Influencer Marketplace | Find 2,000+ Verified Creators Free',
    description: 'Search 2,000+ verified tech influencers by niche, platform, and budget. AI, SaaS, developer creators on YouTube, Twitter, LinkedIn.',
    site: '@infoishai',
    creator: '@infoishai',
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://infoishai.com',
  },
  category: 'technology',
  verification: {
    google: 'google9b21ca159a20a693',
  },
}

// ============================================================================
// STRUCTURED DATA (JSON-LD) - For Rich Snippets
// ============================================================================
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Infoishai',
  description: 'Find tech influencers marketplace - Connect brands with verified AI, SaaS, and tech content creators',
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

const faqData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Infoishai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Infoishai is a B2B tech influencer marketplace that connects brands with verified tech content creators including YouTubers, Twitter influencers, LinkedIn thought leaders, and more.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does Infoishai cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Infoishai is free to join for both brands and creators. There are no subscription fees or platform charges.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of tech influencers can I find?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can find influencers across niches including AI/ML, SaaS, developer tools, cloud computing, cybersecurity, and more. Platforms include YouTube, Twitter, LinkedIn, podcasts, and newsletters.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I hire a tech influencer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Browse our creator directory, filter by niche and platform, view profiles, and send a deal proposal directly through the platform.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a tech influencer marketplace?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A tech influencer marketplace is a platform that helps brands discover, analyze, and collaborate with influencers who create content related to technology, AI, SaaS, and developer tools.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do brands find tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Brands can find tech influencers through influencer discovery platforms like Infoishai, which provides searchable creator databases with filters for niche, platform, engagement, and audience demographics.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do tech influencers charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pricing varies depending on follower count, engagement rate, and platform. Micro influencers (1K-10K) may charge $50-200, while large creators (100K+) may charge $2,500+ per campaign.',
      },
    },
    {
      '@type': 'Question',
      name: 'What platforms are best for tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'YouTube, Twitter/X, LinkedIn, and newsletters are the most effective platforms for technology creators.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should startups work with tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tech influencers help startups build credibility, reach targeted audiences of developers and tech enthusiasts, and generate product awareness quickly through authentic recommendations.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does escrow payment protection work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When a deal is agreed upon, the brand deposits funds into our secure escrow system. The money is held safely until the creator delivers the work and the brand approves it, protecting both parties.',
      },
    },
  ],
}

const breadcrumbData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://infoishai.com',
    },
  ],
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function HomePage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <main className="min-h-screen">
        {/* Navigation with Blog & Tools */}
        <Navigation />
        
        {/* Hero - Main H1 with primary keyword */}
        <HeroSection />

        {/* About - What Infoishai is, who it's for, key benefits */}
        <AboutSection />

        {/* Social Proof */}
        <TrustedBySection />
        
        {/* Problem Section */}
        <ProblemSection />
        
        {/* Solution Section */}
        <SolutionSection />
        
        {/* Search by Platform - YouTube, Twitter, LinkedIn, etc. */}
        <PlatformSection />
        
        {/* Tech Influencer Categories - AI, SaaS, Developer, etc. */}
        <CategoriesSection />
        
        {/* How Infoishai Works - platform mechanics */}
        <HowInfoishaiWorksSection />

        {/* How to Find Tech Influencers - Step by Step */}
        <HowItWorksSection />
        
        {/* Why Use a Marketplace */}
        <WhyMarketplaceSection />
        
        {/* Influencer vs Traditional Ads Comparison */}
        <ComparisonSection />
        
        {/* Use Cases */}
        <UseCasesSection />
        
        {/* FAQ Section - Schema markup for rich snippets */}
        <FAQSection />
        
        {/* Final CTA */}
        <FinalCTASection />

        {/* Newsletter Signup */}
        <NewsletterSection />

        {/* Footer with links */}
        <Footer />
      </main>
    </>
  )
}