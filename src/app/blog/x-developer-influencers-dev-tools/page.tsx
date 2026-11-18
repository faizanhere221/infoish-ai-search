// src/app/blog/x-developer-influencers-dev-tools/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/x-developer-influencers-dev-tools'
const HEADLINE = 'Using X for Developer Marketing: Working with Creators on Launches'
const META_TITLE = 'X for Developer Marketing: Working with Creators'
const DESCRIPTION =
  'Is X still worth it for dev-tool launches? Learn how to work with developer creators on X, what formats to sponsor and how to judge results honestly.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'x twitter developer influencers for dev tools',
    'twitter tech influencers',
    'developer twitter marketing',
    'x creators for startups',
    'how to launch a dev tool on x with creators',
    'developer influencer threads sponsorship',
    'x sponsored thread pricing',
    'build in public marketing',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-18T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['X (Twitter)', 'Developer Marketing', 'Dev Tools', 'Playbook'],
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
  datePublished: '2026-11-18',
  dateModified: '2026-11-18',
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

const SO_SURVEY = 'https://survey.stackoverflow.co/2025/technology/'
const BUFFER_LINKS = 'https://buffer.com/resources/links-on-x/'
const PPC_LAND_LINKS = 'https://ppc.land/x-drops-year-old-link-penalty-musk-tells-zuckerberg-on-platform/'
const TECHCRUNCH_LABEL =
  'https://techcrunch.com/2026/03/02/x-ads-paid-partnership-labels-for-creators-so-they-can-ditch-the-hashtags/'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const formatRows = [
  {
    format: 'Sponsored thread',
    best: 'Explaining a problem step by step, with your tool as one of the steps',
    ask: 'Real code or terminal screenshots, one tracked link, a clear label',
    measure: 'Replies from developers, link clicks, sign-ups',
  },
  {
    format: 'Single post with a demo clip',
    best: 'Showing one feature in under a minute',
    ask: 'A screen recording on a real project, not a slide deck',
    measure: 'Video views, replies asking how it works',
  },
  {
    format: 'Build-in-public update',
    best: 'Creators who ship their own projects and report progress',
    ask: 'Your tool used inside their project, shown over two or three updates',
    measure: 'Repeat mentions, profile visits, trials from the tracked link',
  },
  {
    format: 'Quote post on your launch',
    best: 'Launch day reach from a trusted voice',
    ask: 'An honest first take after real hands-on time',
    measure: 'Reach on launch day, traffic spike on the tracked link',
  },
  {
    format: 'Pinned post for a set period',
    best: 'Keeping a tutorial or offer visible to profile visitors',
    ask: 'Agreed start and end dates in the contract',
    measure: 'Clicks over the pinned period',
  },
]

const timelineRows = [
  {
    when: 'Two weeks before',
    action:
      'Book three to five creators. Give each one a working account, docs and a direct line to an engineer. Agree on format, posting window, label and link.',
  },
  {
    when: 'One week before',
    action:
      'Creators build something real with the product. Collect questions and bugs they hit, and fix or document them before launch.',
  },
  {
    when: 'Launch day',
    action:
      'Post from your company and founder accounts first. Creators publish in a staggered window across the day. Your team answers replies under every creator post.',
  },
  {
    when: 'Days two to four',
    action:
      'Creators share a follow-up: a deeper thread, a bug they found, or a second use case. Quote the best replies from your own account.',
  },
  {
    when: 'One week after',
    action:
      'Collect analytics screenshots, compare tracked clicks and sign-ups per creator, and decide who gets a second round.',
  },
]

const sources = [
  {
    label:
      'Stack Overflow 2025 Developer Survey, Technology section, community platforms question (30,190 responses)',
    href: SO_SURVEY,
  },
  {
    label: 'Buffer, Do Posts with Links Affect Content Performance on X? (October 14, 2025)',
    href: BUFFER_LINKS,
  },
  {
    label: 'PPC Land, report on the July 2026 link penalty exchange between X leaders and Mark Zuckerberg (July 30, 2026)',
    href: PPC_LAND_LINKS,
  },
  {
    label: 'TechCrunch, X adds paid partnership labels for creators (March 2, 2026)',
    href: TECHCRUNCH_LABEL,
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

export default function XDeveloperInfluencersDevToolsPage() {
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
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">X (Twitter)</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A platform playbook for dev-tool founders and marketers: where X fits in 2026, which creator formats to
            sponsor, a launch-week timeline, and how to tell a real developer audience from a noisy one.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 18, 2026</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Is X still useful for developer marketing?</h2>
            <AnswerBox>
              Yes, for launches and for reaching founders, indie hackers and AI builders, but X is a smaller
              developer channel than YouTube, GitHub or Reddit. Use X creators for launch-week reach and fast
              feedback, track every link, and pair X with a second channel so one feed algorithm never decides your
              launch.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>X developer influencer marketing for dev tools</strong> means paying or partnering with
              developers who post on X, so they show your API, SDK, CLI or platform to their followers in their own
              words. The goal is trust from people who write code, not mass reach.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: dev-tool, API and developer platform companies working with independent creators on X, in any
              country. X product facts were checked on November 18, 2026, and X changes its ranking and features
              often. New to creator marketing? Start with the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>
                complete guide to tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Key terms */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Key terms for developer marketing on X</h2>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <p className="text-gray-700">
                <strong>X:</strong> the social network formerly called Twitter. Posts are short by default, with
                longer posts available to paid Premium subscribers.
              </p>
              <p className="text-gray-700">
                <strong>Thread:</strong> a chain of connected posts from one account on X. Threads are the main X
                format for step-by-step technical content, so most sponsored developer content on X is a thread.
              </p>
              <p className="text-gray-700">
                <strong>Developer audience:</strong> followers who write, review or ship code, as opposed to
                followers interested in tech news. Only the first group signs up for an API key.
              </p>
              <p className="text-gray-700">
                <strong>Launch:</strong> a planned release of a product or feature, often with a set date, a launch
                post and a burst of outside coverage in the same week.
              </p>
              <p className="text-gray-700">
                <strong>Build in public:</strong> a habit of sharing progress, numbers and mistakes on a project
                while building it. Many <strong>indie hackers</strong>, solo founders who build small software
                businesses, do this on X, and their followers are often other builders.
              </p>
            </div>
          </section>

          {/* State of X */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The state of X for developers in 2026</h2>
            <AnswerBox>
              X reaches a smaller share of developers than several other platforms, and link posts have a mixed
              record on reach. It still works for launches when you pick creators with engaged developer followers
              and judge them on their own analytics.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The Stack Overflow 2025 Developer Survey asked which community platforms developers used considerably
              or consistently in the past year. Of 30,190 people who answered, 17.1% picked X. LinkedIn got 37.2%,
              Reddit 53.7%, YouTube 60.5% and public GitHub 66.9% (
              <ExternalLink href={SO_SURVEY}>Stack Overflow, 2025</ExternalLink>). The survey reaches Stack Overflow
              users, so treat it as a signal, not a census. Still, the message is clear: X is one channel in a
              developer mix, not the whole mix.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Links are the second issue. In July 2026, X&apos;s head of product Nikita Bier told Mark Zuckerberg he
              no longer needed to put links in replies, and Elon Musk wrote X had not penalised posts with links
              &quot;for over a year&quot; (
              <ExternalLink href={PPC_LAND_LINKS}>PPC Land, July 2026</ExternalLink>). Earlier outside data told a
              different story. Buffer studied 18.8 million X posts from 71,000 accounts and reported link posts from
              regular accounts fell to zero engagement after March 2025, while Premium accounts kept some engagement
              on link posts (<ExternalLink href={BUFFER_LINKS}>Buffer, October 2025</ExternalLink>).
            </p>
            <p className="text-gray-700 leading-relaxed">
              What this means for you: don&apos;t assume either claim holds for a given creator. Ask each creator
              for the analytics of their last few posts with and without links, and agree on link placement (in the
              post or the first reply) based on their numbers.
            </p>
          </section>

          {/* Formats */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which X creator formats work for dev tools?</h2>
            <AnswerBox>
              Threads and short demo clips do most of the work. Build-in-public updates suit tools a creator uses in
              their own project, and quote posts give launch-day reach. Buy the format the creator already posts
              well.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Format</th>
                    <th className={thClass}>Best for</th>
                    <th className={thClass}>What to ask for</th>
                    <th className={thClass}>What to measure</th>
                  </tr>
                </thead>
                <tbody>
                  {formatRows.map((row) => (
                    <tr key={row.format}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.format}</td>
                      <td className={tdClass}>{row.best}</td>
                      <td className={tdClass}>{row.ask}</td>
                      <td className={tdClass}>{row.measure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Developers reward proof. A thread with a real repo, a real error message and a fix beats a polished
              feature list every time. If you also plan longer video, our{' '}
              <Link href="/blog/tech-youtuber-campaign-playbook" className={linkClass}>
                tech YouTuber campaign playbook
              </Link>{' '}
              covers briefs and timelines for YouTube.
            </p>
          </section>

          {/* Sponsor a thread */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you sponsor a developer thread?</h2>
            <AnswerBox>
              Give the creator a real problem, working access and freedom to write. Agree on the label, the link,
              the posting window and one round of fact checks. Then let your engineers answer every technical reply
              under the thread.
            </AnswerBox>
            <ol className="list-decimal list-inside text-gray-700 space-y-3 mb-6">
              <li>
                <strong>Pick the problem, not the feature.</strong> &quot;How I cut cold starts on serverless
                functions&quot; earns more reads than &quot;Tool X now supports Y&quot;.
              </li>
              <li>
                <strong>Set up access a week early.</strong> A real account, real limits and docs. Developers spot a
                demo sandbox fast.
              </li>
              <li>
                <strong>Approve facts, not tone.</strong> Check pricing, limits and benchmarks. Leave the voice and
                any criticism alone.
              </li>
              <li>
                <strong>Label it.</strong> Since March 2026, X offers a &quot;Paid Partnership&quot; label creators
                switch on for a post, and it shows below the post content (
                <ExternalLink href={TECHCRUNCH_LABEL}>TechCrunch, March 2026</ExternalLink>). Our guide to{' '}
                <Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>
                  influencer disclosure rules for B2B
                </Link>{' '}
                covers what the law expects beyond the platform label.
              </li>
              <li>
                <strong>Use one tracked link per creator.</strong> Our{' '}
                <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>
                  UTM tracking guide
                </Link>{' '}
                walks through the setup.
              </li>
            </ol>
          </section>

          {/* Launch timeline */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">A launch-week timeline with X creators</h2>
            <AnswerBox>
              Book creators two weeks out, let them build with the product for a week, publish in a staggered window
              on launch day, run follow-ups on days two to four, and review results one week after.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>When</th>
                    <th className={thClass}>What happens</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineRows.map((row) => (
                    <tr key={row.when}>
                      <td className={`${tdClass} font-semibold text-gray-900 whitespace-nowrap`}>{row.when}</td>
                      <td className={tdClass}>{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              <em>Illustrative example (fictional):</em> a three-person team launches an open-source database
              migration CLI. Two backend creators write threads on migrating a real side project, one indie hacker
              posts a build-in-public update using the tool, and the founder replies to every question. Each
              creator gets their own UTM link, so the team sees which audience installed the CLI.
            </p>
          </section>

          {/* Vetting */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Signals an X audience is real developers</h2>
            <AnswerBox>
              Look at who replies, not how many follow. Real developer audiences ask specific technical questions,
              share code and push back on claims. Generic praise and engagement-bait replies point to a broad tech
              news audience.
            </AnswerBox>
            <Checklist
              items={[
                <>Replies include code, error messages or questions about edge cases.</>,
                <>Repliers have their own GitHub links, projects or job titles in their bios.</>,
                <>The creator ships things: a public repo, a product, a library or a technical blog.</>,
                <>Past sponsored posts got real questions, not only emoji replies.</>,
                <>The creator shares post analytics, including link clicks, when you ask.</>,
              ]}
            />
            <Checklist
              negative
              items={[
                <>Most posts are &quot;top 10 AI tools&quot; lists or reposted news.</>,
                <>Follower count jumped fast with no matching jump in replies.</>,
                <>The same accounts reply to every post with generic praise.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              For a full scoring sheet, use our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>
                tech influencer vetting scorecard
              </Link>
              . For the search itself, read{' '}
              <Link href="/blog/how-to-find-tech-influencers-b2b-2026" className={linkClass}>
                how to find B2B tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Costs */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What does X creator marketing cost?</h2>
            <AnswerBox>
              No public rate card exists for X, and prices vary with niche, audience fit, format and usage rights.
              A thread with a demo and follow-ups costs more than a single post. Ask each creator for a rate card and
              compare it with published benchmarks.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed">
              Pay for the work behind the post. A good developer thread takes hours of hands-on testing. Budget for
              the creator&apos;s time with the product, a follow-up post and any right to reuse the content in your
              own ads. Current ranges by platform and tier are in our guide to{' '}
              <Link href="/blog/tech-influencer-rates-2026" className={linkClass}>
                tech influencer rates
              </Link>
              .
            </p>
          </section>

          {/* Measurement */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to measure X creator results honestly</h2>
            <AnswerBox>
              Judge X creators on developer actions: tracked clicks, sign-ups, API keys created, installs and
              technical replies. Impressions show reach, not intent. Collect analytics screenshots seven days after
              each post.
            </AnswerBox>
            <Checklist
              items={[
                <>Tracked clicks and sign-ups per creator, from unique UTM links.</>,
                <>Activation events: API keys created, first deploy, CLI installs, repo stars in the launch week.</>,
                <>Technical replies counted by hand, as a sign of the right audience.</>,
                <>A &quot;how did you hear about us?&quot; field on sign-up, since many developers type the URL later.</>,
              ]}
            />
          </section>

          {/* Alternatives */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What to do when X reach is unreliable</h2>
            <AnswerBox>
              Never put a whole launch on one feed. Pair X with a channel where developers search or subscribe, such
              as YouTube tutorials or LinkedIn posts from engineers, and reuse the best X thread there.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              YouTube and GitHub reach more developers in the Stack Overflow data above, and YouTube tutorials keep
              getting found through search months after a launch. LinkedIn suits tools sold to engineering managers
              and platform teams. Our playbook on{' '}
              <Link href="/blog/linkedin-influencer-marketing-b2b-tech" className={linkClass}>
                LinkedIn influencer marketing for B2B tech
              </Link>{' '}
              covers formats there.
            </p>
            <p className="text-gray-700 leading-relaxed">
              A simple rule: ask your X creators for the right to repost their thread as a LinkedIn document post or
              turn it into a short video, so one piece of hands-on work reaches two audiences.
            </p>
          </section>

          {/* Getting started */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to start with X creators this month</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              On Infoishai you{' '}
              <Link href="/creators" className={linkClass}>
                browse verified tech creators
              </Link>{' '}
              and filter by platform, niche and country across nine countries. Message creators directly, send a
              deal proposal, or{' '}
              <Link href="/campaigns" className={linkClass}>
                post a campaign
              </Link>{' '}
              creators apply to. Once a creator joins, one tracker holds the offer, contract, deliverables and
              payment records. Infoishai is free for brands and creators. There are no platform fees. Payments are
              made directly between brand and creator, and Infoishai keeps the record.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Prefer to hand the work off? Our{' '}
              <Link href="/pricing" className={linkClass}>
                managed service
              </Link>{' '}
              runs creator campaigns for you, priced by custom quote.
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
              Last updated November 18, 2026. Survey figures describe Stack Overflow survey respondents, not all
              developers. The link reach data comes from Buffer&apos;s 2025 analysis and predates the July 2026
              statements from X. The database migration example is fictional.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Browse X creators</h2>
          <p className="text-blue-800 mb-6">
            Find verified tech creators on X, YouTube, LinkedIn, TikTok and Instagram, and message them directly. No
            platform fees for brands or creators.
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
