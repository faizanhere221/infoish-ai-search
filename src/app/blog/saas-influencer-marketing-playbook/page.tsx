// src/app/blog/saas-influencer-marketing-playbook/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/saas-influencer-marketing-playbook'
const HEADLINE = 'SaaS Influencer Marketing Playbook: From Awareness to Trial Sign-Ups'
const META_TITLE = 'SaaS Influencer Marketing Playbook: Awareness to Trials'
const DESCRIPTION =
  'A funnel-based SaaS influencer marketing playbook: which creators, platforms and deliverables fit each stage, plus KPIs and a first campaign budget.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'saas influencer marketing strategy',
    'influencer marketing for saas',
    'b2b saas creator marketing',
    'saas influencer campaign',
    'saas influencer marketing funnel',
    'how to run saas influencer campaign step by step',
    'saas influencer marketing kpis',
    'product-led growth influencer marketing',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-09T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['SaaS', 'Tech Influencers', 'Strategy', 'B2B'],
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
  datePublished: '2026-11-09',
  dateModified: '2026-11-09',
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

const OUTLIERKIT = 'https://outlierkit.com/resources/youtube-sponsorship-rates/'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const funnelRows = [
  {
    stage: 'Awareness',
    goal: 'Buyers learn the problem has a better fix',
    creators: 'Tech commentators and larger channels whose viewers match your buyer',
    deliverables: '60 to 90 second YouTube integration, LinkedIn post, short video',
    kpis: 'Views from the right audience, branded search, new visitors',
  },
  {
    stage: 'Consideration',
    goal: 'Buyers see the product work and compare it',
    creators: 'Practitioners and educators who teach the job your product does',
    deliverables: 'Dedicated tutorial, comparison video, LinkedIn document post, X thread',
    kpis: 'Watch time, clicks on the tracked link, pricing page visits',
  },
  {
    stage: 'Trial or demo',
    goal: 'Buyers start a trial or book a call',
    creators: 'Niche creators with a loyal, specific audience',
    deliverables: 'Setup walkthrough with an extended trial code, co-hosted webinar or live stream',
    kpis: 'Trial sign-ups, demo requests, activation rate, cost per trial',
  },
  {
    stage: 'Expansion',
    goal: 'Existing users adopt more and upgrade',
    creators: 'Power users and creators who already use the product',
    deliverables: 'Advanced feature tutorials, templates, a short use-case series',
    kpis: 'Feature adoption, upgrades, retention of creator-sourced users',
  },
]

const motionRows = [
  {
    item: 'Main conversion',
    plg: 'Trial or free sign-up',
    slg: 'Demo request',
  },
  {
    item: 'Best-fit creators',
    plg: 'YouTube tutorial channels, developer creators on X, short-form demo creators',
    slg: 'LinkedIn creators followed by your buyer’s job title, podcast and webinar hosts',
  },
  {
    item: 'Core deliverable',
    plg: 'A tutorial ending in a tracked sign-up link',
    slg: 'A recurring series or a co-hosted session ending in a demo offer',
  },
  {
    item: 'Offer in the content',
    plg: 'Extended trial or a credit on the first paid month',
    slg: 'A tailored demo, an audit or a benchmark report',
  },
  {
    item: 'Time to judge results',
    plg: 'Weeks',
    slg: 'Months, in line with your sales cycle',
  },
  {
    item: 'Main tracking',
    plg: 'UTM link, trial code, product analytics',
    slg: 'UTM link, a "how did you hear about us" field, CRM source',
  },
]

// Illustrative starting split. Our suggestion, not benchmark data.
const budgetRows = [
  { line: 'Consideration content (tutorials, comparisons)', plg: '50%', slg: '30%' },
  { line: 'Awareness placements', plg: '20%', slg: '20%' },
  { line: 'Recurring LinkedIn series or co-hosted sessions', plg: '0%', slg: '30%' },
  { line: 'Paid usage rights and ads behind the best content', plg: '15%', slg: '10%' },
  { line: 'Reserve for a second round with the top creator', plg: '15%', slg: '10%' },
]

const sources = [
  { label: 'Outlier Kit, YouTube sponsorship rates (updated September 13, 2026)', href: OUTLIERKIT },
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

export default function SaasInfluencerMarketingPlaybookPage() {
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
              SaaS
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Which creators, platforms and deliverables fit each stage of a SaaS funnel, how to measure them, and how to plan your first 90 days.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 9, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>11 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">

          {/* Intro */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Does influencer marketing work for SaaS?</h2>
            <AnswerBox>
              Yes, when your product has a clear buyer and the creator&apos;s audience matches your buyer. It works best for products people try on their own, where a demo video leads straight to a free trial. In long enterprise sales, creators build trust and familiarity, but they rarely close the deal by themselves.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>SaaS influencer marketing strategy</strong> is a plan for using independent creators to move software buyers from first hearing about a product to starting a trial or booking a demo, and later to upgrading. A good plan names the buyer, the funnel stage each creator serves, the deliverable, the offer and the number you will judge it by.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Most SaaS teams skip the funnel part. They book one creator, send traffic to the homepage, and judge the result by sign-ups in the first week. This playbook gives you a stage-by-stage map instead, two versions for product-led and sales-led companies, and an honest list of cases where creators are the wrong spend.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: global, covering the five platforms Infoishai supports (YouTube, LinkedIn, X, TikTok and Instagram). Last updated November 9, 2026. If you are new to the topic, start with the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>complete guide to tech influencers</Link>.
            </p>
          </section>

          {/* Why SaaS is different */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why is SaaS different from other influencer marketing?</h2>
            <AnswerBox>
              SaaS buyers rarely buy from one video. They try the product first, often involve colleagues, and pay every month. So a SaaS campaign aims at trials and demos, not instant sales, and its real value shows up in retention.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              A consumer brand often measures a creator post by sales in the next few days. Software works on a different clock. Four things change the plan:
            </p>
            <Checklist
              items={[
                <><strong>The first conversion is free.</strong> A trial or a demo is the goal of the content, and payment comes later inside the product or through sales.</>,
                <><strong>Several people decide.</strong> A developer finds the tool, a team lead approves it, and finance signs off. Each one trusts different voices.</>,
                <><strong>Revenue repeats.</strong> A customer who stays two years is worth far more than one who leaves after a month, so the quality of sign-ups matters more than the count.</>,
                <><strong>Tech audiences spot weak ads.</strong> Viewers of tech content notice a scripted read fast. Creators who show the product doing real work earn more trust.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed mb-6">
              Two terms come up through the rest of this guide. <strong>Product-led growth</strong> (PLG) means the product drives sign-ups itself through a free plan or self-serve trial. <strong>Sales-led growth</strong> means a sales team runs the buying process, and a demo call is the main entry point.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The two conversions connect. A <strong>trial sign-up</strong> is a person creating an account to use the product on their own. A <strong>demo request</strong> is a person asking your team for a guided walkthrough. In a PLG company, trials come first and demo requests often follow when a trial user hits a team or security question. In a sales-led company, the demo request is the front door, and a trial, if one exists, happens after the call. Our guide to{' '}
              <Link href="/blog/b2b-vs-b2c-influencer-marketing-tech-2026" className={linkClass}>B2B vs B2C tech influencer marketing</Link> covers the wider differences.
            </p>
          </section>

          {/* Funnel map */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The SaaS influencer marketing funnel: who fits each stage</h2>
            <AnswerBox>
              Match each creator to one funnel stage. Broad tech creators build awareness, practitioners drive consideration, niche creators with a loyal audience drive trials and demos, and power users help existing customers expand.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Use this matrix to plan deliverables and KPIs before you contact anyone. One creator often covers two neighbouring stages, but a brief built for one stage is easier to judge.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Stage</th>
                    <th className={thClass}>Goal</th>
                    <th className={thClass}>Creator type</th>
                    <th className={thClass}>Deliverables</th>
                    <th className={thClass}>KPIs</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelRows.map((row) => (
                    <tr key={row.stage}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.stage}</td>
                      <td className={tdClass}>{row.goal}</td>
                      <td className={tdClass}>{row.creators}</td>
                      <td className={tdClass}>{row.deliverables}</td>
                      <td className={tdClass}>{row.kpis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Awareness</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              The aim here is recognition. A buyer who has seen your name twice is more likely to click a search result or reply to a sales email later. Short integrations in popular videos and single LinkedIn posts fit this stage. Do not expect many trials from it, and do not judge it by trials alone.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Consideration</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Buyers at this stage compare tools. <strong>YouTube demos</strong> do the heavy lifting: a full tutorial where a creator sets up your product and solves a real task. Comparisons with tools the viewer already uses work well too, as long as the creator keeps editorial control. A LinkedIn document post with screenshots serves buyers who prefer to read.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Trial or demo</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Give the audience a reason to act now: an extended trial, a credit or a tailored demo. Send them to a landing page built for the creator&apos;s audience, with the same words the creator used. A co-hosted webinar or live build session works well for sales-led products, since attendees are already warm when sales calls.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Expansion</h3>
            <p className="text-gray-700 leading-relaxed">
              Most SaaS teams forget this stage. Creators who use your product daily make tutorials on advanced features, templates and workflows. Existing customers watch these too, and a user who adopts more features is less likely to cancel. Measure feature adoption and upgrades among users who came through creator links.
            </p>
          </section>

          {/* PLG vs SLG */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Product-led vs sales-led: two versions of the playbook</h2>
            <AnswerBox>
              Product-led SaaS should aim creator content at trial sign-ups and judge it within weeks. Sales-led SaaS should aim at demo requests and influenced pipeline, favour LinkedIn and recurring formats, and judge results over a full sales cycle.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Decision</th>
                    <th className={thClass}>Product-led</th>
                    <th className={thClass}>Sales-led</th>
                  </tr>
                </thead>
                <tbody>
                  {motionRows.map((row) => (
                    <tr key={row.item}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.item}</td>
                      <td className={tdClass}>{row.plg}</td>
                      <td className={tdClass}>{row.slg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Product-led example (illustrative, fictional):</strong> a database tool with a free plan books a dedicated tutorial on a developer YouTube channel. The video ends with a link to a landing page offering 60 days free instead of 14. The team tracks sign-ups from the link and checks how many of those users run their first query within a week.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Sales-led example (illustrative, fictional):</strong> a security platform sold to IT leaders sponsors a monthly LinkedIn series from a creator who writes about compliance work, plus one co-hosted webinar. Sales adds a &quot;how did you hear about us&quot; field to the demo form and tags every deal where a prospect names the creator.
            </p>
          </section>

          {/* Platforms */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which platforms are best for SaaS?</h2>
            <AnswerBox>
              YouTube is the strongest default for SaaS, because tutorials keep earning search views for a long time. LinkedIn fits sales-led products sold to specific job titles. X suits developer tools and launches. TikTok and Instagram suit simple, visual tools for individuals and small teams.
            </AnswerBox>
            <Checklist
              items={[
                <><strong>YouTube:</strong> best for showing the product working. A tutorial titled with a problem your buyer searches for stays useful long after launch. Our guide to{' '}<Link href="/blog/youtube-sponsorship-cost-b2b-saas" className={linkClass}>YouTube sponsorship cost for B2B SaaS</Link> covers pricing.</>,
                <><strong>LinkedIn:</strong> best for reaching managers and decision makers by role. Text posts, document posts and short videos from a respected practitioner warm up buyers before sales reaches out.</>,
                <><strong>X:</strong> strong for developer tools, open source products and launch days. Threads and short demo clips travel fast inside technical communities.</>,
                <><strong>TikTok and Instagram:</strong> fit productivity, design and AI tools for individuals and small teams. Short screen recordings work best. They are a weaker fit for enterprise software with a long sales cycle.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Developer tool companies often run both creators and <strong>dev advocates</strong>. A developer advocate is an employee whose job is to help developers succeed with the product through docs, talks and samples. A creator is independent and brings an audience the company does not own. The two work well together: the advocate makes sure the tutorial is accurate, and the creator brings the viewers.
            </p>
          </section>

          {/* KPIs */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What KPIs matter for SaaS creator campaigns?</h2>
            <AnswerBox>
              Track one main KPI per stage: qualified reach for awareness, clicks and watch time for consideration, trial sign-ups or demo requests for conversion, and upgrades for expansion. Then roll everything up into creator-sourced CAC and the retention of those users.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>CAC</strong>, customer acquisition cost, is what you spend to win one paying customer. For a creator campaign, add creator fees, usage rights, ad spend behind the content and any trial credits, then divide by the paying customers who came through creator links or codes. Compare the result with CAC from your other channels, and look at it again after three to six months, once you know how many of those customers stayed.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Set up four kinds of tracking before anything goes live:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              <li>A unique UTM link for each creator and each deliverable.</li>
              <li>A unique trial code or offer per creator, for viewers who type the address instead of clicking.</li>
              <li>A &quot;how did you hear about us&quot; field on sign-up and demo forms.</li>
              <li>A note of your branded search volume and direct traffic before launch, so you have a baseline.</li>
            </ol>
            <p className="text-gray-700 leading-relaxed">
              Links will miss part of the effect, because many viewers search your name later. Treat the tracked numbers as a floor. Our guide to{' '}
              <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>tracking B2B influencer campaigns with UTMs</Link> walks through the setup step by step.
            </p>
          </section>

          {/* Budget */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How should you split a first SaaS influencer campaign budget?</h2>
            <AnswerBox>
              Put most of a first budget into consideration content, such as tutorials and comparisons, since it serves both awareness and trials. Keep part for putting ads behind the best piece and part for a second round with the creator who performs best.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The split below is our suggested starting point, not benchmark data. Adjust it once you see your own results.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Budget line</th>
                    <th className={thClass}>Product-led</th>
                    <th className={thClass}>Sales-led</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetRows.map((row) => (
                    <tr key={row.line}>
                      <td className={tdClass}>{row.line}</td>
                      <td className={tdClass}>{row.plg}</td>
                      <td className={tdClass}>{row.slg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              To size the budget, start from creator prices. Outlier Kit estimates YouTube integration rates for B2B SaaS and developer tool channels at $40 to $80 per 1,000 views, the highest bracket in its table (
              <ExternalLink href={OUTLIERKIT}>Outlier Kit, updated September 2026</ExternalLink>). These are vendor planning estimates, not transacted deal data. At those rates, a channel with 20,000 median views would quote about $800 to $1,600 for one integration.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Book at least three creators in the first round. One placement tells you about one creator, not about the channel. For LinkedIn pricing, see our{' '}
              <Link href="/blog/linkedin-tech-creator-rates" className={linkClass}>LinkedIn tech creator rates</Link> guide.
            </p>
          </section>

          {/* Wrong lever */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">When is influencer marketing the wrong lever for SaaS?</h2>
            <AnswerBox>
              Skip creators when your buyers do not follow creators, when your onboarding loses most new users, when you need results within two weeks, or when your budget covers only one post. Fix those first, then come back.
            </AnswerBox>
            <Checklist
              negative
              items={[
                <><strong>Your buyers are not on social platforms.</strong> Some niche buyers, such as procurement teams in regulated industries, rarely follow any creator. Events, partners and direct sales reach them better.</>,
                <><strong>Your onboarding leaks.</strong> If most new users never reach the first useful result, creator traffic will leak the same way. Fix activation first.</>,
                <><strong>You need pipeline this month.</strong> Creator content builds over weeks and months. Paid search or outbound sales act faster.</>,
                <><strong>You have budget for one post.</strong> One post rarely proves or disproves anything. Wait until you fund three creators and a second round.</>,
                <><strong>You need to approve every word.</strong> Creators who read a script lose the trust you are paying for. If legal needs line-by-line control, pick paid ads instead.</>,
                <><strong>There is no free trial, demo or clear next step.</strong> A viewer who likes the video needs somewhere to go. Build the landing page and offer first.</>,
              ]}
            />
          </section>

          {/* Mistakes */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Mistakes to avoid in a SaaS influencer campaign</h2>
            <AnswerBox>
              The common mistakes are choosing creators by follower count, scripting every line, sending traffic to the homepage, and judging results after one week. Each one wastes a good creator.
            </AnswerBox>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Choosing by follower count.</strong> Check recent views, comment quality and who the audience is. Our{' '}<Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>vetting scorecard</Link> helps.</li>
              <li><strong>Writing the script for the creator.</strong> Give key points, the offer and the facts to get right. Let the creator choose the words.</li>
              <li><strong>Sending viewers to the homepage.</strong> Use a landing page with the creator&apos;s offer and the same problem framing as the video.</li>
              <li><strong>Judging after a week.</strong> Tutorials keep collecting views. Review at 30 and 90 days.</li>
              <li><strong>Counting only last-click sign-ups.</strong> Add self-reported source and branded search to the picture.</li>
              <li><strong>Skipping disclosure.</strong> Every sponsored post needs a clear label. See our guide to{' '}<Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>influencer disclosure rules for B2B</Link>.</li>
            </ol>
          </section>

          {/* 30-60-90 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to run a SaaS influencer campaign step by step: a 30-60-90 day plan</h2>
            <AnswerBox>
              Spend the first 30 days on the plan, the shortlist and tracking. Run three to five pilot creators in days 31 to 60. Use days 61 to 90 to review cost per trial or demo, renew the best creator and stop the rest.
            </AnswerBox>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Days 1 to 30: plan and prepare</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                  <li>Write down your buyer: job title, company size and the problem they search for.</li>
                  <li>Choose product-led or sales-led goals and one main KPI.</li>
                  <li>Shortlist 10 to 15 creators across one or two platforms, then vet them.</li>
                  <li>Build the landing page, offer, UTM links and trial codes.</li>
                  <li>Write a one-page brief with key points, the offer, disclosure and review rules.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Days 31 to 60: run the pilot</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                  <li>Book three to five creators with a mix of formats, such as two integrations and one tutorial.</li>
                  <li>Review each draft once, for facts and disclosure only.</li>
                  <li>Check clicks, sign-ups and demo requests each week, without changing course too early.</li>
                  <li>Ask sales and support to log any prospect who mentions a creator.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Days 61 to 90: decide and scale</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                  <li>Compare cost per trial or demo by creator, and check how many of those users activated.</li>
                  <li>Renew the top one or two creators with a package of several pieces.</li>
                  <li>Buy usage rights on the best piece and run it as an ad.</li>
                  <li>Stop working with creators who missed the goal, and note why.</li>
                </ul>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              For a fuller walkthrough of a first pilot, read our guide to running your{' '}
              <Link href="/blog/first-tech-influencer-campaign-startup-guide-2026" className={linkClass}>first tech influencer campaign</Link>.
            </p>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Running a SaaS creator campaign with Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              You have two routes. To run it yourself,{' '}
              <Link href="/creators" className={linkClass}>browse verified tech creators</Link> on the free marketplace and message them directly, or post a brief through our{' '}
              <Link href="/campaigns" className={linkClass}>campaign management tools</Link> and let creators apply. Once a creator joins, you track the offer, contract, deliverables and payment records in one place. There are no platform fees. Payments are made directly between brand and creator. Infoishai keeps the record.
            </p>
            <p className="text-gray-700 leading-relaxed">
              To hand the work to a team, use our{' '}
              <Link href="/pricing" className={linkClass}>managed influencer marketing service</Link>. We build the shortlist, brief the creators and run the campaign. Each quote is custom to your campaign.
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
              Last updated November 9, 2026. The rate figures are vendor estimates, not transacted deal data. The examples in this guide are illustrative and fictional, and the budget split is our suggested starting point, not a benchmark. Infoishai does not publish its own campaign results here.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Talk to us about a managed SaaS campaign</h2>
          <p className="text-blue-800 mb-6">
            Tell us your product, buyer and goal, and we will send a creator shortlist and a custom quote. Prefer to run it yourself? The marketplace is free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Talk to Us About a Managed Campaign
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
