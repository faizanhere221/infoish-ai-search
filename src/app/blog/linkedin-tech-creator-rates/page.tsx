// src/app/blog/linkedin-tech-creator-rates/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/linkedin-tech-creator-rates'
const HEADLINE = 'LinkedIn Tech Creator Rates 2026: What B2B Brands Pay'
const DESCRIPTION =
  'See what B2B brands pay LinkedIn tech creators in 2026: rates by tier, whether tech carries a premium, and how to structure posts, newsletters and retainers.'

export const metadata: Metadata = {
  title: `${HEADLINE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'linkedin influencer rates tech',
    'linkedin creator pricing b2b',
    'sponsored linkedin post cost',
    'linkedin influencer marketing cost',
    'how much to pay a tech linkedin creator',
    'linkedin newsletter sponsorship cost',
    'linkedin influencer retainer pricing',
    'B2B creator rates',
  ],
  openGraph: {
    title: HEADLINE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-03T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['LinkedIn', 'Tech Influencers', 'Rates', 'B2B'],
    images: [{ url: 'https://infoishai.com/og-image.jpg', width: 1200, height: 630, alt: 'Infoishai Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: HEADLINE,
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
  datePublished: '2026-11-03',
  dateModified: '2026-11-03',
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

const FAVIKON = 'https://www.favikon.com/blog/the-complete-b2b-influencer-pricing-guide-2026-benchmarks-geography-industry-format'
const NAANO = 'https://naano.com/blog/linkedin-sponsored-post-price-index-2026'
const CONTENTGRIP = 'https://www.contentgrip.com/linkedin-influencer-pricing/'
const CLEVERLY = 'https://www.cleverly.co/blog/linkedin-impressions-vs-members-reached'
const PPC_LAND = 'https://ppc.land/linkedin-now-shows-creators-exactly-who-is-seeing-their-posts/'
const TLA = 'https://business.linkedin.com/advertise/ads/sponsored-content/thought-leader-ads'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

// Naano Index, transacted bookings, 14 June to 11 August 2026. Euros, excl. VAT.
const tiers = [
  { tier: 'Emerging', band: 'Under 5,000', n: 66, range: '€56 to €120', median: '€84' },
  { tier: 'Emerging', band: '5,000 to 10,000', n: 64, range: '€88 to €423', median: '€180' },
  { tier: 'Mid-tier', band: '10,000 to 25,000', n: 118, range: '€122 to €360', median: '€300' },
  { tier: 'Mid-tier', band: '25,000 to 50,000', n: 36, range: '€345 to €606', median: '€588' },
  { tier: 'Top voices', band: '50,000 and up', n: 16, range: '€499 to €900', median: '€720' },
]

// Naano Index, listed rates, snapshot of 11 August 2026. Niches overlap.
const niches = [
  { niche: 'Marketing', group: 'General', n: 270, range: '€70 to €500', median: '€150' },
  { niche: 'Growth / GTM', group: 'General', n: 260, range: '€70 to €400', median: '€130' },
  { niche: 'AI', group: 'Tech', n: 430, range: '€70 to €358', median: '€100' },
  { niche: 'SaaS', group: 'Tech', n: 237, range: '€65 to €370', median: '€100' },
  { niche: 'Developer tools', group: 'Tech', n: 21, range: '€40 to €250', median: '€100' },
  { niche: 'Cybersecurity', group: 'Tech', n: 13, range: '€20 to €100', median: '€50' },
  { niche: 'Fintech', group: 'Tech', n: 46, range: '€81 to €450', median: '€190' },
]

// Illustrative pilot. Every fee below is an assumption, not a quote.
const POST_FEE = 600
const pilotLines = [
  { item: '10 sponsored posts: 5 mid-tier creators, 2 posts each', basis: `10 x $${POST_FEE} assumed fee`, cost: 10 * POST_FEE },
  { item: '1 newsletter feature from one of the 5 creators', basis: `2 x the post fee`, cost: 2 * POST_FEE },
  { item: 'Paid usage rights on your 2 best posts', basis: '30% of the post fee, per post', cost: 2 * POST_FEE * 0.3 },
  { item: 'Thought Leader Ads media spend', basis: 'Your choice, paid to LinkedIn', cost: 1500 },
]
const PILOT_TOTAL = 10000
const pilotSubtotal = pilotLines.reduce((sum, line) => sum + line.cost, 0)
const pilotReserve = PILOT_TOTAL - pilotSubtotal
const usd = (value: number) => `$${value.toLocaleString('en-US')}`

const sources = [
  { label: 'Favikon, The Complete B2B Influencer Pricing Guide 2026 (July 2026)', href: FAVIKON },
  { label: 'Naano, LinkedIn Sponsored Post Price Index 2026 (updated October 2026)', href: NAANO },
  { label: 'ContentGrip, LinkedIn influencer pricing (June 2026)', href: CONTENTGRIP },
  { label: 'LinkedIn, Thought Leader Ads', href: TLA },
  { label: 'Cleverly, LinkedIn impressions vs members reached (July 2026)', href: CLEVERLY },
  { label: 'PPC Land, in-network and out-of-network reach on LinkedIn (June 2026)', href: PPC_LAND },
]

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  )
}

function Checklist({ items }: { items: ReactNode[] }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function LinkedInTechCreatorRatesPage() {
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
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Pricing
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Strategy
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Transacted prices by creator tier, what the data says about a tech premium, and a worked $10k pilot budget.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 3, 2026</span>
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
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 mb-6">
              <p className="text-blue-900 leading-relaxed">
                A sponsored LinkedIn post usually costs between $200 and $2,000. Favikon&apos;s dataset of 136 B2B influencers puts roughly 81% of creators in this range, and its 135 client deals show a median of $798 per post. Expect more above 100,000 followers, plus fees for usage rights and exclusivity.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              LinkedIn influencer rates for tech are the fees a brand pays a creator to publish sponsored content for a technical or software-buying audience on LinkedIn. Published numbers vary widely, because some report what creators list and others report what brands pay.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This guide covers LinkedIn only and shows each source&apos;s method, so you know how far to trust a number. For other platforms, see our{' '}
              <Link href="/blog/tech-influencer-rates-2026" className={linkClass}>tech influencer rates</Link> guide. Creators setting prices should read{' '}
              <Link href="/blog/tech-creator-sponsorship-rates-2026" className={linkClass}>tech creator sponsorship rates</Link>.
            </p>
          </section>

          {/* What's included */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What does a LinkedIn sponsorship include?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              A standard deal covers one post on the creator&apos;s own profile, written in their voice, with a clear label and one review round. Anything else tends to cost extra: a carousel or video format, a newsletter feature, paid usage of the post, or a promise not to work with your competitors.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Before you compare quotes, know what you are buying. <strong>Impressions</strong> count every time a post loads in a feed, even if one person sees it five times. <strong>Members reached</strong> counts unique people, according to{' '}
              <ExternalLink href={CLEVERLY}>this breakdown from Cleverly</ExternalLink>, which also notes LinkedIn has never published the exact mechanics of either metric.
            </p>
            <p className="text-gray-700 leading-relaxed">
              So price against members reached, because repeat views inflate impressions. Ask for the{' '}
              <ExternalLink href={PPC_LAND}>in-network and out-of-network split</ExternalLink> LinkedIn began rolling out in June 2026 as well. It shows whether a post reached people beyond the creator&apos;s existing followers.
            </p>
          </section>

          {/* Tiers */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How much do LinkedIn creators charge by tier?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              The cleanest tier data we found comes from the{' '}
              <ExternalLink href={NAANO}>Naano Index</ExternalLink>, which reports 300 bookings on the Naano marketplace between June and August 2026. Prices are what brands paid, in euros, without VAT. The range below runs from the 25th to the 75th percentile, so a quarter of deals fall on each side of it.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Tier</th>
                    <th className={thClass}>Followers</th>
                    <th className={thClass}>Median per post</th>
                    <th className={thClass}>Middle 50%</th>
                    <th className={thClass}>Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((row) => (
                    <tr key={row.band}>
                      <td className={tdClass}>{row.tier}</td>
                      <td className={tdClass}>{row.band}</td>
                      <td className={tdClass}>{row.median}</td>
                      <td className={tdClass}>{row.range}</td>
                      <td className={tdClass}>{row.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Tier names are ours. Source: Naano Index, transacted bookings, 14 June to 11 August 2026. One marketplace, across B2B niches, not tech only.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Emerging creators (under 10,000 followers)</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Most Naano bookings in this tier stay under €425. Do not assume small means cheap everywhere, though. In{' '}
              <ExternalLink href={FAVIKON}>Favikon&apos;s client data</ExternalLink>, nano creators under 10,000 followers out-price micro creators, and one 851-follower profile charged $2,400 per post.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Mid-tier creators (10,000 to 50,000 followers)</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Mid-tier creators drew the most bookings in the Naano data, with medians of €300 and €588. Favikon&apos;s overall transacted median of $798 sits above this, which is a reminder the two datasets cover different buyers and creators.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Top voices (50,000 followers and up)</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Here the data thins out. Naano has 16 bookings at 50,000 and up, with a €720 median. Favikon reports the median roughly triples to $2,000 above 100,000 followers. Treat both as a floor for talks, since well-known names set their own prices.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Follower count alone is a weak guide. In Naano&apos;s listed rates, followers explain about 29% of the difference in price. Favikon also separates what creators declare from what brands pay: a declared rate-card median near $300, against the $798 transacted median. Market matters too. Favikon&apos;s survey of 125 creators shows median post prices of $500 in the US, $550 in the UK, $300 in France, and $155 in India.
            </p>
          </section>

          {/* Tech premium */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Are tech LinkedIn creators more expensive?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Not on the evidence we verified. Many guides claim a tech premium, yet the largest niche table we found shows tech listings at or below marketing listings. Scarcity is real in narrow fields, so you still pay more for the right specialist, but no solid public dataset proves a blanket premium.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Niche</th>
                    <th className={thClass}>Group</th>
                    <th className={thClass}>Median listed rate</th>
                    <th className={thClass}>Middle 50%</th>
                    <th className={thClass}>Creators</th>
                  </tr>
                </thead>
                <tbody>
                  {niches.map((row) => (
                    <tr key={row.niche}>
                      <td className={tdClass}>{row.niche}</td>
                      <td className={tdClass}>{row.group}</td>
                      <td className={tdClass}>{row.median}</td>
                      <td className={tdClass}>{row.range}</td>
                      <td className={tdClass}>{row.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Source: Naano Index, listed rates of 769 creators, 11 August 2026. Creators declare several niches, so groups overlap. The Group column is ours.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Read this table with care. These are listed prices on one marketplace, not deals, and Naano says the table shows an association, not a cause. The cybersecurity and developer tools rows rest on small samples. For a marketing comparison at higher prices, Favikon quotes the person who runs influencer sponsorships at Ahrefs, who says most marketing-niche LinkedIn creators the company sponsors charge $500 to $2,000 per post.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Pay for fit, not the label. A site reliability engineer with followers who buy observability tools deserves a higher fee than a general AI commentator, and our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>10-point vetting scorecard</Link> gives you a way to judge this before you negotiate.
            </p>
          </section>

          {/* Reach */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you judge a quote against LinkedIn reach?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Divide the fee by the members reached on the creator&apos;s recent posts, then multiply by 1,000. This gives you a cost per thousand people, and it lets you compare creators of different sizes on one line.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Take a fictional example. Creator A quotes $600 and reaches about 12,000 members per post, or $50 per thousand. Creator B quotes $1,200 and reaches about 40,000, or $30 per thousand. Creator B looks cheaper, yet the math ignores who those members are. If 40% of Creator A&apos;s followers match your buyer and 10% of Creator B&apos;s do, Creator A costs $125 per thousand relevant members and Creator B costs $300.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Use the median of the last ten posts, not the creator&apos;s best one. Naano says it has no defensible per-post reach figure, so no public benchmark exists to check against. Your own comparison across quotes is the benchmark.
            </p>
          </section>

          {/* Structures */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Should you pay per post or on retainer?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Pay per post for a first test, then move to a package or retainer once a creator proves fit. Repeat exposure is the main reason to commit, and volume brings the price down. We found no reliable public benchmark for LinkedIn retainer fees by tier, so price them from the post rate.
            </p>
            <Checklist
              items={[
                <><strong>Single post:</strong> the lowest risk, and the right place to start with a new creator.</>,
                <><strong>Package:</strong> Favikon reports 15% to 25% off for three posts.</>,
                <><strong>Retainer:</strong> a set number of posts per month. Favikon reports 30% to 50% off for six-month ambassador deals.</>,
                <><strong>Newsletter feature:</strong> a LinkedIn newsletter is a separate list of subscribers who get each issue. Favikon cites 1.5 to 3 times the post rate, so treat this as a rule of thumb and ask for subscriber and open data.</>,
              ]}
            />
          </section>

          {/* Hidden costs */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What hidden costs should you budget for?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Review cycles, usage rights, and exclusivity move the final price most. Favikon puts usage rights and exclusivity at 20% to 50% each. <ExternalLink href={CONTENTGRIP}>ContentGrip</ExternalLink> puts standard exclusivity at 25% to 50% and notes creators build review time into their rates. Use this checklist before you sign:
            </p>
            <Checklist
              items={[
                <><strong>Review rounds:</strong> how many are included, who gives feedback, and how fast? Name one reviewer and a deadline.</>,
                <><strong>Legal review:</strong> if your legal team reads every post, say so upfront. Slow reviews cost creators time, and they price this in.</>,
                <><strong>Usage rights:</strong> where do you plan to reuse the post, and for how long? Separate organic resharing from paid use.</>,
                <><strong>Paid amplification:</strong> <ExternalLink href={TLA}>LinkedIn Thought Leader Ads</ExternalLink> let you sponsor a post from a creator with the author&apos;s approval. ContentGrip puts the extra creator fee at 20% to 40%. Media spend comes on top.</>,
                <><strong>Exclusivity:</strong> define competitors by name, and set an end date. A broad category for six months costs far more than three named rivals for 30 days.</>,
                <><strong>Disclosure:</strong> write the label into the contract, and check the post before it goes live.</>,
              ]}
            />
          </section>

          {/* Pilot */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">A sample $10k LinkedIn pilot budget</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              This example is illustrative. It is not a quote or a past campaign. The ${POST_FEE} post fee is an assumption, below Favikon&apos;s $798 median and close to Naano&apos;s €588 median for 25,000 to 50,000 followers. The multipliers sit inside the ranges above. Swap in the quotes you receive.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Line item</th>
                    <th className={thClass}>Basis</th>
                    <th className={thClass}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {pilotLines.map((line) => (
                    <tr key={line.item}>
                      <td className={tdClass}>{line.item}</td>
                      <td className={tdClass}>{line.basis}</td>
                      <td className={tdClass}>{usd(line.cost)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className={tdClass}>Reserve for extra review rounds or a follow-up post</td>
                    <td className={tdClass}>Whatever remains</td>
                    <td className={tdClass}>{usd(pilotReserve)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-bold text-gray-900`}>Total</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-gray-900`}>{usd(pilotSubtotal + pilotReserve)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Two posts per creator gives you a second read on each one, so one lucky post does not decide the result. Decide your success measure first, such as qualified demo requests or cost per thousand members reached. After the pilot, keep the two best creators and move them to a package.
            </p>
          </section>

          {/* Negotiate */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you negotiate LinkedIn creator rates?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Negotiate on scope before price. Creators protect their rate, but they often flex on what the rate includes.
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              <li>Ask for a rate card and the last 90 days of analytics, including members reached.</li>
              <li>Compare the quote with the tier table above, then adjust for format and market.</li>
              <li>Trade terms for price: narrower exclusivity, shorter usage rights, or fewer review rounds.</li>
              <li>Offer volume in exchange for a package rate once a first post performs.</li>
              <li>Pay on time. Reliable brands earn better terms on the next deal.</li>
            </ol>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to book LinkedIn tech creators with Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              You have two routes. To run the campaign yourself,{' '}
              <Link href="/creators" className={linkClass}>browse verified tech creators</Link> on the free marketplace, message them, and send offers. There are no platform fees. Payments are made directly between brand and creator. Infoishai keeps the record.
            </p>
            <p className="text-gray-700 leading-relaxed">
              To hand the work to a team, our{' '}
              <Link href="/pricing" className={linkClass}>managed influencer marketing service</Link> gives you a custom quote for your campaign.
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
              Last updated November 3, 2026. Figures come from vendor and marketplace datasets, not an independent census, so use them as starting points. Naano figures are in euros and are not converted. Infoishai does not publish its own LinkedIn rate data here.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Plan your LinkedIn campaign</h2>
          <p className="text-blue-800 mb-6">
            Tell us your goal and budget, and get a custom quote for a managed LinkedIn campaign. Prefer to run it yourself? The marketplace is free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Get a Custom Quote
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/creators"
              className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-3 rounded-lg font-medium border border-blue-300 transition-colors"
            >
              Browse Verified Tech Creators
            </Link>
          </div>
        </div>

        <PillarGuideLink />
      </article>
    </div>
  )
}
