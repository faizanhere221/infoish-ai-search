import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import NetherlandsFaq from '@/components/influencers/NetherlandsFaq'
import {
  ChevronRight,
  Youtube,
  Linkedin,
  Twitter,
  Mail,
  Mic,
  Landmark,
  LayoutGrid,
  Cloud,
  Brain,
  Truck,
  Sprout,
  Globe2,
  Cpu,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Tech Influencers in Netherlands | Dutch Tech Creators',
  description:
    'Find verified Dutch tech influencers for your brand. Browse creators in Amsterdam, Eindhoven, and Rotterdam covering AI, SaaS, fintech, and developer niches. Benelux region coverage. Free to search.',
  keywords: [
    'tech influencers Netherlands',
    'Dutch tech creators',
    'Amsterdam tech influencers',
    'tech influencer platform Europe',
    'Dutch tech YouTubers',
    'find tech influencers Netherlands',
    'Benelux tech creators',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Find Tech Influencers in Netherlands | Infoishai',
    description:
      'Find verified Dutch tech influencers for your brand. Browse creators in Amsterdam, Eindhoven, and Rotterdam. Benelux coverage. Free to search.',
    url: 'https://infoishai.com/influencers/netherlands',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/images/netherlands-tech-influencers.jpg', width: 1200, height: 630, alt: 'Tech influencers in the Netherlands' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tech Influencers in Netherlands | Infoishai',
    description:
      'Find verified Dutch tech influencers for your brand. Browse creators in Amsterdam, Eindhoven, and Rotterdam. Benelux coverage. Free to search.',
  },
  alternates: {
    canonical: 'https://infoishai.com/influencers/netherlands',
  },
}

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Tech Influencers in Netherlands',
  description:
    'Browse and hire verified Dutch tech influencers across YouTube, LinkedIn, Twitter/X, and other platforms',
  url: 'https://infoishai.com/influencers/netherlands',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Infoishai',
    url: 'https://infoishai.com',
  },
  about: {
    '@type': 'Thing',
    name: 'Tech Influencer Marketing in the Netherlands',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://infoishai.com' },
      { '@type': 'ListItem', position: 2, name: 'Influencers', item: 'https://infoishai.com/creators' },
      { '@type': 'ListItem', position: 3, name: 'Netherlands', item: 'https://infoishai.com/influencers/netherlands' },
    ],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find tech influencers in the Netherlands?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search the Infoishai creator directory and filter by Netherlands. Browse verified Dutch tech influencers across YouTube, LinkedIn, Twitter/X, and newsletters. Filter by niche (AI, SaaS, fintech, developer tools), language (Dutch or English), and audience size to find the right creator for your campaign.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do Dutch tech influencers charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Dutch tech influencer rates vary by platform and audience size. YouTube: EUR 800 to EUR 4,000 per video (50K-200K subscribers). LinkedIn: EUR 400 to EUR 1,800 per post. Twitter/X: EUR 150 to EUR 800 per thread. Newsletter mentions: EUR 250 to EUR 1,200 per issue.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I work with Dutch tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "The Netherlands is one of Europe's top tech hubs, home to Booking.com, Adyen, and ASML. Dutch tech professionals are among the most English-proficient non-native speakers globally, meaning Dutch creators produce high-quality English content reaching all of Europe. The Netherlands serves as a gateway to the Benelux market and wider European expansion.",
      },
    },
  ],
}

const stats = [
  { value: '100+', label: 'Verified Dutch Creators' },
  { value: '10+', label: 'Tech Niches Covered' },
  { value: '4.7/5', label: 'Average Creator Rating' },
  { value: 'Free', label: 'To Search and Connect' },
]

const niches = [
  {
    icon: Landmark,
    color: 'from-blue-500 to-cyan-500',
    name: 'Fintech and Payments',
    description:
      "The Netherlands is one of Europe's strongest fintech markets. Adyen, Mollie, and Bunq are Dutch-born. Creators cover payment APIs, banking infrastructure, open banking, and financial compliance. Audiences include fintech founders, payment engineers, and financial services professionals.",
  },
  {
    icon: LayoutGrid,
    color: 'from-green-500 to-emerald-500',
    name: 'SaaS and B2B Software',
    description:
      'Creators reviewing CRM, marketing automation, analytics, and business tools. The Netherlands has a high SaaS adoption rate per capita. Audiences include startup teams, operations managers, and enterprise buyers at Dutch and multinational companies.',
  },
  {
    icon: Cloud,
    color: 'from-sky-500 to-blue-500',
    name: 'Developer Tools and Cloud Infrastructure',
    description:
      "Coding-focused creators covering APIs, DevOps, CI/CD pipelines, and cloud platforms. Amsterdam's position as Europe's data centre capital creates a strong community of infrastructure-focused creators. Audiences include backend engineers, DevOps professionals, and cloud architects.",
  },
  {
    icon: Brain,
    color: 'from-violet-500 to-purple-500',
    name: 'AI and Machine Learning',
    description:
      'Creators covering AI tools, data science, NLP, and computer vision. The Netherlands has strong AI research programs at TU Delft, University of Amsterdam, and Eindhoven University of Technology. Audiences include AI researchers, data engineers, and tech teams adopting AI solutions.',
  },
  {
    icon: Truck,
    color: 'from-amber-500 to-yellow-500',
    name: 'Logistics and Supply Chain Tech',
    description:
      "Netherlands-specific niche. The Netherlands is Europe's logistics gateway (Rotterdam port, Schiphol airport). Creators cover supply chain software, warehouse automation, and logistics platforms. Audiences include supply chain managers, logistics engineers, and operations teams.",
  },
  {
    icon: Sprout,
    color: 'from-lime-500 to-green-500',
    name: 'AgriTech and FoodTech',
    description:
      "The Netherlands is the world's second-largest agricultural exporter by value. Dutch agritech is globally leading. Creators cover precision farming platforms, food supply chain software, and agricultural IoT. Niche but high-value audience among agritech companies and food industry professionals.",
  },
]

const platforms = [
  {
    icon: Youtube,
    name: 'YouTube',
    description:
      'Strong platform for Dutch tech content. Dutch creators produce content in both Dutch and English. English-language videos from Dutch tech YouTubers rank across Europe and globally. Dutch-language content serves the domestic and Flemish Belgian market. Best for product reviews, tutorials, and technical walkthroughs.',
  },
  {
    icon: Linkedin,
    name: 'LinkedIn',
    description:
      'The dominant B2B platform in the Netherlands. The country has one of the highest LinkedIn penetration rates globally relative to population. Dutch LinkedIn influencers reach senior professionals, startup founders, and enterprise buyers. Posts from Dutch thought leaders generate high engagement among European business audiences. Best for enterprise SaaS, B2B platforms, and professional tools.',
  },
  {
    icon: Twitter,
    name: 'Twitter/X',
    description:
      'Active Dutch tech community covering startups, developer tools, AI, and fintech. Dutch tech Twitter operates primarily in English, making the content accessible across Europe. Best for developer-focused products, startup launches, and open-source projects.',
  },
  {
    icon: Mail,
    name: 'Newsletters',
    description:
      'Dutch tech newsletters cover startup news, SaaS roundups, fintech developments, and AI research. Strong engagement from niche professional audiences. Both Dutch-language and English-language newsletters serve different segments. Best for reaching engaged decision-makers.',
  },
  {
    icon: Mic,
    name: 'Podcasts',
    description:
      'Dutch tech podcasts in both Dutch and English reach professionals across the Benelux region. Best for B2B products needing in-depth discussion and thought leadership.',
  },
]

const rateTable = [
  { platform: 'YouTube (dedicated video)', audience: '10K-50K subscribers', rate: '€500 - €2,000' },
  { platform: 'YouTube (dedicated video)', audience: '50K-200K subscribers', rate: '€2,000 - €5,000' },
  { platform: 'YouTube (dedicated video)', audience: '200K+ subscribers', rate: '€5,000 - €12,000' },
  { platform: 'Twitter/X (thread)', audience: '10K-50K followers', rate: '€80 - €400' },
  { platform: 'Twitter/X (thread)', audience: '50K-200K followers', rate: '€400 - €1,200' },
  { platform: 'LinkedIn (post)', audience: '10K-50K followers', rate: '€300 - €1,000' },
  { platform: 'LinkedIn (post)', audience: '50K-100K followers', rate: '€1,000 - €2,500' },
  { platform: 'Newsletter (mention)', audience: '5K-20K subscribers', rate: '€200 - €800' },
  { platform: 'Newsletter (mention)', audience: '20K-50K subscribers', rate: '€800 - €2,000' },
  { platform: 'Podcast (mid-roll spot)', audience: '1K-10K downloads/ep', rate: '€300 - €1,400' },
]

const techHubs = [
  {
    name: 'Amsterdam',
    description:
      "The country's startup capital and one of Europe's top tech cities. Home to Booking.com, TomTom, and hundreds of startups. Amsterdam's Startup Village, the Zuidas business district, and the city centre house a dense tech ecosystem. Amsterdam-based creators cover SaaS, fintech, AI, and developer tools. The city also hosts European headquarters for Netflix, Uber, Tesla, and Cisco, giving creators access to professionals at global companies.",
  },
  {
    name: 'Eindhoven (Brainport)',
    description:
      'Europe\'s leading tech and innovation hub per capita. Home to ASML (the world\'s most valuable semiconductor equipment company), Philips, NXP Semiconductors, and the High Tech Campus Eindhoven ("the smartest square kilometre in Europe"). Eindhoven-based creators cover hardware engineering, semiconductor technology, IoT, and deep tech. This niche exists at this depth only in Eindhoven. Audiences include R&D engineers, hardware designers, and deep tech professionals.',
  },
  {
    name: 'Rotterdam',
    description:
      "The Netherlands' second city with strengths in logistics technology, maritime tech, and cleantech. Home to Europe's largest port. Rotterdam-based creators cover supply chain platforms, port technology, logistics automation, and sustainability tech. The city's CIC Rotterdam and BlueCity innovation hubs produce creators focused on urban tech and circular economy solutions.",
  },
  {
    name: 'The Hague (Den Haag)',
    description:
      "The Netherlands' government and security hub. Home to the Dutch government, international courts, and a growing cybersecurity cluster (The Hague Security Delta, Europe's largest security cluster). Creators based here cover cybersecurity, govtech, legal tech, and international tech policy. Audiences include security professionals, government IT teams, and legal tech companies.",
  },
  {
    name: 'Utrecht',
    description:
      "Central Netherlands' growing tech hub with a strong SaaS and gaming scene. Utrecht-based creators cover mobile gaming, SaaS products, and digital health. The city's central location makes Utrecht a hub for creators serving the national market.",
  },
  {
    name: 'Groningen',
    description:
      "Northern Netherlands' student and startup hub. Home to the University of Groningen and a growing energy tech ecosystem. Creators cover energy technology, student-focused tools, and early-stage startup content. Cost-effective partnerships for brands targeting younger Dutch audiences.",
  },
]

const steps = [
  {
    number: '1',
    title: 'Search the Creator Directory',
    description:
      'Browse Dutch tech influencers on Infoishai. Filter by niche (fintech, SaaS, developer tools, AI, logistics tech, deep tech), platform (YouTube, LinkedIn, Twitter/X), language (Dutch, English), and audience size. View profiles with engagement rates, past campaigns, and content samples.',
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
  { label: 'Find Tech Influencers in Singapore', href: '/influencers/singapore' },
  { label: 'Browse All Tech Influencers', href: '/creators' },
  { label: 'Tech Influencer Marketing Blog', href: '/blog' },
]

export default function NetherlandsInfluencersPage() {
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
          <span className="text-gray-900 font-medium">Netherlands</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Find Tech Influencers in the Netherlands
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            Connect with verified Dutch tech creators across YouTube, LinkedIn, Twitter/X, and
            newsletters. Reach the Benelux region and wider European market. Browse by niche,
            audience size, and engagement rate. Free to search.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/creators?country=NL"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Dutch Creators
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

      {/* Why Dutch influencers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Why Work With Dutch Tech Influencers?
          </h2>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed">
            <p>
              The Netherlands punches far above its weight in global tech. A country of 17.5
              million people hosts some of Europe&apos;s most valuable tech companies:
              Booking.com, Adyen, Mollie, TomTom, and ASML. Amsterdam ranks as a top-five European
              startup city by venture funding. The Netherlands has the highest internet
              penetration rate in Europe at 98%.
            </p>
            <p>
              Dutch tech influencers reach professionals across one of Europe&apos;s most
              digitally advanced markets. Their audiences include engineers at ASML and Philips,
              fintech professionals at Adyen and Mollie, startup founders building from
              Amsterdam&apos;s Startup Village, and enterprise IT buyers at Dutch and multinational
              companies with European headquarters in the Netherlands.
            </p>
            <p>
              Working with Dutch creators gives your brand four specific advantages. First,
              English fluency. The Netherlands ranks first globally in English proficiency among
              non-native speakers (EF English Proficiency Index). Dutch tech creators produce
              polished English-language content indistinguishable from native English speakers.
              This means a single Dutch creator partnership reaches both the domestic market and
              the entire English-speaking European audience. Second, European headquarters hub.
              Hundreds of US and Asian tech companies base their European headquarters in the
              Netherlands (Cisco, Netflix, Tesla, Uber, Nike). Dutch creators reach the employees
              and buyers at these companies. A review from a Dutch creator carries weight with
              European divisions of global companies. Third, Benelux market access. Dutch-language
              content reaches the Netherlands (17.5 million) and the Dutch-speaking population of
              Belgium/Flanders (6.5 million). One partnership covers 24 million Dutch speakers.
              English content from Dutch creators reaches the entire Benelux region including
              Luxembourg. Fourth, data infrastructure credibility. Amsterdam hosts AMS-IX, one of
              the world&apos;s largest internet exchanges. The Netherlands is Europe&apos;s top
              data centre market. Dutch creators covering cloud, hosting, and infrastructure carry
              unique credibility in data infrastructure topics.
            </p>
            <p>
              Whether you sell SaaS software, developer tools, fintech products, cloud
              infrastructure, or AI solutions, Dutch tech influencers connect your brand with one
              of Europe&apos;s most tech-forward audiences.
            </p>
          </div>
        </div>
      </section>

      {/* Top niches */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Popular Tech Influencer Niches in the Netherlands
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => {
              const Icon = niche.icon
              return (
                <Link
                  key={niche.name}
                  href="/creators?country=NL"
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
          Find Dutch Creators on Every Platform
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Dutch tech influencers create content across multiple platforms. On Infoishai, you
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
            How Much Do Dutch Tech Influencers Charge in 2026?
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
            Rates for Dutch tech influencers vary based on platform, audience size, engagement
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
            These rates reflect market averages for Dutch tech creators in 2026. Dutch rates are
            slightly below German rates and comparable to UK rates, making the Netherlands a
            cost-effective entry point for the European market. Dutch creators who produce
            English-language content offer particularly strong value because their content
            reaches audiences well beyond the domestic market. On Infoishai, you message creators
            directly to discuss rates and campaign details.
          </p>
        </div>
      </section>

      {/* Tech hubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Tech Influencers Across the Netherlands&apos; Top Tech Cities
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Dutch tech influencers are based across every major tech hub in the country. Your
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
            The Netherlands has the highest remote work adoption rate in Europe. Many Dutch tech
            creators work from smaller cities and towns across the country. The country&apos;s
            compact geography and strong internet infrastructure (97% broadband penetration)
            support remote content creation from anywhere. On Infoishai, filter by audience
            demographics rather than creator location.
          </p>
        </div>
      </section>

      {/* Benelux and European access */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-start gap-4 mb-6 max-w-3xl">
            <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Reach the Benelux Region and All of Europe Through Dutch Creators
            </h2>
          </div>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed max-w-3xl">
            <p>
              The Netherlands sits at the geographic and economic centre of Western Europe. Dutch
              creators serve as a natural gateway for brands expanding across the continent.
            </p>
            <p>
              A typical Dutch tech creator&apos;s audience breaks down as follows: 55-65% from the
              Netherlands, 8-12% from Belgium (primarily Dutch-speaking Flanders), 3-5% from
              Luxembourg and other Benelux, 10-15% from Germany and the UK, and 10-15% from the US
              and rest of the world.
            </p>
            <p>
              The Benelux market (Netherlands, Belgium, Luxembourg) represents 30 million people
              with high tech adoption rates and strong purchasing power. Dutch-language content
              reaches the Netherlands and Flanders. English-language content from Dutch creators
              reaches the entire Benelux region plus the broader European market.
            </p>
            <p>
              For US and UK brands entering continental Europe, the Netherlands is the easiest
              starting point. Dutch business culture closely mirrors Anglo-Saxon norms. English is
              widely spoken in professional settings. The regulatory environment is
              business-friendly. Starting with Dutch creators gives brands a European foothold
              before expanding into German, French, and Southern European markets.
            </p>
            <p>
              For APAC brands seeking European expansion, the Netherlands offers a similar
              advantage. The country&apos;s role as a European HQ location for Asian companies
              (Samsung, Huawei, many Japanese firms) means Dutch creators reach both Western
              European buyers and the European teams of Asian corporations.
            </p>
          </div>
        </div>
      </section>

      {/* Deep tech and hardware */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-start gap-4 mb-6 max-w-3xl">
          <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            The Netherlands&apos; Unique Deep Tech and Hardware Creator Ecosystem
          </h2>
        </div>
        <div className="space-y-4 text-base text-gray-600 leading-relaxed max-w-3xl">
          <p>
            The Netherlands has a deep tech and hardware creator community not found in most other
            markets. This stems from Eindhoven&apos;s Brainport ecosystem, the densest
            concentration of high-tech R&amp;D in Europe.
          </p>
          <p>
            ASML, headquartered in Veldhoven near Eindhoven, builds the machines that manufacture
            the world&apos;s most advanced computer chips. The company&apos;s EUV lithography
            technology is essential to every major semiconductor manufacturer globally. Creators
            connected to this ecosystem produce content about semiconductor manufacturing,
            photonics, precision engineering, and advanced materials.
          </p>
          <p>
            Philips (now focused on health technology), NXP Semiconductors, and the High Tech
            Campus Eindhoven add depth to this hardware creator community. The campus hosts 235
            companies and 12,000 researchers and developers working on semiconductors, IoT, AI
            hardware, and medical devices.
          </p>
          <p>
            For brands selling tools or services to hardware engineers, R&amp;D teams, or deep
            tech companies, Dutch creators from the Eindhoven ecosystem reach an audience no other
            market serves at this level. This includes EDA (electronic design automation) tools,
            simulation software, CAD/CAM platforms, supply chain solutions for high-tech
            manufacturing, and R&amp;D collaboration tools.
          </p>
          <p>
            This niche is small. The audience is concentrated. The purchasing power per viewer is
            among the highest of any tech creator audience globally.
          </p>
        </div>
      </section>

      {/* How to get started */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
            How to Find and Hire Dutch Tech Influencers on Infoishai
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
            Browse Dutch Tech Influencers
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <NetherlandsFaq />
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Start Finding Dutch Tech Influencers Today
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-base leading-relaxed">
            Join brands across Europe using Infoishai to connect with verified Dutch tech
            creators. Reach the Benelux region. Search by niche, platform, language, and audience
            size. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/creators"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Dutch Creators
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
