import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import SingaporeFaq from '@/components/influencers/SingaporeFaq'
import {
  ChevronRight,
  Youtube,
  Linkedin,
  Twitter,
  Mail,
  Mic,
  Send,
  Landmark,
  Brain,
  Cloud,
  Code2,
  Building2,
  Link2,
  Globe2,
  ShieldCheck,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Tech Influencers in Singapore | APAC Tech Creators | Infoishai',
  description:
    "Find verified Singaporean tech influencers for your brand. Browse creators covering AI, fintech, SaaS, and developer niches. Gateway to Southeast Asia's 650M+ market. Free to search.",
  keywords: [
    'tech influencers Singapore',
    'Singapore tech creators',
    'APAC tech influencers',
    'Southeast Asia tech creators',
    'find tech influencers Singapore',
    'Singapore tech YouTubers',
    'ASEAN influencer marketing',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Find Tech Influencers in Singapore | Infoishai',
    description:
      "Find verified Singaporean tech influencers for your brand. Gateway to Southeast Asia's 650M+ market. Free to search.",
    url: 'https://infoishai.com/influencers/singapore',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/images/singapore-tech-influencers.jpg', width: 1200, height: 630, alt: 'Tech influencers in Singapore' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tech Influencers in Singapore | Infoishai',
    description:
      "Find verified Singaporean tech influencers for your brand. Gateway to Southeast Asia's 650M+ market. Free to search.",
  },
  alternates: {
    canonical: 'https://infoishai.com/influencers/singapore',
  },
}

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Tech Influencers in Singapore',
  description:
    'Browse and hire verified Singaporean tech influencers across YouTube, LinkedIn, Twitter/X, and other platforms',
  url: 'https://infoishai.com/influencers/singapore',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Infoishai',
    url: 'https://infoishai.com',
  },
  about: {
    '@type': 'Thing',
    name: 'Tech Influencer Marketing in Singapore',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://infoishai.com' },
      { '@type': 'ListItem', position: 2, name: 'Influencers', item: 'https://infoishai.com/creators' },
      { '@type': 'ListItem', position: 3, name: 'Singapore', item: 'https://infoishai.com/influencers/singapore' },
    ],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find tech influencers in Singapore?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search the Infoishai creator directory and filter by Singapore. Browse verified Singaporean tech influencers across YouTube, LinkedIn, Twitter/X, and newsletters. Filter by niche (fintech, AI, SaaS, developer tools), audience size, and engagement rate to find the right creator for your campaign.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do Singaporean tech influencers charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Singaporean tech influencer rates vary by platform and audience size. YouTube: SGD 1,200 to SGD 5,500 per video (50K-200K subscribers). LinkedIn: SGD 600 to SGD 2,500 per post. Twitter/X: SGD 250 to SGD 1,200 per thread. Newsletter mentions: SGD 400 to SGD 1,800 per issue.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I work with Singaporean tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Singapore is Southeast Asia's tech capital and the regional headquarters for most global tech companies. Singaporean tech influencers reach decision-makers across the ASEAN market of 650 million people. English is the business language, the government actively supports tech through the Smart Nation initiative, and Singapore-based creators carry trust across all of Southeast Asia.",
      },
    },
  ],
}

const stats = [
  { value: '100+', label: 'Verified SG Creators' },
  { value: '10+', label: 'Tech Niches Covered' },
  { value: '4.8/5', label: 'Average Creator Rating' },
  { value: 'Free', label: 'To Search and Connect' },
]

const niches = [
  {
    icon: Landmark,
    color: 'from-blue-500 to-cyan-500',
    name: 'Fintech and Digital Banking',
    description:
      "Singapore is ASEAN's fintech capital. Home to DBS (world's best digital bank), GrabPay, and the Monetary Authority of Singapore's fintech regulatory sandbox. Creators cover payment APIs, digital banking platforms, crypto regulation, and wealth tech. Audiences include fintech founders, banking professionals, and payment engineers.",
  },
  {
    icon: Brain,
    color: 'from-violet-500 to-purple-500',
    name: 'AI and Data Analytics',
    description:
      "Creators covering machine learning, AI tools, data engineering, and business intelligence. Singapore's AI Singapore (AISG) national programme and strong university research (NUS, NTU) drive demand for AI content. Audiences include data scientists, AI engineers, and enterprise teams adopting AI.",
  },
  {
    icon: Cloud,
    color: 'from-sky-500 to-blue-500',
    name: 'Enterprise SaaS and Cloud',
    description:
      "Creators reviewing CRM, ERP, project management, and cloud platforms. Singapore's position as a regional HQ hub means enterprise software adoption is high. Audiences include IT directors, ops managers, and procurement teams at MNCs and regional companies.",
  },
  {
    icon: Code2,
    color: 'from-emerald-500 to-green-500',
    name: 'Developer Tools and Engineering',
    description:
      "Coding-focused creators covering APIs, frameworks, DevOps, and developer platforms. Singapore's developer community is active on GitHub and Stack Overflow. Audiences include full-stack developers, backend engineers, and engineering managers at regional tech companies.",
  },
  {
    icon: Building2,
    color: 'from-amber-500 to-yellow-500',
    name: 'GovTech and Smart City',
    description:
      'Singapore-specific niche. Creators covering government technology, Smart Nation initiatives, digital identity (SingPass), and public sector digital transformation. Audiences include govtech companies, public sector IT teams, and smart city solution providers.',
  },
  {
    icon: Link2,
    color: 'from-rose-500 to-red-500',
    name: 'Web3 and Digital Assets',
    description:
      'Singapore is a regulated hub for digital assets in Asia. Creators cover blockchain infrastructure, tokenisation platforms, and digital asset compliance under MAS regulations. Audiences include Web3 builders, compliance professionals, and crypto infrastructure teams.',
  },
]

const platforms = [
  {
    icon: Linkedin,
    name: 'LinkedIn',
    description:
      'The dominant platform for Singaporean tech professionals. Singapore has one of the highest LinkedIn penetration rates in Asia. Singaporean LinkedIn influencers reach senior professionals, founders, and enterprise buyers across ASEAN. Posts from Singapore-based thought leaders generate engagement from professionals across the entire region. Best for enterprise SaaS, B2B platforms, and fintech products.',
  },
  {
    icon: Youtube,
    name: 'YouTube',
    description:
      'Strong platform for Singaporean tech content. Creators produce product reviews, tech analysis, and tutorials in English. Content from Singaporean YouTubers ranks across all English-speaking Asian markets. Best for detailed product demonstrations and long-form reviews.',
  },
  {
    icon: Twitter,
    name: 'Twitter/X',
    description:
      'Active Singaporean tech community covering fintech, AI, Web3, and startup discussions. Singapore tech Twitter engages with global conversations while maintaining a strong regional voice. Best for developer-focused products, startup launches, and crypto/Web3 tools.',
  },
  {
    icon: Mail,
    name: 'Newsletters',
    description:
      'Singaporean tech newsletters cover ASEAN startup funding, fintech regulation, AI developments, and enterprise tech news. High engagement from regional decision-makers. Best for reaching senior professionals who prefer curated content.',
  },
  {
    icon: Mic,
    name: 'Podcasts',
    description:
      'Singaporean tech podcasts reach professionals across ASEAN time zones. Both long-form interview shows and focused topic discussions serve the regional professional audience. Best for complex enterprise products and thought leadership.',
  },
  {
    icon: Send,
    name: 'Telegram',
    description:
      'Active tech community platform in Singapore and Southeast Asia. Creators run channels and groups focused on fintech, Web3, and startup discussions. Best for community-driven products and crypto/Web3 tools.',
  },
]

const rateTable = [
  { platform: 'YouTube (dedicated video)', audience: '10K-50K subscribers', rate: 'S$700 - S$2,500' },
  { platform: 'YouTube (dedicated video)', audience: '50K-200K subscribers', rate: 'S$2,500 - S$6,000' },
  { platform: 'YouTube (dedicated video)', audience: '200K+ subscribers', rate: 'S$6,000 - S$15,000' },
  { platform: 'Twitter/X (thread)', audience: '10K-50K followers', rate: 'S$120 - S$600' },
  { platform: 'Twitter/X (thread)', audience: '50K-200K followers', rate: 'S$600 - S$1,500' },
  { platform: 'LinkedIn (post)', audience: '10K-50K followers', rate: 'S$400 - S$1,200' },
  { platform: 'LinkedIn (post)', audience: '50K-100K followers', rate: 'S$1,200 - S$3,000' },
  { platform: 'Newsletter (mention)', audience: '5K-20K subscribers', rate: 'S$300 - S$1,000' },
  { platform: 'Newsletter (mention)', audience: '20K-50K subscribers', rate: 'S$1,000 - S$2,500' },
  { platform: 'Podcast (mid-roll spot)', audience: '1K-10K downloads/ep', rate: 'S$400 - S$1,800' },
  { platform: 'Telegram (sponsored post)', audience: '5K-20K members', rate: 'S$200 - S$800' },
]

const techDistricts = [
  {
    name: 'Central Business District (CBD) and Marina Bay',
    description:
      "Home to regional headquarters for Google, Meta, ByteDance, Stripe, and most global tech companies. The CBD houses the densest concentration of enterprise tech buyers in Southeast Asia. Creators connected to the CBD ecosystem cover enterprise software, cloud platforms, and B2B SaaS.",
  },
  {
    name: 'One-North and Fusionopolis',
    description:
      "Singapore's dedicated science and technology hub. Home to A*STAR research institutes, JTC LaunchPad (the country's largest startup incubator), and Block71 (one of the world's densest startup ecosystems). Creators from One-North cover deep tech, AI research, biomedical technology, and early-stage startups. This district is the heart of Singapore's innovation economy.",
  },
  {
    name: 'Changi Business Park',
    description:
      "Eastern Singapore's enterprise tech hub hosting regional offices for IBM, Hitachi, Infosys, and CGI. Creators connected to this ecosystem cover enterprise IT services, digital transformation, and systems integration.",
  },
  {
    name: 'Mapletree Business City and Alexandra',
    description:
      "Southern tech corridor housing Microsoft, Google, and multiple fintech companies. Strong cluster of fintech and payment technology professionals.",
  },
  {
    name: 'Paya Lebar Quarter',
    description:
      "Growing tech hub housing Grab's headquarters and a cluster of ride-hailing, delivery, and super-app companies. Creators from this area cover mobility tech, super-app ecosystems, and gig economy platforms.",
  },
  {
    name: 'Universities and Research',
    description:
      "NUS (National University of Singapore), NTU (Nanyang Technological University), SUTD, and SMU produce creators with academic and research credibility. University-connected creators cover AI research, data science, and emerging technology. Best for brands targeting the academic and R&D audience.",
  },
]

const steps = [
  {
    number: '1',
    title: 'Search the Creator Directory',
    description:
      'Browse Singaporean tech influencers on Infoishai. Filter by niche (fintech, AI, enterprise SaaS, developer tools, govtech, Web3), platform (LinkedIn, YouTube, Twitter/X, Telegram), and audience size. View profiles with engagement rates, past campaigns, and content samples.',
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
  { label: 'Find Tech Influencers in Australia', href: '/influencers/australia' },
  { label: 'Find Tech Influencers in Pakistan', href: '/influencers/pakistan' },
  { label: 'Find Tech Influencers in Germany', href: '/influencers/germany' },
  { label: 'Find Tech Influencers in Netherlands', href: '/influencers/netherlands' },
  { label: 'Browse All Tech Influencers', href: '/creators' },
  { label: 'Tech Influencer Marketing Blog', href: '/blog' },
]

export default function SingaporeInfluencersPage() {
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
          <span className="text-gray-900 font-medium">Singapore</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Find Tech Influencers in Singapore
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            Connect with verified Singaporean tech creators across YouTube, LinkedIn, Twitter/X,
            and newsletters. Your gateway to Southeast Asia&apos;s 650 million person market.
            Browse by niche, audience size, and engagement rate. Free to search.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/creators?country=SG"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Singapore Creators
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

      {/* Why Singaporean influencers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Why Work With Singaporean Tech Influencers?
          </h2>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed">
            <p>
              Singapore is Southeast Asia&apos;s undisputed tech capital. The city-state of 5.9
              million people hosts the regional headquarters for Google, Meta, ByteDance, Stripe,
              Shopify, and hundreds of global tech companies. Singapore attracts more venture
              capital than any other Southeast Asian country. The government&apos;s Smart Nation
              initiative drives one of the world&apos;s highest rates of digital transformation.
            </p>
            <p>
              Singaporean tech influencers reach decision-makers across the entire ASEAN region.
              Their audiences include engineering leads at regional tech hubs, fintech
              professionals at DBS and GrabPay, startup founders building from Block71 and
              LaunchPad, enterprise IT buyers at MNCs with APAC headquarters in Singapore, and
              tech professionals across Malaysia, Indonesia, Thailand, Vietnam, and the
              Philippines who look to Singapore as the region&apos;s tech authority.
            </p>
            <p>
              Working with Singaporean creators gives your brand four specific advantages. First,
              ASEAN gateway. Singapore is the business entry point for Southeast Asia&apos;s 650
              million person market. A Singaporean creator&apos;s endorsement carries weight from
              Jakarta to Ho Chi Minh City. English-language content from Singapore reaches the
              professional class across all ASEAN countries. Second, concentrated enterprise
              audience. Singapore&apos;s small population means every tech professional in the
              country is reachable through a handful of well-placed creator partnerships. A
              campaign with 3 to 5 Singaporean creators covers the majority of the local tech
              professional audience. Third, highest purchasing power in ASEAN. Singapore has the
              highest GDP per capita in Southeast Asia. An audience of 10,000 Singaporean tech
              professionals represents more purchasing power than 100,000 viewers in most other
              ASEAN markets. Quality over quantity defines the Singaporean audience. Fourth,
              government and enterprise trust. Singapore&apos;s government actively partners with
              tech companies through Smart Nation, GovTech, and IMDA (Infocomm Media Development
              Authority). A Singaporean creator who discusses your product in the context of Smart
              Nation initiatives or government-backed digital transformation adds institutional
              credibility no other market provides.
            </p>
            <p>
              Whether you sell fintech infrastructure, enterprise software, AI products, developer
              tools, or cloud platforms, Singaporean tech influencers position your brand at the
              centre of Southeast Asia&apos;s tech economy.
            </p>
          </div>
        </div>
      </section>

      {/* Top niches */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Popular Tech Influencer Niches in Singapore
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => {
              const Icon = niche.icon
              return (
                <Link
                  key={niche.name}
                  href="/creators?country=SG"
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
          Find Singapore Creators on Every Platform
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Singaporean tech influencers create content across multiple platforms. On Infoishai, you
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
            How Much Do Singaporean Tech Influencers Charge in 2026?
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
            Rates for Singaporean tech influencers vary based on platform, audience size,
            engagement rate, and content format. Here are the standard ranges for 2026 in SGD.
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
            These rates reflect market averages for Singaporean tech creators in 2026. Singapore
            rates are the highest in Southeast Asia, reflecting the audience&apos;s strong
            purchasing power. Rates are comparable to Australian and UK levels. For brands seeking
            maximum ASEAN reach, pairing a Singaporean creator (for credibility and regional
            trust) with creators from Malaysia, Indonesia, or the Philippines (for volume)
            delivers the best combined ROI. On Infoishai, you message creators directly to discuss
            rates and campaign details.
          </p>
        </div>
      </section>

      {/* Tech districts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Singapore&apos;s Tech Ecosystem by District
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Singapore&apos;s compact geography concentrates the entire tech ecosystem within a
          single city. Each district has a distinct specialisation.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          {techDistricts.map((district) => (
            <div key={district.name} className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{district.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{district.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ASEAN Gateway */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-start gap-4 mb-6 max-w-3xl">
            <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Reach All of Southeast Asia Through Singaporean Creators
            </h2>
          </div>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed max-w-3xl">
            <p>
              Singapore is the command centre of Southeast Asian business. Every major tech
              company uses Singapore as its ASEAN headquarters. This position makes Singaporean
              tech influencers the most trusted voices in the region.
            </p>
            <p>
              A typical Singaporean tech creator&apos;s audience breaks down as follows: 35-45%
              from Singapore, 15-20% from Malaysia, 10-15% from Indonesia, 5-10% from the
              Philippines, 5-8% from Vietnam and Thailand, and 10-15% from India, Australia, and
              the rest of the world.
            </p>
            <p>
              This distribution means a single Singaporean creator partnership reaches
              professionals across six ASEAN countries. The content performs across borders
              because English is the business language of ASEAN&apos;s professional class. A
              product recommendation from a Singapore-based creator carries weight in Kuala
              Lumpur, Jakarta, Manila, Bangkok, and Ho Chi Minh City.
            </p>
            <p>
              For brands expanding into Southeast Asia, the strategy is clear. Start with
              Singaporean creators to establish regional credibility. Pair them with local
              creators in specific ASEAN markets for depth. A Singaporean creator provides the
              trust signal. A Malaysian or Indonesian creator provides local-language reach and
              cultural specificity.
            </p>
            <p>
              The ASEAN tech market collectively represents over 650 million people and is growing
              at 20%+ annually in digital economy size. Southeast Asia&apos;s internet economy
              exceeded $200 billion in 2025, according to the Google-Temasek-Bain e-Conomy SEA
              report. Brands entering now through Singaporean creators position themselves for
              long-term growth in the world&apos;s fastest-growing digital region.
            </p>
            <p>
              For brands already present in the US or Europe, Singaporean creators provide the
              APAC leg of a global influencer strategy. A campaign combining US, UK, and
              Singaporean creators covers the three largest English-speaking tech markets and
              their surrounding regions.
            </p>
          </div>
        </div>
      </section>

      {/* Regulated industries */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-start gap-4 mb-6 max-w-3xl">
          <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Fintech, GovTech, and Regulated Tech in Singapore
          </h2>
        </div>
        <div className="space-y-4 text-base text-gray-600 leading-relaxed max-w-3xl">
          <p>
            Singapore stands apart from other tech markets because of its strong regulatory
            framework. The Monetary Authority of Singapore (MAS), the Infocomm Media Development
            Authority (IMDA), and GovTech Singapore create a regulatory environment other ASEAN
            countries look to as a model.
          </p>
          <p>
            For fintech products, Singapore is the testing ground for Southeast Asia. MAS operates
            a regulatory sandbox allowing fintech companies to test products under controlled
            conditions. A Singaporean creator who reviews your fintech product and addresses MAS
            compliance signals regulatory readiness to buyers across the region. Licensed fintech
            companies in Singapore include Grab Financial, Ant Group, and Revolut&apos;s ASEAN
            operations.
          </p>
          <p>
            For govtech products, Singapore&apos;s Smart Nation initiative drives one of the
            world&apos;s most ambitious government digitalisation programs. SingPass (national
            digital identity), TraceTogether (contact tracing), and the Government Technology
            Agency (GovTech) set global standards for digital public infrastructure. Creators who
            cover govtech topics reach decision-makers at government agencies across ASEAN who
            model their digital transformation on Singapore&apos;s example.
          </p>
          <p>
            For healthtech products, Singapore&apos;s healthcare system is highly digitalised.
            Creators covering healthtech reach hospital IT teams, clinic management companies, and
            health insurance technology providers across ASEAN.
          </p>
          <p>
            Brands selling products in regulated industries gain disproportionate value from
            Singaporean creator partnerships. The Singapore stamp of approval carries regulatory
            weight no other ASEAN market provides.
          </p>
        </div>
      </section>

      {/* How to get started */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
            How to Find and Hire Singaporean Tech Influencers on Infoishai
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
            Browse Singapore Tech Influencers
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <SingaporeFaq />
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Start Finding Singaporean Tech Influencers Today
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-base leading-relaxed">
            Join brands across ASEAN using Infoishai to connect with verified Singaporean tech
            creators. Your gateway to Southeast Asia. Search by niche, platform, and audience
            size. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/creators"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Singapore Creators
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
