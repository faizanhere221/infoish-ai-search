// src/app/blog/b2b-influencer-marketing-roi/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/b2b-influencer-marketing-roi'
const HEADLINE = 'B2B Influencer Marketing ROI: How to Prove Impact to Finance'
const META_TITLE = 'B2B Influencer Marketing ROI: Prove Impact'
const DESCRIPTION =
  'Measure B2B influencer marketing ROI with pipeline metrics, assisted conversions and self-reported attribution, and see why EMV alone fails finance.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'how to measure b2b influencer marketing roi',
    'b2b influencer roi',
    'influencer pipeline attribution',
    'measure creator campaign saas',
    'influencer roi formula b2b',
    'earned media value vs pipeline',
    'how to prove influencer impact to cfo',
    'self-reported attribution',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-20T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Measurement', 'ROI', 'B2B Tech', 'Attribution'],
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
  datePublished: '2026-11-20',
  dateModified: '2026-11-20',
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

const GA4_ATTRIBUTION = 'https://support.google.com/analytics/answer/10597962?hl=en'
const LINKEDIN_95_5 =
  'https://business.linkedin.com/it/it/advertise/resources/b2b-institute/b2b-research/trends/95-5-rule'
const SPROUT_EMV = 'https://sproutsocial.com/insights/earned-media-value/'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const hierarchyRows = [
  {
    level: '1. Delivery',
    metric: 'Posts live on time, views, watch time, impressions',
    timing: 'Days',
    finance: 'Low: proves you got what you paid for',
  },
  {
    level: '2. Engagement',
    metric: 'Comments from your buyer type, saves, profile visits',
    timing: 'Days to 2 weeks',
    finance: 'Low: a signal of fit, not value',
  },
  {
    level: '3. Visits and sign-ups',
    metric: 'Tracked sessions, trials, demo requests, newsletter sign-ups',
    timing: '1 to 4 weeks',
    finance: 'Medium: shows intent',
  },
  {
    level: '4. Pipeline',
    metric: 'Qualified opportunities and their value, influenced or sourced',
    timing: '1 to 3 months',
    finance: 'High: the number finance plans on',
  },
  {
    level: '5. Revenue',
    metric: 'Closed-won deals, CAC, payback',
    timing: 'One full sales cycle or longer',
    finance: 'Highest: the real return',
  },
]

const worksheetRows = [
  { input: 'Creator fees', low: '$6,000', base: '$6,000', high: '$6,000' },
  { input: 'Other costs (product access, team time)', low: '$1,500', base: '$1,500', high: '$1,500' },
  { input: 'Total cost', low: '$7,500', base: '$7,500', high: '$7,500' },
  { input: 'Demo requests tied to creators', low: '10', base: '18', high: '18 + 8 self-reported' },
  { input: 'Qualified opportunities', low: '3', base: '6', high: '9' },
  { input: 'Closed-won deals', low: '1', base: '2', high: '3' },
  { input: 'Annual contract value per deal', low: '$9,000', base: '$9,000', high: '$9,000' },
  { input: 'Gross profit at 80% margin', low: '$7,200', base: '$14,400', high: '$21,600' },
  { input: 'ROI on gross profit', low: '-4%', base: '92%', high: '188%' },
  { input: 'Pipeline created (opps x ACV)', low: '$27,000', base: '$54,000', high: '$81,000' },
  { input: 'CAC (cost / new customers)', low: '$7,500', base: '$3,750', high: '$2,500' },
]

const sources = [
  {
    label: 'Google Analytics Help, Select attribution settings (lookback windows for key events)',
    href: GA4_ATTRIBUTION,
  },
  {
    label: 'LinkedIn B2B Institute, The 95-5 Rule',
    href: LINKEDIN_95_5,
  },
  {
    label: 'Sprout Social, Earned media value: How to calculate it (November 2024, updated 2026)',
    href: SPROUT_EMV,
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

export default function B2BInfluencerMarketingRoiPage() {
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
              Measurement
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A measurement guide for growth and demand-gen leads: which metrics count, how to calculate return, and
            how to show finance a number they trust, uncertainty included.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 20, 2026</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you measure B2B influencer ROI?</h2>
            <AnswerBox>
              Track each creator with unique links, then follow those visits into your CRM as demo requests,
              opportunities and closed deals. Add a &quot;How did you hear about us?&quot; field to catch buyers
              who never clicked. ROI is gross profit from those deals minus total campaign cost, divided by total
              cost, reported as a range.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Measuring B2B influencer marketing ROI</strong> means connecting creator content to the
              business numbers finance already tracks: pipeline, revenue and the cost of winning a customer. Views
              and likes tell you the content ran. They do not tell your CFO whether to fund the next quarter.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: B2B tech brands (SaaS, AI, dev tools, cloud, security) working with creators on YouTube,
              LinkedIn, X, TikTok and Instagram. All money figures in the worked example are illustrative, not
              benchmarks. Facts were checked on November 20, 2026. For the wider picture, read the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>
                complete guide to tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Definitions */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The terms finance will ask about</h2>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <p className="text-gray-700">
                <strong>ROI (return on investment):</strong> (gain from the campaign minus campaign cost) divided
                by campaign cost. For B2B, use gross profit from closed deals as the gain, not top-line revenue.
              </p>
              <p className="text-gray-700">
                <strong>Pipeline:</strong> the total value of open, qualified sales opportunities. Pipeline comes
                before revenue: a creator campaign first adds opportunities, and some of those opportunities later
                close as revenue.
              </p>
              <p className="text-gray-700">
                <strong>Sourced vs influenced pipeline:</strong> sourced means the creator brought the first touch.
                Influenced means the buyer saw creator content at any point before the deal closed.
              </p>
              <p className="text-gray-700">
                <strong>Assisted conversion:</strong> a conversion where creator content was one touchpoint, but
                another channel got the final click. In B2B, most creator value shows up here.
              </p>
              <p className="text-gray-700">
                <strong>CAC (customer acquisition cost):</strong> total campaign cost divided by new customers won.
                Finance compares this number across every channel.
              </p>
              <p className="text-gray-700">
                <strong>Earned media value (EMV):</strong> an estimate of what the same exposure would cost as paid
                ads. A media-cost proxy, not a return.
              </p>
              <p className="text-gray-700">
                <strong>Self-reported attribution:</strong> asking buyers directly where they heard about you,
                usually with a free-text field on the demo or sign-up form.
              </p>
            </div>
          </section>

          {/* Why hard */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why is B2B influencer ROI hard to prove?</h2>
            <AnswerBox>
              B2B buyers rarely click a creator link and buy the same day. Several people join the decision, the
              sales cycle runs for months, and much of the research happens in places analytics never sees, such as
              a shared Slack message or a podcast heard on a commute.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Timing is the first problem. LinkedIn&apos;s B2B Institute describes the &quot;95-5 rule&quot;: 95%
              of your potential buyers are not ready to buy today (
              <ExternalLink href={LINKEDIN_95_5}>LinkedIn B2B Institute</ExternalLink>). A creator video reaches
              mostly future buyers. Its effect shows up months later, long after a 7-day tracking window closes.
            </p>
            <Checklist
              negative
              items={[
                <>
                  <strong>Link limits.</strong> Creators on LinkedIn and X often keep links out of the main post,
                  and Instagram and TikTok captions do not support clickable links. Clicks undercount interest.
                </>,
                <>
                  <strong>Device and person changes.</strong> An engineer watches on a phone, then a manager signs
                  the contract on a laptop weeks later. No cookie connects them.
                </>,
                <>
                  <strong>Dark social.</strong> Buyers share creator content in private chats and email. Those
                  visits arrive as &quot;direct&quot; traffic.
                </>,
                <>
                  <strong>Small numbers.</strong> A pilot with five creators produces a handful of deals. One extra
                  deal swings ROI by a large amount, so single-point results mislead.
                </>,
              ]}
            />
          </section>

          {/* Hierarchy */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Metric hierarchy: leading vs lagging</h2>
            <AnswerBox>
              Leading metrics (delivery, engagement, visits) arrive in days and tell you the campaign is working.
              Lagging metrics (pipeline, revenue, CAC) arrive in months and tell finance whether it paid off. Report
              both, but never present a leading metric as the return.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Level</th>
                    <th className={thClass}>What you measure</th>
                    <th className={thClass}>When it shows</th>
                    <th className={thClass}>Weight with finance</th>
                  </tr>
                </thead>
                <tbody>
                  {hierarchyRows.map((row) => (
                    <tr key={row.level}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.level}</td>
                      <td className={tdClass}>{row.metric}</td>
                      <td className={tdClass}>{row.timing}</td>
                      <td className={tdClass}>{row.finance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Use the top levels to manage the campaign week by week: drop a creator whose audience leaves no
              qualified visits, and rebook one whose comments come from your buyers. Use the bottom levels to judge
              the channel. Our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>
                tech influencer vetting scorecard
              </Link>{' '}
              helps you pick creators whose audience fits before any money goes out.
            </p>
          </section>

          {/* Formula */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The ROI formula and a worked example</h2>
            <AnswerBox>
              ROI = (gross profit from creator-attributed deals minus total campaign cost) / total campaign cost.
              Count every cost, including team time and product access, and show three scenarios instead of one
              number.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <em>Illustrative worksheet (fictional numbers):</em> a SaaS company runs a pilot with five creators.
              The low case counts only demo requests with a creator UTM. The base case adds deals where a creator
              touch appears anywhere in the CRM journey. The high case adds buyers who named a creator in the
              &quot;How did you hear about us?&quot; field.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Input</th>
                    <th className={thClass}>Low (tracked only)</th>
                    <th className={thClass}>Base (influenced)</th>
                    <th className={thClass}>High (plus self-reported)</th>
                  </tr>
                </thead>
                <tbody>
                  {worksheetRows.map((row) => (
                    <tr key={row.input}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.input}</td>
                      <td className={tdClass}>{row.low}</td>
                      <td className={tdClass}>{row.base}</td>
                      <td className={tdClass}>{row.high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              The base case math: two deals at $9,000 give $18,000 in first-year revenue. At an 80% gross margin,
              gross profit is $14,400. ROI is ($14,400 minus $7,500) divided by $7,500, or 92%. The low case loses
              4%; the high case returns 188%.
            </p>
            <p className="text-gray-700 leading-relaxed">
              To build your own version, swap in your real fees, your average contract value and your own funnel
              conversion rates from other channels. If your deals renew, add a second column with lifetime gross
              profit, but label it clearly. For help setting fees, see our{' '}
              <Link href="/blog/tech-influencer-campaign-budget" className={linkClass}>
                tech influencer campaign budget guide
              </Link>
              .
            </p>
          </section>

          {/* EMV */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Is EMV a valid metric?</h2>
            <AnswerBox>
              EMV is a reasonable media-cost comparison, but not a return. It estimates what the reach would cost
              as ads and says nothing about pipeline or revenue. There is also no standard formula, so two tools
              give two different EMV figures for the same post.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Sprout Social puts it plainly: &quot;there is no standard way to assign a monetary value to social
              media engagements,&quot; and EMV calculations vary between platforms and partners (
              <ExternalLink href={SPROUT_EMV}>Sprout Social</ExternalLink>). A CFO who sees an EMV of ten times
              spend will ask where the cash is. Use EMV, if at all, as a secondary line to compare creator reach
              with paid social costs. Keep it out of the ROI line.
            </p>
          </section>

          {/* Attribution caveats */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Attribution caveats to fix before launch</h2>
            <AnswerBox>
              Set long lookback windows, give each creator a unique link and code, record creator touches on the
              CRM contact, and add a self-reported source field. Without these four steps, most creator influence
              never reaches your reports.
            </AnswerBox>
            <Checklist
              items={[
                <>
                  <strong>Check your lookback windows.</strong> In Google Analytics 4, acquisition key events
                  default to a 30-day lookback window and all other key events to 90 days, with shorter options
                  available (
                  <ExternalLink href={GA4_ATTRIBUTION}>Google Analytics Help</ExternalLink>). Do not shorten them
                  for B2B. Your CRM keeps a longer history, so judge pipeline there.
                </>,
                <>
                  <strong>Unique link and code per creator.</strong> Same naming pattern every time. Our{' '}
                  <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>
                    UTM tracking guide
                  </Link>{' '}
                  shows the setup step by step.
                </>,
                <>
                  <strong>Store the first creator touch on the CRM record.</strong> A hidden form field or a
                  contact property for &quot;first creator source&quot; keeps the link alive after the cookie
                  expires.
                </>,
                <>
                  <strong>Add a free-text source field.</strong> &quot;How did you hear about us?&quot; on the demo
                  form catches buyers who watched, never clicked, and searched your name later. Review answers
                  weekly and tag creator names.
                </>,
                <>
                  <strong>Agree the rules first.</strong> Decide with finance, before launch, which deals count as
                  sourced, influenced or self-reported. Agreeing after the results come in looks like moving the
                  goalposts.
                </>,
              ]}
            />
          </section>

          {/* Timing */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How long until results show?</h2>
            <AnswerBox>
              Delivery and engagement show within days. Tracked sign-ups and demo requests show within the first
              few weeks. Pipeline and closed revenue follow your normal sales cycle, so judge ROI after at least
              one full cycle, not after launch week.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed">
              If your average deal takes four months to close, a 30-day report shows leading metrics only. Say so
              in the report. Tell finance which date the first pipeline read lands, and which date the first
              revenue read lands, before the campaign starts.
            </p>
          </section>

          {/* Reporting */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to prove influencer impact to your CFO</h2>
            <AnswerBox>
              Lead with pipeline and CAC, show ROI as a low-base-high range, state the attribution rules you agreed,
              and list what the numbers miss. Finance trusts a range with honest limits more than one confident
              figure.
            </AnswerBox>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. One summary line</h3>
                <p className="text-gray-700">
                  &quot;$7,500 spent, $54,000 pipeline created, 2 deals won, ROI between -4% and 188% depending on
                  attribution rule (base 92%).&quot; Fictional figures from the worksheet above.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Compare with other channels</h3>
                <p className="text-gray-700">
                  Put creator CAC next to paid search, paid social and events, measured the same way. A relative
                  view tells finance more than an absolute number.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Present the uncertainty</h3>
                <p className="text-gray-700">
                  Name the gaps: deals still open, buyers who never clicked, small sample size. Say which way each
                  gap pushes the result. Most gaps in creator tracking undercount, and finance should hear this from
                  you.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Ask for a specific next step</h3>
                <p className="text-gray-700">
                  Propose the next budget tied to a test, such as rebooking the two best creators and adding a
                  holdout region with no creator activity to compare demo rates.
                </p>
              </div>
            </div>
          </section>

          {/* Cadence */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Review cadence</h2>
            <Checklist
              items={[
                <>
                  <strong>Weekly during the campaign:</strong> delivery, engagement quality, tracked visits and
                  self-reported mentions per creator.
                </>,
                <>
                  <strong>Monthly:</strong> demo requests, qualified opportunities and pipeline value by creator.
                </>,
                <>
                  <strong>Quarterly:</strong> closed-won revenue, CAC, the low-base-high ROI range and the rebooking
                  decision.
                </>,
                <>
                  <strong>After one full sales cycle:</strong> a final read with finance, and the attribution rules
                  updated for the next round.
                </>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Still choosing creators? Start with{' '}
              <Link href="/blog/how-to-find-tech-influencers-b2b-2026" className={linkClass}>
                how to find B2B tech influencers
              </Link>
              , and see the{' '}
              <Link href="/blog/top-10-benefits-tech-influencer-marketing-2026" className={linkClass}>
                benefits of tech influencer marketing
              </Link>{' '}
              for the case to make before the budget is approved.
            </p>
          </section>

          {/* Getting started */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Start a measured pilot on Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              On Infoishai you post a campaign creators apply to, or{' '}
              <Link href="/creators" className={linkClass}>
                browse verified tech creators
              </Link>{' '}
              on YouTube, LinkedIn, X, TikTok and Instagram and message them directly. Our{' '}
              <Link href="/campaigns" className={linkClass}>
                campaign management tools
              </Link>{' '}
              keep offers, contracts, deliverables and payment records for each creator in one tracker, so your
              cost side of the ROI sheet is ready when you need it. Infoishai is free for brands and creators.
              There are no platform fees. Payments are made directly between brand and creator, and Infoishai keeps
              the record.
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
              Last updated November 20, 2026. The worksheet, its scenarios and the summary line use fictional
              numbers to show the method. They are not benchmarks for creator campaign results. GA4 settings are
              as described in Google&apos;s help page on the date checked.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Start a measured pilot</h2>
          <p className="text-blue-800 mb-6">
            Post a campaign, pick tech creators, and keep every offer, deliverable and payment record in one place.
            No platform fees for brands or creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/campaigns"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Explore Campaigns
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
