import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import PakistanFaq from '@/components/influencers/PakistanFaq'
import {
  ChevronRight,
  Youtube,
  Instagram,
  Twitter,
  Linkedin,
  Music2,
  Facebook,
  Briefcase,
  Code2,
  Brain,
  Smartphone,
  ShoppingCart,
  GraduationCap,
  Languages,
  Wallet,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Tech Influencers in Pakistan | Pakistani Tech Creators',
  description:
    'Find verified Pakistani tech influencers for your brand. Browse creators in Lahore, Karachi, and Islamabad covering AI, SaaS, mobile apps, freelancing, and developer niches. Free to search.',
  keywords: [
    'tech influencers Pakistan',
    'Pakistani tech creators',
    'Pakistani tech YouTubers',
    'Lahore tech influencers',
    'Karachi tech creators',
    'hire Pakistani tech reviewers',
    'influencer marketing Pakistan',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Find Tech Influencers in Pakistan | Infoishai',
    description:
      'Find verified Pakistani tech influencers for your brand. Browse creators in Lahore, Karachi, and Islamabad covering AI, SaaS, and developer niches. Free to search.',
    url: 'https://infoishai.com/influencers/pakistan',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/images/pakistan-tech-influencers.jpg', width: 1200, height: 630, alt: 'Tech influencers in Pakistan' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tech Influencers in Pakistan | Infoishai',
    description:
      'Find verified Pakistani tech influencers for your brand. Browse creators in Lahore, Karachi, and Islamabad covering AI, SaaS, and developer niches. Free to search.',
  },
  alternates: {
    canonical: 'https://infoishai.com/influencers/pakistan',
  },
}

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Tech Influencers in Pakistan',
  description:
    'Browse and hire verified Pakistani tech influencers across YouTube, Twitter/X, LinkedIn, Instagram, and other platforms',
  url: 'https://infoishai.com/influencers/pakistan',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Infoishai',
    url: 'https://infoishai.com',
  },
  about: {
    '@type': 'Thing',
    name: 'Tech Influencer Marketing in Pakistan',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://infoishai.com' },
      { '@type': 'ListItem', position: 2, name: 'Influencers', item: 'https://infoishai.com/creators' },
      { '@type': 'ListItem', position: 3, name: 'Pakistan', item: 'https://infoishai.com/influencers/pakistan' },
    ],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find tech influencers in Pakistan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search the Infoishai creator directory and filter by Pakistan. Browse verified Pakistani tech influencers across YouTube, Instagram, Twitter/X, and LinkedIn. Filter by niche (AI, SaaS, freelancing, mobile development), language (English, Urdu), and audience size to find the right creator for your campaign.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do Pakistani tech influencers charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pakistani tech influencer rates vary by platform and audience size. YouTube: PKR 15,000 to PKR 150,000 per video (50K-500K subscribers). Instagram: PKR 10,000 to PKR 80,000 per reel. LinkedIn: PKR 8,000 to PKR 40,000 per post. Twitter/X: PKR 5,000 to PKR 25,000 per thread.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I work with Pakistani tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Pakistan has the third-largest freelancer population globally, a rapidly growing startup ecosystem, and over 100 million internet users. Pakistani tech influencers reach a young, tech-savvy audience at the lowest rates in any major English-speaking market. The country's IT exports exceeded $3.2 billion in 2025, making Pakistan a key market for developer tools, freelancing platforms, and SaaS products.",
      },
    },
  ],
}

const stats = [
  { value: '400+', label: 'Verified Pakistani Creators' },
  { value: '12+', label: 'Tech Niches Covered' },
  { value: '4.6/5', label: 'Average Creator Rating' },
  { value: 'Free', label: 'To Search and Connect' },
]

const niches = [
  {
    icon: Briefcase,
    color: 'from-blue-500 to-cyan-500',
    name: 'Freelancing and Remote Work',
    description:
      "Pakistan's largest tech content category. Creators teach how to earn through Fiverr, Upwork, Toptal, and direct clients. They cover portfolio building, client management, pricing strategies, and skill development. Audiences include active freelancers and aspiring remote workers.",
  },
  {
    icon: Code2,
    color: 'from-green-500 to-emerald-500',
    name: 'Coding Tutorials and Education',
    description:
      'Creators teaching programming languages, web development, mobile app development, and data structures. Pakistan produces over 50,000 IT graduates annually. This audience is large, engaged, and actively looking for tools and platforms to accelerate their learning.',
  },
  {
    icon: Brain,
    color: 'from-violet-500 to-purple-500',
    name: 'AI and Data Science',
    description:
      "Creators covering machine learning tools, AI applications, ChatGPT workflows, data analysis, and Python programming. Pakistan's AI community is growing through university programs, bootcamps, and self-taught developers. Strong demand for AI tool reviews and tutorials.",
  },
  {
    icon: Smartphone,
    color: 'from-sky-500 to-blue-500',
    name: 'Mobile App Development',
    description:
      "Creators covering Flutter, React Native, Swift, and Kotlin development. Pakistan's mobile-first internet population drives high demand for app development content. Audiences include student developers, agency teams, and solo app builders.",
  },
  {
    icon: ShoppingCart,
    color: 'from-amber-500 to-yellow-500',
    name: 'E-Commerce and Digital Marketing',
    description:
      "Creators covering Shopify, WooCommerce, Amazon FBA, Daraz seller strategies, and social media marketing. Pakistan's e-commerce market grows 25-30% annually. Audiences include small business owners, online sellers, and marketing agency teams.",
  },
  {
    icon: GraduationCap,
    color: 'from-red-500 to-orange-500',
    name: 'Career and Professional Growth',
    description:
      'Creators covering job interview preparation, resume building, salary negotiation, and career switching into tech. Massive audience among fresh graduates, career changers, and professionals upskilling. Brands selling HR tech, job platforms, and educational products partner with these creators.',
  },
]

const platforms = [
  {
    icon: Youtube,
    name: 'YouTube',
    description:
      "The dominant platform for Pakistani tech content. Pakistan is YouTube's fourth-largest market by viewership. Pakistani tech YouTubers produce content in English and Urdu, covering everything from freelancing tutorials to AI tool reviews. Channels range from 5K to over 2 million subscribers. Best for detailed product walkthroughs, coding tutorials, and long-form reviews.",
  },
  {
    icon: Instagram,
    name: 'Instagram',
    description:
      'Fast-growing platform for short-form tech content in Pakistan. Tech reels covering quick tips, tool demos, freelancing advice, and coding snippets reach millions of young Pakistanis. Instagram is the second most popular social platform in the country after YouTube. Best for reaching the 18-28 age group with visual, fast-paced content.',
  },
  {
    icon: Music2,
    name: 'TikTok',
    description:
      "Massive reach in Pakistan. TikTok is the most downloaded app in the country. Short tech tips, coding clips, and freelancing motivation content perform well. Best for mass awareness campaigns targeting the youngest segment of Pakistan's tech audience.",
  },
  {
    icon: Linkedin,
    name: 'LinkedIn',
    description:
      'Growing among Pakistani tech professionals. Pakistani LinkedIn creators share career insights, tool recommendations, and industry analysis. The platform has strong adoption among mid-level and senior professionals at Pakistani and multinational companies. Best for B2B SaaS, enterprise tools, and professional development products.',
  },
  {
    icon: Twitter,
    name: 'Twitter/X',
    description:
      'Active Pakistani tech community with strong presence in developer tools, startup discussions, and AI. Pakistani tech Twitter drives engagement on product launches, open-source projects, and tech news. Best for developer-focused products and startup tools.',
  },
  {
    icon: Facebook,
    name: 'Facebook Groups',
    description:
      'Still relevant in Pakistan. Large tech communities operate through Facebook Groups focused on programming, freelancing, WordPress, and digital marketing. Creators who moderate or post actively in these groups reach engaged members. Best for community-driven products and educational platforms.',
  },
]

const rateTable = [
  { platform: 'YouTube (dedicated video)', audience: '5K-50K subscribers', rate: '₨5,000 - ₨25,000' },
  { platform: 'YouTube (dedicated video)', audience: '50K-500K subscribers', rate: '₨25,000 - ₨1,50,000' },
  { platform: 'YouTube (dedicated video)', audience: '500K-1M subscribers', rate: '₨1,50,000 - ₨5,00,000' },
  { platform: 'YouTube (dedicated video)', audience: '1M+ subscribers', rate: '₨5,00,000 - ₨15,00,000' },
  { platform: 'Instagram (reel)', audience: '10K-50K followers', rate: '₨5,000 - ₨20,000' },
  { platform: 'Instagram (reel)', audience: '50K-500K followers', rate: '₨20,000 - ₨80,000' },
  { platform: 'TikTok (video)', audience: '50K-500K followers', rate: '₨5,000 - ₨30,000' },
  { platform: 'TikTok (video)', audience: '500K+ followers', rate: '₨30,000 - ₨1,50,000' },
  { platform: 'Twitter/X (thread)', audience: '10K-50K followers', rate: '₨3,000 - ₨12,000' },
  { platform: 'Twitter/X (thread)', audience: '50K-200K followers', rate: '₨12,000 - ₨40,000' },
  { platform: 'LinkedIn (post)', audience: '10K-50K followers', rate: '₨5,000 - ₨20,000' },
  { platform: 'LinkedIn (post)', audience: '50K-100K followers', rate: '₨20,000 - ₨50,000' },
  { platform: 'Newsletter (mention)', audience: '2K-10K subscribers', rate: '₨3,000 - ₨15,000' },
  { platform: 'Podcast (mid-roll spot)', audience: '500-5K downloads/ep', rate: '₨5,000 - ₨25,000' },
]

const techHubs = [
  {
    name: 'Lahore',
    description:
      "Pakistan's tech capital and the largest hub for IT companies, startups, and tech content creators. Home to Arbisoft, Systems Limited, and hundreds of software houses along the Lahore IT corridor. The city's Johar Town, Gulberg, and DHA areas house a dense startup ecosystem. Lahore-based creators cover freelancing, web development, AI, and SaaS. The city produces the highest concentration of Pakistani tech YouTubers.",
  },
  {
    name: 'Karachi',
    description:
      "Pakistan's financial capital and largest city. Home to major banks, fintech startups, and e-commerce companies. Karachi-based creators cover digital marketing, e-commerce, fintech, and enterprise tech. The city's I.I. Chundrigar Road financial district and Clifton tech scene produce creators focused on business technology and digital transformation.",
  },
  {
    name: 'Islamabad',
    description:
      "Pakistan's political capital with a growing tech hub. Home to the National Incubation Center, IGNITE national technology fund, and a cluster of IT companies in the Blue Area and F-sectors. Islamabad-based creators cover government tech, startup funding, and IT policy. The city has a strong community of creators who work with international clients and brands.",
  },
  {
    name: 'Rawalpindi',
    description:
      'Adjacent to Islamabad, Rawalpindi has a growing freelancer and developer community. Creators from Rawalpindi often serve the combined Islamabad-Rawalpindi twin city audience. Cost-effective partnerships for brands targeting the northern Pakistan market.',
  },
  {
    name: 'Peshawar',
    description:
      "Emerging tech hub with growing IT infrastructure. Home to the Peshawar IT Park, one of Pakistan's largest tech incubation facilities. Creators from Peshawar cover web development, freelancing, and mobile apps. Audiences include tech professionals and students from Khyber Pakhtunkhwa province.",
  },
  {
    name: 'Faisalabad',
    description:
      "Pakistan's industrial capital with a growing digital economy. Creators from Faisalabad cover e-commerce, digital marketing, and small business technology. The city's textile and manufacturing industries drive demand for business automation and digital transformation content.",
  },
  {
    name: 'Multan',
    description:
      'Growing tech community with active freelancer and developer networks. Creators from Multan produce content in Urdu and English, covering freelancing, web development, and career guidance. Cost-effective partnerships for brands targeting South Punjab audiences.',
  },
]

const languages = [
  {
    icon: Languages,
    name: 'English',
    description:
      'The standard language for technical content among Pakistani professionals and international freelancers. English-language Pakistani tech creators reach the global Pakistani diaspora across the US, UK, Canada, Middle East, and Europe. Best for developer tools, SaaS products, and international brands entering Pakistan.',
  },
  {
    icon: Languages,
    name: 'Urdu',
    description:
      "The national language and the widest-reach option for the domestic market. Urdu tech YouTubers often have larger subscriber counts than English-language equivalents because Urdu content reaches a broader audience across Pakistan. Best for consumer apps, freelancing platforms, educational products, and mass-market tech tools.",
  },
  {
    icon: Languages,
    name: 'Roman Urdu',
    description:
      'Written Urdu using English script. Common in social media posts, Twitter/X threads, and Instagram captions. Creators who write in Roman Urdu reach the mobile-first audience consuming content through social feeds. Best for social media campaigns and short-form content.',
  },
  {
    icon: Languages,
    name: 'Pashto',
    description:
      'Growing tech content community in Pashto, primarily from KPK and Balochistan. Pashto tech creators cover freelancing, web development, and career guidance. Best for reaching Pashtun audiences in Pakistan and Afghanistan.',
  },
  {
    icon: Languages,
    name: 'Punjabi and Sindhi',
    description:
      'Smaller but growing tech content communities in regional languages. Best for hyper-local campaigns targeting specific provincial audiences.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Search the Creator Directory',
    description:
      'Browse Pakistani tech influencers on Infoishai. Filter by niche (freelancing, coding, AI, e-commerce, career), platform (YouTube, Instagram, TikTok, Twitter/X, LinkedIn), language (English, Urdu), and audience size. View profiles with engagement rates, past campaigns, and content samples.',
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

const relatedBlogPosts = [
  { title: 'Influencer Marketing in Pakistan: The Complete Guide', href: '/blog/complete-guide-influencer-marketing-pakistan-2025' },
  { title: 'Micro-Influencers in Pakistan: Why They Outperform Celebrities', href: '/blog/micro-influencers-pakistan-guide' },
  { title: 'How to Find the Right Pakistani Influencers for Your Brand', href: '/blog/find-right-pakistani-influencers-brand' },
]

const relatedLinks = [
  { label: 'Find Tech Influencers in USA', href: '/influencers/usa' },
  { label: 'Find Tech Influencers in UK', href: '/influencers/uk' },
  { label: 'Find Tech Influencers in Canada', href: '/influencers/canada' },
  { label: 'Find Tech Influencers in India', href: '/influencers/india' },
  { label: 'Find Tech Influencers in Australia', href: '/influencers/australia' },
  { label: 'Find Tech Influencers in Germany', href: '/influencers/germany' },
  { label: 'Find Tech Influencers in Netherlands', href: '/influencers/netherlands' },
  { label: 'Find Tech Influencers in Singapore', href: '/influencers/singapore' },
  { label: 'Browse All Tech Influencers', href: '/creators' },
  { label: 'Tech Influencer Marketing Blog', href: '/blog' },
]

export default function PakistanInfluencersPage() {
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
          <span className="text-gray-900 font-medium">Pakistan</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Find Tech Influencers in Pakistan
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            Connect with verified Pakistani tech creators across YouTube, Instagram, Twitter/X,
            and LinkedIn. Browse by niche, language, audience size, and engagement rate. Free to
            search.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/creators?country=PK"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Pakistani Creators
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

      {/* Why Pakistani influencers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Why Work With Pakistani Tech Influencers?
          </h2>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed">
            <p>
              Pakistan&apos;s tech sector is growing faster than any other South Asian market. IT
              exports exceeded $3.2 billion in 2025. The country has over 100 million internet
              users, a median age of 22, and one of the most active YouTube audiences globally.
              Pakistan ranks as the fourth-largest YouTube market by viewership.
            </p>
            <p>
              Pakistani tech influencers reach a young, tech-hungry audience spending hours daily
              consuming content about programming, freelancing, mobile development, AI tools, and
              career growth. Their audiences include freelancers earning on Fiverr and Upwork,
              developers building products at Pakistani startups, computer science students across
              hundreds of universities, and IT professionals at companies in Lahore, Karachi, and
              Islamabad.
            </p>
            <p>
              Working with Pakistani creators gives your brand four specific advantages. First,
              the lowest rates in any major English-speaking market. Pakistani creator rates are
              80-90% lower than US equivalents and 60-70% lower than Indian rates. A campaign
              budget of $500 buys partnerships with 5 to 8 Pakistani creators, reaching a combined
              audience of hundreds of thousands. Second, massive youth audience. 64% of
              Pakistan&apos;s population is under 30. Tech content consumption among this
              demographic grows year over year. Brands targeting young developers, students, and
              early-career professionals reach them through Pakistani creators at scale. Third,
              freelancer economy access. Pakistan has the third-largest freelancer population
              globally. Over 2 million Pakistanis earn through international freelancing
              platforms. Brands selling freelancing tools, payment platforms, or productivity
              software access this audience directly through Pakistani tech creators. Fourth,
              bilingual content. Pakistani creators produce content in English, Urdu, or both.
              English-language content reaches the global Pakistani diaspora across the Middle
              East, UK, US, and Canada. Urdu-language content reaches the domestic mass market.
            </p>
            <p>
              Whether you sell a freelancing platform, developer tools, AI products, a coding
              bootcamp, mobile apps, or SaaS software, Pakistani tech influencers connect your
              brand with one of the world&apos;s fastest-growing tech audiences.
            </p>
          </div>
        </div>
      </section>

      {/* Top niches */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Popular Tech Influencer Niches in Pakistan
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => {
              const Icon = niche.icon
              return (
                <Link
                  key={niche.name}
                  href="/creators?country=PK"
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
          Find Pakistani Creators on Every Platform
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Pakistani tech influencers create content across multiple platforms. On Infoishai, you
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
            How Much Do Pakistani Tech Influencers Charge in 2026?
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
            Rates for Pakistani tech influencers vary based on platform, audience size, engagement
            rate, language, and content format. Here are the standard ranges for 2026 in PKR.
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
            These rates reflect market averages for Pakistani tech creators in 2026. Pakistani
            creator rates are the most affordable in any major English-speaking market, running
            80-90% lower than US equivalents and 60-70% lower than Indian rates. For brands on
            tighter budgets, Pakistan offers the highest volume of creator partnerships per dollar
            spent. On Infoishai, you message creators directly to discuss rates and campaign
            details.
          </p>
        </div>
      </section>

      {/* Tech hubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Tech Influencers Across Pakistan&apos;s Top Tech Cities
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Pakistani tech influencers are based across every major tech hub in the country. Your
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
          <h3 className="font-semibold text-gray-900 mb-2">Remote and Smaller Cities</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Many of Pakistan&apos;s fastest-growing tech creators work from smaller cities
            including Sialkot, Gujranwala, Hyderabad (Sindh), Quetta, and Abbottabad. Pakistan&apos;s
            improving internet infrastructure supports remote content creation across the country.
            On Infoishai, filter by audience demographics rather than creator location.
          </p>
        </div>
      </section>

      {/* Language options */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Find Pakistani Tech Influencers by Language
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
            Pakistan&apos;s tech creator ecosystem operates in multiple languages. On Infoishai,
            you find creators producing content in the language your target audience speaks.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {languages.map((language) => {
              const Icon = language.icon
              return (
                <div key={language.name} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{language.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{language.description}</p>
                </div>
              )
            })}
          </div>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl">
            Choosing the right language depends on your goals. International brands entering
            Pakistan should start with English-language creators. Brands targeting the mass
            Pakistani market should work with Urdu-language creators. A bilingual campaign using
            both English and Urdu maximises reach across all audience segments.
          </p>
        </div>
      </section>

      {/* Freelancer economy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-start gap-4 mb-6 max-w-3xl">
          <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Reach Pakistan&apos;s 2 Million+ Freelancers Through Tech Creators
          </h2>
        </div>
        <div className="space-y-4 text-base text-gray-600 leading-relaxed max-w-3xl">
          <p>
            Pakistan ranks as the third-largest freelancer market globally, behind only the US and
            India. Over 2 million Pakistanis earn through international freelancing platforms
            including Fiverr, Upwork, Toptal, Freelancer.com, and direct clients.
          </p>
          <p>
            This freelancer economy creates a unique opportunity for brands. Pakistani freelancers
            actively spend on tools and platforms to improve their work. They buy design software,
            coding tools, project management apps, payment solutions, invoicing platforms, and
            productivity software.
          </p>
          <p>
            Pakistani tech influencers who cover freelancing topics reach this audience directly. A
            creator teaching &ldquo;how to earn on Fiverr&rdquo; has an audience of people who need
            the exact tools your brand sells. The connection between content and purchase intent is
            direct.
          </p>
          <p>
            Categories with high demand among Pakistani freelancers include graphic design tools
            (Canva, Figma, Adobe), web development platforms (WordPress, Shopify, Webflow),
            communication tools (Slack, Zoom, Notion), payment and invoicing (Payoneer, Wise,
            PayPal), SEO and marketing tools (Ahrefs, SEMrush, Mailchimp), and AI writing and
            coding assistants.
          </p>
          <p>
            If your product serves freelancers, remote workers, or digital professionals,
            partnering with Pakistani tech creators puts your brand in front of the right buyers at
            the lowest cost in any English-speaking market.
          </p>
          <p>
            Read more about influencer marketing strategies for the Pakistani market:{' '}
            <Link href="/blog/complete-guide-influencer-marketing-pakistan-2025" className="text-blue-600 hover:underline">
              The Complete Guide to Influencer Marketing in Pakistan
            </Link>
            . Learn why micro-influencers outperform celebrities in Pakistan:{' '}
            <Link href="/blog/micro-influencers-pakistan-guide" className="text-blue-600 hover:underline">
              Micro-Influencers in Pakistan
            </Link>
            .
          </p>
        </div>
      </section>

      {/* How to get started */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
            How to Find and Hire Pakistani Tech Influencers on Infoishai
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
            Browse Pakistani Tech Influencers
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <PakistanFaq />
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Start Finding Pakistani Tech Influencers Today
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-base leading-relaxed">
            Join brands using Infoishai to connect with verified Pakistani tech creators. Search by
            niche, platform, language, and audience size. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/creators"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Pakistani Creators
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

      {/* Related blog posts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Related Articles</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {relatedBlogPosts.map((post) => (
            <Link
              key={post.href}
              href={post.href}
              className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <h3 className="font-semibold text-gray-900 leading-snug">{post.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Related links */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
        </div>
      </section>

      <Footer />
    </div>
  )
}
