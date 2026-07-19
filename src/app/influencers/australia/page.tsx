import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AustraliaFaq from '@/components/influencers/AustraliaFaq'
import {
  ChevronRight,
  Youtube,
  Twitter,
  Linkedin,
  Mail,
  Mic,
  Brain,
  LayoutGrid,
  Landmark,
  Code2,
  ShieldCheck,
  Pickaxe,
  Globe2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Tech Influencers in Australia | Aussie Tech Creators',
  description:
    'Find verified Australian tech influencers for your brand. Browse creators in Sydney, Melbourne, and Brisbane covering AI, SaaS, fintech, and developer niches. Free to search.',
  keywords: [
    'tech influencers Australia',
    'Australian tech creators',
    'Aussie tech YouTubers',
    'Sydney tech influencers',
    'Melbourne tech creators',
    'find tech influencers Australia',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Find Tech Influencers in Australia | Infoishai',
    description:
      'Find verified Australian tech influencers for your brand. Browse creators in Sydney, Melbourne, and Brisbane covering AI, SaaS, and developer niches. Free to search.',
    url: 'https://infoishai.com/influencers/australia',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/images/australia-tech-influencers.jpg', width: 1200, height: 630, alt: 'Tech influencers in Australia' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tech Influencers in Australia | Infoishai',
    description:
      'Find verified Australian tech influencers for your brand. Browse creators in Sydney, Melbourne, and Brisbane. Free to search.',
  },
  alternates: {
    canonical: 'https://infoishai.com/influencers/australia',
  },
}

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Tech Influencers in Australia',
  description:
    'Browse and hire verified Australian tech influencers across YouTube, Twitter/X, LinkedIn, and other platforms',
  url: 'https://infoishai.com/influencers/australia',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Infoishai',
    url: 'https://infoishai.com',
  },
  about: {
    '@type': 'Thing',
    name: 'Tech Influencer Marketing in Australia',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://infoishai.com' },
      { '@type': 'ListItem', position: 2, name: 'Influencers', item: 'https://infoishai.com/creators' },
      { '@type': 'ListItem', position: 3, name: 'Australia', item: 'https://infoishai.com/influencers/australia' },
    ],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find tech influencers in Australia?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search the Infoishai creator directory and filter by Australia. Browse verified Australian tech influencers across YouTube, Twitter/X, LinkedIn, and newsletters. Filter by niche (AI, SaaS, developer tools, fintech) and audience size to find the right creator for your campaign.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do Australian tech influencers charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Australian tech influencer rates vary by platform and audience size. YouTube: AUD $1,000 to AUD $5,000 per video (50K-200K subscribers). LinkedIn: AUD $500 to AUD $2,000 per post. Twitter/X: AUD $200 to AUD $1,000 per thread. Newsletter mentions: AUD $300 to AUD $1,500 per issue.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I work with Australian tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Australia has a highly educated, English-speaking tech workforce and a growing startup ecosystem valued at over AUD $10 billion. Australian tech influencers bridge the APAC and Western markets, reaching buyers across Australia, New Zealand, and Southeast Asia. Their audiences include developers, CTOs, and enterprise buyers at companies across Sydney, Melbourne, and Brisbane.',
      },
    },
  ],
}

const stats = [
  { value: '150+', label: 'Verified Australian Creators' },
  { value: '10+', label: 'Tech Niches Covered' },
  { value: '4.7/5', label: 'Average Creator Rating' },
  { value: 'Free', label: 'To Search and Connect' },
]

const niches = [
  {
    icon: LayoutGrid,
    color: 'from-blue-500 to-cyan-500',
    name: 'SaaS and Productivity',
    description:
      'Australia is home to Atlassian, Canva, and hundreds of SaaS companies. Creators review project management tools, design platforms, CRM software, and business applications. Strong audience among startup teams and enterprise operations.',
  },
  {
    icon: Landmark,
    color: 'from-amber-500 to-yellow-500',
    name: 'Fintech and Payments',
    description:
      "Australia's fintech sector is one of the strongest in APAC. Creators cover digital payments, neobanks, buy-now-pay-later platforms, and banking APIs. Audiences include fintech founders, banking professionals, and financial services teams.",
  },
  {
    icon: Brain,
    color: 'from-violet-500 to-purple-500',
    name: 'AI and Data Analytics',
    description:
      "Creators covering machine learning tools, data visualisation platforms, business intelligence, and AI applications. Australia's growing AI adoption in mining, agriculture, and financial services drives demand for AI-focused content.",
  },
  {
    icon: Code2,
    color: 'from-green-500 to-emerald-500',
    name: 'Developer Tools and Cloud',
    description:
      "Coding-focused creators covering AWS, Azure, GCP, APIs, and developer platforms. Australia's developer community is active on GitHub and Stack Overflow. Strong audience among software engineers and engineering managers.",
  },
  {
    icon: ShieldCheck,
    color: 'from-red-500 to-orange-500',
    name: 'Cybersecurity and Compliance',
    description:
      "Australia's strict data protection regulations and the 2024 cybersecurity strategy drive demand for security-focused content. Creators cover security tools, compliance frameworks, and risk management platforms. Audiences include CISOs, IT managers, and compliance officers.",
  },
  {
    icon: Pickaxe,
    color: 'from-sky-500 to-blue-500',
    name: 'Mining Tech and AgriTech',
    description:
      'Australia-specific niche. Creators covering technology solutions for mining operations, agricultural automation, remote asset management, and resource industry digitalisation. Niche audience with high enterprise value.',
  },
]

const platforms = [
  {
    icon: Youtube,
    name: 'YouTube',
    description:
      'The primary platform for Australian tech content. Product reviews, tutorials, and comparisons from Australian creators serve both local and APAC audiences. YouTube content ranks on Google across all English-speaking markets. Best for detailed product demonstrations and long-form reviews.',
  },
  {
    icon: Linkedin,
    name: 'LinkedIn',
    description:
      'The strongest B2B channel in Australia. Australian LinkedIn influencers reach senior professionals, executives, and enterprise buyers. The platform has high adoption among Australian business leaders. Best for enterprise SaaS, B2B platforms, and professional tools.',
  },
  {
    icon: Twitter,
    name: 'Twitter/X',
    description:
      'Active Australian tech community with strong engagement in developer tools, startup discussions, and AI. Australian tech Twitter overlaps with both US and UK tech conversations. Best for developer-focused products and startup launches.',
  },
  {
    icon: Mail,
    name: 'Newsletters',
    description:
      'Australian tech newsletters cover SaaS roundups, startup funding, AI developments, and industry analysis. Smaller subscriber bases but strong engagement and trust. Best for reaching niche professional audiences.',
  },
  {
    icon: Mic,
    name: 'Podcasts',
    description:
      'Australian tech podcasts serve commuters in Sydney, Melbourne, and Brisbane. Interview and panel formats work well for B2B products needing detailed discussion. Best for complex enterprise products and thought leadership.',
  },
]

const rateTable = [
  { platform: 'YouTube (dedicated video)', audience: '10K-50K subscribers', rate: 'AUD $600 - $2,000' },
  { platform: 'YouTube (dedicated video)', audience: '50K-200K subscribers', rate: 'AUD $2,000 - $5,000' },
  { platform: 'YouTube (dedicated video)', audience: '200K+ subscribers', rate: 'AUD $5,000 - $14,000' },
  { platform: 'Twitter/X (thread)', audience: '10K-50K followers', rate: 'AUD $100 - $500' },
  { platform: 'Twitter/X (thread)', audience: '50K-200K followers', rate: 'AUD $500 - $1,500' },
  { platform: 'LinkedIn (post)', audience: '10K-50K followers', rate: 'AUD $300 - $1,000' },
  { platform: 'LinkedIn (post)', audience: '50K-100K followers', rate: 'AUD $1,000 - $2,500' },
  { platform: 'Newsletter (mention)', audience: '5K-20K subscribers', rate: 'AUD $200 - $700' },
  { platform: 'Newsletter (mention)', audience: '20K-50K subscribers', rate: 'AUD $700 - $1,800' },
  { platform: 'Podcast (mid-roll spot)', audience: '1K-10K downloads/ep', rate: 'AUD $300 - $1,500' },
]

const techHubs = [
  {
    name: 'Sydney',
    description:
      "Australia's largest tech hub and financial centre. Home to Atlassian's headquarters, a dense fintech ecosystem, and the country's highest concentration of enterprise tech companies. Sydney-based creators cover SaaS, fintech, AI, and enterprise software. The Surry Hills and Barangaroo precincts house a growing startup community.",
  },
  {
    name: 'Melbourne',
    description:
      "Australia's second tech hub with strengths in design tech, healthtech, and SaaS. Home to Canva, SEEK, REA Group, and a thriving startup scene. Melbourne-based creators reach audiences across product design, HR tech, and property technology. The Cremorne digital precinct is the city's startup centre.",
  },
  {
    name: 'Brisbane',
    description:
      "Queensland's growing tech hub with a focus on mining tech, agritech, and government technology. Brisbane-based creators serve audiences in resource sector technology and public sector IT. The Fortitude Valley precinct houses a growing startup community.",
  },
  {
    name: 'Perth',
    description:
      "Western Australia's tech centre with deep connections to mining and energy technology. Perth-based creators cover resource industry digitalisation, remote operations technology, and energy sector software. Niche but high-value enterprise audiences.",
  },
  {
    name: 'Canberra',
    description:
      "Australia's government tech hub. Home to federal government agencies and defence technology companies. Creators based here cover govtech, cybersecurity, and public sector digital transformation. Audiences include government IT teams and defence technology procurement.",
  },
  {
    name: 'Adelaide',
    description:
      'Emerging tech hub with strengths in defence technology, space tech, and cybersecurity. The Australian Space Agency is headquartered in Adelaide. Growing creator community serving defence and space industry audiences.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Search the Creator Directory',
    description:
      'Browse Australian tech influencers on Infoishai. Filter by niche (SaaS, fintech, AI, developer tools, cybersecurity, mining tech), platform (YouTube, Twitter/X, LinkedIn), and audience size. View profiles with engagement rates, past campaigns, and content samples.',
  },
  {
    number: '2',
    title: 'Message Creators Directly',
    description:
      'Found a creator who fits your campaign? Send them a message through Infoishai. Share your product details, campaign goals, and budget. Discuss deliverables and timelines directly.',
  },
  {
    number: '3',
    title: 'Launch Your Campaign',
    description:
      "Agree on terms, create a brief, and let the creator produce content in their own voice. Track performance through UTM links and promo codes. Pay securely through Infoishai's escrow system.",
  },
]

const relatedLinks = [
  { label: 'Find Tech Influencers in USA', href: '/influencers/usa' },
  { label: 'Find Tech Influencers in UK', href: '/influencers/uk' },
  { label: 'Find Tech Influencers in Canada', href: '/influencers/canada' },
  { label: 'Find Tech Influencers in India', href: '/influencers/india' },
  { label: 'Find Tech Influencers in Pakistan', href: '/influencers/pakistan' },
  { label: 'Find Tech Influencers in Germany', href: '/influencers/germany' },
  { label: 'Find Tech Influencers in Netherlands', href: '/influencers/netherlands' },
  { label: 'Find Tech Influencers in Singapore', href: '/influencers/singapore' },
  { label: 'Browse All Tech Influencers', href: '/creators' },
  { label: 'Tech Influencer Marketing Blog', href: '/blog' },
]

export default function AustraliaInfluencersPage() {
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
          <span className="text-gray-900 font-medium">Australia</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Find Tech Influencers in Australia
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            Connect with verified Australian tech creators across YouTube, Twitter/X, LinkedIn,
            and newsletters. Browse by niche, audience size, and engagement rate. Free to search.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/creators?country=AU"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Australian Creators
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

      {/* Why Australian influencers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Why Work With Australian Tech Influencers?
          </h2>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed">
            <p>
              Australia has one of the most developed tech ecosystems in the Asia-Pacific region.
              The country&apos;s tech sector generates over AUD $167 billion in annual revenue.
              Sydney and Melbourne rank among the top 20 global startup cities. Australian
              businesses adopt SaaS products at one of the highest rates per capita globally.
            </p>
            <p>
              Australian tech influencers reach professionals across a compact but high-value
              market. Their audiences include software engineers at Atlassian and Canva, fintech
              teams at Afterpay and Airwallex, startup founders building from Sydney&apos;s Surry
              Hills and Melbourne&apos;s Cremorne, and enterprise IT buyers at Australia&apos;s top
              companies and government agencies.
            </p>
            <p>
              Working with Australian creators gives your brand three specific advantages. First,
              APAC gateway. Australia bridges Western and Asian markets. Australian creators reach
              buyers across Australia, New Zealand, Singapore, and the broader Asia-Pacific
              region. English-language content from Australian creators performs well across all
              APAC English-speaking markets. Second, high purchasing power. Australian tech buyers
              have one of the highest per-capita software spending rates globally. An audience of
              50,000 Australian professionals represents more purchasing power than 200,000
              viewers in most other markets. Third, timezone advantage. Australian business hours
              overlap with Asian markets in the morning and US West Coast in the evening. Product
              launches timed with Australian creators reach the APAC audience during business
              hours and catch late US audiences. For brands targeting both Western and Asian
              buyers, Australian creators offer natural timezone bridging.
            </p>
            <p>
              Whether you sell a SaaS platform, developer tools, AI products, fintech
              infrastructure, or enterprise software, Australian tech influencers connect your
              brand with high-value APAC buyers.
            </p>
          </div>
        </div>
      </section>

      {/* Top niches */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Popular Tech Influencer Niches in Australia
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => {
              const Icon = niche.icon
              return (
                <Link
                  key={niche.name}
                  href="/creators?country=AU"
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
          Find Australian Creators on Every Platform
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Australian tech influencers create content across multiple platforms. On Infoishai, you
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
            How Much Do Australian Tech Influencers Charge in 2026?
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
            Rates for Australian tech influencers vary based on platform, audience size,
            engagement rate, and content format. Here are the standard ranges for 2026 in AUD.
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
            These rates reflect market averages for Australian tech creators in 2026. Australian
            creator rates are comparable to UK rates and approximately 10-15% lower than US
            equivalents, while offering access to the high-value APAC market. On Infoishai, you
            message creators directly to discuss rates and campaign details.
          </p>
        </div>
      </section>

      {/* Tech hubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Tech Influencers Across Australia&apos;s Top Tech Cities
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Australian tech influencers are based across every major tech hub in the country. Your
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
          <h3 className="font-semibold text-gray-900 mb-2">Remote and Regional</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Many Australian tech creators work remotely from regional areas across the country.
            Australia&apos;s strong internet infrastructure supports remote content creation. On
            Infoishai, you filter by audience demographics rather than creator location.
          </p>
        </div>
      </section>

      {/* APAC market access */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-start gap-4 mb-6 max-w-3xl">
            <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Reach the APAC Market Through Australian Creators
            </h2>
          </div>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed max-w-3xl">
            <p>
              Australia sits at the crossroads of Western and Asian tech markets. Australian tech
              influencers serve as a bridge for brands entering the Asia-Pacific region.
            </p>
            <p>
              A typical Australian tech creator&apos;s audience breaks down as follows: 50-65%
              from Australia and New Zealand, 10-15% from Southeast Asia (Singapore, Malaysia,
              Philippines, Indonesia), 10-15% from the United States and Canada, and 10-15% from
              the United Kingdom, India, and other English-speaking markets.
            </p>
            <p>
              For brands based in the US or Europe looking to expand into APAC, partnering with
              Australian creators provides English-language content consumed across the entire
              region. This eliminates the need for separate localisation for each Asian market.
            </p>
            <p>
              For APAC-based brands looking to build credibility in Western markets, Australian
              creators offer a trusted English-language voice familiar to both audiences. A
              recommendation from an Australian creator carries weight in Sydney, Singapore, and
              San Francisco.
            </p>
            <p>
              New Zealand is effectively part of the Australian tech market. Australian
              creators&apos; content reaches Kiwi audiences natively. A partnership with an
              Australian creator covers both markets without additional spend.
            </p>
          </div>
        </div>
      </section>

      {/* How to get started */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
          How to Find and Hire Australian Tech Influencers on Infoishai
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
          Browse Australian Tech Influencers
        </Link>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <AustraliaFaq />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Start Finding Australian Tech Influencers Today
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-base leading-relaxed">
            Join brands across APAC using Infoishai to connect with verified Australian tech
            creators. Search by niche, platform, and audience size. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/creators"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Australian Creators
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
