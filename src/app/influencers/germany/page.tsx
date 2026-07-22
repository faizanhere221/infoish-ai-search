import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import GermanyFaq from '@/components/influencers/GermanyFaq'
import {
  ChevronRight,
  Youtube,
  Linkedin,
  Twitter,
  Mail,
  Mic,
  Landmark,
  Factory,
  Brain,
  Code2,
  ShieldCheck,
  Car,
  Globe2,
  Scale,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Tech Influencers in Germany | German Tech Creators',
  description:
    'Find verified German tech influencers for your brand. Browse creators in Berlin, Munich, and Hamburg covering AI, SaaS, Industry 4.0, and developer niches. DACH region coverage. Free to search.',
  keywords: [
    'tech influencers Germany',
    'German tech creators',
    'tech influencer Deutschland',
    'Berlin tech YouTubers',
    'DACH tech influencers',
    'German tech influencer marketing',
    'find tech influencers Germany',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Find Tech Influencers in Germany | Infoishai',
    description:
      'Find verified German tech influencers for your brand. Browse creators in Berlin, Munich, and Hamburg. DACH region coverage. Free to search.',
    url: 'https://infoishai.com/influencers/germany',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/images/germany-tech-influencers.jpg', width: 1200, height: 630, alt: 'Tech influencers in Germany' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tech Influencers in Germany | Infoishai',
    description:
      'Find verified German tech influencers for your brand. Browse creators in Berlin, Munich, and Hamburg. DACH region coverage. Free to search.',
  },
  alternates: {
    canonical: 'https://infoishai.com/influencers/germany',
    languages: {
      en: 'https://infoishai.com/influencers/germany',
    },
  },
}

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Tech Influencers in Germany',
  description:
    'Browse and hire verified German tech influencers across YouTube, LinkedIn, Twitter/X, and other platforms',
  url: 'https://infoishai.com/influencers/germany',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Infoishai',
    url: 'https://infoishai.com',
  },
  about: {
    '@type': 'Thing',
    name: 'Tech Influencer Marketing in Germany',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://infoishai.com' },
      { '@type': 'ListItem', position: 2, name: 'Influencers', item: 'https://infoishai.com/creators' },
      { '@type': 'ListItem', position: 3, name: 'Germany', item: 'https://infoishai.com/influencers/germany' },
    ],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find tech influencers in Germany?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search the Infoishai creator directory and filter by Germany. Browse verified German tech influencers across YouTube, LinkedIn, Twitter/X, and newsletters. Filter by niche (AI, SaaS, Industry 4.0, developer tools), language (German or English), and audience size to find the right creator for your campaign.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do German tech influencers charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'German tech influencer rates vary by platform and audience size. YouTube: EUR 1,000 to EUR 5,000 per video (50K-200K subscribers). LinkedIn: EUR 500 to EUR 2,000 per post. Twitter/X: EUR 200 to EUR 1,000 per thread. Newsletter mentions: EUR 300 to EUR 1,500 per issue.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I work with German tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Germany is Europe's largest economy and the world's fourth-largest tech market. German tech influencers reach decision-makers across the DACH region (Germany, Austria, Switzerland), covering 100 million German-speaking professionals. Germany leads in Industry 4.0, automotive tech, enterprise software, and industrial IoT, making German creators essential for brands entering the European market.",
      },
    },
  ],
}

const stats = [
  { value: '200+', label: 'Verified German Creators' },
  { value: '12+', label: 'Tech Niches Covered' },
  { value: '4.7/5', label: 'Average Creator Rating' },
  { value: 'Free', label: 'To Search and Connect' },
]

const niches = [
  {
    icon: Landmark,
    color: 'from-blue-500 to-cyan-500',
    name: 'Enterprise Software and ERP',
    description:
      "Germany is home to SAP, the world's largest enterprise software company. Creators cover ERP systems, business process automation, and enterprise digital transformation. Audiences include IT directors, consultants, and project managers at German Mittelstand and large enterprises.",
  },
  {
    icon: Factory,
    color: 'from-amber-500 to-yellow-500',
    name: 'Industry 4.0 and Manufacturing Tech',
    description:
      'Germany leads the global Industry 4.0 movement. Creators cover IoT platforms, manufacturing automation, digital twins, predictive maintenance, and smart factory technology. This niche exists at this depth only in the German market. Audiences include manufacturing engineers, plant managers, and industrial IT teams.',
  },
  {
    icon: Brain,
    color: 'from-violet-500 to-purple-500',
    name: 'AI and Data Science',
    description:
      "Creators covering machine learning, computer vision, NLP, and AI tools. Germany's AI research ecosystem includes the German Research Center for Artificial Intelligence (DFKI), Fraunhofer institutes, and strong university programs. Audiences include AI researchers, data engineers, and tech teams adopting AI solutions.",
  },
  {
    icon: Code2,
    color: 'from-green-500 to-emerald-500',
    name: 'Developer Tools and Open Source',
    description:
      "Coding-focused creators covering frameworks, APIs, CI/CD, and developer platforms. Germany has a strong open-source culture. Creators based in Berlin's developer community reach engineers across Europe. Audiences include full-stack developers, DevOps engineers, and engineering leads.",
  },
  {
    icon: ShieldCheck,
    color: 'from-red-500 to-orange-500',
    name: 'Cybersecurity and Data Privacy',
    description:
      "Germany's strict GDPR enforcement and privacy-first culture drive strong demand for security content. Creators cover security tools, compliance frameworks, data protection solutions, and risk management. Audiences include CISOs, data protection officers (DPOs), and IT security teams.",
  },
  {
    icon: Car,
    color: 'from-sky-500 to-blue-500',
    name: 'Automotive Tech and Mobility',
    description:
      'Germany is home to Volkswagen, BMW, Mercedes, and Porsche. Creators cover connected vehicle platforms, autonomous driving software, EV charging infrastructure, and mobility-as-a-service. Niche but high-value audience among automotive engineers and mobility startup teams.',
  },
]

const platforms = [
  {
    icon: Youtube,
    name: 'YouTube',
    description:
      'The primary platform for German tech content. German tech YouTubers produce content in both German and English. German-language channels reach the DACH market, while English-language channels from German creators reach a pan-European audience. Best for product reviews, tutorials, and long-form technical content.',
  },
  {
    icon: Linkedin,
    name: 'LinkedIn',
    description:
      'The strongest B2B channel in Germany. German LinkedIn has high adoption among senior professionals, executives, and Mittelstand decision-makers. German LinkedIn influencers share industry analysis, tool recommendations, and thought leadership. Best for enterprise SaaS, B2B platforms, and Industry 4.0 products.',
  },
  {
    icon: Twitter,
    name: 'Twitter/X',
    description:
      'Active German tech community with strong engagement in developer tools, AI, and startup discussions. German tech Twitter operates in both German and English. Best for developer-focused products, open-source projects, and startup launches.',
  },
  {
    icon: Landmark,
    name: 'XING',
    description:
      "Germany-specific professional network. While LinkedIn dominates among younger tech professionals, XING still has a strong presence among traditional German businesses and Mittelstand companies. Some German B2B creators maintain active XING profiles alongside LinkedIn. Best for reaching traditional German enterprises and the Mittelstand.",
  },
  {
    icon: Mail,
    name: 'Newsletters',
    description:
      'German tech newsletters cover Industry 4.0 developments, SaaS roundups, AI research, and startup news. Strong readership among professionals who prefer curated content in German. Best for niche B2B audiences and enterprise decision-makers.',
  },
  {
    icon: Mic,
    name: 'Podcasts',
    description:
      'German tech podcasts serve commuters and professionals across the country. Both German-language and English-language tech podcasts from German creators reach engaged audiences. Best for complex enterprise products and thought leadership.',
  },
]

const rateTable = [
  { platform: 'YouTube (dedicated video)', audience: '10K-50K subscribers', rate: '€600 - €2,500' },
  { platform: 'YouTube (dedicated video)', audience: '50K-200K subscribers', rate: '€2,500 - €6,000' },
  { platform: 'YouTube (dedicated video)', audience: '200K+ subscribers', rate: '€6,000 - €15,000' },
  { platform: 'Twitter/X (thread)', audience: '10K-50K followers', rate: '€100 - €500' },
  { platform: 'Twitter/X (thread)', audience: '50K-200K followers', rate: '€500 - €1,500' },
  { platform: 'LinkedIn (post)', audience: '10K-50K followers', rate: '€400 - €1,200' },
  { platform: 'LinkedIn (post)', audience: '50K-100K followers', rate: '€1,200 - €3,000' },
  { platform: 'XING (post)', audience: '10K-50K contacts', rate: '€300 - €1,000' },
  { platform: 'Newsletter (mention)', audience: '5K-20K subscribers', rate: '€300 - €1,000' },
  { platform: 'Newsletter (mention)', audience: '20K-50K subscribers', rate: '€1,000 - €2,500' },
  { platform: 'Podcast (mid-roll spot)', audience: '1K-10K downloads/ep', rate: '€400 - €1,800' },
]

const techHubs = [
  {
    name: 'Berlin',
    description:
      "Europe's startup capital. Home to over 3,000 tech startups and the largest startup ecosystem on the continent. Berlin-based creators cover SaaS, AI, developer tools, and startup culture. The city attracts international tech talent, making Berlin creators uniquely positioned to produce both German and English content. Kreuzberg and Mitte house the densest startup clusters.",
  },
  {
    name: 'Munich (München)',
    description:
      "Germany's enterprise tech hub. Home to the European headquarters of Google, Apple, Amazon, and Microsoft, plus German giants like Siemens and BMW. Munich-based creators cover enterprise software, AI research, automotive tech, and cloud infrastructure. The city's proximity to the Bavarian automotive industry creates a strong cluster of mobility and manufacturing tech content.",
  },
  {
    name: 'Hamburg',
    description:
      "Northern Germany's media and tech hub. Home to a growing SaaS ecosystem and strong digital marketing community. Hamburg-based creators cover e-commerce technology, digital media platforms, and B2B marketing tools. The city's media industry (Axel Springer, Der Spiegel) intersects with tech to produce creators who cover media technology and adtech.",
  },
  {
    name: 'Frankfurt am Main',
    description:
      "Germany's financial capital. Home to the European Central Bank, Deutsche Bank, and a dense financial services sector. Frankfurt-based creators cover fintech, regtech, banking APIs, and financial compliance tools. Strong audience among banking IT teams and fintech startup founders.",
  },
  {
    name: 'Stuttgart',
    description:
      "The heart of Germany's automotive industry. Home to Porsche, Mercedes-Benz, and Bosch. Stuttgart-based creators cover automotive software, industrial IoT, and manufacturing technology. Niche but high-value audience among automotive engineers and Industry 4.0 professionals.",
  },
  {
    name: 'Cologne (Köln) and Düsseldorf',
    description:
      "Rhineland tech hub covering gaming, media tech, and e-commerce. Cologne hosts Gamescom, the world's largest gaming event. Düsseldorf has a growing SaaS and consulting tech scene. Creators from this region cover gaming technology, retail tech, and digital transformation.",
  },
  {
    name: 'Dresden and Leipzig',
    description:
      'Eastern Germany\'s emerging tech hubs. Dresden has a strong semiconductor and chip manufacturing sector ("Silicon Saxony"). Leipzig has a growing startup scene. Creators from these cities cover deep tech, hardware engineering, and microelectronics.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Search the Creator Directory',
    description:
      'Browse German tech influencers on Infoishai. Filter by niche (enterprise software, Industry 4.0, AI, developer tools, automotive tech, cybersecurity), platform (YouTube, LinkedIn, Twitter/X, XING), language (German, English), and audience size. View profiles with engagement rates, past campaigns, and content samples.',
  },
  {
    number: '2',
    title: 'Message Creators Directly',
    description:
      'Found a creator who fits your campaign? Send them a message through Infoishai. Share your product details, campaign goals, and budget. Discuss deliverables, language preference, and timelines directly.',
  },
  {
    number: '3',
    title: 'Launch Your Campaign',
    description:
      "Agree on terms, create a brief, and let the creator produce content in their own voice. Confirm GDPR-compliant disclosure practices. Track performance through UTM links and promo codes. Pay securely through Infoishai's escrow system.",
  },
]

const relatedLinks = [
  { label: 'Find Tech Influencers in USA', href: '/influencers/usa' },
  { label: 'Find Tech Influencers in UK', href: '/influencers/uk' },
  { label: 'Find Tech Influencers in Canada', href: '/influencers/canada' },
  { label: 'Find Tech Influencers in India', href: '/influencers/india' },
  { label: 'Find Tech Influencers in Australia', href: '/influencers/australia' },
  { label: 'Find Tech Influencers in Pakistan', href: '/influencers/pakistan' },
  { label: 'Find Tech Influencers in Netherlands', href: '/influencers/netherlands' },
  { label: 'Find Tech Influencers in Singapore', href: '/influencers/singapore' },
  { label: 'Browse All Tech Influencers', href: '/creators' },
  { label: 'Tech Influencer Marketing Blog', href: '/blog' },
]

export default function GermanyInfluencersPage() {
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
          <span className="text-gray-900 font-medium">Germany</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Find Tech Influencers in Germany
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            Connect with verified German tech creators across YouTube, LinkedIn, Twitter/X, and
            newsletters. Reach the DACH region. Browse by niche, language, and engagement rate.
            Free to search.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/creators?country=DE"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse German Creators
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

      {/* Why German influencers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Why Work With German Tech Influencers?
          </h2>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed">
            <p>
              Germany is Europe&apos;s largest economy and the world&apos;s fourth-largest tech
              market. The country&apos;s IT sector generates over EUR 200 billion in annual
              revenue. Berlin is Europe&apos;s startup capital by funding volume. Munich houses
              the European headquarters of Google, Apple, Microsoft, and Amazon. Germany leads
              globally in Industry 4.0, manufacturing technology, and enterprise software through
              companies like SAP, Siemens, and Bosch.
            </p>
            <p>
              German tech influencers reach professionals across the DACH region: Germany,
              Austria, and Switzerland. This combined market covers 100 million German-speaking
              people with the highest average purchasing power in Europe.
            </p>
            <p>
              Working with German creators gives your brand four specific advantages. First, DACH
              region access. German-language content reaches buyers across Germany (84 million),
              Austria (9 million), and German-speaking Switzerland (5.5 million) from a single
              creator partnership. No other European language covers three wealthy markets so
              efficiently. Second, enterprise buyer reach. Germany has more Fortune 500 companies
              than any European country. German LinkedIn and YouTube creators reach CTOs, IT
              directors, and procurement managers at Mittelstand companies (mid-sized enterprises)
              and large corporations. The Mittelstand alone comprises over 3 million companies
              driving Europe&apos;s industrial economy. Third, Industry 4.0 and manufacturing tech
              credibility. Germany leads the global Industry 4.0 movement. Creators embedded in
              this ecosystem cover IoT platforms, manufacturing automation, digital twin
              technology, and smart factory solutions. No other market has this depth of
              industrial tech content. Fourth, data privacy and compliance trust. Germany has the
              strictest data privacy culture in Europe. German creators who review SaaS and cloud
              tools address GDPR compliance, data sovereignty, and EU regulatory requirements.
              Their endorsement signals to European buyers your product meets the region&apos;s
              highest privacy standards.
            </p>
            <p>
              Whether you sell enterprise software, developer tools, AI products, cloud
              infrastructure, or industrial IoT solutions, German tech influencers connect your
              brand with Europe&apos;s most valuable tech buyers.
            </p>
          </div>
        </div>
      </section>

      {/* Top niches */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Popular Tech Influencer Niches in Germany
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => {
              const Icon = niche.icon
              return (
                <Link
                  key={niche.name}
                  href="/creators?country=DE"
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
          Find German Creators on Every Platform
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          German tech influencers create content across multiple platforms. On Infoishai, you
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
            How Much Do German Tech Influencers Charge in 2026?
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
            Rates for German tech influencers vary based on platform, audience size, engagement
            rate, language, and content format. Here are the standard ranges for 2026 in EUR.
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
            These rates reflect market averages for German tech creators in 2026. German creator
            rates are comparable to UK rates and approximately 5-10% higher than the European
            average, reflecting the high purchasing power of the DACH audience. German-language
            creators and English-language German creators charge similar rates at comparable
            audience sizes. On Infoishai, you message creators directly to discuss rates and
            campaign details.
          </p>
        </div>
      </section>

      {/* Tech hubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Tech Influencers Across Germany&apos;s Top Tech Cities
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          German tech influencers are based across every major tech hub in the country. Your
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
            Many German tech creators work remotely from smaller cities and towns across the
            country. Germany&apos;s strong broadband infrastructure supports remote content
            creation. On Infoishai, filter by audience demographics rather than creator location.
          </p>
        </div>
      </section>

      {/* DACH region access */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-start gap-4 mb-6 max-w-3xl">
            <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Reach the Entire DACH Region Through German Creators
            </h2>
          </div>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed max-w-3xl">
            <p>
              The DACH region (Deutschland, Austria, Schweiz) represents the most valuable
              German-speaking market in the world. Combined, the region has 100 million people,
              the highest average GDP per capita in the EU, and some of the strongest enterprise
              software adoption rates globally.
            </p>
            <p>
              A typical German tech creator&apos;s audience breaks down as follows: 65-75% from
              Germany, 8-12% from Austria, 5-8% from Switzerland, and 10-20% from other European
              countries and the US.
            </p>
            <p>
              For brands entering the European market, the DACH region is the strategic starting
              point. German is the most widely spoken native language in the EU, ahead of French
              and Spanish. A successful campaign with German creators establishes credibility
              across the entire DACH market before expanding to other European countries.
            </p>
            <p>
              Austria shares Germany&apos;s language and business culture. Austrian tech buyers
              consume German-language content from Germany without friction. A partnership with a
              German creator covers the Austrian market automatically.
            </p>
            <p>
              Switzerland is split between German-speaking (63%), French-speaking (23%), and
              Italian-speaking (14%) regions. German-language content from German creators reaches
              the largest segment of Swiss tech buyers, including those in Zurich, the
              country&apos;s financial and tech capital.
            </p>
            <p>
              For brands already present in the US or UK market, German creators provide localized
              European market access. A product landing page in English paired with a German
              creator&apos;s review in German signals to DACH buyers the brand takes the European
              market seriously.
            </p>
          </div>
        </div>
      </section>

      {/* Language and compliance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-start gap-4 mb-6 max-w-3xl">
          <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Language and Compliance for the German Market
          </h2>
        </div>
        <div className="space-y-4 text-base text-gray-600 leading-relaxed max-w-3xl">
          <p>
            The German tech market has two considerations international brands must address:
            language and data privacy.
          </p>
          <p>
            Language: German tech audiences consume content in both German and English. The split
            depends on the audience segment. Senior developers and engineering leads often prefer
            English technical content. Mid-level professionals and the broader business audience
            prefer German. For B2B enterprise tools targeting Mittelstand companies,
            German-language creator content performs better. For developer tools targeting
            engineers, English-language content from German creators performs well.
          </p>
          <p>
            On Infoishai, you filter German creators by language to match your audience. Many
            German creators are bilingual and produce content in both German and English. Ask
            during outreach whether the creator offers both language options.
          </p>
          <p>
            Data Privacy and GDPR: Germany enforces GDPR more strictly than most EU countries.
            German buyers expect SaaS and cloud products to address data residency, data
            processing agreements (DPAs), and EU server locations. When a German tech influencer
            reviews your product and confirms GDPR compliance, the endorsement carries significant
            weight with German enterprise buyers. Brief your creator on your product&apos;s data
            handling practices so they address compliance naturally in the content.
          </p>
          <p>
            Influencer Disclosure Laws: Germany has strict rules around sponsored content
            disclosure. The Medienstaatsvertrag (Interstate Media Treaty) requires clear labelling
            of paid partnerships. German creators must mark sponsored content with
            &ldquo;Werbung&rdquo; (advertising) or &ldquo;Anzeige&rdquo; (ad). Reputable German
            creators handle this automatically. Confirm disclosure practices before launching the
            campaign.
          </p>
        </div>
      </section>

      {/* How to get started */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
            How to Find and Hire German Tech Influencers on Infoishai
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
            Browse German Tech Influencers
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <GermanyFaq />
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Start Finding German Tech Influencers Today
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-base leading-relaxed">
            Join brands across Europe using Infoishai to connect with verified German tech
            creators. Reach the DACH region. Search by niche, platform, language, and audience
            size. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/creators"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse German Creators
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
