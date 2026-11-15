// src/app/blog/pitch-tech-brands-creator-email-template/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/pitch-tech-brands-creator-email-template'
const HEADLINE = 'How to Pitch Tech Brands as a Creator: Email Templates to Get Replies'
const META_TITLE = 'Pitch Tech Brands as a Creator: Email Templates'
const DESCRIPTION =
  'Pitch tech and SaaS brands with confidence using email templates for cold, warm and follow-up outreach, plus what to attach, how to quote and when to follow up.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'how to pitch a tech brand as a creator',
    'tech creator brand deal email',
    'pitch email to brands creator',
    'how to get tech brand deals',
    'brand deal pitch template tech youtuber',
    'cold email saas for sponsorship',
    'follow up email brand deal',
    'creator media kit and rate card',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-15T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Creators', 'Brand Deals', 'Pitching', 'Templates'],
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
  datePublished: '2026-11-15',
  dateModified: '2026-11-15',
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

const YT_AUDIENCE = 'https://support.google.com/youtube/answer/9314416'
const FTC_101 = 'https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

type ScreenRow = { check: string; question: string; show: string }

const screenRows: ScreenRow[] = [
  {
    check: 'Topic fit',
    question: 'Does this creator cover the problem our product solves?',
    show: 'Link one or two posts on the same topic as the product, not your most viewed post.',
  },
  {
    check: 'Audience',
    question: 'Are the viewers our buyers or users?',
    show: 'Top countries, age range, and job roles or industries if your analytics show them.',
  },
  {
    check: 'Technical credibility',
    question: 'Will developers or IT buyers trust this person?',
    show: 'A real tutorial, demo or teardown where you used a tool hands-on.',
  },
  {
    check: 'Proof of results',
    question: 'Did past partners get anything measurable?',
    show: 'Views, clicks or sign-ups from past sponsored work, shared with the brand’s permission.',
  },
  {
    check: 'Clear ask',
    question: 'What exactly is on offer, and when?',
    show: 'One format, one timeline, one price range or a link to your rate card.',
  },
  {
    check: 'Low risk',
    question: 'Will this person be easy and safe to work with?',
    show: 'A professional tone, disclosure on past sponsored posts, and a fast reply.',
  },
]

const COLD_TEMPLATE = `Subject: [Product] tutorial idea for [audience] on [platform]

Hi [first name],

I make [platform] videos on [topic] for [audience, e.g. backend
engineers]. I have used [product] for [time] to [specific task].

Idea: a [format, e.g. 60 to 90 second integration] showing how to
[specific use case], aimed at [who in your audience].

Closest past work: [title + link], [views] views in [days] days.

Audience: [top 3 countries], [main age range], [job roles or
industries, if your analytics show them].

Media kit and rates: [link]

Open to a 15-minute call next week?

[Your name]
[Channel link] | [Media kit link]`

const WARM_TEMPLATE = `Subject: [Mutual contact] suggested I reach out about [product]

Hi [first name],

[Mutual contact] at [company or community] mentioned you run creator
partnerships for [product]. [One line on how you know them.]

I cover [topic] for [audience] on [platform]. Last month I published
[title + link], a walkthrough of [related workflow]. Viewers asked
how [product] handles [specific question], so a follow-up video
fits my content plan.

Proposal: [format] in [month], with your sign-up link and a spoken
"sponsored" label up front.

Media kit and rates: [link]

Would a short call this week or next work?

[Your name]`

const FOLLOW_UP_TEMPLATE = `Subject: Re: [original subject]

Hi [first name],

A quick follow-up on my note about a [format] for [product].

One new detail: [new proof, e.g. "my [topic] tutorial passed
[number] views this week" or "I tested [new feature] and built a
short demo"]: [link].

If creator partnerships sit with someone else on your team, a name
helps me reach the right person.

Thanks,
[Your name]`

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

function EmailTemplate({ text }: { text: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto text-sm leading-relaxed mb-6 whitespace-pre">
      {text}
    </pre>
  )
}

export default function PitchTechBrandsCreatorEmailTemplatePage() {
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
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              Guide
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              For Creators
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Tech brands get a steady stream of creator pitches, and most read the same. This guide gives you three email templates (cold, warm intro and follow-up), the six things a B2B marketer checks first, and a simple plan for quoting and following up.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 15, 2026</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do tech creators pitch brands?</h2>
            <AnswerBox>
              Pick a product you already use, find the person who runs creator or partner marketing, and send a short email with one specific content idea, one past post on the same topic, a snapshot of who your audience is, and a link to your media kit and rates. Follow up once or twice, then move on.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Pitching a tech brand as a creator means asking a software, AI, cloud or developer tools company to pay you for content about its product. The difference from consumer pitching is the buyer. A B2B marketer cares less about reach and more about whether your viewers are the engineers, IT leads or founders who use or buy the product.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Four terms come up below. A <strong>pitch email</strong> is the short first message proposing a partnership. A <strong>media kit</strong> is a one or two page profile with your audience, channels and past work. A <strong>rate card</strong> is your price list per format, often a page inside the media kit. A <strong>case study</strong> is a short write-up of one past partnership and its results. The pitch email is the hook; the media kit, rate card and case study are the evidence it links to. Keep the email short and let the attachments carry the detail.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: creators on YouTube, LinkedIn, X, TikTok and Instagram pitching B2B tech brands. Last updated November 15, 2026. For the full path from profile to signed deal, read our guide on{' '}
              <Link href="/blog/tech-creators-guide-how-to-get-brand-deals-2026" className={linkClass}>how tech creators get brand deals</Link>, and for the brand side, the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>complete guide to tech influencers</Link>.
            </p>
          </section>

          {/* Why pitch */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why pitch instead of waiting for inbound</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Many tech companies have no creator program yet. Nobody on the team searches for creators, so no offer arrives. A good pitch puts a ready-made idea in front of a busy marketer, and a ready-made idea is easier to approve than a blank brief.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Pitching also lets you choose. You pick products you trust and topics your audience asks about, instead of taking whatever lands in your inbox. Inbound still matters, and the last section covers how to get both.
            </p>
          </section>

          {/* Research */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What to research before you write</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Spend 20 minutes on each brand before you send anything. You need four answers:
            </p>
            <Checklist
              items={[
                <><strong>Have you used the product?</strong> Pitch tools you know. A creator who says they use a product must be a real user, and your viewers notice a shallow demo fast.</>,
                <><strong>Who is the buyer?</strong> Read the pricing page and the customer stories. A tool sold to platform teams needs a different angle than one sold to solo founders.</>,
                <><strong>Does the brand already work with creators?</strong> Search the brand name plus &quot;sponsored&quot; on YouTube and LinkedIn. Past partners show the formats and creator size the team buys.</>,
                <><strong>Who should get the email?</strong> Look for titles such as partner marketing, developer marketing, community, DevRel or growth. At a small startup, the founder or head of marketing often decides.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Also check timing. A launch, a new feature or a funding announcement gives you a reason to write this month rather than next quarter.
            </p>
          </section>

          {/* Screening table */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What B2B brands check in the first 30 seconds</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              A marketer reading your pitch decides fast whether to open the media kit. The table lists six checks and what to put in front of each one. It reflects common B2B buying criteria, not a survey.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Check</th>
                    <th className={thClass}>The marketer asks</th>
                    <th className={thClass}>What to show</th>
                  </tr>
                </thead>
                <tbody>
                  {screenRows.map((row) => (
                    <tr key={row.check}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.check}</td>
                      <td className={tdClass}>{row.question}</td>
                      <td className={tdClass}>{row.show}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              For audience data, YouTube&apos;s{' '}
              <ExternalLink href={YT_AUDIENCE}>Audience tab</ExternalLink> reports age, gender and top geographies, among other reports. Other platforms show different fields, so use whatever your own analytics give you and say where the numbers come from.
            </p>
          </section>

          {/* What a pitch email includes */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What should a pitch email include?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              A pitch email needs a specific subject line, one line on who you are and who watches you, one content idea, one piece of proof, a link to your media kit and rates, and one clear next step. Keep it under 150 words. Everything else belongs in the attachments.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Weak pitches open with follower counts and end with &quot;let me know if you&apos;re interested.&quot; Strong pitches open with the product and the viewer, and end with a question the marketer answers in one line, such as a call next week.
            </p>
          </section>

          {/* Templates */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Three pitch email templates</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Copy these, fill in the brackets, and cut any line you have no real data for. Never pad a pitch with numbers you have no proof for.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Cold pitch</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Use this when you have no connection to the brand. The idea and the proof do the work.
            </p>
            <EmailTemplate text={COLD_TEMPLATE} />

            <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Warm intro</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Use this when someone the marketer knows suggested you, or when you already talk with the team in a community or at an event. Name the connection in the first line.
            </p>
            <EmailTemplate text={WARM_TEMPLATE} />

            <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Follow-up</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Reply in the same thread so the marketer sees your first email. Add one new piece of proof instead of repeating the ask.
            </p>
            <EmailTemplate text={FOLLOW_UP_TEMPLATE} />

            <p className="text-gray-700 leading-relaxed">
              Example, fictional: Sam, a backend YouTuber, pitches Acme Deploy, a fictional deployment tool. Sam&apos;s subject line reads &quot;Acme Deploy rollback tutorial for Kubernetes engineers on YouTube&quot;, and the proof line links a past video on rollback strategies. Both details tell the marketer the fit in seconds.
            </p>
          </section>

          {/* Attachments */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What to attach or link</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Link rather than attach where possible. Large files land in spam folders, and a link lets you update your numbers without resending.
            </p>
            <Checklist
              items={[
                <><strong>Media kit:</strong> audience snapshot, channels, best tech content and past partners. Our{' '}
                  <Link href="/blog/creator-media-kit-guide-tech-influencers" className={linkClass}>creator media kit guide</Link> walks through each section.</>,
                <><strong>Rate card:</strong> a price or range per format, such as a dedicated video, an integration or a LinkedIn post.</>,
                <><strong>One case study:</strong> only if you have real results and the past brand agreed to share them. If not, skip it.</>,
                <><strong>Two content links:</strong> your best work on the brand&apos;s topic, not your most viral post.</>,
              ]}
            />
          </section>

          {/* Quoting */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to quote your rate</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Put a starting price or a range in your rate card so the marketer knows the deal fits the budget before a call. Price the format, not the follower count: a dedicated tutorial takes more work than a mention and costs more.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              List what each price includes: number of posts, review rounds, link placement and how long the post stays up. Price anything extra as its own line, such as usage rights for ads or exclusivity against competitors. For benchmarks by platform and size, see our guide to{' '}
              <Link href="/blog/tech-creator-sponsorship-rates-2026" className={linkClass}>tech creator sponsorship rates</Link>.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Mention disclosure in your quote. The FTC&apos;s{' '}
              <ExternalLink href={FTC_101}>Disclosures 101</ExternalLink> tells influencers to disclose any financial, employment, personal or family relationship with a brand, and says free or discounted products count. Brands want creators who handle this without being asked. Our guide to{' '}
              <Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>disclosure rules for B2B tech</Link> covers each platform&apos;s label.
            </p>
          </section>

          {/* Follow-up */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">When should you follow up?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Follow up once after about a week, then a final time a week or two later. After two follow-ups with no reply, stop and move the brand to a later list. These timings are a sensible default, not a rule.
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Day 0:</strong> send the pitch on a weekday morning in the marketer&apos;s time zone.</li>
              <li><strong>Around day 5 to 7 (working days):</strong> first follow-up in the same thread, with one new piece of proof.</li>
              <li><strong>Around day 14 to 21:</strong> final follow-up asking for the right contact if partnerships sit elsewhere.</li>
              <li><strong>After a no or no reply:</strong> wait for a new trigger, such as a launch, before you write again.</li>
            </ol>
            <p className="text-gray-700 leading-relaxed">
              Keep a simple sheet with the brand, contact, date sent, follow-up dates and outcome. It stops double emails and shows which angles get replies.
            </p>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Let brands find you on Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Outbound pitching works best alongside inbound. Infoishai is a free marketplace for tech creators on YouTube, LinkedIn, X, TikTok and Instagram. Your profile shows your platforms, niches, services and past work, and tech brands browse it, message you directly or send a deal proposal. You also browse{' '}
              <Link href="/campaigns" className={linkClass}>open brand campaigns</Link> and apply to the ones which fit.
            </p>
            <p className="text-gray-700 leading-relaxed">
              There are no platform fees for creators or brands. Payments are made directly between brand and creator, and Infoishai keeps the record. To get started,{' '}
              <Link href="/signup/creator" className={linkClass}>join as a creator</Link>. It is free.
            </p>
          </section>

          {/* Sources */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Sources</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>
                <ExternalLink href={YT_AUDIENCE}>YouTube Help, Understand your YouTube audience</ExternalLink>
              </li>
              <li>
                <ExternalLink href={FTC_101}>FTC, Disclosures 101 for Social Media Influencers (November 2019)</ExternalLink>
              </li>
            </ul>
            <p className="text-sm text-gray-500">
              Last updated November 15, 2026. Sam, Acme Deploy and all email examples are fictional and for illustration only. Follow-up timings and the screening checks are practical suggestions, not research findings. This guide is general information, not legal advice.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Join as a creator (free)</h2>
          <p className="text-blue-800 mb-6">
            Build a profile tech brands browse, get messages and deal proposals, and apply to campaigns. Infoishai is free for brands and creators. There are no platform fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup/creator"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Create Your Creator Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/campaigns"
              className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-3 rounded-lg font-medium border border-blue-300 transition-colors"
            >
              Browse Open Campaigns
            </Link>
          </div>
        </div>

        <PillarGuideLink />
      </article>
    </div>
  )
}
