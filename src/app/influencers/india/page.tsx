import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import Footer from '@/components/footer'
import IndiaFaq from '@/components/influencers/IndiaFaq'
import {
  ChevronRight,
  Youtube,
  Instagram,
  Twitter,
  Linkedin,
  Send,
  GraduationCap,
  Brain,
  LayoutGrid,
  Cloud,
  Briefcase,
  Rocket,
  Languages,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Find Tech Influencers in India | Indian Tech Creators',
  description:
    'Find verified Indian tech influencers for your brand. Browse creators in Bangalore, Mumbai, Delhi, and Hyderabad covering AI, SaaS, coding tutorials, and developer niches. Free to search.',
  keywords: [
    'tech influencers India',
    'Indian tech creators',
    'Indian tech YouTubers',
    'Bangalore tech influencers',
    'find tech influencers India',
    'hire Indian tech reviewers',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Find Tech Influencers in India | Infoishai',
    description:
      'Find verified Indian tech influencers for your brand. Browse creators in Bangalore, Mumbai, Delhi, and Hyderabad. Free to search.',
    url: 'https://infoishai.com/influencers/india',
    siteName: 'Infoishai',
    type: 'website',
    images: [{ url: 'https://infoishai.com/images/india-tech-influencers.jpg', width: 1200, height: 630, alt: 'Tech influencers in India' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Tech Influencers in India | Infoishai',
    description:
      'Find verified Indian tech influencers for your brand. Browse creators in Bangalore, Mumbai, Delhi, and Hyderabad. Free to search.',
  },
  alternates: {
    canonical: 'https://infoishai.com/influencers/india',
  },
}

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Tech Influencers in India',
  description:
    'Browse and hire verified Indian tech influencers across YouTube, Twitter/X, LinkedIn, and other platforms',
  url: 'https://infoishai.com/influencers/india',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Infoishai',
    url: 'https://infoishai.com',
  },
  about: {
    '@type': 'Thing',
    name: 'Tech Influencer Marketing in India',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://infoishai.com' },
      { '@type': 'ListItem', position: 2, name: 'Influencers', item: 'https://infoishai.com/creators' },
      { '@type': 'ListItem', position: 3, name: 'India', item: 'https://infoishai.com/influencers/india' },
    ],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find tech influencers in India?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search the Infoishai creator directory and filter by India. Browse verified Indian tech influencers across YouTube, Twitter/X, LinkedIn, and Instagram. Filter by niche (AI, SaaS, coding, developer tools), language (English, Hindi, regional), and audience size to find the right creator for your campaign.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much do Indian tech influencers charge?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Indian tech influencer rates vary by platform and audience size. YouTube: INR 15,000 to INR 1,50,000 per video (50K-500K subscribers). LinkedIn: INR 10,000 to INR 50,000 per post. Twitter/X: INR 5,000 to INR 30,000 per thread. Instagram: INR 8,000 to INR 60,000 per reel.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I work with Indian tech influencers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "India has the world's largest developer population and the fastest-growing SaaS ecosystem. Indian tech influencers reach millions of developers, startup founders, and IT decision-makers. India has over 800 million internet users, and tech content in English and Hindi reaches a massive audience at a fraction of Western creator rates.",
      },
    },
  ],
}

const stats = [
  { value: '800+', label: 'Verified Indian Creators' },
  { value: '15+', label: 'Tech Niches Covered' },
  { value: '4.6/5', label: 'Average Creator Rating' },
  { value: 'Free', label: 'To Search and Connect' },
]

const niches = [
  {
    icon: GraduationCap,
    color: 'from-blue-500 to-cyan-500',
    name: 'Coding Tutorials and Education',
    description:
      "India's largest tech content category. Creators teach programming languages, data structures, algorithms, and interview preparation. Audiences include engineering students, bootcamp learners, and working developers upskilling for career growth.",
  },
  {
    icon: Brain,
    color: 'from-violet-500 to-purple-500',
    name: 'AI and Data Science',
    description:
      'Creators covering machine learning, AI tools, data analytics, and Python programming. India produces more AI research papers annually than any country except the US and China. Strong audience among aspiring data scientists and ML engineers.',
  },
  {
    icon: LayoutGrid,
    color: 'from-green-500 to-emerald-500',
    name: 'SaaS and Product Reviews',
    description:
      "Software reviewers covering CRM, project management, marketing tools, and business applications. Audiences include startup founders, small business owners, and operations teams across India's growing SaaS adoption curve.",
  },
  {
    icon: Cloud,
    color: 'from-sky-500 to-blue-500',
    name: 'Cloud and DevOps',
    description:
      "Infrastructure creators covering AWS, Azure, GCP, Docker, and Kubernetes. India's IT services industry employs millions of cloud professionals. High demand for cloud certification prep and DevOps workflow content.",
  },
  {
    icon: Briefcase,
    color: 'from-amber-500 to-yellow-500',
    name: 'Career and Placement',
    description:
      'Creators covering tech interview preparation, resume building, salary negotiation, and career transitions. Massive audience among engineering graduates and professionals switching roles. Brands selling HR tech, coding platforms, and educational products partner with these creators.',
  },
  {
    icon: Rocket,
    color: 'from-red-500 to-orange-500',
    name: 'Startup and Entrepreneurship',
    description:
      "Creators covering startup building, fundraising, product development, and the Indian startup ecosystem. Audiences include aspiring founders, early-stage teams, and investors tracking India's tech scene.",
  },
]

const platforms = [
  {
    icon: Youtube,
    name: 'YouTube',
    description:
      "The dominant platform for Indian tech content. India is YouTube's largest market by user count. Indian tech YouTubers produce content in English, Hindi, and regional languages. Channels range from 10K to 10 million subscribers. Best for product reviews, coding tutorials, and detailed tech explanations.",
  },
  {
    icon: Instagram,
    name: 'Instagram',
    description:
      'Strong and growing platform for short-form tech content in India. Tech reels covering quick tips, tool demos, and coding snippets reach millions of young professionals and students. Best for reaching the 18-30 age group with visual, fast-paced content.',
  },
  {
    icon: Linkedin,
    name: 'LinkedIn',
    description:
      'Rapidly growing among Indian tech professionals. Indian LinkedIn creators share career insights, tool recommendations, and industry analysis. Strong engagement from mid-level and senior professionals at Indian and multinational companies. Best for B2B SaaS and enterprise tools.',
  },
  {
    icon: Twitter,
    name: 'Twitter/X',
    description:
      'Active Indian tech community covering startups, developer tools, open-source projects, and AI. Tech Twitter in India drives strong engagement on product launches and feature announcements. Best for developer tools and startup products.',
  },
  {
    icon: Send,
    name: 'Telegram and Discord',
    description:
      'Indian tech communities are highly active on Telegram and Discord. Creators run channels with thousands of members discussing tools, sharing resources, and recommending products. Best for developer-focused products and community-driven tools.',
  },
]

const rateTable = [
  { platform: 'YouTube (dedicated video)', audience: '10K-50K subscribers', rate: '₹5,000 - ₹20,000' },
  { platform: 'YouTube (dedicated video)', audience: '50K-500K subscribers', rate: '₹20,000 - ₹1,50,000' },
  { platform: 'YouTube (dedicated video)', audience: '500K-1M subscribers', rate: '₹1,50,000 - ₹5,00,000' },
  { platform: 'YouTube (dedicated video)', audience: '1M+ subscribers', rate: '₹5,00,000 - ₹15,00,000' },
  { platform: 'Instagram (reel)', audience: '10K-50K followers', rate: '₹3,000 - ₹15,000' },
  { platform: 'Instagram (reel)', audience: '50K-500K followers', rate: '₹15,000 - ₹80,000' },
  { platform: 'Twitter/X (thread)', audience: '10K-50K followers', rate: '₹2,000 - ₹10,000' },
  { platform: 'Twitter/X (thread)', audience: '50K-200K followers', rate: '₹10,000 - ₹40,000' },
  { platform: 'LinkedIn (post)', audience: '10K-50K followers', rate: '₹5,000 - ₹20,000' },
  { platform: 'LinkedIn (post)', audience: '50K-100K followers', rate: '₹20,000 - ₹60,000' },
  { platform: 'Newsletter (mention)', audience: '5K-20K subscribers', rate: '₹3,000 - ₹15,000' },
  { platform: 'Podcast (mid-roll spot)', audience: '1K-10K downloads/ep', rate: '₹5,000 - ₹25,000' },
]

const techHubs = [
  {
    name: 'Bangalore (Bengaluru)',
    description:
      "India's Silicon Valley and the country's largest tech hub. Home to thousands of startups, multinational R&D centres, and the highest concentration of Indian tech creators. Bangalore-based influencers cover AI, SaaS, developer tools, and startup culture. Koramangala, HSR Layout, and Whitefield are the city's startup epicentres.",
  },
  {
    name: 'Mumbai',
    description:
      "India's financial capital with growing strength in fintech, media tech, and enterprise software. Mumbai-based creators reach audiences in financial services, digital media, and e-commerce. The city's advertising and media industry also makes Mumbai a hub for creator economy discussions.",
  },
  {
    name: 'Delhi-NCR (Delhi, Gurugram, Noida)',
    description:
      "India's second-largest tech hub. Gurugram hosts major SaaS companies, consulting firms, and IT centres. Delhi-NCR creators cover enterprise tech, startup funding, and B2B products. Strong LinkedIn presence among corporate tech professionals.",
  },
  {
    name: 'Hyderabad',
    description:
      "Growing tech hub with major presence from Google, Apple, Microsoft, Amazon, and Meta. Hyderabad-based creators cover cloud computing, AI, and enterprise infrastructure. The city's HITEC City district is one of India's largest IT corridors.",
  },
  {
    name: 'Pune',
    description:
      'Strong IT and engineering hub with companies like Infosys, Wipro, and numerous startups. Pune-based creators cover developer tools, IT services, and engineering education. High concentration of engineering graduates and early-career tech professionals.',
  },
  {
    name: 'Chennai',
    description:
      'South India\'s enterprise IT capital with strength in IT services, automotive tech, and manufacturing technology. Chennai-based creators produce content in English and Tamil, reaching South Indian tech audiences.',
  },
  {
    name: 'Kolkata',
    description:
      'Emerging tech hub with a growing startup ecosystem and a strong base of student and early-career tech audiences. Lower creator rates make Kolkata-based influencers cost-effective for brands on smaller budgets.',
  },
]

const languages = [
  {
    icon: Languages,
    name: 'English',
    description:
      'The default language for technical content in India. English-language Indian tech creators reach a global audience, including the 350+ million English-speaking Indians and the global Indian diaspora. Best for developer tools, SaaS products, and international brands entering India.',
  },
  {
    icon: Languages,
    name: 'Hindi',
    description:
      'The widest-reach regional language for tech content. Hindi tech YouTubers reach audiences across North India, Central India, and Hindi-speaking viewers worldwide. Channels in Hindi often have larger subscriber counts than English equivalents. Best for consumer tech, coding education, and products targeting the mass Indian market.',
  },
  {
    icon: Languages,
    name: 'Tamil',
    description:
      'Strong tech creator community in Tamil Nadu and among Tamil-speaking audiences globally. Best for reaching South Indian tech professionals and students in Chennai, Coimbatore, and Madurai.',
  },
  {
    icon: Languages,
    name: 'Telugu',
    description:
      'Growing tech content ecosystem in Telugu. Best for reaching audiences in Hyderabad, Andhra Pradesh, and the Telugu diaspora.',
  },
  {
    icon: Languages,
    name: 'Kannada',
    description:
      "Tech content for Karnataka's developer community. Best for reaching Bangalore's local audience alongside English content.",
  },
]

const steps = [
  {
    number: '1',
    title: 'Search the Creator Directory',
    description:
      'Browse Indian tech influencers on Infoishai. Filter by niche (AI, SaaS, developer tools, coding education, career), platform (YouTube, Instagram, Twitter/X, LinkedIn), language (English, Hindi, regional), and audience size. View profiles with engagement rates, past campaigns, and content samples.',
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
  { label: 'Find Tech Influencers in Australia', href: '/influencers/australia' },
  { label: 'Find Tech Influencers in Pakistan', href: '/influencers/pakistan' },
  { label: 'Find Tech Influencers in Germany', href: '/influencers/germany' },
  { label: 'Find Tech Influencers in Netherlands', href: '/influencers/netherlands' },
  { label: 'Find Tech Influencers in Singapore', href: '/influencers/singapore' },
  { label: 'Browse All Tech Influencers', href: '/creators' },
  { label: 'Tech Influencer Marketing Blog', href: '/blog' },
]

export default function IndiaInfluencersPage() {
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
          <span className="text-gray-900 font-medium">India</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Find Tech Influencers in India
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            Connect with verified Indian tech creators across YouTube, Twitter/X, LinkedIn, and
            Instagram. Browse by niche, language, audience size, and engagement rate. Free to
            search.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/creators?country=IN"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Indian Creators
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

      {/* Why Indian influencers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Why Work With Indian Tech Influencers?
          </h2>
          <div className="space-y-4 text-base text-gray-600 leading-relaxed">
            <p>
              India is the world&apos;s largest tech talent market. The country has over 5.8
              million software developers, more than 100,000 active startups, and a SaaS ecosystem
              valued at over $30 billion. Tech YouTube in India is massive. Indian tech channels
              collectively reach hundreds of millions of viewers every month across English,
              Hindi, and regional languages.
            </p>
            <p>
              Indian tech influencers reach the professionals building, buying, and implementing
              technology across the subcontinent. Their audiences include developers at Infosys,
              Wipro, and TCS; startup founders in Bangalore&apos;s Koramangala; product managers at
              global companies with India offices; and the next generation of engineers graduating
              from IITs and NITs.
            </p>
            <p>
              Working with Indian creators gives your brand four specific advantages. First,
              massive scale. India has over 800 million internet users. A single Indian tech
              YouTuber with 500K subscribers reaches more developers than the entire population of
              many European countries. Second, cost efficiency. Indian creator rates are 70-80%
              lower than US equivalents. A campaign budget of $2,000 buys one US video or five to
              eight Indian creator partnerships, reaching a combined audience of millions. Third,
              multilingual reach. Indian creators produce content in English, Hindi, Tamil, Telugu,
              Kannada, and other languages. You target specific regional markets or go broad with
              English-language content consumed across India and the global Indian diaspora.
              Fourth, developer community depth. India&apos;s developer community is the largest on
              GitHub outside the US. Tech creators embedded in this community carry influence
              across coding bootcamps, open-source projects, college tech fests, and corporate
              engineering teams.
            </p>
            <p>
              Whether you sell a developer tool, a SaaS platform, an AI product, a coding
              bootcamp, or cloud infrastructure, Indian tech influencers give your brand access to
              the world&apos;s largest and fastest-growing tech audience.
            </p>
          </div>
        </div>
      </section>

      {/* Top niches */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Popular Tech Influencer Niches in India
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => {
              const Icon = niche.icon
              return (
                <Link
                  key={niche.name}
                  href="/creators?country=IN"
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
          Find Indian Creators on Every Platform
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Indian tech influencers create content across multiple platforms. On Infoishai, you
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
            How Much Do Indian Tech Influencers Charge in 2026?
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-8">
            Rates for Indian tech influencers vary based on platform, audience size, engagement
            rate, language, and content format. Here are the standard ranges for 2026 in INR.
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
            These rates reflect market averages for Indian tech creators in 2026. Indian creator
            rates are 70-80% lower than US equivalents, making India one of the most
            cost-effective markets for influencer marketing globally. Hindi-language creators and
            English-language creators charge similar rates at comparable audience sizes. On
            Infoishai, you message creators directly to discuss rates and campaign details.
          </p>
        </div>
      </section>

      {/* Tech hubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Tech Influencers Across India&apos;s Top Tech Cities
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
          Indian tech influencers are based across every major tech hub in the country. Your
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
          <h3 className="font-semibold text-gray-900 mb-2">Remote and Tier-2/3 Cities</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Many of India&apos;s fastest-growing tech creators work from smaller cities. Creators
            from Jaipur, Lucknow, Indore, Kochi, Chandigarh, and other tier-2 cities produce
            high-quality content at lower rates. On Infoishai, filter by audience demographics
            rather than creator location to reach the right buyers.
          </p>
        </div>
      </section>

      {/* Language options */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Find Indian Tech Influencers by Language
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl mb-10">
            India&apos;s tech creator ecosystem spans multiple languages. On Infoishai, you find
            creators producing content in the language your target audience speaks.
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
            Choosing the right language depends on your product and audience. A developer tool
            targeting senior engineers works best with English-language creators. A mobile app
            targeting students across India works best with Hindi-language creators. A regional
            SaaS product works best with creators in the local language.
          </p>
        </div>
      </section>

      {/* How to get started */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-10">
          How to Find and Hire Indian Tech Influencers on Infoishai
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
          Browse Indian Tech Influencers
        </Link>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <IndiaFaq />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Start Finding Indian Tech Influencers Today
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-base leading-relaxed">
            Join brands worldwide using Infoishai to connect with verified Indian tech creators.
            Search by niche, platform, language, and audience size. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/creators"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all"
            >
              Browse Indian Creators
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
