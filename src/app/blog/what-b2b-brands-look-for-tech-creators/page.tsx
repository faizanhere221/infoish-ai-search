// src/app/blog/what-b2b-brands-look-for-tech-creators/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/what-b2b-brands-look-for-tech-creators'
const HEADLINE = 'What B2B Brands Look for in a Tech Creator (and How to Show It)'
const META_TITLE = 'What B2B Brands Look For in a Tech Creator'
const DESCRIPTION =
  'Brands vet tech creators on audience fit, content quality and reliability, not followers alone. Use this checklist to prepare your profile and pitch.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'what b2b brands look for in a tech creator',
    'how brands choose creators',
    'tech creator checklist brands',
    'brand deal readiness',
    'what makes a tech creator attractive to saas',
    'creator audit before pitching brands',
    'b2b creator credibility',
    'tech creator media kit',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-23T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Creators', 'Brand Deals', 'B2B Marketing', 'Media Kit'],
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
  datePublished: '2026-11-23',
  dateModified: '2026-11-23',
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
const LINKEDIN_ANALYTICS = 'https://news.linkedin.com/2022/december/new-analytics-to-understand-your-audience-and-grow-on-linkedin'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const scorecardRows = [
  {
    area: 'Audience fit',
    question: 'Do your viewers or followers do the job the brand sells to?',
    strong: 'Analytics screenshots by job title, industry or country, plus comments from practitioners',
  },
  {
    area: 'Niche focus',
    question: 'Do most of your last 20 posts sit in one or two topics?',
    strong: 'A clear niche line in your bio, for example "Kubernetes and platform engineering"',
  },
  {
    area: 'Engagement quality',
    question: 'Do people ask real questions under your posts?',
    strong: 'Saved posts, thoughtful comments, replies from engineers or buyers',
  },
  {
    area: 'Technical credibility',
    question: 'Do you show the product working, or only talk about it?',
    strong: 'Screen recordings, code, setup steps, honest limits',
  },
  {
    area: 'Past work',
    question: 'Does a brand see a sponsored piece you made before?',
    strong: 'Two or three links with a short note on the result',
  },
  {
    area: 'Professionalism',
    question: 'Do you reply fast, hit dates and follow the brief?',
    strong: 'A stated response time, clear delivery days and revision terms',
  },
  {
    area: 'Clear pricing',
    question: 'Does a brand know your price before the first call?',
    strong: 'Listed packages per platform with a starting price',
  },
]

const sources = [
  {
    label: 'TopRank Marketing, 2025 B2B Influencer Marketing Statistics and Trends (August 20, 2025)',
    href: TOPRANK_STATS,
  },
  {
    label: 'LinkedIn, New analytics to understand your audience and grow on LinkedIn (December 2022)',
    href: LINKEDIN_ANALYTICS,
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

export default function WhatB2BBrandsLookForTechCreatorsPage() {
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
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Checklist</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">For creators</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            The signals B2B tech brands check before they send a creator an offer, a self-audit scorecard to
            grade yourself, and the profile and pitch changes to fix the gaps.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 23, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>8 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {/* Intro */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What do SaaS brands look for in creators?</h2>
            <AnswerBox>
              SaaS and other B2B tech brands look for an audience of the people they sell to, a clear technical
              niche, real engagement in the comments, proof of past work and a creator who replies fast and
              delivers on time. Follower count matters less than fit. A small, relevant audience often beats a
              large, mixed one.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>What B2B brands look for in a tech creator</strong> is the set of signals a marketer checks
              before paying for content: who your audience is, what you post about, how people respond, what you
              made before and how you work. Brands buying for developer tools, AI products, cloud or security sell
              to a narrow group of buyers. They pay for access to those buyers and for your credibility with them.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: creators on YouTube, LinkedIn, X, TikTok and Instagram who want deals with B2B tech brands.
              This post covers how brands judge you and how to show it. For the outreach step, read our guide on{' '}
              <Link href="/blog/tech-creators-guide-how-to-get-brand-deals-2026" className={linkClass}>
                how tech creators get brand deals
              </Link>
              . For the wider picture, read the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>
                complete guide to tech influencers
              </Link>
              . Last updated November 23, 2026.
            </p>
          </section>

          {/* How brands decide */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How brands decide</h2>
            <AnswerBox>
              B2B marketers rank professionalism, authenticity, brand alignment, audience alignment and engagement
              above reach. Cost sits on the same list. A brand wants to know your audience buys, your content
              fits, and working with you is easy.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              In TopRank Marketing&apos;s 2025 B2B influencer research, marketers named the attributes they treat
              as non-negotiable when they pick partners: professionalism (42%), authenticity (33%), brand alignment
              (33%), audience alignment (31%), engagement rate (31%) and cost or pricing (31%) (
              <ExternalLink href={TOPRANK_STATS}>TopRank Marketing, 2025</ExternalLink>). Follower count is not on
              the list.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              In practice, a brand marketer screens you in three passes:
            </p>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Fit (about a minute)</h3>
                <p className="text-gray-700">
                  Your bio, your niche and your last ten posts. Does the topic match the product? Would the
                  brand&apos;s buyers follow you?
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Proof (a few minutes)</h3>
                <p className="text-gray-700">
                  Audience data, comment quality and past sponsored work. The marketer looks for evidence your
                  audience is real and relevant.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Risk (before the offer)</h3>
                <p className="text-gray-700">
                  Response speed, clear pricing, delivery terms and anything in your history the brand&apos;s
                  legal or security team would flag.
                </p>
              </div>
            </div>
          </section>

          {/* 100k */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Do you need 100k followers?</h2>
            <AnswerBox>
              No. B2B brands sell to small, specific groups, so a creator with a few thousand engineers or IT
              buyers in the audience is worth more to them than a large general tech audience. Fit and proof decide
              the deal, not a follower milestone.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              A database tool sells to backend engineers. A security product sells to security leads. If your
              audience is mostly those people, your follower count is a smaller part of the decision. Smaller
              creators also tend to cost less per post, which lets a brand test with you before a bigger deal.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Brands still look at reach for awareness campaigns, so a larger audience helps. It does not replace
              fit. Our guide to{' '}
              <Link href="/blog/micro-vs-macro-tech-influencers" className={linkClass}>
                micro vs macro tech influencers
              </Link>{' '}
              explains how brands weigh the two.
            </p>
          </section>

          {/* Audience quality */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you show audience quality?</h2>
            <AnswerBox>
              Show who your audience is with platform analytics, and show how they engage with examples. Audience
              demographics prove the right people see your posts. Engagement proves they care. A brand needs both.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Audience demographics</strong> are the facts about your followers: country, age, job title,
              industry and seniority. <strong>Engagement</strong> is how those followers react: comments, saves,
              shares and replies. Demographics without engagement suggest a passive audience. Engagement without
              the right demographics means the wrong people are active. Brands look for the overlap.
            </p>
            <Checklist
              items={[
                <>
                  <strong>Screenshots, dated.</strong> Export the audience tab from YouTube Studio or your other
                  platforms, and add the month. LinkedIn creator analytics includes audience details such as job
                  title, location and industry (
                  <ExternalLink href={LINKEDIN_ANALYTICS}>LinkedIn, 2022</ExternalLink>).
                </>,
                <>
                  <strong>Comment examples.</strong> Pick three threads where practitioners asked technical
                  questions. These show depth no follower count shows.
                </>,
                <>
                  <strong>Country split.</strong> A brand selling in the US or Germany wants to see viewers there.
                </>,
                <>
                  <strong>Honest averages.</strong> Share typical views per post over the last few months, not your
                  one viral hit.
                </>,
              ]}
            />
          </section>

          {/* Scorecard */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Self-audit scorecard</h2>
            <AnswerBox>
              Score yourself 0, 1 or 2 on each of the seven areas below. A total of 11 or more means you are ready
              to pitch. Below 8, fix the weakest areas first. The scoring is our own working rule, not an industry
              standard.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Area</th>
                    <th className={thClass}>Ask yourself</th>
                    <th className={thClass}>What strong looks like (2 points)</th>
                  </tr>
                </thead>
                <tbody>
                  {scorecardRows.map((row) => (
                    <tr key={row.area}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.area}</td>
                      <td className={tdClass}>{row.question}</td>
                      <td className={tdClass}>{row.strong}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Score 0 when you have nothing to show, 1 when the proof exists but sits in your head or your
              analytics, and 2 when a brand sees it on your profile or media kit without asking.
            </p>
          </section>

          {/* Weak vs strong */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Weak vs strong: an example</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              <em>The two profiles below are fictional, written to show the difference.</em>
            </p>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Weak</h3>
                <p className="text-gray-700">
                  &quot;Tech lover. I review gadgets, apps, AI and more. 40K followers. DM for collabs.&quot; No
                  audience data, no past work, no prices.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Strong</h3>
                <p className="text-gray-700">
                  &quot;I teach platform engineers to run Kubernetes in production. Most of my LinkedIn audience
                  works in software engineering and IT. Past work: two sponsored tutorials for observability tools.
                  Integrated video from $X. Replies within 24 hours.&quot; Same follower count, a much easier yes.
                </p>
              </div>
            </div>
          </section>

          {/* Profile tips */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What to put on your profile</h2>
            <AnswerBox>
              Put your niche in one line, your platforms with live links and follower counts, packages with
              starting prices, delivery days, your response time and the languages you create in. Brands decide
              faster when they don&apos;t have to ask.
            </AnswerBox>
            <Checklist
              items={[
                <>
                  <strong>A niche bio.</strong> Name the topic and the audience: &quot;AI tools for data
                  teams&quot; beats &quot;tech content&quot;.
                </>,
                <>
                  <strong>Every platform you post on.</strong> Add the URL and a current follower count for each.
                </>,
                <>
                  <strong>Priced services.</strong> One line per package, for example a LinkedIn post or a YouTube
                  integration, with a price, delivery days and revisions included.
                </>,
                <>
                  <strong>Response time and availability.</strong> Brands with a launch date filter for creators
                  who answer fast.
                </>,
                <>
                  <strong>A media kit link.</strong> Our{' '}
                  <Link href="/blog/creator-media-kit-guide-tech-influencers" className={linkClass}>
                    creator media kit guide
                  </Link>{' '}
                  covers what goes in it.
                </>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              On Infoishai, your creator profile holds each of these fields: bio, niches, languages, platforms with
              followers, services with prices and delivery days, minimum budget and response time. Brands browse
              these profiles on the{' '}
              <Link href="/creators" className={linkClass}>
                creator marketplace
              </Link>{' '}
              and message you directly.
            </p>
          </section>

          {/* Mistakes */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Mistakes behind lost deals</h2>
            <Checklist
              negative
              items={[
                <>Pitching every brand in tech, so no brand sees itself in your content.</>,
                <>Hiding prices until a call. Many marketers skip creators with no starting rate.</>,
                <>Showing your best view count as if it were your average.</>,
                <>Slow replies. A brand with a launch date moves to the next creator.</>,
                <>Reading a script about a product you never opened. Technical audiences notice.</>,
                <>Skipping the sponsorship disclosure. It puts the brand at legal risk.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Before you sign, read the brief and the terms closely. Our{' '}
              <Link href="/blog/tech-creator-brief-template" className={linkClass}>
                tech creator brief template
              </Link>{' '}
              shows what a good brief from a brand includes.
            </p>
          </section>

          {/* Next step */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Next step</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Run the scorecard, fix your two lowest areas, then update your profile and media kit. Once you
              score 11 or more, start pitching brands whose buyers match your audience.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Infoishai is a free marketplace for tech creators and B2B tech brands. There are no platform fees.
              Brands find you, message you, send offers or shortlist you for campaigns, and you apply to open
              campaigns yourself. Payments are made directly between brand and creator, and Infoishai keeps the
              record.
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
              Last updated November 23, 2026. The scorecard thresholds are our own working rule. The two profile
              examples are fictional.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Create your creator profile</h2>
          <p className="text-blue-800 mb-6">
            Show B2B tech brands your niche, audience and prices in one place. Free for creators, no platform fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup/creator"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Join as a Creator
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/blog/tech-creators-guide-how-to-get-brand-deals-2026"
              className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-3 rounded-lg font-medium border border-blue-300 transition-colors"
            >
              Read the Brand Deals Guide
            </Link>
          </div>
        </div>

        <PillarGuideLink />
      </article>
    </div>
  )
}
