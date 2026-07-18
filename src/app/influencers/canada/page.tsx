import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import CanadaFaq from '@/components/influencers/CanadaFaq'
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
  Landmark,
  Leaf,
  Gamepad2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Tech Influencers in Canada | Canadian Tech Creators',
  description:
    'Find verified Canadian tech influencers for your brand. Browse creators in Toronto, Vancouver, Montreal, and Waterloo covering AI, SaaS, and developer niches. Free to search.',
  keywords: [
    'tech influencers Canada',
    'Canadian tech creators',
    'Toronto tech YouTubers',
    'Vancouver tech influencers',
    'find tech influencers Canada',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Find Tech Influencers in Canada | Infoishai',
    description:
      'Find verified Canadian tech influencers for your brand. Browse creators in Toronto, Vancouver, Montreal, and Waterloo. Free to search.',
    url: 'https://infoishai.com/influencers/canada',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/images/canada-tech-influencers.jpg', width: 1200, height: 630, alt: 'Tech influencers in Canada' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tech Influencers in Canada | Infoishai',
    description:
      'Find verified Canadian tech influencers for your brand. Browse creators in Toronto, Vancouver, Montreal, and Waterloo. Free to search.',
  },
  alternates: {
    canonical: 'https://infoishai.com/influencers/canada',
  },
}

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Tech Influencers in Canada',
  description:
    'Browse and hire verified Canadian tech influencers across YouTube, Twitter/X, LinkedIn, and other platforms',
  url: 'https://infoishai.com/influencers/canada',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Infoishai',
    url: 'https://infoishai.com',
  },
  about: {
    '@type': 'Thing',
    name: 'Tech Influencer Marketing in Canada',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://infoishai.com' },
      { '@type': 'ListItem', position: 2, name: 'Influencers', item: 'https://infoishai.com/creators' },
      { '@type': 'ListItem', position: 3, name: 'Canada', item: 'https://infoishai.com/influencers/canada' },
    ],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find tech influencers in Canada?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search the Infoishai creator directory and filter by Canada. Browse verified Canadian tech influencers across YouTube, Twitter/X, LinkedIn, and newsletters. Filter by niche (AI, SaaS, developer tools) and audience size to find the right creator for your campaign.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do Canadian tech influencers charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Canadian tech influencer rates vary by platform and audience size. YouTube: CAD $800 to CAD $4,500 per video (50K-200K subscribers). LinkedIn: CAD $400 to CAD $1,800 per post. Twitter/X: CAD $150 to CAD $900 per thread. Newsletter mentions: CAD $300 to CAD $1,500 per issue.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I work with Canadian tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Canada is home to one of the world's strongest AI research ecosystems, a thriving SaaS sector, and a highly educated tech workforce. Canadian creators reach North American buyers at rates 20-30% lower than US equivalents. The Waterloo-Toronto corridor alone has produced more startups per capita than any region outside Silicon Valley.",
      },
    },
  ],
}

const stats = [
  { value: '200+', label: 'Verified Canadian Creators' },
  { value: '12+', label: 'Tech Niches Covered' },
  { value: '4.7/5', label: 'Average Creator Rating' },
  { value: 'Free', label: 'To Search and Connect' },
]

const niches = [
  {
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    name: 'AI and Machine Learning',
    description:
      'Canada leads global AI research. Creators cover deep learning frameworks, AI tools, computer vision, and NLP applications. Strong connections to Mila, Vector Institute, and Amii research labs.',
  },
  {
    icon: LayoutGrid,
    color: 'from-violet-500 to-purple-500',
    name: 'SaaS and E-Commerce',
    description:
      'Canada is home to Shopify and hundreds of SaaS startups. Creators review e-commerce platforms, CRM tools, analytics software, and productivity applications for North American audiences.',
  },
  {
    icon: Code2,
    color: 'from-green-500 to-emerald-500',
    name: 'Developer Tools and Open Source',
    description:
      "Coding-focused creators covering frameworks, APIs, cloud platforms, and open-source projects. Canada's Waterloo region produces a high concentration of developer-focused content creators.",
  },
  {
    icon: Landmark,
    color: 'from-amber-500 to-yellow-500',
    name: 'Fintech and Banking',
    description:
      "Creators covering digital banking, payment APIs, blockchain infrastructure, and financial compliance tools. Canada's Big Five banks drive heavy fintech adoption and investment.",
  },
  {
    icon: Leaf,
    color: 'from-lime-500 to-green-500',
    name: 'Cleantech and Climate Tech',
    description:
      'Canada has a growing cleantech sector. Creators cover carbon tracking software, energy management platforms, and sustainability reporting tools. Niche but growing audience with government and enterprise backing.',
  },
  {
    icon: Gamepad2,
    color: 'from-sky-500 to-blue-500',
    name: 'Gaming and Interactive Media',
    description:
      'Vancouver and Montreal are global gaming hubs. Creators cover game development tools, engines, VR/AR platforms, and interactive media technology. Strong audiences among game developers and studio leads.',
  },
]

const platforms = [
  {
    icon: Youtube,
    name: 'YouTube',
    description:
      'The primary platform for Canadian tech content. Product reviews, coding tutorials, and tech comparisons from Canadian creators rank globally on YouTube and Google search. Best for detailed product demonstrations and long-form content.',
  },
  {
    icon: Twitter,
    name: 'Twitter/X',
    description:
      'Active Canadian tech community with strong presence in AI, developer tools, and startup discussions. Canadian tech threads often trend in both Canadian and US feeds. Best for developer tools, open source, and quick product highlights.',
  },
  {
    icon: Linkedin,
    name: 'LinkedIn',
    description:
      'Growing platform for Canadian B2B creators. Strong engagement from enterprise buyers, banking professionals, and startup executives across Toronto, Vancouver, and Montreal. Best for enterprise SaaS and B2B platforms.',
  },
  {
    icon: Mail,
    name: 'Newsletters',
    description:
      'Canadian tech newsletters cover AI developments, SaaS roundups, startup funding news, and developer tool reviews. Smaller but highly engaged subscriber bases with strong open rates. Best for reaching dedicated readers in specific niches.',
  },
  {
    icon: Mic,
    name: 'Podcasts',
    description:
      'Canadian tech podcasts serve commuters in Toronto, Vancouver, and Montreal. Interview-format shows featuring product discussions and industry analysis reach attentive professional audiences. Best for complex products needing detailed explanation.',
  },
]

const rateTable = [
  { platform: 'YouTube (dedicated video)', audience: '10K-50K subscribers', rate: 'CAD $500 - $1,800' },
  { platform: 'YouTube (dedicated video)', audience: '50K-200K subscribers', rate: 'CAD $1,800 - $4,500' },
  { platform: 'YouTube (dedicated video)', audience: '200K+ subscribers', rate: 'CAD $4,500 - $12,000' },
  { platform: 'Twitter/X (thread)', audience: '10K-50K followers', rate: 'CAD $80 - $400' },
  { platform: 'Twitter/X (thread)', audience: '50K-200K followers', rate: 'CAD $400 - $1,200' },
  { platform: 'LinkedIn (post)', audience: '10K-50K followers', rate: 'CAD $250 - $800' },
  { platform: 'LinkedIn (post)', audience: '50K-100K followers', rate: 'CAD $800 - $1,800' },
  { platform: 'Newsletter (mention)', audience: '5K-20K subscribers', rate: 'CAD $150 - $600' },
  { platform: 'Newsletter (mention)', audience: '20K-50K subscribers', rate: 'CAD $600 - $1,500' },
  { platform: 'Podcast (mid-roll spot)', audience: '1K-10K downloads/ep', rate: 'CAD $250 - $1,200' },
]

const techHubs = [
  {
    name: 'Toronto',
    description:
      "Canada's largest tech hub and financial capital. Home to the MaRS Discovery District, a dense startup ecosystem, and the country's biggest concentration of fintech, AI, and SaaS companies. Toronto-based creators reach the largest pool of Canadian tech buyers and decision-makers.",
  },
  {
    name: 'Waterloo Region',
    description:
      "Known as \"Canada's Silicon Valley.\" Home to the University of Waterloo's co-op program, which feeds talent into companies like Google, Shopify, and hundreds of startups. Creators from this region bring strong developer and engineering credibility.",
  },
  {
    name: 'Vancouver',
    description:
      "Canada's West Coast tech hub with strengths in gaming, VR/AR, cleantech, and cloud infrastructure. Vancouver-based creators reach Pacific Northwest audiences across both Canada and the US West Coast. The city's proximity to Seattle's tech scene creates cross-border audience overlap.",
  },
  {
    name: 'Montreal',
    description:
      'The bilingual tech hub and AI research capital. Home to Mila (the world\'s largest academic AI lab), a strong gaming industry (Ubisoft, EA), and a growing SaaS sector. Montreal creators produce content in English, French, or both, opening doors to French-speaking markets.',
  },
  {
    name: 'Ottawa',
    description:
      "Canada's government tech hub. Creators based here cover govtech, cybersecurity, and telecommunications. Strong connections to Shopify's headquarters and federal government technology procurement.",
  },
  {
    name: 'Calgary and Edmonton',
    description:
      "Alberta's emerging tech cities with strengths in energy tech, agritech, and AI research through the Alberta Machine Intelligence Institute (Amii). Growing creator communities serving Western Canadian audiences.",
  },
]

const steps = [
  {
    number: '1',
    title: 'Search the Creator Directory',
    description:
      'Browse Canadian tech influencers on Infoishai. Filter by niche (AI, SaaS, developer tools, fintech, gaming), platform (YouTube, Twitter/X, LinkedIn), and audience size. View profiles with engagement rates, past campaigns, and content samples.',
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
  { label: 'Find Tech Influencers in India', href: '/influencers/india' },
  { label: 'Find Tech Influencers in Australia', href: '/influencers/australia' },
  { label: 'Find Tech Influencers in Pakistan', href: '/influencers/pakistan' },
  { label: 'Find Tech Influencers in Germany', href: '/influencers/germany' },
  { label: 'Find Tech Influencers in Netherlands', href: '/influencers/netherlands' },
  { label: 'Find Tech Influencers in Singapore', href: '/influencers/singapore' },
  { label: 'Browse All Tech Influencers', href: '/creators' },
  { label: 'Tech Influencer Marketing Blog', href: '/blog' },
]

export default function CanadaInfluencersPage() {
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
          <span className="text-gray-900 font-medium">Canada</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Find Tech Influencers in Canada
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            Connect with verified Canadian tech creators across YouTube, Twitter/X, LinkedIn, and
            newsletters. Browse by niche, audience size, and engagement rate. Free to search.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/creators?country=CA"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Canadian Creators
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

      {/* Why Canadian influencers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Why Work With Canadian Tech Influencers?
          </h2>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed">
            <p>
              Canada punches above its weight in global tech. The country is home to over 3,000
              tech companies, a world-leading AI research ecosystem, and a SaaS sector generating
              over CAD $20 billion in annual revenue. Toronto, Vancouver, Montreal, and the
              Waterloo corridor form one of North America&apos;s densest startup networks.
            </p>
            <p>
              Canadian tech influencers reach a unique audience. Their viewers include developers
              at Shopify, AI researchers at Mila and the Vector Institute, startup founders
              building from Toronto&apos;s MaRS district, and enterprise buyers at Canada&apos;s
              largest banks and telecoms.
            </p>
            <p>
              Working with Canadian creators gives your brand three specific advantages. First,
              North American reach at lower cost. Canadian creator rates run 20-30% below US
              equivalents while reaching the same English-speaking North American audience. A
              Canadian tech YouTuber&apos;s content ranks on Google and YouTube globally, not
              locally. Second, AI and research credibility. Canada&apos;s AI ecosystem is
              world-class. Montreal hosts Mila, the world&apos;s largest academic AI research lab.
              Toronto has the Vector Institute. Creators embedded in these communities bring
              genuine research credibility to their content. Third, bilingual market access.
              Canadian creators in Montreal and Quebec produce content in both English and French.
              A bilingual campaign reaches buyers across Canada and expands into French-speaking
              European markets.
            </p>
            <p>
              Whether you sell an AI product, a SaaS platform, developer tools, or enterprise
              software, Canadian tech influencers connect your brand with North American buyers at
              competitive rates.
            </p>
          </div>
        </div>
      </section>

      {/* Top niches */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Popular Tech Influencer Niches in Canada
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => {
              const Icon = niche.icon
              return (
                <Link
                  key={niche.name}
                  href="/creators?country=CA"
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
          Find Canadian Creators on Every Platform
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Canadian tech influencers create content across multiple platforms. On Infoishai, you
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
            How Much Do Canadian Tech Influencers Charge in 2026?
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
            Rates for Canadian tech influencers vary based on platform, audience size, engagement
            rate, and content format. Here are the standard ranges for 2026 in CAD.
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
            These rates reflect market averages for Canadian tech creators in 2026. Canadian
            creator rates are 20-30% lower than US equivalents while delivering comparable
            audience quality and engagement. On Infoishai, you message creators directly to
            discuss rates and campaign details.
          </p>
        </div>
      </section>

      {/* Tech hubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Tech Influencers Across Canada&apos;s Top Tech Hubs
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Canadian tech influencers are based across every major tech hub in the country. Your
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
            Many Canadian tech creators work remotely across provinces. On Infoishai, you filter
            by audience demographics rather than creator location to reach the right buyers across
            North America.
          </p>
        </div>
      </section>

      {/* How to get started */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
            How to Find and Hire Canadian Tech Influencers on Infoishai
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
            Browse Canadian Tech Influencers
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <CanadaFaq />
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Start Finding Canadian Tech Influencers Today
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-base leading-relaxed">
            Join brands across North America using Infoishai to connect with verified Canadian
            tech creators. Search by niche, platform, and audience size. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/creators"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Canadian Creators
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
