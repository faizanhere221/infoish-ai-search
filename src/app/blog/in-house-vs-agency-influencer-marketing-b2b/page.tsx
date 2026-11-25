// src/app/blog/in-house-vs-agency-influencer-marketing-b2b/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/in-house-vs-agency-influencer-marketing-b2b'
const HEADLINE = 'In-House vs Agency Influencer Marketing for B2B Tech: A Staffing Decision Guide'
const META_TITLE = 'In-House vs Agency Influencer Marketing for B2B'
const DESCRIPTION =
  'Compare in-house influencer marketing with agencies for B2B tech: skills, tools, workload and cost drivers, plus a hybrid model suited to most small teams.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'in-house vs agency influencer marketing b2b',
    'hire influencer marketing manager',
    'agency retainer vs in-house',
    'influencer marketing team structure',
    'cost of in-house influencer manager',
    'when to hire influencer agency saas',
    'hybrid influencer team',
    'b2b tech influencer marketing staffing',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-25T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Team Structure', 'B2B Marketing', 'Influencer Marketing', 'Agencies'],
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
  datePublished: '2026-11-25',
  dateModified: '2026-11-25',
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

const IMH_BENCHMARK = 'https://influencermarketinghub.com/influencer-marketing-benchmark-report/'
const BLS_SPECIALISTS = 'https://www.bls.gov/ooh/business-and-financial/market-research-analysts.htm'
const BLS_MANAGERS = 'https://www.bls.gov/ooh/management/advertising-promotions-and-marketing-managers.htm'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const compareRows = [
  {
    factor: 'Who does the work',
    inHouse: 'Your employee',
    agency: 'Agency team',
    hybrid: 'Your owner plus outside help for the heavy steps',
  },
  {
    factor: 'Cost structure',
    inHouse: 'Salary, tools and time, paid every month',
    agency: 'Retainer or per-campaign fee, on top of creator fees',
    hybrid: 'Part of a salary plus fees for the outsourced steps',
  },
  {
    factor: 'Speed to first campaign',
    inHouse: 'Slow if you need to hire first',
    agency: 'Fast once the contract is signed',
    hybrid: 'Fast, the outside partner starts the sourcing',
  },
  {
    factor: 'Control over creators and message',
    inHouse: 'Full',
    agency: 'Shared, through approvals',
    hybrid: 'Full on decisions, shared on execution',
  },
  {
    factor: 'Creator relationships kept',
    inHouse: 'Stay with your company',
    agency: 'Often stay with the agency',
    hybrid: 'Stay with your owner',
  },
  {
    factor: 'Best for',
    inHouse: 'Steady, year-round programs',
    agency: 'Big launches, no spare headcount',
    hybrid: 'Small teams with a few launches a year',
  },
]

const workloadRows = [
  { step: 'Brief and goals', hours: '3 to 5' },
  { step: 'Longlist, filtering and shortlist', hours: '11 to 16' },
  { step: 'Outreach and negotiation', hours: '6 to 10' },
  { step: 'Contracts and payment terms', hours: '3 to 5' },
  { step: 'Content review and revisions', hours: '5 to 10' },
  { step: 'Posting checks and disclosure', hours: '2 to 4' },
  { step: 'Payments and records', hours: '1 to 2' },
  { step: 'Reporting and next steps', hours: '3 to 5' },
]

const skillRows = [
  { skill: 'Creator sourcing and vetting', why: 'Picks people your buyers trust', hire: 'Core', agency: 'Core' },
  { skill: 'Technical product knowledge', why: 'Catches wrong claims in drafts', hire: 'Strong', agency: 'Varies' },
  { skill: 'Negotiation and contracts', why: 'Sets fair rates, rights and revisions', hire: 'Learnable', agency: 'Core' },
  { skill: 'Project management', why: 'Keeps five creators on one schedule', hire: 'Core', agency: 'Core' },
  { skill: 'Analytics and attribution', why: 'Ties posts to signups and pipeline', hire: 'Learnable', agency: 'Varies' },
  { skill: 'Disclosure and compliance', why: 'Keeps paid posts labelled', hire: 'Learnable', agency: 'Core' },
]

const sources = [
  {
    label: 'Influencer Marketing Hub, Influencer Marketing Benchmark Report 2026 (updated May 4, 2026)',
    href: IMH_BENCHMARK,
  },
  {
    label: 'US Bureau of Labor Statistics, Occupational Outlook Handbook: Market Research Analysts (May 2025 wages)',
    href: BLS_SPECIALISTS,
  },
  {
    label:
      'US Bureau of Labor Statistics, Occupational Outlook Handbook: Advertising, Promotions, and Marketing Managers (May 2025 wages)',
    href: BLS_MANAGERS,
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

function Checklist({ items }: { items: ReactNode[] }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function InHouseVsAgencyInfluencerMarketingPage() {
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
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Strategy</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Team Structure</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            For marketing leaders deciding who runs creator campaigns: the hours a campaign takes, the skills it
            needs, what drives the cost of each option, and a hybrid setup for small teams.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 25, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>8 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {/* Direct answer */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Should you build influencer marketing in-house?</h2>
            <AnswerBox>
              Build in-house if you run creator campaigns most months and have someone with 10 or more spare hours
              a week. Use an agency for a few big launches a year with no spare headcount. Most small B2B tech
              teams do best with a hybrid: one internal owner plus outside help for sourcing and coordination.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>In-house</strong> influencer marketing means your own employees find creators, negotiate,
              review content and report results. An <strong>agency</strong> is an outside company paid to do some
              or all of this work for you. A <strong>hybrid</strong> model splits the work: an internal owner keeps
              strategy, approvals and creator relationships, and an outside partner takes the time-heavy steps.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Most brands start in-house. In Influencer Marketing Hub&apos;s 2026 benchmark survey of marketing
              professionals, 66.3% of those answering said they run programs entirely in-house (
              <ExternalLink href={IMH_BENCHMARK}>Influencer Marketing Hub</ExternalLink>). The survey covers brands
              of all kinds, not only B2B tech.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope of this guide: B2B tech brands (SaaS, AI, developer tools, cloud, security) working with
              creators on YouTube, LinkedIn, X, TikTok and Instagram. Hour estimates are our planning figures, not
              measured data. Last updated November 25, 2026. For the basics of the channel, read our{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>
                complete guide to tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Decision table */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The decision at a glance</h2>
            <AnswerBox>
              The choice comes down to three things: how often you run campaigns, who has time, and who should
              own creator relationships long term. The table compares the three models on each.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Factor</th>
                    <th className={thClass}>In-house</th>
                    <th className={thClass}>Agency</th>
                    <th className={thClass}>Hybrid</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.factor}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.factor}</td>
                      <td className={tdClass}>{row.inHouse}</td>
                      <td className={tdClass}>{row.agency}</td>
                      <td className={tdClass}>{row.hybrid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Relationships are the factor teams forget. A creator who posted well for you is the cheapest
              creator to book again. If the agency holds the contact, you lose it when the contract ends. Ask
              about this before you sign.
            </p>
          </section>

          {/* Workload */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How much work is one campaign?</h2>
            <AnswerBox>
              Plan for roughly 34 to 57 hours of work for a campaign with about five creators, spread over four to
              eight weeks. These are our planning estimates for a manual process. Sourcing and content review take
              the largest share.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Step</th>
                    <th className={thClass}>Hours (estimate, about 5 creators)</th>
                  </tr>
                </thead>
                <tbody>
                  {workloadRows.map((row) => (
                    <tr key={row.step}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.step}</td>
                      <td className={tdClass}>{row.hours}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className={`${tdClass} font-bold text-gray-900`}>Total</td>
                    <td className={`${tdClass} font-bold text-gray-900`}>34 to 57</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Divide the total by your number of campaigns. One campaign a quarter is a few hours a week for one
              person, an add-on to an existing role. One campaign a month is close to a third of a full-time job,
              and two or more at once justify a dedicated hire.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The sourcing figure matches the workflow in our guide to{' '}
              <Link href="/blog/build-tech-influencer-shortlist" className={linkClass}>
                building a tech influencer shortlist
              </Link>
              . It drops sharply for repeat campaigns, since you re-book creators you already know.
            </p>
          </section>

          {/* Skills */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What skills are needed?</h2>
            <AnswerBox>
              Six skills cover the job: sourcing and vetting, technical product knowledge, negotiation, project
              management, analytics and disclosure. An in-house hire brings product knowledge. An agency brings
              process and creator contacts.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Skill</th>
                    <th className={thClass}>Why it matters</th>
                    <th className={thClass}>Typical in-house hire</th>
                    <th className={thClass}>Typical agency</th>
                  </tr>
                </thead>
                <tbody>
                  {skillRows.map((row) => (
                    <tr key={row.skill}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.skill}</td>
                      <td className={tdClass}>{row.why}</td>
                      <td className={tdClass}>{row.hire}</td>
                      <td className={tdClass}>{row.agency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Technical knowledge is the gap most often missed with generalist agencies. A creator reviewing a
              database or a security tool needs someone on your side who spots a wrong benchmark or an overstated
              claim before the post goes live. Keep this review in-house whichever model you pick.
            </p>
          </section>

          {/* Cost drivers */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What does an agency cost, and what does a hire cost?</h2>
            <AnswerBox>
              Creator fees are the same in both models. The difference is the cost of the work around them: a
              salary for in-house, a management fee or retainer for an agency. Compare those two numbers, not the
              total campaign budget.
            </AnswerBox>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">In-house cost drivers</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              The US Bureau of Labor Statistics does not track influencer marketing roles on their own. As
              reference points, the median annual wage for market research analysts and marketing specialists was
              $78,760 in May 2025 (<ExternalLink href={BLS_SPECIALISTS}>BLS</ExternalLink>), and the median for
              marketing managers was $166,790 (<ExternalLink href={BLS_MANAGERS}>BLS</ExternalLink>). Pay outside
              the US differs widely, so check local salary data. Add tools, benefits and the months a new hire
              takes to build creator contacts.
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Agency cost drivers</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Agencies charge a monthly retainer, a flat fee per campaign, or a percentage of creator spend, and
              rates vary by agency and scope. Ask each one to separate creator fees from their own fee in the
              quote. The number of creators, platforms, deliverables and revision rounds moves both parts.
            </p>
            <p className="text-gray-700 leading-relaxed">
              One example of published fee terms: on Infoishai&apos;s{' '}
              <Link href="/pricing" className={linkClass}>
                managed influencer marketing service
              </Link>
              , you pay the creator fee plus a 10% Infoishai fee on one invoice, Infoishai keeps 10% of the creator
              fee at payout, and each brand gets a custom quote. Our guide to{' '}
              <Link href="/blog/managed-influencer-marketing-tech-brands" className={linkClass}>
                managed influencer marketing for tech brands
              </Link>{' '}
              explains the scope and timeline in detail.
            </p>
          </section>

          {/* Hybrid */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The hybrid model for small teams</h2>
            <AnswerBox>
              In a hybrid team, one internal owner spends a few hours a week on strategy, approvals and
              relationships. An outside partner or a self-serve platform handles sourcing, outreach and
              coordination. You keep the knowledge and the contacts without a full-time hire.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-4">A simple split:</p>
            <Checklist
              items={[
                <>
                  <strong>Internal owner keeps:</strong> goals, the brief, final shortlist approval, technical
                  review of drafts, the creator relationship after the campaign, and reporting to leadership.
                </>,
                <>
                  <strong>Outside partner takes:</strong> longlist building, first outreach, rate negotiation,
                  contract paperwork, posting schedules and the weekly status report.
                </>,
                <>
                  <strong>Shared:</strong> the creator contact list, kept in a tool your company owns, so nothing
                  is lost if the partner changes.
                </>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed mb-6">
              <em>Illustrative example, not a client case.</em> A 40-person SaaS company plans three launches a year.
              Its product marketer owns creators for about four hours a week, a managed service runs sourcing and
              outreach for each launch, and the marketer re-books the two best performers directly for smaller
              updates between launches.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The other common hybrid is in-house work on a free marketplace. On Infoishai you search tech creators
              by platform, niche and country, message them, and track offers, contracts, deliverables and payment
              records with our{' '}
              <Link href="/campaigns" className={linkClass}>
                campaign management tools
              </Link>
              . Payments are made directly between brand and creator. Infoishai keeps the record. If this is your
              first run, follow our{' '}
              <Link href="/blog/first-tech-influencer-campaign-startup-guide-2026" className={linkClass}>
                first tech influencer campaign
              </Link>{' '}
              guide.
            </p>
          </section>

          {/* Checklist */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Decision checklist</h2>
            <AnswerBox>
              Answer these six questions in order. Mostly yes points to in-house, mostly no points to an agency or
              managed service, and a mix points to hybrid.
            </AnswerBox>
            <ol className="list-decimal list-inside text-gray-700 space-y-3 mb-6">
              <li>Will you run a creator campaign in most months of the next year?</li>
              <li>Does someone on the team have 10 or more spare hours a week for it?</li>
              <li>Does the team know your product well enough to review technical content?</li>
              <li>Do you want to own creator relationships for repeat launches?</li>
              <li>Is your management budget closer to a salary than to a few campaign fees?</li>
              <li>Is the first campaign able to wait until you hire and train someone?</li>
            </ol>
            <p className="text-gray-700 leading-relaxed">
              Revisit the answer every six months. Many teams start with outside help, learn the channel, then bring
              the work in-house once campaigns run every month. For a comparison of marketplaces and agencies as
              tools, read{' '}
              <Link href="/blog/influencer-marketplace-vs-agency-tech" className={linkClass}>
                influencer marketplace vs agency for tech brands
              </Link>
              .
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
              Last updated November 25, 2026. Hour estimates, the skill matrix, the decision checklist and the
              illustrative example are our guidance, not measured data. BLS wages are US medians for broad
              marketing occupations, not influencer marketing roles.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Talk to our team</h2>
          <p className="text-blue-800 mb-6">
            Need outside help for your next launch? Our managed service gives you a dedicated account manager and
            one invoice. Prefer to keep it in-house? The marketplace is free for brands.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Talk to Our Team
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
