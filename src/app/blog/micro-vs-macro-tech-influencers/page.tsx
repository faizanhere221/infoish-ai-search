// src/app/blog/micro-vs-macro-tech-influencers/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/micro-vs-macro-tech-influencers'
const HEADLINE = 'Micro vs Macro Tech Influencers: Which Tier Fits Your B2B Goal?'
const META_TITLE = 'Micro vs Macro Tech Influencers: Which Tier to Pick?'
const DESCRIPTION =
  'Compare nano, micro, mid-tier and macro tech influencers for B2B goals. See cost, reach, trust and risk trade-offs with a simple decision table.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'micro vs macro tech influencers b2b',
    'nano micro macro influencers b2b',
    'micro influencers tech',
    'which influencer tier for saas',
    'micro tech influencers cost per lead',
    'when to choose macro creators',
    'influencer tiers explained',
    'cost per engagement by influencer tier',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-19T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Influencer Tiers', 'Micro Influencers', 'B2B Tech', 'Guide'],
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
  datePublished: '2026-11-19',
  dateModified: '2026-11-19',
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

const HYPEAUDITOR_REPORT = 'https://a.storyblok.com/f/103674/x/8d895a970b/state2025-web.pdf'
const INBEAT_REPORT = 'https://inbeat.agency/blog/influencer-marketing-benchmark-report'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const tierRows = [
  { tier: 'Nano', range: '1K to 10K', share: '75.9%' },
  { tier: 'Micro', range: '10K to 50K', share: '13.6%' },
  { tier: 'Mid-tier', range: '50K to 500K', share: '3.4%' },
  { tier: 'Macro', range: '500K to 1M', share: '0.2%' },
  { tier: 'Mega', range: 'Over 1M', share: '0.1%' },
]

const costRows = [
  { tier: 'Nano (under 10K)', rate: '$134', views: '1,115', er: '4.6%', cpe: '$3.11' },
  { tier: 'Micro (10K to 50K)', rate: '$150', views: '989', er: '4.3%', cpe: '$3.05' },
  { tier: 'Mid (50K to 250K)', rate: '$417', views: '2,606', er: '2.9%', cpe: '$7.07' },
  { tier: 'Macro (250K to 1M)', rate: '$517', views: '6,974', er: '2.6%', cpe: '$4.39' },
]

const decisionRows = [
  {
    goal: 'Product feedback and early proof',
    tier: 'Nano and micro',
    why: 'Small, specialist audiences reply, test and tell you what breaks',
  },
  {
    goal: 'Leads in one narrow niche',
    tier: 'Micro',
    why: 'Audience match matters more than size; several creators spread the risk',
  },
  {
    goal: 'Credibility with senior buyers',
    tier: 'Micro or mid-tier with niche authority',
    why: 'Practitioners and operators known in the niche carry weight with peers',
  },
  {
    goal: 'Launch-week awareness',
    tier: 'One macro or mid-tier plus several micro',
    why: 'The large creator brings reach; smaller creators add depth and repeat exposure',
  },
  {
    goal: 'Category awareness in a broad market',
    tier: 'Macro',
    why: 'Reach and production quality at once, if the audience fits your buyer',
  },
  {
    goal: 'Content to reuse in ads and sales',
    tier: 'Mid-tier',
    why: 'Strong production at a lower fee than macro; agree usage rights up front',
  },
]

const sources = [
  {
    label: 'HypeAuditor, State of Influencer Marketing 2025 report (2024 data, Instagram tiers)',
    href: HYPEAUDITOR_REPORT,
  },
  {
    label:
      'inBeat Agency, 2026 Influencer Marketing Benchmark Report, citing OpenSponsorship deal data (1,527 paid deliverables, January 2025 to June 2026)',
    href: INBEAT_REPORT,
  },
]

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  )
}

function AnswerBox({ children }: { children: ReactNode }) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 mb-6">
      <p className="text-blue-900 leading-relaxed">{children}</p>
    </div>
  )
}

function Checklist({ items, negative = false }: { items: ReactNode[]; negative?: boolean }) {
  const Icon = negative ? XCircle : CheckCircle
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${negative ? 'text-red-500' : 'text-blue-600'}`} />
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MicroVsMacroTechInfluencersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Guide</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Creator Selection
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A comparison guide for brand managers: what each creator tier costs and delivers, which tier fits which
            B2B goal, and how to mix tiers in one campaign.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 19, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>9 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {/* Intro */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Are micro-influencers better for B2B?</h2>
            <AnswerBox>
              Often, but not always. Micro-influencers win when you need a narrow, specialist audience, honest
              feedback and leads from one niche. Macro creators win when you need broad awareness fast and their
              audience matches your buyer. Most B2B tech brands get the best results by picking tier per goal, then
              mixing tiers.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Micro vs macro tech influencers for B2B</strong> is the choice between many small, specialist
              creators and a few large ones when you promote a business technology product. Follower count is the
              starting point, but for B2B the deciding factor is whether the audience includes the people who buy,
              use or recommend your product.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: B2B tech brands (SaaS, AI, dev tools, cloud, security) working with creators on YouTube,
              LinkedIn, X, TikTok and Instagram. Facts were checked on November 19, 2026. For the wider picture,
              read the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>
                complete guide to tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Definitions */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What follower count is micro?</h2>
            <AnswerBox>
              A common definition puts micro-influencers at 10K to 50K followers, with nano below them at 1K to
              10K, mid-tier at 50K to 500K, macro at 500K to 1M and mega above 1M. Other sources draw the lines
              differently, so always check which bands a report uses.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              HypeAuditor&apos;s State of Influencer Marketing report sorts Instagram creators into five groups by
              follower count. Using 2024 data, it also shows how few creators sit in the upper tiers (
              <ExternalLink href={HYPEAUDITOR_REPORT}>HypeAuditor, 2024 data</ExternalLink>):
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Tier</th>
                    <th className={thClass}>Followers</th>
                    <th className={thClass}>Share of Instagram influencers</th>
                  </tr>
                </thead>
                <tbody>
                  {tierRows.map((row) => (
                    <tr key={row.tier}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.tier}</td>
                      <td className={tdClass}>{row.range}</td>
                      <td className={tdClass}>{row.share}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <p className="text-gray-700">
                <strong>Nano-influencer:</strong> a creator with roughly 1K to 10K followers. In tech, often an
                engineer, analyst or founder who posts about their own work. Nano is the tier below micro: a nano
                creator who keeps growing becomes a micro creator once they pass about 10K followers.
              </p>
              <p className="text-gray-700">
                <strong>Micro-influencer:</strong> roughly 10K to 50K followers. Large enough to run regular
                sponsorships, small enough to know much of the audience by name.
              </p>
              <p className="text-gray-700">
                <strong>Mid-tier influencer:</strong> roughly 50K to 500K followers. Usually a full-time or
                part-time creator with a production routine and a media kit.
              </p>
              <p className="text-gray-700">
                <strong>Macro-influencer:</strong> roughly 500K to 1M followers. Broad reach, higher fees and a
                wider, less specialist audience.
              </p>
              <p className="text-gray-700">
                <strong>Niche authority:</strong> how much a creator&apos;s audience trusts them on one specific
                topic, such as Kubernetes or B2B sales tools. In B2B, niche authority often matters more than tier.
              </p>
              <p className="text-gray-700">
                <strong>Cost per engagement:</strong> the fee divided by likes, comments and shares. Useful for
                comparing tiers, but engagement is not a sale. For B2B, follow it with tracked visits, sign-ups and
                pipeline.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              On LinkedIn, a B2B creator with a few thousand followers often reaches a valuable audience, because
              the followers are peers in one industry. Our post on the{' '}
              <Link href="/blog/types-of-b2b-tech-influencers" className={linkClass}>
                types of B2B tech influencers
              </Link>{' '}
              explains why creator type matters as much as size.
            </p>
          </section>

          {/* Pros and cons */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Cost, reach and engagement by tier</h2>
            <AnswerBox>
              Smaller creators earn higher engagement per view and a lower cost per engagement. Larger creators
              bring far more views per post. In one 2025 to 2026 deal dataset, macro creators had a lower cost per
              view than micro creators, so &quot;micro is always cheaper&quot; is a myth.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              inBeat Agency&apos;s 2026 benchmark report analysed 1,527 completed paid deliverables from the
              OpenSponsorship marketplace, January 2025 to June 2026, with cash fees only (
              <ExternalLink href={INBEAT_REPORT}>inBeat, 2026</ExternalLink>). Its tier bands differ from the table
              above. Median figures per deliverable:
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Tier</th>
                    <th className={thClass}>Median rate</th>
                    <th className={thClass}>Median views</th>
                    <th className={thClass}>Engagement per view</th>
                    <th className={thClass}>Cost per engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {costRows.map((row) => (
                    <tr key={row.tier}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.tier}</td>
                      <td className={tdClass}>{row.rate}</td>
                      <td className={tdClass}>{row.views}</td>
                      <td className={tdClass}>{row.er}</td>
                      <td className={tdClass}>{row.cpe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Read the ratios, not the prices. The report notes its data skews toward sports, wellness, food and
              lifestyle, so B2B tech fees differ. For tech pricing, see our{' '}
              <Link href="/blog/tech-influencer-campaign-budget" className={linkClass}>
                tech influencer campaign budget guide
              </Link>
              .
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Nano and micro: strengths and limits</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Specialist audiences, close replies, real feedback</li>
                  <li>Lower fees, easier to test several creators</li>
                  <li>Limited reach per post</li>
                  <li>More creators to brief, review and pay</li>
                  <li>Production quality varies</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mid-tier and macro: strengths and limits</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Large reach in one post, polished production</li>
                  <li>One relationship to manage</li>
                  <li>Wider, less specialist audiences</li>
                  <li>Higher fees put more budget on one result</li>
                  <li>Longer lead times and stricter terms</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Decision table */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which tier fits your B2B goal?</h2>
            <AnswerBox>
              Pick the tier from the goal. Nano and micro for feedback, niche leads and peer credibility. Mid-tier
              for reusable content. Macro for broad awareness, and only when the audience matches your buyer.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Your goal</th>
                    <th className={thClass}>Best tier</th>
                    <th className={thClass}>Why</th>
                  </tr>
                </thead>
                <tbody>
                  {decisionRows.map((row) => (
                    <tr key={row.goal}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.goal}</td>
                      <td className={tdClass}>{row.tier}</td>
                      <td className={tdClass}>{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Whatever the tier, check the audience before you check the fee. Our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>
                tech influencer vetting scorecard
              </Link>{' '}
              helps you compare creators on audience fit, credibility and past sponsorships.
            </p>
          </section>

          {/* How many micro */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How many micro creators equal one macro?</h2>
            <AnswerBox>
              On raw views, about seven micro deliverables matched one macro deliverable in the inBeat dataset. On
              audience fit and trust, the answer depends on your niche: five micro creators who reach your exact
              buyer often beat one macro creator who reaches mostly the wrong people.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The arithmetic: median views were 6,974 for a macro deliverable and 989 for a micro deliverable in
              the inBeat data, a ratio of about 7 to 1. Seven micro deliverables at the $150 median cost about
              $1,050, against $517 for one macro deliverable. On views alone, macro wins in this dataset.
            </p>
            <p className="text-gray-700 leading-relaxed">
              B2B buying adds two questions views ignore. How many of those viewers buy, use or recommend your
              type of product? And how much do they trust the creator on this topic? A micro creator who teaches
              data engineering reaches a higher share of data engineers than a general tech channel ten times
              larger. Run the same calculation on qualified viewers, not total views, using the audience data each
              creator shares.
            </p>
          </section>

          {/* Portfolio */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The portfolio approach: mix tiers in one campaign</h2>
            <AnswerBox>
              Combine one larger creator for reach with several smaller creators for depth and repeat exposure.
              The mix spreads risk, tests more audiences and gives buyers the same message from several voices they
              trust.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <em>Illustrative example (fictional):</em> a SaaS company launches an API monitoring feature. It
              books one macro tech YouTuber for a launch-week integration, and five micro creators: two backend
              engineers on YouTube, two on LinkedIn and one on X. The macro video brings a spike of awareness. The
              micro creators publish deeper tutorials over the next three weeks, answer questions in their
              communities, and each gets a unique tracking link.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Split budget by goal, not by tier</h3>
                <p className="text-gray-700">
                  Decide how much goes to awareness and how much to consideration, then pick tiers for each.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Stagger the dates</h3>
                <p className="text-gray-700">
                  Put the large creator first for reach, then let smaller creators follow with depth over two to four
                  weeks.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Track each creator separately</h3>
                <p className="text-gray-700">
                  Unique links and codes per creator show which tier brought qualified visits, not only clicks. Our{' '}
                  <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>
                    UTM tracking guide
                  </Link>{' '}
                  shows the setup.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Rebook the winners</h3>
                <p className="text-gray-700">
                  Move next quarter&apos;s budget toward the creators with the best qualified results, at any tier.
                </p>
              </div>
            </div>
          </section>

          {/* Risks */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Risk trade-offs by tier</h2>
            <Checklist
              negative
              items={[
                <>
                  <strong>Macro: concentration risk.</strong> One video carries most of the budget. A weak hook, a
                  bad posting date or an audience mismatch sinks the campaign.
                </>,
                <>
                  <strong>Macro: audience drift.</strong> Large tech channels often attract consumers and students,
                  not B2B buyers. Ask for audience data by country, age and job type where the platform shows it.
                </>,
                <>
                  <strong>Micro and nano: inconsistency.</strong> Quality, deadlines and disclosure habits vary.
                  Clear briefs and a review step matter more here.
                </>,
                <>
                  <strong>Micro and nano: management load.</strong> Ten creators mean ten briefs, contracts and
                  payment records. Plan time for it.
                </>,
                <>
                  <strong>All tiers: fake reach.</strong> Bought followers exist at every size. Check engagement
                  quality and comment content, not only the totals.
                </>,
              ]}
            />
          </section>

          {/* Pitfalls */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Common pitfalls when choosing a tier</h2>
            <Checklist
              negative
              items={[
                <>Choosing tier from a consumer benchmark and applying it to a B2B product unchanged.</>,
                <>Comparing engagement rates calculated on different bases, such as followers vs views.</>,
                <>Judging a micro campaign on first-week reach, or a macro one on last-click sales.</>,
                <>Spreading a small budget across so many nano creators nobody posts more than once.</>,
                <>Ignoring regional fit. Micro creators in one market often reach buyers a global channel misses.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Regional examples help here. Our guide to{' '}
              <Link href="/blog/micro-influencers-pakistan-guide" className={linkClass}>
                micro-influencers in Pakistan
              </Link>{' '}
              shows how small creators work in one market, and our post on{' '}
              <Link href="/blog/how-to-find-tech-influencers-b2b-2026" className={linkClass}>
                how to find B2B tech influencers
              </Link>{' '}
              covers search and outreach.
            </p>
          </section>

          {/* Getting started */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Filter creators by audience size on Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              On Infoishai you{' '}
              <Link href="/creators" className={linkClass}>
                browse verified tech creators
              </Link>{' '}
              on YouTube, LinkedIn, X, TikTok and Instagram, filter by follower range, platform, niche and country,
              and sort by most followers. Message creators directly, send a deal proposal, or post a campaign
              creators apply to. Infoishai is free for brands and creators. There are no platform fees. Payments are
              made directly between brand and creator, and Infoishai keeps the record.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Prefer to hand the work off? Our{' '}
              <Link href="/pricing" className={linkClass}>
                managed service
              </Link>{' '}
              plans and runs creator campaigns for you, priced by custom quote.
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
              Last updated November 19, 2026. HypeAuditor tier shares describe Instagram creators in 2024. The
              inBeat figures are medians from one marketplace, skewed toward consumer categories, and use their own
              tier bands; engagement there is per view. Neither source covers B2B tech creators alone. The API
              monitoring example is fictional.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Filter creators by audience size</h2>
          <p className="text-blue-800 mb-6">
            Find nano, micro and larger tech creators in one place, and message them directly. No platform fees for
            brands or creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/creators"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Browse Verified Tech Creators
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup/brand"
              className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-3 rounded-lg font-medium border border-blue-300 transition-colors"
            >
              Sign Up Free as a Brand
            </Link>
          </div>
        </div>

        <PillarGuideLink />
      </article>
    </div>
  )
}
