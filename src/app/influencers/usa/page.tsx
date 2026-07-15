import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import UsaFaq from '@/components/influencers/UsaFaq'
import {
  ChevronRight,
  Youtube,
  Twitter,
  Linkedin,
  Mail,
  Mic,
  Brain,
  LayoutGrid,
  Code2,
  Cloud,
  ShieldCheck,
  Landmark,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Tech Influencers in USA | American Tech Creators',
  description:
    'Find verified American tech influencers for your brand. Browse US-based YouTubers, LinkedIn creators, and Twitter experts in AI, SaaS, and developer niches. Free to search.',
  keywords: [
    'tech influencers USA',
    'American tech creators',
    'US tech YouTubers',
    'Silicon Valley influencers',
    'find tech influencers United States',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Find Tech Influencers in USA | Infoishai',
    description:
      'Find verified American tech influencers for your brand. Browse US-based YouTubers, LinkedIn creators, and Twitter experts. Free to search.',
    url: 'https://infoishai.com/influencers/usa',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/images/usa-tech-influencers.jpg', width: 1200, height: 630, alt: 'Tech influencers in the USA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tech Influencers in USA | Infoishai',
    description:
      'Find verified American tech influencers for your brand. Browse US-based YouTubers, LinkedIn creators, and Twitter experts. Free to search.',
  },
  alternates: {
    canonical: 'https://infoishai.com/influencers/usa',
  },
}

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Tech Influencers in USA',
  description:
    'Browse and hire verified American tech influencers across YouTube, Twitter/X, LinkedIn, and other platforms',
  url: 'https://infoishai.com/influencers/usa',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Infoishai',
    url: 'https://infoishai.com',
  },
  about: {
    '@type': 'Thing',
    name: 'Tech Influencer Marketing in the United States',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://infoishai.com' },
      { '@type': 'ListItem', position: 2, name: 'Influencers', item: 'https://infoishai.com/creators' },
      { '@type': 'ListItem', position: 3, name: 'USA', item: 'https://infoishai.com/influencers/usa' },
    ],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find tech influencers in the USA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search the Infoishai creator directory and filter by United States. Browse verified tech influencers across YouTube, Twitter/X, LinkedIn, and newsletters. Filter by niche (AI, SaaS, developer tools) and audience size to find the right creator for your campaign.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do American tech influencers charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'US tech influencer rates vary by platform and audience size. YouTube: $1,000 to $5,000 per video (50K-200K subscribers). LinkedIn: $500 to $2,000 per post. Twitter/X: $200 to $1,000 per thread. Newsletter mentions: $300 to $1,500 per issue.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I work with US-based tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The US has the largest tech buyer market globally. American tech influencers reach decision-makers at companies across Silicon Valley, New York, Austin, Seattle, and other tech hubs. Their audiences include developers, CTOs, product managers, and startup founders with purchasing authority.',
      },
    },
  ],
}

const stats = [
  { value: '500+', label: 'Verified US Creators' },
  { value: '15+', label: 'Tech Niches Covered' },
  { value: '4.8/5', label: 'Average Creator Rating' },
  { value: 'Free', label: 'To Search and Connect' },
]

const niches = [
  {
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    name: 'AI and Machine Learning',
    description:
      'Creators reviewing AI tools, LLM applications, computer vision, and automation platforms. High demand from AI startups and enterprise AI teams.',
  },
  {
    icon: LayoutGrid,
    color: 'from-violet-500 to-purple-500',
    name: 'SaaS and Productivity',
    description:
      'Software reviewers covering project management, CRM, analytics, and workflow tools. Audiences include founders, ops teams, and product managers.',
  },
  {
    icon: Code2,
    color: 'from-green-500 to-emerald-500',
    name: 'Developer Tools',
    description:
      'Coding-focused creators covering IDEs, APIs, frameworks, and developer platforms. Audiences include software engineers and engineering managers.',
  },
  {
    icon: Cloud,
    color: 'from-sky-500 to-blue-500',
    name: 'Cloud and DevOps',
    description:
      'Infrastructure creators covering AWS, Azure, GCP, Kubernetes, and CI/CD pipelines. Audiences include DevOps engineers and cloud architects.',
  },
  {
    icon: ShieldCheck,
    color: 'from-red-500 to-orange-500',
    name: 'Cybersecurity',
    description:
      'Security-focused creators covering tools, best practices, and threat analysis. Audiences include CISOs, security engineers, and IT managers.',
  },
  {
    icon: Landmark,
    color: 'from-amber-500 to-yellow-500',
    name: 'Fintech',
    description:
      'Creators covering financial technology, payment platforms, banking APIs, and crypto infrastructure. Audiences include fintech founders and finance teams.',
  },
]

const platforms = [
  {
    icon: Youtube,
    name: 'YouTube',
    description:
      'Long-form product reviews, tutorials, and comparison videos. Best for B2B products needing detailed demonstrations.',
  },
  {
    icon: Twitter,
    name: 'Twitter/X',
    description:
      'Tech threads, product announcements, and community discussions. Best for developer tools and open-source projects.',
  },
  {
    icon: Linkedin,
    name: 'LinkedIn',
    description:
      'Thought leadership posts, industry analysis, and professional recommendations. Best for enterprise SaaS and B2B platforms.',
  },
  {
    icon: Mail,
    name: 'Newsletters',
    description:
      'Curated tech roundups and product spotlights. Best for reaching engaged subscribers who read weekly digests.',
  },
  {
    icon: Mic,
    name: 'Podcasts',
    description:
      'Interview-style content and sponsored segments. Best for complex products needing longer explanations.',
  },
]

const rateTable = [
  { platform: 'YouTube (dedicated video)', audience: '10K-50K subscribers', rate: '$500 - $2,000' },
  { platform: 'YouTube (dedicated video)', audience: '50K-200K subscribers', rate: '$2,000 - $5,000' },
  { platform: 'YouTube (dedicated video)', audience: '200K+ subscribers', rate: '$5,000 - $15,000' },
  { platform: 'Twitter/X (thread)', audience: '10K-50K followers', rate: '$100 - $500' },
  { platform: 'Twitter/X (thread)', audience: '50K-200K followers', rate: '$500 - $1,500' },
  { platform: 'LinkedIn (post)', audience: '10K-50K followers', rate: '$300 - $1,000' },
  { platform: 'LinkedIn (post)', audience: '50K-100K followers', rate: '$1,000 - $2,500' },
  { platform: 'Newsletter (mention)', audience: '5K-20K subscribers', rate: '$200 - $800' },
  { platform: 'Newsletter (mention)', audience: '20K-50K subscribers', rate: '$800 - $2,000' },
  { platform: 'Podcast (mid-roll spot)', audience: '1K-10K downloads/ep', rate: '$300 - $1,500' },
]

const techHubs = [
  {
    name: 'San Francisco and Silicon Valley',
    description:
      'The largest concentration of tech creators. AI, SaaS, and startup-focused influencers with direct connections to the Bay Area tech ecosystem.',
  },
  {
    name: 'New York City',
    description:
      'Fintech, media tech, and enterprise SaaS creators. Strong LinkedIn and newsletter presence among East Coast business audiences.',
  },
  {
    name: 'Austin, Texas',
    description:
      'Growing hub for developer tools, open-source, and startup creators. Many creators relocated during the 2020-2024 tech migration and built local followings.',
  },
  {
    name: 'Seattle',
    description:
      'Cloud computing, DevOps, and enterprise tech creators. Proximity to AWS and Microsoft headquarters means a high concentration of infrastructure-focused content.',
  },
  {
    name: 'Boston',
    description:
      'AI, biotech, and enterprise software creators. Strong academic and research connections through MIT and Harvard networks.',
  },
  {
    name: 'Miami',
    description:
      'Emerging tech and crypto/Web3 creators. Growing startup ecosystem with a focus on Latin American markets.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Search the Creator Directory',
    description:
      'Browse US-based tech influencers on Infoishai. Filter by niche (AI, SaaS, developer tools, cloud), platform (YouTube, Twitter/X, LinkedIn), and audience size. View profiles with engagement rates, past campaigns, and content samples.',
  },
  {
    number: '2',
    title: 'Message Creators Directly',
    description:
      "Found a creator who fits your campaign? Send them a message through Infoishai. Share your product details, campaign goals, and budget. Discuss deliverables and timelines.",
  },
  {
    number: '3',
    title: 'Launch Your Campaign',
    description:
      "Agree on terms, create a brief, and let the creator produce content in their own voice. Track performance through UTM links and promo codes. Pay securely through Infoishai's escrow system.",
  },
]

const relatedLinks = [
  { label: 'Find Tech Influencers in UK', href: '/influencers/uk' },
  { label: 'Find Tech Influencers in India', href: '/influencers/india' },
  { label: 'Find Tech Influencers in Canada', href: '/influencers/canada' },
  { label: 'Find Tech Influencers in Australia', href: '/influencers/australia' },
  { label: 'Find Tech Influencers in Pakistan', href: '/influencers/pakistan' },
  { label: 'Find Tech Influencers in Germany', href: '/influencers/germany' },
  { label: 'Find Tech Influencers in Netherlands', href: '/influencers/netherlands' },
  { label: 'Find Tech Influencers in Singapore', href: '/influencers/singapore' },
  { label: 'Browse All Tech Influencers', href: '/creators' },
  { label: 'Tech Influencer Marketing Blog', href: '/blog' },
]

export default function UsaInfluencersPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Header />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/creators" className="hover:text-blue-600 transition-colors">
            Influencers
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">USA</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Find Tech Influencers in the United States
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            Connect with verified American tech creators across YouTube, Twitter/X, LinkedIn, and
            newsletters. Browse by niche, audience size, and engagement rate. Free to search.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/creators?country=US"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse US Creators
            </Link>
            <Link
              href="/signup/brand"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 rounded-xl font-semibold text-base transition-all"
            >
              Join as a Brand
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why US influencers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Why Work With American Tech Influencers?
          </h2>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed">
            <p>
              The United States is the largest tech market globally. 40% of the world&apos;s SaaS
              companies are headquartered in the US, and American tech buyers spend more per
              subscription than buyers in any other region.
            </p>
            <p>
              American tech influencers reach the people who make purchasing decisions at these
              companies. Their audiences include software engineers in Silicon Valley, startup
              founders in Austin, product managers in New York, and enterprise buyers in Seattle and
              Boston.
            </p>
            <p>
              Working with US-based creators gives your brand three advantages. First, cultural
              relevance. American creators speak to American buyers using references, examples, and
              workflows familiar to the US market. Second, time zone alignment. Live streams, product
              launches, and campaign timelines align with US business hours. Third, platform
              authority. US-based creators often rank higher in YouTube and Google search results for
              English-language tech queries, giving your sponsored content more organic reach.
            </p>
            <p>
              Whether you sell a developer tool, an AI platform, a SaaS product, or cloud
              infrastructure, American tech influencers connect your brand with the right buyers.
            </p>
          </div>
        </div>
      </section>

      {/* Top niches */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Popular Tech Influencer Niches in the USA
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => {
              const Icon = niche.icon
              return (
                <Link
                  key={niche.name}
                  href="/creators?country=US"
                  className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${niche.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{niche.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{niche.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Find US Creators on Every Platform
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          American tech influencers create content across multiple platforms. On Infoishai, you
          search creators by their primary platform and find the right format for your campaign.
        </p>
        <div className="space-y-4">
          {platforms.map((platform) => {
            const Icon = platform.icon
            return (
              <div
                key={platform.name}
                className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{platform.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{platform.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Rates */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            How Much Do US Tech Influencers Charge in 2026?
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
            Rates for American tech influencers vary based on platform, audience size, engagement
            rate, and content format. Here are the standard ranges for 2026.
          </p>
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 font-semibold text-gray-900 whitespace-nowrap">Platform</th>
                  <th className="px-5 py-3 font-semibold text-gray-900 whitespace-nowrap">Audience Size</th>
                  <th className="px-5 py-3 font-semibold text-gray-900 whitespace-nowrap">Rate Range</th>
                </tr>
              </thead>
              <tbody>
                {rateTable.map((row, i) => (
                  <tr key={`${row.platform}-${row.audience}`} className={i !== rateTable.length - 1 ? 'border-b border-gray-100' : ''}>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{row.platform}</td>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{row.audience}</td>
                    <td className="px-5 py-3 text-gray-900 font-medium whitespace-nowrap">{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed max-w-3xl mt-6">
            These rates reflect market averages for US-based tech creators in 2026. Actual pricing
            depends on creator engagement rates, content quality, and niche specialization. On
            Infoishai, you message creators directly to discuss rates and campaign details.
          </p>
        </div>
      </section>

      {/* Tech hubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Tech Influencers Across America&apos;s Top Tech Hubs
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          American tech influencers are based across every major tech hub in the country. Your
          campaign reaches creators rooted in the communities where your buyers work.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          {techHubs.map((hub) => (
            <div key={hub.name} className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{hub.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{hub.description}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Remote and Distributed</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Many top American tech influencers work remotely. Their location matters less than their
            audience demographics and engagement metrics. On Infoishai, you filter by audience
            location, not creator location, to reach buyers wherever they are.
          </p>
        </div>
      </section>

      {/* How to get started */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
            How to Find and Hire US Tech Influencers on Infoishai
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            {steps.map((step) => (
              <div key={step.number}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold flex items-center justify-center mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
          <Link
            href="/creators"
            className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
          >
            Browse US Tech Influencers
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <UsaFaq />
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Start Finding US Tech Influencers Today
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-base leading-relaxed">
            Join 500+ brands using Infoishai to connect with verified American tech creators. Search
            by niche, platform, and audience size. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/creators"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse US Creators
            </Link>
            <Link
              href="/signup/brand"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white/10 border border-white/40 text-white rounded-xl font-semibold text-base hover:bg-white/20 transition-all"
            >
              Sign Up Free as a Brand
            </Link>
            <Link
              href="/signup/creator"
              className="min-h-[48px] inline-flex items-center justify-center px-4 py-3 text-white font-medium underline"
            >
              Join as a Creator
            </Link>
          </div>
        </div>
      </section>

      {/* Related links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Explore More</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors py-1"
            >
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
