import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import UkFaq from '@/components/influencers/UkFaq'
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
  ShieldCheck,
  Landmark,
  HeartPulse,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Tech Influencers in UK | British Tech Creators',
  description:
    'Find verified British tech influencers for your brand. Browse UK-based YouTubers, LinkedIn thought leaders, and Twitter experts in AI, SaaS, and developer niches. Free to search.',
  keywords: [
    'tech influencers UK',
    'British tech creators',
    'UK tech YouTubers',
    'London tech influencers',
    'find tech influencers United Kingdom',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Find Tech Influencers in UK | Infoishai',
    description:
      'Find verified British tech influencers for your brand. Browse UK-based YouTubers, LinkedIn thought leaders, and Twitter experts. Free to search.',
    url: 'https://infoishai.com/influencers/uk',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/images/uk-tech-influencers.jpg', width: 1200, height: 630, alt: 'Tech influencers in the United Kingdom' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tech Influencers in UK | Infoishai',
    description:
      'Find verified British tech influencers for your brand. Browse UK-based YouTubers, LinkedIn thought leaders, and Twitter experts. Free to search.',
  },
  alternates: {
    canonical: 'https://infoishai.com/influencers/uk',
  },
}

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Tech Influencers in United Kingdom',
  description:
    'Browse and hire verified British tech influencers across YouTube, Twitter/X, LinkedIn, and other platforms',
  url: 'https://infoishai.com/influencers/uk',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Infoishai',
    url: 'https://infoishai.com',
  },
  about: {
    '@type': 'Thing',
    name: 'Tech Influencer Marketing in the United Kingdom',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://infoishai.com' },
      { '@type': 'ListItem', position: 2, name: 'Influencers', item: 'https://infoishai.com/creators' },
      { '@type': 'ListItem', position: 3, name: 'UK', item: 'https://infoishai.com/influencers/uk' },
    ],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find tech influencers in the UK?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search the Infoishai creator directory and filter by United Kingdom. Browse verified British tech influencers across YouTube, Twitter/X, LinkedIn, and newsletters. Filter by niche (AI, SaaS, developer tools) and audience size to find the right creator for your campaign.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do UK tech influencers charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'UK tech influencer rates vary by platform and audience size. YouTube: £800 to £4,000 per video (50K-200K subscribers). LinkedIn: £400 to £1,500 per post. Twitter/X: £150 to £800 per thread. Newsletter mentions: £250 to £1,200 per issue.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I work with UK-based tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The UK is Europe’s largest tech market and home to over 150 unicorn startups. British tech influencers reach decision-makers across London’s fintech hub, Cambridge’s AI corridor, Manchester’s growing tech scene, and Edinburgh’s data science community. Their audiences include developers, CTOs, and startup founders across the UK and Europe.',
      },
    },
  ],
}

const stats = [
  { value: '300+', label: 'Verified UK Creators' },
  { value: '12+', label: 'Tech Niches Covered' },
  { value: '4.7/5', label: 'Average Creator Rating' },
  { value: 'Free', label: 'To Search and Connect' },
]

const niches = [
  {
    icon: Landmark,
    color: 'from-amber-500 to-yellow-500',
    name: 'Fintech and Banking Tech',
    description:
      'The UK leads global fintech. British creators cover payment platforms, banking APIs, open banking, and financial infrastructure. Their audiences include fintech founders and finance teams across Europe.',
  },
  {
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    name: 'AI and Data Science',
    description:
      'Creators covering machine learning, AI tools, data engineering, and natural language processing. The Cambridge and London AI clusters generate a strong pool of expert creators.',
  },
  {
    icon: LayoutGrid,
    color: 'from-violet-500 to-purple-500',
    name: 'SaaS and B2B Software',
    description:
      'Software reviewers covering CRM, project management, analytics, and enterprise platforms. Audiences include UK and European startup teams, operations managers, and procurement teams.',
  },
  {
    icon: Code2,
    color: 'from-green-500 to-emerald-500',
    name: 'Developer Tools and Open Source',
    description:
      'Coding-focused creators covering frameworks, APIs, IDEs, and open-source projects. Audiences include full-stack developers, backend engineers, and engineering leads.',
  },
  {
    icon: ShieldCheck,
    color: 'from-red-500 to-orange-500',
    name: 'Cybersecurity and Privacy',
    description:
      'Security-focused creators covering threat analysis, compliance tools, and privacy regulations including UK GDPR. Audiences include CISOs, security teams, and compliance officers.',
  },
  {
    icon: HeartPulse,
    color: 'from-sky-500 to-blue-500',
    name: 'Healthtech and Govtech',
    description:
      'Creators covering NHS digital transformation, government technology platforms, and healthcare IT. Niche but high-value audiences with long procurement cycles.',
  },
]

const platforms = [
  {
    icon: Youtube,
    name: 'YouTube',
    description:
      'The dominant platform for UK tech content. British creators produce product reviews, tutorials, and comparisons. YouTube is the top channel for reaching developers and technical buyers in the UK.',
  },
  {
    icon: Linkedin,
    name: 'LinkedIn',
    description:
      'Strong presence among UK B2B creators. British LinkedIn influencers reach senior professionals, executives, and decision-makers at UK and European companies. Posts from established UK thought leaders generate high engagement from enterprise buyers.',
  },
  {
    icon: Twitter,
    name: 'Twitter/X',
    description:
      'Active UK tech community, especially in developer tools, open source, and AI. Tech threads from British creators reach engaged professional audiences across Europe.',
  },
  {
    icon: Mail,
    name: 'Newsletters',
    description:
      'The UK has a growing tech newsletter ecosystem. Curated roundups covering SaaS, AI, and startup news reach highly engaged subscribers. UK newsletters often cover both UK-specific and global tech developments.',
  },
  {
    icon: Mic,
    name: 'Podcasts',
    description:
      'British tech podcasts reach commuters and professionals across the UK. Sponsored segments on UK tech podcasts connect your brand with listeners during dedicated attention time.',
  },
]

const rateTable = [
  { platform: 'YouTube (dedicated video)', audience: '10K-50K subscribers', rate: '£400 - £1,500' },
  { platform: 'YouTube (dedicated video)', audience: '50K-200K subscribers', rate: '£1,500 - £4,000' },
  { platform: 'YouTube (dedicated video)', audience: '200K+ subscribers', rate: '£4,000 - £12,000' },
  { platform: 'Twitter/X (thread)', audience: '10K-50K followers', rate: '£80 - £400' },
  { platform: 'Twitter/X (thread)', audience: '50K-200K followers', rate: '£400 - £1,200' },
  { platform: 'LinkedIn (post)', audience: '10K-50K followers', rate: '£250 - £800' },
  { platform: 'LinkedIn (post)', audience: '50K-100K followers', rate: '£800 - £2,000' },
  { platform: 'Newsletter (mention)', audience: '5K-20K subscribers', rate: '£150 - £600' },
  { platform: 'Newsletter (mention)', audience: '20K-50K subscribers', rate: '£600 - £1,500' },
  { platform: 'Podcast (mid-roll spot)', audience: '1K-10K downloads/ep', rate: '£250 - £1,200' },
]

const techHubs = [
  {
    name: 'London',
    description:
      'Europe’s largest tech hub. Home to fintech, AI, SaaS, and enterprise tech creators. London-based influencers reach audiences across the City, Shoreditch’s startup scene, Canary Wharf’s financial tech centre, and King’s Cross’s AI campus. The highest concentration of UK tech creators work from London.',
  },
  {
    name: 'Cambridge',
    description:
      'The UK’s AI and deep tech capital. Creators based here cover machine learning, biotech, quantum computing, and research-driven technology. Strong connections to Cambridge University’s research network give these creators unique authority in deep tech topics.',
  },
  {
    name: 'Manchester',
    description:
      'The fastest-growing tech city outside London. Creators cover SaaS, e-commerce technology, and digital marketing tools. Manchester’s MediaCity hub has produced a strong community of digital and tech content creators.',
  },
  {
    name: 'Edinburgh',
    description:
      'Scotland’s tech capital with strengths in data science, fintech, and enterprise software. Edinburgh-based creators reach Scottish and wider UK audiences with a focus on analytics and financial technology.',
  },
  {
    name: 'Bristol',
    description:
      'Growing strength in aerospace tech, simulation, and creative technology. Bristol creators often cover niche engineering and deep tech topics with highly specialist audiences.',
  },
  {
    name: 'Birmingham',
    description:
      'The Midlands’ tech hub with growing strengths in healthtech, govtech, and enterprise IT. Creators based here serve audiences focused on public sector technology and digital transformation.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Search the Creator Directory',
    description:
      'Browse UK-based tech influencers on Infoishai. Filter by niche (AI, SaaS, developer tools, fintech, cybersecurity), platform (YouTube, Twitter/X, LinkedIn), and audience size. View profiles with engagement rates, past campaigns, and content samples.',
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

export default function UkInfluencersPage() {
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
          <span className="text-gray-900 font-medium">UK</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Find Tech Influencers in the United Kingdom
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            Connect with verified British tech creators across YouTube, Twitter/X, LinkedIn, and
            newsletters. Browse by niche, audience size, and engagement rate. Free to search.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/creators?country=GB"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse UK Creators
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

      {/* Why UK influencers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Why Work With British Tech Influencers?
          </h2>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed">
            <p>
              The United Kingdom is Europe&apos;s largest tech economy. London alone houses over 80
              unicorn startups, more than Berlin, Paris, and Stockholm combined. The UK tech sector
              generated £150 billion in revenue in 2025, and the ecosystem continues to expand into
              cities like Manchester, Bristol, Edinburgh, and Cambridge.
            </p>
            <p>
              British tech influencers reach the professionals building and buying technology across
              the UK and Europe. Their audiences include software engineers at London fintech
              companies, AI researchers at Cambridge labs, startup founders scaling from Manchester,
              and enterprise buyers evaluating tools for FTSE 100 companies.
            </p>
            <p>
              Working with UK-based creators gives your brand three distinct advantages. First, access
              to the European market. British creators reach audiences across the UK, Ireland, and
              mainland Europe. English-language content from UK creators performs well across all
              English-speaking European markets. Second, credibility in regulated industries. The UK
              has strong fintech, healthtech, and govtech sectors. Creators based in these ecosystems
              understand compliance requirements and speak with authority on regulated technology.
              Third, timezone coverage. UK creators bridge the gap between US and Asian markets. A
              product launch timed with a UK creator reaches European audiences during business hours
              and catches US East Coast audiences in the morning.
            </p>
            <p>
              Whether you sell a SaaS platform, a developer tool, an AI product, or enterprise
              software, British tech influencers position your brand in front of qualified European
              buyers.
            </p>
          </div>
        </div>
      </section>

      {/* Top niches */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Popular Tech Influencer Niches in the UK
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => {
              const Icon = niche.icon
              return (
                <Link
                  key={niche.name}
                  href="/creators?country=GB"
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
          Find UK Creators on Every Platform
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          British tech influencers create content across multiple platforms. On Infoishai, you
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
            How Much Do UK Tech Influencers Charge in 2026?
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
            Rates for British tech influencers vary based on platform, audience size, engagement
            rate, and content format. Here are the standard ranges for 2026 in GBP.
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
            These rates reflect market averages for UK-based tech creators in 2026. Actual pricing
            depends on creator engagement rates, content quality, and niche specialisation. UK rates
            are generally 15-25% lower than equivalent US creator rates, offering strong value for
            brands targeting European markets. On Infoishai, you message creators directly to discuss
            rates and campaign details.
          </p>
        </div>
      </section>

      {/* Tech hubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Tech Influencers Across Britain&apos;s Top Tech Hubs
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          British tech influencers are based across the UK&apos;s growing network of tech cities. Your
          campaign reaches creators embedded in the communities where your buyers work.
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
            Many top British tech influencers work remotely across the UK. On Infoishai, you filter
            by audience location rather than creator location to reach buyers wherever they are
            across the UK and Europe.
          </p>
        </div>
      </section>

      {/* How to get started */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
            How to Find and Hire UK Tech Influencers on Infoishai
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
            Browse UK Tech Influencers
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <UkFaq />
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Start Finding UK Tech Influencers Today
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-base leading-relaxed">
            Join brands across Europe using Infoishai to connect with verified British tech
            creators. Search by niche, platform, and audience size. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/creators"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse UK Creators
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
