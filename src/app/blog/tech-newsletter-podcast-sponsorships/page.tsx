// src/app/blog/tech-newsletter-podcast-sponsorships/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/tech-newsletter-podcast-sponsorships'
const HEADLINE = 'Sponsoring Tech Newsletters and Podcasts: How B2B Brands Buy and Measure'
const META_TITLE = 'Sponsoring Tech Newsletters and Podcasts: A Buyer Guide'
const DESCRIPTION =
  'How to buy tech newsletter and podcast sponsorships: vetting audiences, pricing models, ad formats and how to measure demo requests and sign-ups.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'tech newsletter and podcast sponsorships',
    'sponsor tech newsletter',
    'podcast sponsorship b2b tech',
    'newsletter creators sponsorship cost',
    'how to buy newsletter sponsorships',
    'podcast ad vs creator integration',
    'newsletter cpm b2b',
    'host-read ads',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-20T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Newsletters', 'Podcasts', 'Sponsorships', 'B2B Tech'],
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

const EDISON_2026 = 'https://podnews.net/press-release/infinite-dial-us-2026'
const RBR_IAB_2025 = 'https://rbr.com/iab-digital-audio-grew-10-in-2025/'
const MAILCHIMP_MPP = 'https://mailchimp.com/en-gb/help/apple-privacy-faq/'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const compareRows = [
  {
    factor: 'How people consume it',
    newsletter: 'Read in an inbox, often at a desk',
    podcast: 'Heard or watched, often while commuting or working out',
  },
  {
    factor: 'Best for',
    newsletter: 'A link, a short pitch, a clear next step',
    podcast: 'A story, trust in the host, repeat exposure',
  },
  {
    factor: 'Click tracking',
    newsletter: 'Strong: one tracked link per issue',
    podcast: 'Weak: listeners type a URL or code later',
  },
  {
    factor: 'Main audience metric',
    newsletter: 'Subscribers, unique clicks, click rate',
    podcast: 'Downloads or views per episode in the first 30 days',
  },
  {
    factor: 'Common pricing',
    newsletter: 'Flat fee per issue, or CPM on sends',
    podcast: 'Flat fee per episode, or CPM on downloads',
  },
  {
    factor: 'Lead time',
    newsletter: 'Days to a few weeks',
    podcast: 'Weeks; episodes are often recorded ahead',
  },
]

const pricingRows = [
  {
    model: 'Flat fee per placement',
    how: 'One price for one slot in one issue or episode',
    when: 'Small and mid-size shows; easy to compare with your own CPM math',
  },
  {
    model: 'CPM (cost per thousand)',
    how: 'Price per 1,000 sends, opens or downloads',
    when: 'Larger publishers; confirm which number the CPM counts',
  },
  {
    model: 'Package or bundle',
    how: 'Several issues or episodes, sometimes with a social post',
    when: 'After a test run works; ask for a lower unit price',
  },
  {
    model: 'Performance (CPC or CPA)',
    how: 'Pay per click or per sign-up',
    when: 'Rare in B2B tech; useful only with reliable tracking on both sides',
  },
]

const sources = [
  {
    label: 'Edison Research, The Infinite Dial 2026 (US, age 12+, survey January 2026), via Podnews press release',
    href: EDISON_2026,
  },
  {
    label: 'Radio & Television Business Report, IAB: Digital Audio Grew 10% In 2025 (April 2026), on the IAB/PwC Internet Advertising Revenue Report',
    href: RBR_IAB_2025,
  },
  {
    label: 'Mailchimp, Apple Mail Privacy Protection (MPP) FAQs',
    href: MAILCHIMP_MPP,
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

export default function TechNewsletterPodcastSponsorshipsPage() {
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
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Playbook</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Newsletters and Podcasts
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A buyer guide for B2B marketers: when owned-audience media fits, how sponsorships are priced, how to
            vet an audience you never see, and how to track demo requests and sign-ups.
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
              <span>9 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {/* Intro */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Are newsletter sponsorships worth it?</h2>
            <AnswerBox>
              For B2B tech, often yes, when the subscriber list matches your buyer. A good tech newsletter reaches
              engineers, founders or IT leaders who chose to hear from the writer. Test one or two issues first,
              track every click, and judge the result on qualified sign-ups, not opens.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Tech newsletter and podcast sponsorships</strong> are paid placements inside media a creator
              or publisher owns: an email list, or an audio or video show. You pay for a slot, the writer or host
              presents your product to their audience, and you measure the visits and sign-ups the slot brings.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: B2B tech brands (SaaS, AI, dev tools, cloud, security) buying sponsorships globally. This post
              covers buying and measurement. It does not list publications or prices, because rates change often
              and vary by audience. Facts were checked on November 20, 2026. For creator marketing as a whole,
              read the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>
                complete guide to tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Why owned audiences */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why owned audiences matter for B2B</h2>
            <AnswerBox>
              An owned audience reaches people directly, without a feed algorithm deciding who sees the post. The
              subscriber or listener opted in, so attention is higher and the audience is easier to describe in
              job-title terms.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Podcasts now reach most of the US population. Edison Research&apos;s Infinite Dial 2026 survey found
              58% of Americans aged 12 and older consumed a podcast in the last month, and 57% have both listened
              to and watched one (
              <ExternalLink href={EDISON_2026}>Edison Research, 2026</ExternalLink>). Advertisers follow: US podcast
              ad revenue grew 17.6% in 2025 to $2.862 billion, according to the IAB/PwC Internet Advertising
              Revenue Report as reported by{' '}
              <ExternalLink href={RBR_IAB_2025}>Radio &amp; Television Business Report</ExternalLink>.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Those numbers describe all podcasts, not tech shows. The point for you is narrower: a niche tech
              newsletter or podcast with a modest audience reaches a concentrated group of practitioners, the
              same logic behind working with niche creators on{' '}
              <Link href="/blog/linkedin-influencer-marketing-b2b-tech" className={linkClass}>
                LinkedIn
              </Link>{' '}
              or{' '}
              <Link href="/blog/x-developer-influencers-dev-tools" className={linkClass}>
                X
              </Link>
              .
            </p>
          </section>

          {/* Definitions */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Key terms</h2>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <p className="text-gray-700">
                <strong>Newsletter:</strong> a regular email a writer or publisher sends to subscribers. Sponsor
                slots sit at the top (primary), in the middle, or in a short &quot;classified&quot; list.
              </p>
              <p className="text-gray-700">
                <strong>Podcast:</strong> a recurring audio or video show. Ad slots run before the episode
                (pre-roll), in the middle (mid-roll) or at the end (post-roll).
              </p>
              <p className="text-gray-700">
                <strong>Sponsor slot:</strong> the fixed space you buy in one issue or episode.
              </p>
              <p className="text-gray-700">
                <strong>CPM:</strong> cost per thousand, the price per 1,000 sends, opens or downloads. Always ask
                which of the three the CPM uses.
              </p>
              <p className="text-gray-700">
                <strong>Open rate:</strong> the share of recipients recorded as opening an email. Treat it with
                care: see the vetting section.
              </p>
              <p className="text-gray-700">
                <strong>Host-read ad:</strong> an ad the host delivers in their own voice, often with personal
                experience of the product. A pre-produced spot is a recorded ad inserted into the show.
              </p>
            </div>
          </section>

          {/* Newsletter vs podcast */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Newsletter vs podcast: which fits your goal?</h2>
            <AnswerBox>
              Newsletters suit direct response: a link, a clear offer and clean tracking. Podcasts suit trust and
              memory: a host explains your product in a story, and listeners act later. Many B2B brands use
              newsletters for sign-ups and podcasts for consideration.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Factor</th>
                    <th className={thClass}>Newsletter</th>
                    <th className={thClass}>Podcast</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.factor}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.factor}</td>
                      <td className={tdClass}>{row.newsletter}</td>
                      <td className={tdClass}>{row.podcast}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The two connect: many writers turn issues into episodes, and many hosts send a newsletter with show
              notes. Ask about both when you contact one, since a bundle often costs less than two separate
              deals.
            </p>
          </section>

          {/* Pricing */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How sponsorships are priced</h2>
            <AnswerBox>
              Most tech newsletters and podcasts charge a flat fee per placement or a CPM. Convert every quote to
              cost per 1,000 real readers or listeners, then to cost per qualified sign-up after the test, so you
              compare shows on the same basis.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Model</th>
                    <th className={thClass}>How it works</th>
                    <th className={thClass}>When to use it</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingRows.map((row) => (
                    <tr key={row.model}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.model}</td>
                      <td className={tdClass}>{row.how}</td>
                      <td className={tdClass}>{row.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              <em>Illustrative math (fictional numbers):</em> a newsletter quotes $1,200 for a primary slot and
              reports 20,000 subscribers. On sends, the CPM is $60. If the writer shows 2,000 unique clicks across
              recent issues on average, each click costs about $0.60 on past form. After the test, divide the fee
              by qualified sign-ups to get the number you compare across channels.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Creator fees for video and social posts follow different logic. See our guide to{' '}
              <Link href="/blog/tech-influencer-rates-2026" className={linkClass}>
                tech influencer rates
              </Link>{' '}
              for those formats.
            </p>
          </section>

          {/* Vetting */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you vet newsletter audiences?</h2>
            <AnswerBox>
              Ask for unique clicks per issue, a breakdown of subscriber job titles or company types, and results
              from past sponsors. Treat open rates as a weak signal, since some email apps record opens
              automatically. Read several back issues before you buy.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Open rates mislead for a specific reason. Mailchimp explains Apple Mail Privacy Protection preloads
              tracking pixels, so emails in Apple Mail are reported as &quot;opened&quot; regardless of what the
              reader did, giving inflated open rates (
              <ExternalLink href={MAILCHIMP_MPP}>Mailchimp</ExternalLink>). Clicks are harder to fake.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Vetting checklist for owned-audience media</h3>
            <Checklist
              items={[
                <>
                  <strong>Audience fit:</strong> job titles, seniority, company size and country of readers or
                  listeners, from a survey or sign-up data.
                </>,
                <>
                  <strong>Real reach:</strong> unique clicks per issue, or downloads and views per episode in the
                  first 30 days, from the platform dashboard, not a rounded media kit number.
                </>,
                <>
                  <strong>Growth source:</strong> how subscribers joined. Organic sign-ups beat paid list growth
                  and giveaway sign-ups.
                </>,
                <>
                  <strong>Sponsor history:</strong> past sponsors in your category, and whether any rebooked.
                </>,
                <>
                  <strong>Ad load:</strong> how many sponsors share one issue or episode.
                </>,
                <>
                  <strong>Editorial quality:</strong> read three back issues or hear two episodes. Would your buyer
                  forward them?
                </>,
                <>
                  <strong>Disclosure:</strong> sponsored slots clearly labelled as paid.
                </>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>
                tech influencer vetting scorecard
              </Link>{' '}
              covers the same checks for social creators.
            </p>
          </section>

          {/* Creative */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Podcast sponsor read vs host-read: which works?</h2>
            <AnswerBox>
              A host-read ad, in the host&apos;s words and ideally after real use of the product, fits B2B tech
              best, because listeners trust the host. A pre-produced spot gives you full control of the wording
              but sounds like an ad. Supply talking points, not a word-for-word script.
            </AnswerBox>
            <Checklist
              items={[
                <>
                  <strong>Give the host product access early</strong> so the read draws on real use.
                </>,
                <>
                  <strong>Send three to five talking points</strong> and the facts they must get right, such as
                  pricing tiers or security claims.
                </>,
                <>
                  <strong>One call to action.</strong> A short, spoken URL or code works best, because listeners
                  type it later.
                </>,
                <>
                  <strong>For newsletters, write like the writer.</strong> Match their tone, keep it short, and
                  link one page built for this audience.
                </>,
              ]}
            />
            <Checklist
              negative
              items={[
                <>A feature list read aloud. Listeners tune out.</>,
                <>A link to your homepage instead of a page for this audience.</>,
                <>Changing the offer between issues or episodes, which breaks comparison.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              A video podcast on YouTube often works like a creator integration, with the product shown on screen.
              Our{' '}
              <Link href="/blog/tech-creator-brief-template" className={linkClass}>
                tech creator brief template
              </Link>{' '}
              helps you hand over talking points in a clear format.
            </p>
          </section>

          {/* Measurement */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to measure demo requests and sign-ups</h2>
            <AnswerBox>
              Give every placement its own tracked link, a short vanity URL or code for audio, and a &quot;How did
              you hear about us?&quot; field on your forms. Judge results over weeks, since podcast listeners and
              forwarded newsletters act late.
            </AnswerBox>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. One link per placement</h3>
                <p className="text-gray-700">
                  Tag each issue or episode with its own UTM parameters. Our{' '}
                  <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>
                    UTM tracking guide
                  </Link>{' '}
                  shows a naming pattern.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. A vanity URL or code for audio</h3>
                <p className="text-gray-700">
                  A short path such as yoursite.com/showname redirects to a tagged URL. A code on the sign-up
                  form catches people who type your domain instead.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Ask buyers directly</h3>
                <p className="text-gray-700">
                  A free-text source field on demo forms picks up listeners who never used the link. Tag show and
                  newsletter names each week.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Follow it into the CRM</h3>
                <p className="text-gray-700">
                  Count qualified opportunities and pipeline, not only clicks. Our guide to{' '}
                  <Link href="/blog/b2b-influencer-marketing-roi" className={linkClass}>
                    B2B influencer marketing ROI
                  </Link>{' '}
                  shows how to turn this into a number finance trusts.
                </p>
              </div>
            </div>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Where Infoishai fits</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai lists tech creators on YouTube, LinkedIn, X, TikTok and Instagram. It does not list
              newsletters or podcast feeds as separate channels, so you buy those slots directly from the writer or
              publisher. Some creators you meet on Infoishai also run a newsletter or a podcast.
              When a creator mentions one, ask for the numbers in the checklist above and agree the slot with them
              directly.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              To{' '}
              <Link href="/creators" className={linkClass}>
                browse verified tech creators
              </Link>
              , filter by platform, niche and country, then message creators or send a deal proposal. Our guide on{' '}
              <Link href="/blog/how-to-find-tech-influencers-b2b-2026" className={linkClass}>
                how to find B2B tech influencers
              </Link>{' '}
              covers search and outreach. Infoishai is free for brands and creators. There are no platform fees.
              Payments are made directly between brand and creator, and Infoishai keeps the record.
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
              Last updated November 20, 2026. Edison Research figures cover the US population aged 12 and older,
              from a survey of 2,050 people in January 2026. The IAB revenue figure covers all US podcast
              advertising in 2025, not tech shows alone. The pricing example uses fictional numbers to show the
              method and is not a rate benchmark.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Find tech creators for your next campaign</h2>
          <p className="text-blue-800 mb-6">
            Browse verified tech creators on YouTube, LinkedIn, X, TikTok and Instagram, and message them directly.
            No platform fees for brands or creators.
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
