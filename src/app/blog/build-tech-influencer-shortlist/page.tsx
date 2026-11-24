// src/app/blog/build-tech-influencer-shortlist/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/build-tech-influencer-shortlist'
const HEADLINE = 'How to Build a Tech Influencer Shortlist: From 100 Names to 10 Outreach Targets'
const META_TITLE = 'Build a Tech Influencer Shortlist: 100 to 10'
const DESCRIPTION =
  'A repeatable workflow to turn a long list of tech creators into a ranked shortlist of ten outreach targets, with a spreadsheet layout and scoring tips.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'how to build a tech influencer shortlist',
    'influencer shortlist template',
    'creator list building b2b',
    'shortlist 20 creators workflow',
    'influencer longlist to shortlist',
    'creator scoring spreadsheet',
    'outreach list tech influencers',
    'tech influencer vetting workflow',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-24T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Influencer Discovery', 'Vetting', 'B2B Marketing', 'Workflow'],
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
  datePublished: '2026-11-24',
  dateModified: '2026-11-24',
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

const TOPRANK_STATS = 'https://www.toprankmarketing.com/blog/b2b-influencer-marketing-statistics-trends/'
const MARKETINGPROFS_STUDY = 'https://www.marketingprofs.com/charts/2025/53054/b2b-influencer-marketing-study-stats'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const funnelRows = [
  { stage: 'Longlist', count: '~100', work: 'Collect names from every source. No judging yet.', time: '3 to 4 hours' },
  { stage: 'Filtered list', count: '~40', work: 'Remove anyone failing a hard filter.', time: '1 to 2 hours' },
  { stage: 'Scored list', count: '~20', work: 'Score each creator on five quick criteria.', time: '3 to 4 hours' },
  { stage: 'Shortlist', count: '10', work: 'Deep-check the top 20, keep the best 10.', time: '3 to 5 hours' },
  { stage: 'Outreach order', count: '10 in 2 waves', work: 'Rank, split into waves, write notes.', time: '1 hour' },
]

const columnRows = [
  { column: 'Name and handle', why: 'One row per creator, not per channel' },
  { column: 'Main platform and profile URL', why: 'YouTube, LinkedIn, X, TikTok or Instagram' },
  { column: 'Other platforms', why: 'Cross-posting widens the deal' },
  { column: 'Country and language', why: 'Must match your target market' },
  { column: 'Niche and sub-topic', why: 'For example "cloud", then "Kubernetes cost"' },
  { column: 'Audience size', why: 'Context only, never a ranking input on its own' },
  { column: 'Median views or reactions, last 10 posts', why: 'Typical reach, not the one viral hit' },
  { column: 'Last post date', why: 'Filters out inactive creators' },
  { column: 'Sponsored posts seen, and for whom', why: 'Experience, and competitor conflicts' },
  { column: 'Contact route', why: 'Email, form, DM or marketplace message' },
  { column: 'Source', why: 'Where you found them, to judge your sources later' },
  { column: 'Filter result', why: 'Pass, or the reason for removal' },
  { column: 'Scores (5 columns) and total', why: 'The ranking itself' },
  { column: 'Wave and status', why: 'Wave 1 or 2; not contacted, contacted, replied, declined' },
  { column: 'Notes', why: 'The specific post you will mention in your pitch' },
]

const scoreRows = [
  { criterion: 'Topic fit', one: 'Covers your category now and then', five: 'Most recent posts sit in your exact sub-topic' },
  { criterion: 'Audience fit', one: 'Mixed or consumer audience', five: 'Comments come from your buyers or users' },
  { criterion: 'Typical reach', one: 'Well below your target range', five: 'Steady median views or reactions in your range' },
  { criterion: 'Content quality', one: 'Shallow or error-prone', five: 'Accurate, hands-on, clear explanations' },
  { criterion: 'Brand safety and conflicts', one: 'Recent competitor deal or risky content', five: 'No conflicts, professional tone' },
]

const sources = [
  {
    label: 'TopRank Marketing, B2B influencer marketing statistics and trends (August 20, 2025)',
    href: TOPRANK_STATS,
  },
  {
    label: 'MarketingProfs, summary of the TopRank Marketing and Ascend2 2025 B2B influencer study',
    href: MARKETINGPROFS_STUDY,
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

export default function BuildTechInfluencerShortlistPage() {
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
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Workflow</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A step-by-step workflow for campaign managers: where to collect names, which columns to fill, how to
            filter and score, and how to order your outreach, with time estimates for each step.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 24, 2026</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How many creators should be on a shortlist?</h2>
            <AnswerBox>
              Aim for about 10 outreach targets for a campaign needing three to five creators. Start from a
              longlist of around 100 names, filter to about 40, score down to 20, then deep-check those 20 to pick
              the final 10. Replies and declines shrink any list, so the extra names protect your timeline.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>longlist</strong> is every creator who might fit, collected fast with no judging. A{' '}
              <strong>shortlist</strong> is the ranked set of creators you will contact, each with a reason to be
              there. The longlist feeds the shortlist through two cuts: hard filters, which remove anyone who
              fails a must-have, and a <strong>scorecard</strong>, which ranks the rest. <strong>Outreach</strong>{' '}
              is the last step, run in waves from the top of the ranking.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              The numbers 100, 40, 20 and 10 are a planning ratio we suggest, not a measured benchmark. Adjust
              them to your campaign: a niche such as embedded security has fewer creators, so your longlist might
              stop at 50.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Finding the right people is the hard part for most teams. In a 2025 survey of 404 US marketers at
              B2B firms by TopRank Marketing and Ascend2, 48% named identifying, qualifying and connecting with
              ideal influencers as their top challenge (
              <ExternalLink href={TOPRANK_STATS}>TopRank Marketing</ExternalLink>,{' '}
              <ExternalLink href={MARKETINGPROFS_STUDY}>MarketingProfs</ExternalLink>). Scope of this guide: B2B
              tech brands working with creators on YouTube, LinkedIn, X, TikTok and Instagram. Last updated
              November 24, 2026. For the wider picture, start with our{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>
                complete guide to tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Workflow overview */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The workflow at a glance</h2>
            <AnswerBox>
              Five stages, each with a target count and a time budget. One person working alone finishes in two
              to three working days. The time estimates are our planning figures for a manual process.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Stage</th>
                    <th className={thClass}>Count</th>
                    <th className={thClass}>Work</th>
                    <th className={thClass}>Time (estimate)</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelRows.map((row) => (
                    <tr key={row.stage}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.stage}</td>
                      <td className={tdClass}>{row.count}</td>
                      <td className={tdClass}>{row.work}</td>
                      <td className={tdClass}>{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Total: roughly 11 to 16 hours. Most of the time goes into the scoring and deep-check stages, where
              you watch or read real content. Do not skip those to save time; they decide who represents your
              brand.
            </p>
          </section>

          {/* Longlist */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Build the longlist</h2>
            <AnswerBox>
              Pull names from four or five sources in one sitting and paste them into one sheet. Speed matters
              more than accuracy here. Record the source of every name so you learn which sources produce good
              creators.
            </AnswerBox>
            <Checklist
              items={[
                <>
                  <strong>Platform search.</strong> Search YouTube, LinkedIn and X for the problems your product
                  solves, not your product category. &quot;Reduce AWS bill&quot; finds better creators than
                  &quot;cloud influencer&quot;.
                </>,
                <>
                  <strong>Your own audience.</strong> Ask sales, support and developer relations which creators
                  customers mention, and check who your followers follow.
                </>,
                <>
                  <strong>Competitor and adjacent sponsorships.</strong> Creators who already promote tools in
                  your space understand B2B deals. Note conflicts for later.
                </>,
                <>
                  <strong>Recommendations.</strong> Each good creator follows and collaborates with others. Check
                  guests, collaborations and shout-outs.
                </>,
                <>
                  <strong>Marketplaces.</strong> On{' '}
                  <Link href="/creators" className={linkClass}>
                    Infoishai
                  </Link>{' '}
                  you filter tech creators by platform, niche and country, and every creator on it signed up for
                  brand work.
                </>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              For more sources by platform, read our guide on{' '}
              <Link href="/blog/how-to-find-tech-influencers-b2b-2026" className={linkClass}>
                how to find B2B tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Columns */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What data to collect?</h2>
            <AnswerBox>
              Collect only what you use to filter, score or pitch. Fifteen columns cover it: identity, platform,
              market, niche, typical reach, activity, sponsorship history, contact route, source, filter result,
              scores, wave, status and pitch notes.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Column</th>
                    <th className={thClass}>Why it matters</th>
                  </tr>
                </thead>
                <tbody>
                  {columnRows.map((row) => (
                    <tr key={row.column}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.column}</td>
                      <td className={tdClass}>{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Fill the first five columns at the longlist stage. Fill reach, activity and sponsorship columns only
              for creators who pass the filters. Keep the sheet in a shared drive or your CRM (customer
              relationship management tool) so a teammate picks it up if you are away.
            </p>
          </section>

          {/* Filtering */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Filter with hard rules</h2>
            <AnswerBox>
              A hard filter is a yes or no rule. If a creator fails one, remove them and write the reason. Filters
              are fast, so run them before any scoring.
            </AnswerBox>
            <Checklist
              negative
              items={[
                <>No post in the last 60 days.</>,
                <>Wrong market or language for this campaign.</>,
                <>Off-topic: fewer than a third of recent posts relate to your category.</>,
                <>A sponsorship with a direct competitor in the last three months, or one running now.</>,
                <>No way to reach them: no email, form, open DMs or marketplace profile.</>,
                <>Content your legal or brand team would not approve.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Set the thresholds before you start, and keep them for the whole list. Changing a rule halfway
              through means re-checking every name you already filtered.
            </p>
          </section>

          {/* Scoring */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you rank creators?</h2>
            <AnswerBox>
              Score every filtered creator from 1 to 5 on five criteria, total the scores, and sort. Use the
              median of the last ten posts for reach, not the follower count. Break ties on audience fit.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Criterion</th>
                    <th className={thClass}>Score 1</th>
                    <th className={thClass}>Score 5</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreRows.map((row) => (
                    <tr key={row.criterion}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.criterion}</td>
                      <td className={tdClass}>{row.one}</td>
                      <td className={tdClass}>{row.five}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              This quick score takes about ten minutes per creator and gets you from 40 names to 20. For the top
              20, run a deeper check: watch two full videos or read five posts, scan comments for real
              practitioners, and look for signs of bought engagement. Our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>
                10-point tech influencer vetting scorecard
              </Link>{' '}
              covers the deep check in detail.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Two people scoring the same list will disagree. If a teammate helps, both score the same five
              creators first and compare, so you agree on what a 3 and a 5 look like before splitting the work.
            </p>
          </section>

          {/* Worked example */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">A worked example</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              <em>Illustrative example with fictional creators, not a client case.</em> A database startup wants
              four YouTube and LinkedIn creators for a launch aimed at backend developers in the US and UK.
            </p>
            <Checklist
              items={[
                <>
                  <strong>Longlist, 104 names:</strong> 45 from YouTube and LinkedIn search, 20 from an Infoishai
                  search, 18 from competitor sponsorships, 12 from the sales team, 9 from collaborations.
                </>,
                <>
                  <strong>Filtered, 38 names:</strong> 30 removed for inactivity, 19 for wrong topic, 9 for a
                  competitor deal, 8 for wrong market.
                </>,
                <>
                  <strong>Scored, top 20:</strong> &quot;Creator A&quot;, a backend engineer with a mid-sized
                  channel and steady views, scores 23 of 25. A bigger general coding channel scores 16 on weak
                  audience fit.
                </>,
                <>
                  <strong>Shortlist, 10 names:</strong> the deep check drops six for shallow content and four for
                  comment sections full of generic replies.
                </>,
              ]}
            />
          </section>

          {/* Outreach order */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Set the outreach order</h2>
            <AnswerBox>
              Contact the shortlist in two waves. Wave 1 is your top five plus anyone with a long lead time. Wave
              2 goes out once wave 1 replies come in or a week passes, whichever is first.
            </AnswerBox>
            <Checklist
              items={[
                <>
                  <strong>Lead time first.</strong> Some larger YouTube channels book sponsorship slots weeks
                  ahead, so put them in wave 1 even if they rank sixth.
                </>,
                <>
                  <strong>One message per creator.</strong> Use the Notes column to mention a specific post. Copy
                  and paste pitches get ignored.
                </>,
                <>
                  <strong>One follow-up.</strong> If no reply after five to seven days, send one short nudge, then
                  move on.
                </>,
                <>
                  <strong>Keep the 11th to 20th names.</strong> They are your reserve if wave 2 falls short.
                </>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Before the first message, have a brief ready. Our{' '}
              <Link href="/blog/tech-creator-brief-template" className={linkClass}>
                tech creator brief template
              </Link>{' '}
              shows what to include.
            </p>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Using Infoishai search to build your list</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai is a free marketplace for tech creators on YouTube, LinkedIn, X, TikTok and Instagram, with
              no platform fees for brands or creators. Filter by platform, niche and country to fill the
              marketplace part of your longlist, and message creators directly from their profiles. When you run a
              campaign, add creators to it as shortlisted and track each one through contacted, negotiating and
              confirmed with our{' '}
              <Link href="/campaigns" className={linkClass}>
                campaign tools
              </Link>
              .
            </p>
            <p className="text-gray-700 leading-relaxed">
              Infoishai lists only creators who signed up, so use it next to platform search, not instead of it.
              If you prefer a team to build the shortlist and run outreach, our{' '}
              <Link href="/pricing" className={linkClass}>
                managed service
              </Link>{' '}
              is priced by custom quote.
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
              Last updated November 24, 2026. The 100 to 10 ratio, the time estimates, the filter thresholds and
              the worked example are our planning suggestions, not measured data. The survey figure covers US
              marketers at B2B firms with 100 or more employees.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Use Infoishai search to build your list</h2>
          <p className="text-blue-800 mb-6">
            Filter tech creators by platform, niche and country, then message them directly. Free for brands, no
            platform fees.
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
