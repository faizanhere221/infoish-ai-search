// src/app/blog/influencer-marketplace-vs-agency-tech/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/influencer-marketplace-vs-agency-tech'
const HEADLINE = 'Marketplace, Agency or Freelancer? How Tech Brands Should Buy Influencer Marketing'
const META_TITLE = 'Marketplace vs Agency vs Freelancer for Tech Brands'
const DESCRIPTION =
  'Compare influencer marketplaces, agencies, freelancers and in-house teams for tech brands: costs, speed, control and when each delivery model makes sense.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'influencer marketplace vs agency vs freelancer tech',
    'tech influencer marketing agency vs platform',
    'influencer marketplace for b2b',
    'managed vs self-serve influencer marketing',
    'should we hire an influencer agency or use a marketplace',
    'cost of tech influencer agency vs platform',
    'in-house vs agency influencer marketing b2b',
    'influencer marketing freelancer',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-10T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Influencer Marketing', 'Agencies', 'Marketplaces', 'B2B'],
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
  datePublished: '2026-11-10',
  dateModified: '2026-11-10',
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

const IMH = 'https://influencermarketinghub.com/influencer-marketing-benchmark-report/'
const KOLSQUARE = 'https://www.kolsquare.com/en/blog/influencer-marketing-platform-vs-agency-2026'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const comparisonRows = [
  {
    factor: 'How you pay',
    marketplace: 'Free, a subscription or a fee per booking, depending on the marketplace',
    agency: 'Project fee or monthly retainer, often plus a share of the campaign budget',
    freelancer: 'Hourly or per-project rate',
    inhouse: 'Salary, tools and the time of the people involved',
  },
  {
    factor: 'Who does the work',
    marketplace: 'Your team: search, outreach, briefs, review',
    agency: 'The agency, with your sign-off at key points',
    freelancer: 'The freelancer, on the tasks you hand over',
    inhouse: 'Your own staff, end to end',
  },
  {
    factor: 'Speed to first post',
    marketplace: 'Fast if you have the time to do outreach yourself',
    agency: 'Depends on the onboarding and strategy phase',
    freelancer: 'Depends on their hours and existing contacts',
    inhouse: 'Slow at first, fast once relationships exist',
  },
  {
    factor: 'Control over creators',
    marketplace: 'Full, you talk to creators directly',
    agency: 'Shared, the agency often owns the relationship',
    freelancer: 'Shared, depends on the contract',
    inhouse: 'Full',
  },
  {
    factor: 'Who keeps the relationships',
    marketplace: 'You',
    agency: 'Often the agency, unless the contract says otherwise',
    freelancer: 'You, if you insist on it in writing',
    inhouse: 'You',
  },
  {
    factor: 'Best fit',
    marketplace: 'Teams with time and a clear brief, testing the channel',
    agency: 'Teams with budget and frequent launches, short on time',
    freelancer: 'Teams needing help with one part, such as outreach',
    inhouse: 'Teams treating creators as a core channel for years',
  },
]

const sources = [
  {
    label: 'Influencer Marketing Hub, Influencer Marketing Benchmark Report 2026 (May 4, 2026, survey of 600+ marketing professionals)',
    href: IMH,
  },
  {
    label: 'Kolsquare, Influencer marketing platform vs agency (July 30, 2026, vendor content)',
    href: KOLSQUARE,
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
            <Icon
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${negative ? 'text-red-500' : 'text-blue-600'}`}
            />
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function InfluencerMarketplaceVsAgencyTechPage() {
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
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Strategy
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Comparison
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Four ways to buy creator marketing, how each one charges, and a decision tree based on your budget, launch cadence and team size.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 10, 2026</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Is a marketplace cheaper than an agency?</h2>
            <AnswerBox>
              Usually yes, in fees. A marketplace charges little or nothing for access, while an agency charges a project fee or retainer, often on top of creator fees. The catch is time. With a marketplace your team does the outreach, briefing and review. With an agency you pay someone else to do it.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Every tech brand buying creator content faces the same choice: do the work yourself, or pay someone to do it. The choice is less about price and more about where the hours come from. A cheap option with no one to run it costs you a launch.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              This guide compares the four <strong>delivery models</strong> for influencer marketing: a marketplace, an agency or managed service, a freelancer, and an in-house team. It covers how each one charges, where each one wins, and a simple decision tree for picking one. It also states plainly what Infoishai does and does not do, since we offer both a free marketplace and a managed service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: B2B tech brands (SaaS, AI, developer tools, cloud, cybersecurity) working with creators on YouTube, LinkedIn, X, TikTok and Instagram. This guide describes fee models, not prices, because agency and platform prices are rarely published. Last updated November 10, 2026. New to the topic? Start with the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>complete guide to tech influencers</Link>.
            </p>
          </section>

          {/* Four ways */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What are the four ways to buy influencer marketing?</h2>
            <AnswerBox>
              You either use a marketplace and run campaigns yourself, hire an agency or managed service to run them for you, bring in a freelancer for specific tasks, or build an in-house team. Many brands mix two of these.
            </AnswerBox>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Marketplace (self-serve)</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              An <strong>influencer marketplace</strong> is a platform where brands find creators, contact them and manage the collaboration themselves. Some charge a subscription, some take a fee per booking, and some are free. You get access and tools. You still do the thinking and the follow-up.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Agency or managed service</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              An <strong>influencer marketing agency</strong> plans and runs campaigns for you: strategy, creator selection, negotiation, contracts, content review and reporting. A <strong>managed service</strong> is the same idea offered by a platform company, using its own creator network and tools. The relationship between the two models is simple: a marketplace sells you access, an agency sells you labour and judgement on top of access.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Freelancer</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>freelancer</strong> is an independent specialist you hire for a defined slice of the work, such as building a shortlist, sending outreach or coordinating deliverables. Freelancers sit between the two models above: more hands-on help than a marketplace, less scope than an agency.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">In-house team</h3>
            <p className="text-gray-700 leading-relaxed">
              <strong>In-house</strong> means your own staff run the programme. This is the most common model in the industry. In Influencer Marketing Hub&apos;s 2026 benchmark survey, 66.3% of respondents said they run their programmes entirely in-house (
              <ExternalLink href={IMH}>Influencer Marketing Hub, May 2026</ExternalLink>). An in-house team often still uses a marketplace or tools, so in practice in-house and marketplace go together.
            </p>
          </section>

          {/* Table */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Marketplace vs agency vs freelancer vs in-house: side by side</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              The table compares fee models and trade-offs, not prices. Each row describes the typical case. Read every contract, since terms differ between vendors.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Factor</th>
                    <th className={thClass}>Marketplace</th>
                    <th className={thClass}>Agency or managed</th>
                    <th className={thClass}>Freelancer</th>
                    <th className={thClass}>In-house</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.factor}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.factor}</td>
                      <td className={tdClass}>{row.marketplace}</td>
                      <td className={tdClass}>{row.agency}</td>
                      <td className={tdClass}>{row.freelancer}</td>
                      <td className={tdClass}>{row.inhouse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Cost structure in plain terms.</strong> Creator fees exist in every model. What changes is the layer on top. Agencies charge project fees or retainers, often plus a percentage of the campaign budget, so the cost grows with every campaign you run (
              <ExternalLink href={KOLSQUARE}>Kolsquare, July 2026</ExternalLink>, a platform vendor). Platforms usually charge a subscription or a booking fee, which stays flat as you add creators. A freelancer bills for hours or for a defined project. In-house carries salaries, which you pay whether or not a campaign is live.
            </p>
            <p className="text-gray-700 leading-relaxed">
              One more cost hides in every model: your own time. A free marketplace with no owner on your side produces nothing. Count the hours of review, approvals and follow-up before comparing invoices. Our list of{' '}
              <Link href="/blog/ai-powered-influencer-marketing-tools-game-changer" className={linkClass}>AI tools for influencer marketing</Link> covers software to cut some of those hours.
            </p>
          </section>

          {/* Marketplace wins */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">When does a marketplace win?</h2>
            <AnswerBox>
              A marketplace wins when you have someone with a few hours a week, a clear product story and a budget for a small pilot. You keep full control and the creator relationships, and you spend your money on creators instead of fees.
            </AnswerBox>
            <Checklist
              items={[
                <><strong>You are testing the channel.</strong> A first pilot with three to five creators needs a careful brief, not a retainer. Our guide to your{' '}<Link href="/blog/first-tech-influencer-campaign-startup-guide-2026" className={linkClass}>first tech influencer campaign</Link> walks through one.</>,
                <><strong>Your product is technical.</strong> A founder or product marketer who knows the product often briefs a developer creator better than an outside account manager does.</>,
                <><strong>You want to own the relationships.</strong> Direct contact means the creator who performs well stays your contact, not an agency&apos;s.</>,
                <><strong>Launches are occasional.</strong> If you ship a big release twice a year, a monthly retainer pays for idle months.</>,
              ]}
            />
          </section>

          {/* Managed wins */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">When do you need a managed service?</h2>
            <AnswerBox>
              You need a managed service or agency when launches come often, your team has no one free to run creator campaigns, or you work with many creators at once across several markets. You pay more in fees and get back the hours.
            </AnswerBox>
            <Checklist
              items={[
                <><strong>Frequent launches.</strong> Monthly releases or a steady stream of features need a partner who keeps creators briefed without your team starting from zero each time.</>,
                <><strong>Many creators at once.</strong> Ten or more creators means ten contracts, ten review rounds and ten payment records. A team built for this runs it faster.</>,
                <><strong>Several countries.</strong> Rules on disclosure, language and timing differ between markets. Our guide to{' '}<Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>influencer disclosure rules for B2B</Link> shows how much varies.</>,
                <><strong>No one owns the channel.</strong> If creators are no one&apos;s job, a self-serve tool sits unused. Paying for a managed service is cheaper than a stalled programme.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Check the contract on three points before you sign: who owns the creator relationships, whether creator fees are passed through at cost or marked up, and how you exit. Some brands find out at renewal time they never had direct contact with a single creator.
            </p>
          </section>

          {/* Freelancer */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What does a freelancer do for influencer outreach?</h2>
            <AnswerBox>
              A freelancer handles defined tasks: researching and vetting a shortlist, writing and sending outreach, chasing replies, and tracking deliverables and dates. Strategy, budget and final approval usually stay with you.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Freelancers suit teams who know what they want but lack the hours to do it. Hire one for a single campaign before offering ongoing work. Give them a written brief, a shortlist template and clear rules on what they agree to on your behalf.
            </p>
            <Checklist
              negative
              items={[
                <><strong>Do not hand over the budget decision.</strong> Agree price ranges in advance, and approve each offer yourself.</>,
                <><strong>Do not let contacts leave with them.</strong> Use your own email or a shared inbox, and keep creator contacts in your own records.</>,
                <><strong>Do not skip vetting.</strong> Ask the freelancer to score each creator against a written checklist, such as our{' '}<Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>vetting scorecard</Link>.</>,
              ]}
            />
          </section>

          {/* Hybrid */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The hybrid approach</h2>
            <AnswerBox>
              Most growing tech brands end up hybrid: an agency or managed service for big launches, and a marketplace for always-on work with creators they already know.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Hybrid lets each model do the job it does best. The agency brings speed and scale when a launch needs many creators at once. The marketplace keeps costs low for steady work with creators you already trust.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Hybrid example (illustrative, fictional):</strong> a developer tool company hands its yearly flagship launch to a managed service, which books eight creators across YouTube and X. Between launches, its developer advocate uses a marketplace to rebook the two creators who performed best for monthly tutorials. The company pays management fees only around the launch and keeps direct contact with its best creators all year.
            </p>
          </section>

          {/* Decision tree */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Decision tree: which model fits your team?</h2>
            <AnswerBox>
              Start with team time, then launch cadence, then budget. No owner points to a managed service. An owner with occasional launches points to a marketplace. Frequent launches and a budget for many creators point to hybrid or in-house.
            </AnswerBox>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Does someone on your team have three or more hours a week for creators?</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                  <li>No: go to a <strong>managed service or agency</strong>. If the budget is too small for a retainer, wait, or hire a freelancer for one pilot.</li>
                  <li>Yes: go to question 2.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. How often do you launch something worth promoting?</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                  <li>A few times a year: use a <strong>marketplace</strong> and run each launch yourself.</li>
                  <li>Monthly or more: go to question 3.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. How many creators per launch does your budget cover?</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                  <li>Fewer than five: a <strong>marketplace plus a freelancer</strong> for outreach and tracking.</li>
                  <li>Five or more: <strong>hybrid</strong>, with a managed service for big launches and a marketplace for repeat creators.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Will creators be a core channel for two years or more?</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                  <li>Yes: plan an <strong>in-house</strong> hire once the channel proves its cost per trial or demo. Keep a marketplace as the tool.</li>
                  <li>Not sure: stay hybrid and review after two quarters.</li>
                </ul>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The thresholds above are our suggested starting points, not industry benchmarks. Move them to fit your own sales cycle and team.
            </p>
          </section>

          {/* Questions */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Questions to ask any vendor</h2>
            <AnswerBox>
              Ask every marketplace, agency or freelancer how they charge, who owns the creator relationships, how they find tech creators, and what reporting you get. Vague answers on fees or ownership are a warning sign.
            </AnswerBox>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>How do you charge?</strong> Subscription, booking fee, retainer, percentage of spend or hourly? What happens to the fee if a creator drops out?</li>
              <li><strong>Are creator fees passed through at cost?</strong> Ask to see what each creator receives.</li>
              <li><strong>Who owns the creator relationship and contact details after the contract ends?</strong></li>
              <li><strong>How many of your creators make B2B tech content?</strong> A general consumer network rarely suits a developer tool or security product.</li>
              <li><strong>Which platforms and countries do you cover?</strong> Make sure the list matches where your buyers spend time.</li>
              <li><strong>Who writes and approves the brief, and how many review rounds are included?</strong></li>
              <li><strong>What does a report contain, and how often does it arrive?</strong> Ask for a sample.</li>
              <li><strong>How do you handle disclosure and contracts?</strong></li>
              <li><strong>How do payments to creators work?</strong> Know who pays whom, and when.</li>
            </ol>
          </section>

          {/* Infoishai trade-offs */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Infoishai&apos;s own trade-offs</h2>
            <AnswerBox>
              Infoishai offers a free, tech-only marketplace and a managed service with custom quotes. The marketplace is cheap and direct but needs your time. The managed service saves your time and costs a fee.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Here is what our marketplace does and does not do, so you judge it on the same terms as any other vendor.
            </p>
            <Checklist
              items={[
                <><strong>Free for brands and creators.</strong> There are no platform fees.</>,
                <><strong>Tech creators only</strong>, on YouTube, LinkedIn, X, TikTok and Instagram, across nine countries.</>,
                <><strong>Direct contact.</strong> You message creators, send offers or post a campaign creators apply to, and track the offer, contract, deliverables and payment records in one place.</>,
              ]}
            />
            <Checklist
              negative
              items={[
                <><strong>No escrow.</strong> Payments are made directly between brand and creator. Infoishai keeps the record.</>,
                <><strong>Narrow by design.</strong> No consumer lifestyle creators, and no platforms outside the five above.</>,
                <><strong>Self-serve means your time.</strong> On the marketplace, your team runs search, briefs and review.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Our{' '}
              <Link href="/pricing" className={linkClass}>managed influencer marketing service</Link> covers the other side. We plan the campaign, send a creator shortlist to approve, and handle offers, contracts, content approvals and weekly reports. Each brand gets a custom quote, and one invoice covers creator fees and our management fee. Prefer to run it yourself?{' '}
              <Link href="/creators" className={linkClass}>Browse verified tech creators</Link> on the free marketplace.
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
              Last updated November 10, 2026. Fee models describe typical cases, not quotes from any vendor. The example in this guide is illustrative and fictional, and the decision tree thresholds are our suggestions, not benchmarks.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Book a call about the managed service</h2>
          <p className="text-blue-800 mb-6">
            Tell us your product, buyer and launch plan, and we will send a creator shortlist and a custom quote. Want to run it yourself? The marketplace is free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Book a Call About the Managed Service
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
