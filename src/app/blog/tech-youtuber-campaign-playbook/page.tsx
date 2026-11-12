// src/app/blog/tech-youtuber-campaign-playbook/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/tech-youtuber-campaign-playbook'
const HEADLINE = 'Working with Tech YouTubers: Briefs, Deliverables and Realistic Timelines'
const META_TITLE = 'Tech YouTuber Campaign Playbook: Briefs and Timelines'
const DESCRIPTION =
  'A practical playbook for working with tech YouTubers: what to put in the brief, which deliverables to buy, review rounds, timelines and how to read the results.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'youtube tech influencer marketing for brands',
    'tech youtubers for brand deals',
    'youtube creator sponsorship tech',
    'product review youtubers',
    'how to brief a tech youtuber',
    'youtube sponsorship deliverables checklist',
    'youtube tech review sponsorship rules',
    'sponsored youtube video timeline',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-12T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['YouTube', 'Tech Influencers', 'Strategy', 'Campaigns'],
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
  datePublished: '2026-11-12',
  dateModified: '2026-11-12',
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

const YT_CHAPTERS = 'https://support.google.com/youtube/answer/9884579?hl=en'
const YT_COMMENTS = 'https://support.google.com/youtube/answer/6000964?hl=en'
const YT_PAID_PROMOTION = 'https://support.google.com/youtube/answer/154235?hl=en'
const YT_BRANDED_CONTENT_POLICY = 'https://support.google.com/youtube/answer/17596007?hl=en'
const FTC_DISCLOSURES_101 =
  'https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const deliverableRows = [
  {
    item: 'Dedicated video',
    what: 'A full video about your product, usually a review, tutorial or build',
    ask: 'Real task on screen, honest limits, your link in the first lines of the description',
  },
  {
    item: 'Integration',
    what: 'A sponsor segment of roughly 60 to 120 seconds inside a video on another topic',
    ask: 'One use case shown working, placed early in the video, in the creator’s own words',
  },
  {
    item: 'Pre-roll mention',
    what: 'A short spoken sponsor line in the first seconds of the video',
    ask: 'Your name, the offer and where to find the link',
  },
  {
    item: 'Chapter marker',
    what: 'A named timestamp in the description pointing to the sponsor segment',
    ask: 'A clear label such as "Sponsor: <your product>"',
  },
  {
    item: 'Description link',
    what: 'Your tracked link and offer in the video description',
    ask: 'Above the fold, before the "show more" cut, with a UTM link',
  },
  {
    item: 'Pinned comment',
    what: 'A comment the creator pins to the top of the comments',
    ask: 'The link, the offer and one line on who the product is for',
  },
]

const timelineRows = [
  { step: 'Brief sent and terms agreed', week: 'Week 1', owner: 'Brand, then creator' },
  { step: 'Product access and onboarding call', week: 'Week 1 to 2', owner: 'Brand' },
  { step: 'Outline or script for the sponsor part', week: 'Week 2 to 3', owner: 'Creator' },
  { step: 'Review round 1: outline (facts, claims, offer)', week: 'Week 3', owner: 'Brand, 2 to 3 working days' },
  { step: 'Filming and editing', week: 'Week 3 to 5', owner: 'Creator' },
  { step: 'Review round 2: draft cut (facts and disclosure only)', week: 'Week 5', owner: 'Brand, 2 to 3 working days' },
  { step: 'Final fixes and publish', week: 'Week 5 to 6', owner: 'Creator' },
  { step: 'Results check-ins', week: 'Day 7, 30 and 90 after publish', owner: 'Both' },
]

const sources = [
  {
    label: 'YouTube Help, Video chapters',
    href: YT_CHAPTERS,
  },
  {
    label: 'YouTube Help, Post and interact with comments (pinned comments)',
    href: YT_COMMENTS,
  },
  {
    label: 'YouTube Help, Add branded content restrictions and disclosure labels (paid promotion setting)',
    href: YT_PAID_PROMOTION,
  },
  {
    label: 'YouTube Help, YouTube Branded Content Policies',
    href: YT_BRANDED_CONTENT_POLICY,
  },
  {
    label: 'FTC, Disclosures 101 for Social Media Influencers',
    href: FTC_DISCLOSURES_101,
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

export default function TechYoutuberCampaignPlaybookPage() {
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
            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
              YouTube
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            You booked a tech YouTuber. Now what? This playbook covers the deliverables to ask for, the brief to send, the review rounds to plan, a realistic timeline and how to judge the video once it goes live.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 12, 2026</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you work with tech YouTubers?</h2>
            <AnswerBox>
              Agree on the exact deliverables first: the video format, chapter marker, description link and pinned comment. Send a short brief built around one real task and your offer. Plan two review rounds for facts and disclosure only, allow five to six weeks from brief to publish, and judge results at 7, 30 and 90 days.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>YouTube tech influencer marketing for brands</strong> means paying a creator who reviews, teaches or builds with technology to feature your product in a YouTube video. The creator keeps editorial control and speaks to an audience who trusts their judgment. You supply the product, the facts, the offer and the tracking.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              This guide is for brand marketers running their first or second YouTube sponsorship. It starts after the creator says yes. For the step before, read our guide to{' '}
              <Link href="/blog/how-to-find-tech-youtubers-product-reviews-2026" className={linkClass}>finding tech YouTubers for reviews</Link>. For prices and CPM math, read our breakdown of{' '}
              <Link href="/blog/youtube-sponsorship-cost-b2b-saas" className={linkClass}>YouTube sponsorship cost for B2B SaaS</Link>.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: global, for software, AI, developer tool and hardware brands. The timelines below are planning ranges, not industry benchmarks. Last updated November 12, 2026. New to creator marketing? Start with the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>complete guide to tech influencers</Link>.
            </p>
          </section>

          {/* Deliverables */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What do you buy from a tech YouTuber?</h2>
            <AnswerBox>
              You buy a video format plus the placements around it. The format is a dedicated video, an integration or a pre-roll mention. The placements are a chapter marker, a description link and a pinned comment. Write every item into the agreement, because each one drives clicks long after launch.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              On <strong>YouTube</strong>, the video is the main deliverable, and every other item points viewers from the video to your site. A <strong>dedicated video</strong> is a whole video about your product, so the product is the topic. An <strong>integration</strong> is a sponsor segment inside a video about something else, so the product borrows attention from the topic. A <strong>pre-roll mention</strong> is a short spoken sponsor line at the start of a video. It is read by the creator, and it is not a YouTube ad.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              The relationship between the two main formats is simple. A dedicated video gives the creator room to prove your product works. An integration gives you a slot in front of an audience who came for another topic. Pick a dedicated video when buyers need to see setup, real output and limits. Pick an integration when one clear result explains the product in under two minutes.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Deliverable</th>
                    <th className={thClass}>What it is</th>
                    <th className={thClass}>What to ask for</th>
                  </tr>
                </thead>
                <tbody>
                  {deliverableRows.map((row) => (
                    <tr key={row.item}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.item}</td>
                      <td className={tdClass}>{row.what}</td>
                      <td className={tdClass}>{row.ask}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">YouTube sponsorship deliverables checklist</h3>
            <p className="text-gray-700 leading-relaxed mb-6">Copy this list into the agreement and tick each item on publish day:</p>
            <Checklist
              items={[
                <><strong>Video format and length</strong> of the sponsor part, plus where it sits in the video (first third is a common ask).</>,
                <><strong>Chapter marker.</strong> YouTube chapters need a first timestamp of 00:00, at least three timestamps in ascending order, and chapters of 10 seconds or longer (<ExternalLink href={YT_CHAPTERS}>YouTube Help</ExternalLink>). A labelled sponsor chapter is honest and helps viewers find the demo again.</>,
                <><strong>Description link</strong> with your UTM tags, placed in the first lines before the description cuts off.</>,
                <><strong>Pinned comment.</strong> A creator pins one comment at a time, and pinning a new one replaces the old one (<ExternalLink href={YT_COMMENTS}>YouTube Help</ExternalLink>). Agree on how long yours stays pinned.</>,
                <><strong>Paid promotion setting</strong> switched on in YouTube Studio, plus a spoken label at the start of the segment.</>,
                <><strong>Discount code or trial offer</strong> and its end date.</>,
                <><strong>Usage rights</strong>, if you want to reuse clips in ads or on your site, with a time limit.</>,
                <><strong>Exclusivity</strong>, if any: which rivals, and for how long.</>,
                <><strong>Results data</strong> the creator shares after publish, such as views and audience retention screenshots at day 7 and day 30.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Usage rights and exclusivity add cost. Our{' '}
              <Link href="/blog/youtube-sponsorship-cost-b2b-saas" className={linkClass}>YouTube sponsorship cost guide</Link> explains how these add-ons change the price.
            </p>
          </section>

          {/* Brief */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What should a YouTube creator brief include?</h2>
            <AnswerBox>
              A good YouTube brief fits on one page. It names the viewer, one real task to show, three facts the creator must get right, claims to avoid, the offer and link, the disclosure rules and the review scope. Leave the script, jokes and structure to the creator.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Tech YouTubers turn down briefs full of talking points, and their viewers notice when a segment sounds like ad copy. Give the creator the facts and the goal, then trust their format. Use these eight parts:
            </p>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Goal and viewer</h3>
                <p className="text-gray-700">One sentence. Example: get backend developers to try our API on a side project.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. One real task</h3>
                <p className="text-gray-700">The job the creator does with your product on screen, ideally from their own work.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Three must-get-right facts</h3>
                <p className="text-gray-700">Pricing model, free tier or trial terms, and one key spec. Nothing more.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Known limits and claims to avoid</h3>
                <p className="text-gray-700">What the product does poorly, and phrases you do not want, such as &quot;the fastest&quot; or &quot;the only&quot;, unless you hold proof.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Offer and tracking</h3>
                <p className="text-gray-700">The UTM link, the code, the landing page and the offer end date.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Deliverables</h3>
                <p className="text-gray-700">The checklist above, item by item.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">7. Disclosure</h3>
                <p className="text-gray-700">Spoken label, written label and the paid promotion setting in YouTube Studio.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">8. Review scope and dates</h3>
                <p className="text-gray-700">What you review, how many rounds, and your reply time.</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Disclosure is part of the brief, not an extra. When a creator selects the paid promotion option, YouTube adds a disclosure label at the beginning of the video (<ExternalLink href={YT_PAID_PROMOTION}>YouTube Help</ExternalLink>). YouTube&apos;s Branded Content Policies say creators stay responsible for clear disclosure, and YouTube reserves the right to add a label itself when it finds undisclosed branded content (<ExternalLink href={YT_BRANDED_CONTENT_POLICY}>YouTube Branded Content Policies</ExternalLink>). In the US, the FTC also expects creators to disclose any financial relationship with a brand, including free products (<ExternalLink href={FTC_DISCLOSURES_101}>FTC, Disclosures 101</ExternalLink>).
            </p>
            <p className="text-gray-700 leading-relaxed">
              Rules differ by country. Our guide to{' '}
              <Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>influencer disclosure rules for B2B</Link> covers more markets. This is general information, not legal advice.
            </p>
          </section>

          {/* Review */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do review and approvals work?</h2>
            <AnswerBox>
              Plan two rounds. Review the outline for facts, claims and the offer, then review the draft cut for accuracy and disclosure. Reply within two to three working days each time. Do not rewrite the creator&apos;s voice, structure or opinion, since those are what you paid for.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Most delays in YouTube campaigns come from the brand side: slow replies, new reviewers joining late, or feedback on style. Name one person to approve, and agree on the scope of review in writing before filming starts.
            </p>
            <Checklist
              items={[
                <><strong>Round 1, outline or script:</strong> check facts, pricing, the offer and any claims. Flag missing limits.</>,
                <><strong>Round 2, draft cut:</strong> check on-screen facts, the spoken label, the chapter marker and the description text.</>,
                <><strong>Send one list of notes</strong>, merged from your team, not separate emails from three people.</>,
                <><strong>Mark each note</strong> as &quot;must fix&quot; (wrong fact, missing disclosure) or &quot;suggestion&quot; (everything else).</>,
                <><strong>Respect a negative opinion.</strong> If the creator dislikes a feature, ask for accuracy, not silence. Viewers trust balanced reviews more.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Write the review scope into the agreement. A creator who knows feedback covers facts only works faster and pushes back less.
            </p>
          </section>

          {/* Timeline */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How long does a sponsored video take?</h2>
            <AnswerBox>
              Plan five to six weeks from signed brief to published video for a dedicated video, and around four weeks for an integration. The creator&apos;s upload schedule sets the publish date, so book early around product launches. Add time for hardware shipping or complex product setup.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The table shows a sample plan for one dedicated video. Treat it as a starting point for planning, not a guarantee. Some tech channels book sponsor slots weeks ahead, so ask about the next open slot in your first message.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Step</th>
                    <th className={thClass}>When</th>
                    <th className={thClass}>Who acts</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineRows.map((row) => (
                    <tr key={row.step}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.step}</td>
                      <td className={tdClass}>{row.week}</td>
                      <td className={tdClass}>{row.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              For a launch, work backwards. If your launch day is fixed, send the brief at least six weeks earlier, and ship hardware or grant account access in week one. Building your first campaign from scratch? Our guide to your{' '}
              <Link href="/blog/first-tech-influencer-campaign-startup-guide-2026" className={linkClass}>first tech influencer campaign</Link> covers budget and outreach.
            </p>
          </section>

          {/* Results */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you read the results?</h2>
            <AnswerBox>
              Check results three times. At day 7, look at views and retention through the sponsor segment. At day 30, look at clicks, sign-ups and cost per sign-up. At day 90, look at paid customers. YouTube videos keep earning search views for months, so a slow first week is not a verdict.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              You do not see the creator&apos;s YouTube Analytics, so ask for the numbers in the agreement. Useful ones are views, average view duration, and the audience retention graph around the sponsor segment. A sharp drop at the start of the segment tells you the hand-off to your product needs work next time.
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Day 7:</strong> views, retention through the segment, comment questions about your product.</li>
              <li><strong>Day 30:</strong> clicks from the UTM link, sign-ups or demo requests, cost per sign-up.</li>
              <li><strong>Day 90:</strong> paid customers or qualified pipeline, cost per customer, views still growing from search.</li>
            </ol>
            <p className="text-gray-700 leading-relaxed mb-6">
              Many viewers type your brand name into search instead of clicking. Add a &quot;how did you hear about us&quot; field to sign-up and treat tracked clicks as a floor. Our guide to{' '}
              <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>tracking B2B influencer campaigns with UTMs</Link> walks through the setup.
            </p>
          </section>

          {/* Mistakes */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why do sponsored tech videos underperform?</h2>
            <AnswerBox>
              Most weak sponsored tech videos share a few causes: a scripted read, a segment placed too late, no real demo, a link buried in the description, a poor fit between product and audience, or a brand who judged the video after one week.
            </AnswerBox>
            <Checklist
              negative
              items={[
                <><strong>Scripted reads.</strong> Viewers skip segments in ad voice. Give facts, not lines.</>,
                <><strong>Late placement.</strong> A segment near the end reaches fewer viewers, since retention drops over the video.</>,
                <><strong>No demo.</strong> Tech viewers want proof. A product named but never shown turns into a claim.</>,
                <><strong>Buried link.</strong> A link below ten other links gets few clicks. Ask for the top of the description and a pinned comment.</>,
                <><strong>Audience mismatch.</strong> A consumer gadget channel rarely sells a developer API. Check who comments, not only subscriber counts.</>,
                <><strong>Weak landing page.</strong> Viewers land on a generic homepage with no sign of the offer they heard about.</>,
                <><strong>Too many review rounds.</strong> Delays push the video past your launch and annoy the creator.</>,
                <><strong>Judging too early.</strong> Search views build over months. Wait for the 90-day check before you drop a creator.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Working with creators in India? See our list of{' '}
              <Link href="/blog/top-indian-tech-youtubers-brand-partnerships-2026" className={linkClass}>Indian tech YouTubers for brands</Link>.
            </p>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Running a YouTube campaign on Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai is a free marketplace for tech creators only. You{' '}
              <Link href="/creators" className={linkClass}>browse verified tech creators</Link>, filter by platform, niche and country, and message them directly. You also{' '}
              <Link href="/campaigns" className={linkClass}>post a campaign</Link> and let creators apply. Once a creator joins, our campaign management tools track the offer, contract, deliverables and payment records for each creator in one place.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              There are no platform fees for brands or creators. Payments are made directly between brand and creator. Infoishai keeps the record.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Want a team to run the campaign for you? Our{' '}
              <Link href="/pricing" className={linkClass}>managed service</Link> builds the shortlist, writes the brief and handles reviews, with a custom quote for each project.
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
              Last updated November 12, 2026. Timelines and review rounds are planning ranges based on common practice, not measured benchmarks. YouTube features and policies change, so check the linked help pages before you sign. Disclosure rules are summarised for general information and are not legal advice.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Start a campaign with YouTube creators</h2>
          <p className="text-blue-800 mb-6">
            Post your brief, let verified tech YouTubers apply, and track every deliverable in one place. Infoishai is free for brands and creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/campaigns"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Start a Campaign
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
