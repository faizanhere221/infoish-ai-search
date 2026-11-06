// src/app/blog/b2b-saas-influencers-india/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/b2b-saas-influencers-india'
const HEADLINE = 'B2B and SaaS Influencers in India: Who to Hire Beyond Gadget Reviewers'
const META_TITLE = 'B2B and SaaS Influencers in India: Who to Hire | Infoishai'
const DESCRIPTION =
  'Most Indian tech creator lists cover smartphones. See how B2B and SaaS brands find developer, DevOps and LinkedIn creators in India, with rate tips.'

export const metadata: Metadata = {
  title: { absolute: META_TITLE },
  description: DESCRIPTION,
  keywords: [
    'b2b saas influencers india',
    'indian tech influencers',
    'tech influencers india',
    'india developer creators',
    'indian saas influencers on linkedin',
    'hindi vs english tech creators for b2b',
    'india devops youtubers for brands',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-06T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['India', 'B2B', 'SaaS', 'Tech Influencers'],
    images: [{ url: 'https://infoishai.com/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: META_TITLE,
    description: DESCRIPTION,
    images: ['https://infoishai.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: PAGE_URL,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: HEADLINE,
  description: DESCRIPTION,
  image: 'https://infoishai.com/og-image.jpg',
  datePublished: '2026-11-06',
  dateModified: '2026-11-06',
  author: {
    '@type': 'Person',
    name: 'Infoishai Team',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Infoishai',
    logo: {
      '@type': 'ImageObject',
      url: 'https://infoishai.com/logo.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': PAGE_URL,
  },
}

const BUSINESS_STANDARD =
  'https://www.business-standard.com/amp/industry/news/github-india-57-million-developers-2030-ai-growth-125102801381_1.html'
const DECCAN_CHRONICLE =
  'https://www.deccanchronicle.com/southern-states/telangana/hyderabad-talent-hotspot-for-mid-market-gccs-nasscom-1874488'
const INDIA_BRIEFING =
  'https://www.india-briefing.com/news/indias-global-capability-centers-market-estimated-to-reach-us110-billion-by-2030-28689.html/'
const CENSUS_LANGUAGES = 'https://en.wikipedia.org/wiki/Multilingualism_in_India'
const IAMAI_KANTAR =
  'https://www.theweek.in/wire-updates/business/2025/01/16/dcm51-biz-iamai-internet-usage-report.html'
const UPGROWTH = 'https://upgrowth.in/influencer-marketing-pricing-india-2026/'
const FLUXNOTE = 'https://fluxnote.io/guides/youtube-tech-channel-india-2026'
const FAVIKON = 'https://www.favikon.com/blog/top-b2b-influencers-india'
const AZB = 'https://www.azbpartners.com/bank/the-regulatory-evolution-of-influencer-advertising-in-india/'
const KHURANA =
  'https://www.khuranaandkhurana.com/2025-influencer-compliance-report-a-gloomy-snapshot-of-guidelines-disregarded'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const gadgetVsB2b = [
  {
    signal: 'Typical video',
    gadget: 'Phone launch, unboxing, camera test',
    b2b: 'Tutorial, architecture walk-through, tool comparison',
  },
  {
    signal: 'Comments',
    gadget: 'Which phone to buy, price, giveaways',
    b2b: 'Error messages, stack questions, job and team context',
  },
  {
    signal: 'Past sponsors',
    gadget: 'Phone, audio, and consumer app brands',
    b2b: 'Cloud, dev tools, SaaS, and learning platforms',
  },
  {
    signal: 'Fair success measure',
    gadget: 'Views and reach',
    b2b: 'Signups, demos, and replies from the right job roles',
  },
]

const languageByProduct = [
  {
    product: 'Security or infrastructure sold to senior engineers',
    language: 'English first',
    why: 'Your docs, demos, and sales calls usually run in English.',
  },
  {
    product: 'Dev tool or AI tool with a free tier',
    language: 'English plus Hindi',
    why: 'Hindi widens signups. English reaches people closer to a paid decision.',
  },
  {
    product: 'SaaS for small Indian businesses, such as billing or CRM',
    language: 'Hindi, then regional',
    why: 'Owners want to see the product in their working language.',
  },
  {
    product: 'Global SaaS with an English-only interface',
    language: 'English',
    why: 'A Hindi video sends viewers to a product they then read in English.',
  },
  {
    product: 'Product with a sales team in one region',
    language: 'Tamil, Telugu, or Kannada',
    why: 'Regional creators work best when your follow-up speaks the same language.',
  },
]

const cityHubs = [
  {
    city: 'Bengaluru',
    share: '42%',
    sectors: 'Technology, R&D, retail',
    topics: 'AI, SaaS, developer tools, startup culture',
  },
  {
    city: 'Hyderabad',
    share: '16%',
    sectors: 'IT, biotech, pharma',
    topics: 'Cloud, AI, enterprise infrastructure',
  },
  {
    city: 'Delhi NCR',
    share: '13%',
    sectors: 'IT, BFSI, e-commerce, consulting',
    topics: 'Enterprise tech, startup funding, B2B products',
  },
  {
    city: 'Pune',
    share: '10%',
    sectors: 'IT, engineering, manufacturing',
    topics: 'Developer tools, IT services, engineering education',
  },
  {
    city: 'Mumbai',
    share: '10%',
    sectors: 'BFSI',
    topics: 'Fintech, media tech, enterprise software',
  },
  {
    city: 'Chennai',
    share: '8%',
    sectors: 'IT, BFSI, engineering R&D',
    topics: 'IT services, manufacturing tech, English and Tamil content',
  },
]

const rateEstimates = [
  {
    format: 'LinkedIn post, 30K to 100K followers',
    range: 'INR 40,000 to INR 2.4 lakh',
    source: 'upGrowth estimate, all creator categories',
    href: UPGROWTH,
  },
  {
    format: 'LinkedIn post, 50K to 100K followers',
    range: 'INR 20,000 to INR 60,000',
    source: 'Infoishai India page benchmark',
    href: '/influencers/india',
  },
  {
    format: 'YouTube dedicated video, 1K to 10K subscribers',
    range: 'INR 2,000 to INR 15,000',
    source: 'FluxNote estimate',
    href: FLUXNOTE,
  },
  {
    format: 'YouTube dedicated video, 10K to 50K subscribers',
    range: 'INR 10,000 to INR 50,000',
    source: 'FluxNote estimate',
    href: FLUXNOTE,
  },
  {
    format: 'YouTube dedicated video, 10K to 50K subscribers',
    range: 'INR 5,000 to INR 20,000',
    source: 'Infoishai India page benchmark',
    href: '/influencers/india',
  },
]

const checklist = [
  'Name one buyer: job role, company size, and city or region.',
  'Pick the segment from this guide, then the language from your onboarding and sales coverage.',
  'Build a shortlist of 10 to 15 creators from recent work, not from subscriber rankings.',
  'Ask each creator for audience analytics and the last three sponsored pieces.',
  'Get written quotes in INR, and confirm usage rights, revisions, and whether GST applies.',
  'Write disclosure into the brief, including the label, placement, and language.',
  'Give each creator a unique tracking link or code, and tell your sales team what to expect.',
  'Run one small test per segment, then repeat with whoever brought qualified replies.',
]

const sources = [
  { label: 'Business Standard, GitHub Octoverse 2025 figures for India (October 2025)', href: BUSINESS_STANDARD },
  { label: 'Deccan Chronicle, Nasscom-Zinnov mid-market GCC report (April 2025)', href: DECCAN_CHRONICLE },
  { label: 'India Briefing, JLL figures on GCC share by city (updated July 2024)', href: INDIA_BRIEFING },
  { label: 'Wikipedia, 2011 Census of India language tables', href: CENSUS_LANGUAGES },
  { label: 'PTI via The Week, IAMAI and Kantar Internet in India Report 2024 (January 2025)', href: IAMAI_KANTAR },
  { label: 'upGrowth, Influencer marketing pricing in India 2026 (updated September 2026)', href: UPGROWTH },
  { label: 'FluxNote, YouTube tech channel India guide (updated March 2026)', href: FLUXNOTE },
  { label: 'Favikon, Top B2B influencers in India (April 2026)', href: FAVIKON },
  { label: 'AZB & Partners, The regulatory evolution of influencer advertising in India (October 2023)', href: AZB },
  { label: 'Khurana & Khurana, 2025 influencer compliance report summary (July 2025)', href: KHURANA },
]

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  )
}

export default function B2BSaasInfluencersIndiaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
              India
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Market Guide
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Which creators reach Indian developers and software buyers, which language to choose, and how to check the audience before you pay.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 6, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>10 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">

          {/* Intro */}
          <section className="mb-12">
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 mb-6">
              <p className="text-blue-900 leading-relaxed">
                The best B2B tech influencers in India are rarely the biggest gadget channels. Hire by buyer: developer educators for dev tools, DevOps and cloud creators for infrastructure, startup and product creators for SaaS founders, and LinkedIn operators for managers who approve budgets. Check audience job roles before you compare follower counts.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>B2B SaaS influencer in India</strong> is a creator whose audience includes people in India who build with, buy, or approve business software. <strong>SaaS</strong> means software sold as a subscription and used online. For a SaaS brand, India plays two roles: a market with its own buyers, and a base where global companies run engineering teams.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This guide is for SaaS and dev tool marketers targeting India. It covers creator segments, language, city hubs, budget, vetting, and a campaign checklist. It names segments, not individual creators, and it does not repeat our full rate tables. For the wider process, read our{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>complete guide to tech influencers</Link>. For general search steps, see our guide to{' '}
              <Link href="/blog/how-to-find-tech-influencers-india-2026" className={linkClass}>finding tech influencers in India</Link>.
            </p>
          </section>

          {/* Why lists miss */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why do most India tech lists miss B2B?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Most lists rank channels by subscribers, and the largest Indian tech channels mostly cover phones and consumer gadgets. A phone review audience rarely includes the person who picks your database or signs off on your CRM. Our list of{' '}
              <Link href="/blog/top-indian-tech-youtubers-brand-partnerships-2026" className={linkClass}>Indian tech YouTubers for brands</Link> splits gadget channels from coding channels for this reason.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Signal</th>
                    <th className={thClass}>Consumer gadget reviewer</th>
                    <th className={thClass}>B2B-relevant creator</th>
                  </tr>
                </thead>
                <tbody>
                  {gadgetVsB2b.map((row) => (
                    <tr key={row.signal}>
                      <td className={`${tdClass} font-medium`}>{row.signal}</td>
                      <td className={tdClass}>{row.gadget}</td>
                      <td className={tdClass}>{row.b2b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              The B2B audience is large. <ExternalLink href={BUSINESS_STANDARD}>Business Standard, reporting GitHub&apos;s 2025 Octoverse</ExternalLink>, puts India at over 21.9 million developers on GitHub, second to the United States, with 5.2 million added in a year. The count covers everyone on GitHub, so read it as reach, not as a count of working engineers or software buyers.
            </p>
            <p className="text-gray-700 leading-relaxed">
              India also hosts global engineering teams. <ExternalLink href={DECCAN_CHRONICLE}>A Nasscom-Zinnov report covered by Deccan Chronicle</ExternalLink> counted 1,760 global capability centres (GCCs) in April 2025. A <strong>GCC</strong> is an India office owned by a global company, doing engineering, operations, or support for the parent. Reaching engineers in these offices helps when your buyer sits at the parent company.
            </p>
          </section>

          {/* Segments */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which creator segments work for B2B in India?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Four segments cover most B2B briefs. These labels are our editorial categories, not an industry standard, and one creator often fits two.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Developer educators</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              These creators teach coding, system design, and interview preparation on YouTube, often in Hindi or English. The <strong>developer community</strong> they reach skews toward people still learning, so expect students and early-career engineers in the mix. They suit free tiers, APIs, and learning products. They suit a six-figure enterprise contract far less. Ask for the age split before you assume seniority.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">DevOps and cloud creators</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              These creators show Kubernetes, CI/CD, observability, and cloud cost work on screen. Audiences are smaller, and viewers often already hold the job. They fit infrastructure, security, and platform tools. To find India DevOps YouTubers for brands, search YouTube for a tool name plus &quot;tutorial&quot; or &quot;Hindi&quot;, then read the comments for production questions. Some hold full-time engineering jobs, so ask about employer rules on paid work early.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Startup and product creators</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Founders, product managers, and startup commentators post on YouTube, LinkedIn, and X (Twitter). Their followers include people choosing tools for small teams. They fit SaaS with short sales cycles, such as analytics, support, and collaboration tools. Check for real product detail in their posts, since funding news draws a broad audience with little buying intent.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">LinkedIn operators</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              A LinkedIn operator has run a function such as sales, revenue operations, marketing, or HR, and posts about the work. Indian SaaS influencers on LinkedIn reach managers and executives who rarely watch a tutorial. They fit sales tools, HR software, and martech. <ExternalLink href={FAVIKON}>Favikon&apos;s ranked list of B2B influencers in India</ExternalLink> is one starting point. It scores authority, so check each name against your own buyer.
            </p>
            <p className="text-gray-700 leading-relaxed">
              A simple rule: if your user and your buyer are different people, you need two segments. A dev tool often pairs a developer educator for adoption with a LinkedIn operator for the budget holder.
            </p>
          </section>

          {/* Language */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Should B2B brands use Hindi creators?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Yes, when your onboarding, support, or sales follow-up works for a Hindi audience. No, when a viewer lands on an English-only product and an English-only sales call. Choose the language your buyer will use after the click, not the language with the biggest view count.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Reach data favours Indian languages. The 2011 Census, <ExternalLink href={CENSUS_LANGUAGES}>as tabulated on Wikipedia</ExternalLink>, counted about 57.1% of the population speaking Hindi, against about 10.6% speaking English, with first, second, and third languages combined. The <ExternalLink href={IAMAI_KANTAR}>IAMAI and Kantar report for 2024</ExternalLink> found 98% of 886 million internet users accessed content in Indic languages, and about 57% of urban users preferred regional languages.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Those figures describe the general public, and the census is over a decade old. Neither source measures software buyers. The table below is our editorial guidance, so test it with your own campaign data.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Product type</th>
                    <th className={thClass}>Start with</th>
                    <th className={thClass}>Why</th>
                  </tr>
                </thead>
                <tbody>
                  {languageByProduct.map((row) => (
                    <tr key={row.product}>
                      <td className={`${tdClass} font-medium`}>{row.product}</td>
                      <td className={tdClass}>{row.language}</td>
                      <td className={tdClass}>{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Hindi vs English tech creators for B2B is rarely an either-or choice. Many Indian creators mix the two, keeping technical terms in English. Watch a full video and read the comments before you label a channel.
            </p>
          </section>

          {/* Cities */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Where are the B2B hubs: Bengaluru, Hyderabad, or Pune?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Bengaluru (Bangalore) leads, Hyderabad comes second on GCC share, and Pune suits engineering and IT services audiences. Use city data to plan local events and sales coverage, not to judge a creator. A Pune creator&apos;s audience often lives elsewhere, so ask for the viewer split.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>City</th>
                    <th className={thClass}>Share of GCC stock</th>
                    <th className={thClass}>Main GCC sectors</th>
                    <th className={thClass}>Local creator topics</th>
                  </tr>
                </thead>
                <tbody>
                  {cityHubs.map((row) => (
                    <tr key={row.city}>
                      <td className={`${tdClass} font-medium`}>{row.city}</td>
                      <td className={tdClass}>{row.share}</td>
                      <td className={tdClass}>{row.sectors}</td>
                      <td className={tdClass}>{row.topics}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Shares and sectors come from <ExternalLink href={INDIA_BRIEFING}>JLL figures reported by India Briefing</ExternalLink>, last updated in July 2024, so treat them as a rough guide. They count GCCs only, not startups or Indian SaaS companies. BFSI means banking, financial services, and insurance. Creator topics come from our{' '}
              <Link href="/influencers/india" className={linkClass}>tech influencers in India</Link> page and reflect editorial judgment, not a measured census of creators.
            </p>
          </section>

          {/* Rates */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What do Indian LinkedIn tech creators charge?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Published estimates disagree widely, so use them to set a budget range, not a price. For roughly 30K to 100K followers, you see figures from about INR 20,000 to INR 2.4 lakh per post (1 lakh = 100,000). Get written quotes from your shortlist before you commit.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Format and audience</th>
                    <th className={thClass}>Published range</th>
                    <th className={thClass}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rateEstimates.map((row) => (
                    <tr key={`${row.format}-${row.source}`}>
                      <td className={`${tdClass} font-medium`}>{row.format}</td>
                      <td className={tdClass}>{row.range}</td>
                      <td className={tdClass}>
                        {row.href.startsWith('/') ? (
                          <Link href={row.href} className={linkClass}>{row.source}</Link>
                        ) : (
                          <ExternalLink href={row.href}>{row.source}</ExternalLink>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Each figure is an estimate, not measured deal data. upGrowth labels its rates as its own estimates for negotiation. FluxNote gives no method and sells a video tool. Infoishai&apos;s ranges are editorial benchmarks. None of them isolates B2B specialists, and a narrow, senior audience often commands a premium over its follower count.
            </p>
            <p className="text-gray-700 leading-relaxed">
              For city-level tables, see{' '}
              <Link href="/blog/indian-tech-influencer-rates-by-city-2026" className={linkClass}>Indian tech influencer rates by city</Link>. Keep some budget for the longer work B2B needs, such as a tool walk-through or a follow-up post once the first results arrive.
            </p>
          </section>

          {/* Vetting */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you vet audience quality in India?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Ask for platform analytics, then read the comments yourself. We found no reliable India-wide figure for fake followers, so this guide does not quote one. Run these checks on every creator, and use our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>10-point vetting scorecard</Link> for the full process.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Country split.</strong> Many Indian tech channels have viewers abroad. Confirm the India share if India is your target, and the overseas share if it is not.</li>
              <li><strong>Age and seniority.</strong> A young audience suits a free tier. It suits an enterprise sale poorly. Ask for the YouTube Studio age view.</li>
              <li><strong>Job roles.</strong> On LinkedIn, ask for post analytics showing viewer job titles, locations, and industries.</li>
              <li><strong>Comment content.</strong> Look for stack details and real questions. Repeated praise with no detail is a warning sign.</li>
              <li><strong>Views against subscribers.</strong> Compare the last 10 videos. A large channel with thin recent views has lost its reach, whatever the headline number says.</li>
              <li><strong>Sponsor history.</strong> Betting, crypto, or a long run of unrelated app promotions tells you who the creator sells to now.</li>
            </ul>
          </section>

          {/* Rules */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What disclosure rules apply in India?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Paid posts need a clear, upfront label. Your brand shares the job of making it happen. Per <ExternalLink href={AZB}>AZB &amp; Partners</ExternalLink>, ASCI guidelines ask for a label such as &quot;Ad&quot; or &quot;Sponsored&quot; whenever a material connection exists, including free products. The label must appear in English or the language of the ad, so a Hindi video needs a label viewers will understand.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              AZB also reports the Central Consumer Protection Authority holds power to fine manufacturers, advertisers, and endorsers up to INR 10 lakh for misleading ads, and up to INR 50 lakh for repeat cases. Do not assume a creator knows the rules: <ExternalLink href={KHURANA}>Khurana &amp; Khurana</ExternalLink> reports ASCI found 69% of the top 100 digital influencers it reviewed missing the guidelines. The review covers all categories, not tech alone.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This section is general information, not legal advice. Check the current ASCI text with your counsel before you launch.
            </p>
          </section>

          {/* Checklist */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Campaign checklist for B2B creators in India</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>

          {/* Where Infoishai fits */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Where Infoishai fits</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai is a tech-only creator marketplace covering YouTube, LinkedIn, X (Twitter), TikTok, and Instagram. Start with our{' '}
              <Link href="/influencers/india" className={linkClass}>Indian tech creators</Link> page, read each profile and recent work, and message creators directly.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Infoishai is free for brands and creators, with no platform fees. You pay creators directly, and Infoishai keeps the record. Want a team to run the work? Our{' '}
              <Link href="/pricing" className={linkClass}>managed service</Link> works on a custom quote.
            </p>
          </section>

          {/* Sources */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Sources</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              {sources.map((source) => (
                <li key={source.href}>
                  <ExternalLink href={source.href}>{source.label}</ExternalLink>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-500">
              Last updated November 6, 2026. Figures cover the periods their publishers reported. Segments, language guidance, vetting checks, and the checklist are Infoishai&apos;s editorial guidance. Infoishai does not publish its own performance data here.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Browse Indian tech creators</h2>
          <p className="text-blue-800 mb-6">
            Know the segment you need? See verified tech creators in India and message them directly. Infoishai is free for brands and creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/influencers/india"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Browse Indian Creators
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup/brand"
              className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-3 rounded-lg font-medium border border-blue-300 transition-colors"
            >
              Create a Free Brand Account
            </Link>
          </div>
        </div>

        <PillarGuideLink />
      </article>
    </div>
  )
}
