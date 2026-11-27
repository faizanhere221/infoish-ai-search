// src/app/blog/product-launch-influencer-campaign-timeline/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/product-launch-influencer-campaign-timeline'
const HEADLINE = 'Product Launch Influencer Campaign: A 12-Week Timeline for Tech Teams'
const META_TITLE = 'Product Launch Influencer Campaign: 12-Week Timeline'
const DESCRIPTION =
  'Plan a tech product launch with creators: a 12-week timeline covering shortlist, briefing, embargoes, launch-week content and post-launch reuse.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'product launch influencer campaign timeline',
    'launch campaign creators saas',
    'product hunt creators',
    'influencer launch plan',
    'how early to brief creators before launch',
    'embargo creators launch',
    'launch week creator content',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-27T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Strategy', 'Product Launch', 'Influencer Marketing', 'B2B Marketing'],
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
  datePublished: '2026-11-27',
  dateModified: '2026-11-27',
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

const PRODUCT_HUNT_LAUNCH = 'https://www.producthunt.com/launch'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// Week 10 is launch week. Each workstream lists the weeks it is active.
const ganttRows = [
  { stream: 'Goals and budget', weeks: [1] },
  { stream: 'Shortlist and vetting', weeks: [1, 2, 3] },
  { stream: 'Outreach and offers', weeks: [3, 4, 5] },
  { stream: 'Contracts and embargo terms', weeks: [4, 5, 6] },
  { stream: 'Brief and early access', weeks: [6, 7] },
  { stream: 'Drafts and review', weeks: [7, 8, 9] },
  { stream: 'Scheduling and final checks', weeks: [9] },
  { stream: 'Launch week content', weeks: [10] },
  { stream: 'Reuse and reporting', weeks: [11, 12] },
]

const weekRows = [
  {
    weeks: 'Week 1',
    task: 'Fix the launch date, goal (signups, waitlist, Product Hunt ranking, press) and creator budget.',
    owner: 'Launch lead',
  },
  {
    weeks: 'Weeks 1 to 3',
    task: 'Build a long list of 15 to 25 creators. Vet audience fit, past sponsored posts and posting schedule.',
    owner: 'Marketing',
  },
  {
    weeks: 'Weeks 3 to 5',
    task: 'Pitch the top 8 to 12. Share the launch window, not the product details. Agree fees and formats.',
    owner: 'Marketing',
  },
  {
    weeks: 'Weeks 4 to 6',
    task: 'Sign contracts with the embargo date, deliverables, usage rights and disclosure terms.',
    owner: 'Marketing and legal',
  },
  {
    weeks: 'Weeks 6 to 7',
    task: 'Send the brief and early access: accounts, demo data, a contact on your product team.',
    owner: 'Product and marketing',
  },
  {
    weeks: 'Weeks 7 to 9',
    task: 'Review drafts for accuracy, not tone. Fix bugs creators report. Lock the posting schedule.',
    owner: 'Product and marketing',
  },
  {
    weeks: 'Week 9',
    task: 'Confirm the embargo time in each creator’s time zone. Test every tracking link and promo code.',
    owner: 'Marketing',
  },
  {
    weeks: 'Week 10',
    task: 'Launch week. Content goes live in a planned order. Your team answers comments and questions.',
    owner: 'Everyone',
  },
  {
    weeks: 'Weeks 11 to 12',
    task: 'Reuse the best content, report results, pay creators on schedule and book follow-up posts.',
    owner: 'Marketing',
  },
]

const launchWeekRows = [
  { day: 'Launch day, first hours', content: 'YouTube video and LinkedIn posts from your 2 to 3 lead creators.' },
  { day: 'Launch day, later', content: 'X threads and short videos on TikTok and Instagram.' },
  { day: 'Days 2 to 3', content: 'Second wave: tutorials, use cases, replies to common questions.' },
  { day: 'Days 4 to 7', content: 'Creator stories and reposts, plus your own recap with creator clips.' },
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

export default function ProductLaunchInfluencerTimelinePage() {
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
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Product Launch
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            For launch leads at SaaS, AI and developer tools companies: a week-by-week plan from shortlist to
            launch day, how embargoes work with creators, and how to keep launch content working after the
            launch.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 27, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>9 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {/* Direct answer */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">When should creators be briefed?</h2>
            <AnswerBox>
              Brief creators three to four weeks before launch, and start outreach eight to ten weeks out. Tech
              creators need time to test your product, script, film and edit, and the best ones book sponsors weeks
              ahead. Give them early access with the brief, agree an embargo date in the contract and leave two
              weeks for draft review.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>product launch influencer campaign timeline</strong> is the schedule for every creator
              task tied to a launch: finding creators, signing them, briefing them, reviewing drafts and
              publishing on launch day. This guide uses a 12-week plan with launch week in week 10, which leaves
              two weeks for reuse and reporting.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Four terms carry the plan. The <strong>launch</strong> is the public release date of your product
              or feature. <strong>Early access</strong> is a working account or build you give creators before
              the launch, so they review the real product. A <strong>creator briefing</strong> is the document
              and call where you explain the product, the audience, the key messages and the rules. An{' '}
              <strong>embargo</strong> is an agreement not to publish before a set date and time.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The launch date sets the embargo, and the embargo protects the launch. Every creator who has early
              access holds their content until the embargo lifts, so all posts land together on launch day.
              Scope: B2B tech launches with creators on YouTube, LinkedIn, X, TikTok and Instagram. The weeks,
              creator counts and schedules here are planning guidance, not measured data. Last updated November
              27, 2026. New to creator campaigns? Read our{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>
                complete guide to tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Why timeline */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why the timeline matters</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Most launch campaigns with creators go wrong on time, not on budget. A brand books creators two
              weeks before launch, the top YouTubers are already booked, and the ones who say yes rush a video
              after one day with the product. The result reads like an ad, and viewers notice.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Tech content takes longer than lifestyle content. A creator reviewing a developer tool needs to set
              it up, build something with it and hit the rough edges. The testing finds bugs too, which is a bonus
              when it happens before launch instead of in a public video.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Running your first creator campaign of any kind? Our guide to your{' '}
              <Link href="/blog/first-tech-influencer-campaign-startup-guide-2026" className={linkClass}>
                first tech influencer campaign
              </Link>{' '}
              covers the basics this plan builds on.
            </p>
          </section>

          {/* Gantt */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The 12-week plan at a glance</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Each shaded cell is a week a workstream is active. Week 10 is launch week. Count backwards from your
              launch date to set real calendar dates.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Workstream</th>
                    {WEEKS.map((week) => (
                      <th
                        key={week}
                        className={`border-b border-gray-200 px-2 py-3 text-center font-bold ${
                          week === 10 ? 'text-blue-700' : 'text-gray-900'
                        }`}
                      >
                        W{week}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ganttRows.map((row) => (
                    <tr key={row.stream}>
                      <td className={`${tdClass} font-semibold text-gray-900 whitespace-nowrap`}>{row.stream}</td>
                      {WEEKS.map((week) => (
                        <td key={week} className="border-b border-gray-100 px-1 py-2">
                          <div
                            className={`h-5 rounded ${
                              row.weeks.includes(week) ? (week === 10 ? 'bg-pink-500' : 'bg-blue-500') : ''
                            }`}
                            aria-label={row.weeks.includes(week) ? `Active in week ${week}` : undefined}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Week by week</h3>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>When</th>
                    <th className={thClass}>Task</th>
                    <th className={thClass}>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {weekRows.map((row) => (
                    <tr key={row.weeks}>
                      <td className={`${tdClass} font-semibold text-gray-900 whitespace-nowrap`}>{row.weeks}</td>
                      <td className={tdClass}>{row.task}</td>
                      <td className={tdClass}>{row.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Weeks 1-4 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Weeks 1 to 4: goals, shortlist and outreach</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Start with one main goal. Signups, a waitlist, a Product Hunt ranking and press coverage each need
              different creators. A Product Hunt push favours creators with an engaged X or LinkedIn following
              among founders and makers. A signup goal favours YouTube tutorials with a link in the description.
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">How many creators per launch?</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              For most B2B tech launches, 5 to 10 creators is enough. Pick 2 or 3 lead creators for long-form
              content (a YouTube review, a detailed LinkedIn post) and 3 to 7 supporting creators for short posts
              and threads. Sign one or two extra creators as backups, since someone always gets sick or slips a
              deadline.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Build the shortlist from creators who already talk about your category. Our{' '}
              <Link href="/blog/build-tech-influencer-shortlist" className={linkClass}>
                guide to building a tech influencer shortlist
              </Link>{' '}
              has a vetting process. When you pitch, share the launch window and the category, and save product
              details for after the contract is signed.
            </p>
          </section>

          {/* Weeks 5-8 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Weeks 5 to 8: contracts, embargo and briefing</h2>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">What is an embargo?</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              An embargo is a written promise from the creator not to publish, tease or mention the product before
              a set date and time. It covers posts, stories, comments and private messages to other people. The
              embargo lifts at the launch time, and every creator publishes on schedule from there.
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Embargo guidance</h3>
            <Checklist
              items={[
                <>
                  <strong>Write it into the contract.</strong> State the exact lift time with a time zone, for
                  example 9:00 a.m. Eastern Time on the launch date.
                </>,
                <>
                  <strong>Define what is covered.</strong> Name, screenshots, features, pricing and the launch date
                  itself, if the date is secret.
                </>,
                <>
                  <strong>Allow teasers on purpose.</strong> If you want &quot;something new is coming&quot; posts,
                  list what creators are allowed to say and when.
                </>,
                <>
                  <strong>Plan for a moved date.</strong> Say what happens if your launch slips: the embargo moves
                  with it, and the creator gets notice.
                </>,
                <>
                  <strong>Limit early access.</strong> Give each creator their own account, so you know who has what.
                </>,
                <>
                  <strong>Use platform scheduling.</strong> Ask creators to schedule posts in advance where the
                  platform supports it, so nobody posts early by mistake.
                </>,
              ]}
            />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">The brief and early access</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Send the brief with early access in weeks 6 to 7. Include the product story, three key messages,
              the target viewer, claims to avoid, the call to action, tracking links and the disclosure rules.
              Our{' '}
              <Link href="/blog/tech-creator-brief-template" className={linkClass}>
                tech creator brief template
              </Link>{' '}
              gives you a starting point. Book a 30-minute call with your product team so creators ask questions
              directly.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Some creators review products in exchange for early access alone. If you go this route, see our
              guide to{' '}
              <Link href="/blog/product-seeding-tech-creators" className={linkClass}>
                product seeding with tech creators
              </Link>
              . Free access still counts as a material connection, so paid and gifted content both need clear
              disclosure. Our{' '}
              <Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>
                disclosure rules guide
              </Link>{' '}
              explains the rules.
            </p>
          </section>

          {/* Launch week */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Launch week: weeks 9 and 10</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Week 9 is for checks. Approve the last drafts, confirm each lift time in the creator&apos;s own time
              zone and click every tracking link. Week 10 is the launch. Plan the order of posts, so your launch
              gets attention for the whole week instead of one loud hour.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>When</th>
                    <th className={thClass}>Launch week creator content</th>
                  </tr>
                </thead>
                <tbody>
                  {launchWeekRows.map((row) => (
                    <tr key={row.day}>
                      <td className={`${tdClass} font-semibold text-gray-900 whitespace-nowrap`}>{row.day}</td>
                      <td className={tdClass}>{row.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Product Hunt launches</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Product Hunt</strong> is a site where makers post new tech products and the community votes
              them up a daily leaderboard. If your launch includes it, line up creator posts for the same day and
              ask creators to link to your launch page in their own words. Product Hunt sets its own rules on
              launch timing and on how to ask for support. Read the current{' '}
              <ExternalLink href={PRODUCT_HUNT_LAUNCH}>Product Hunt launch guide</ExternalLink> before you brief
              creators, and never pay for votes.
            </p>
            <p className="text-gray-700 leading-relaxed">
              On launch day, keep someone from your team in the comments of every creator post. Questions about
              pricing, integrations and bugs get answered fast, and the creator sees you care about their audience.
            </p>
          </section>

          {/* After launch */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">After launch: weeks 11 and 12</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Launch content keeps working after launch week if you planned for it. Post-launch reuse covers four
              moves:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-3 mb-6">
              <li>
                <strong>Paid ads.</strong> Run the best creator posts as ads to your target accounts. You need paid
                usage rights in the contract. Our guide to{' '}
                <Link href="/blog/repurpose-creator-content-paid-ads-b2b" className={linkClass}>
                  turning creator content into B2B paid ads
                </Link>{' '}
                covers rights and setup.
              </li>
              <li>
                <strong>Owned channels.</strong> Embed creator videos on your launch page, docs and onboarding
                emails, if the licence allows it.
              </li>
              <li>
                <strong>Sales.</strong> Give your sales team links to creator reviews for follow-up emails.
              </li>
              <li>
                <strong>Follow-up posts.</strong> Book the strongest creators for a 30- or 60-day update, once
                real users have tried the product.
              </li>
            </ol>
            <p className="text-gray-700 leading-relaxed">
              Report results by creator and by platform within two weeks of launch, using the tracking links set up
              in week 9. Pay every creator on the agreed date. Creators who were treated well say yes to your next
              launch.
            </p>
          </section>

          {/* Checklist */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Launch checklist</h2>
            <Checklist
              items={[
                'Launch date, main goal and creator budget agreed (week 1)',
                'Shortlist of 15 to 25 vetted creators (week 3)',
                '5 to 10 creators signed, plus one or two backups (week 6)',
                'Embargo lift time with time zone in every contract (week 6)',
                'Brief, early access accounts and product call sent (week 7)',
                'All drafts reviewed for accuracy (week 9)',
                'Tracking links and promo codes tested (week 9)',
                'Team on comment duty for launch week (week 10)',
                'Paid usage rights confirmed before any ads (week 11)',
                'Results report and creator payments done (week 12)',
              ]}
            />
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Plan your launch with Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai is free for brands and creators, with no platform fees. Find tech creators on YouTube,
              LinkedIn, X, TikTok and Instagram, message them and send offers. Our{' '}
              <Link href="/campaigns" className={linkClass}>
                campaign management tools
              </Link>{' '}
              track each creator&apos;s offer, contract, deliverables and payment record, which keeps a 10-creator
              launch in one place. Payments are made directly between brand and creator. Infoishai keeps the
              record.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Short on time before launch? Our{' '}
              <Link href="/pricing" className={linkClass}>
                managed influencer marketing service
              </Link>{' '}
              gives you a dedicated account manager for creator strategy, outreach and coordination, with a custom
              quote for each brand.
            </p>
          </section>

          {/* Sources */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Sources</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>
                <ExternalLink href={PRODUCT_HUNT_LAUNCH}>Product Hunt, Launch Guide (accessed November 2026)</ExternalLink>
              </li>
            </ul>
            <p className="text-sm text-gray-500">
              Last updated November 27, 2026. The 12-week plan, creator counts, embargo guidance, launch week
              schedule and checklist are our planning guidance, not measured data. This is not legal advice: have
              a lawyer review embargo and usage terms.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Plan your launch with us</h2>
          <p className="text-blue-800 mb-6">
            Tell us your launch date and goals, and our team will plan the creators and timeline with you. Prefer
            to run it yourself? The marketplace is free for brands.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Plan Your Launch
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
