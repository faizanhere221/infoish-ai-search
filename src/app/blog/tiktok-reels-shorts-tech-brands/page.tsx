// src/app/blog/tiktok-reels-shorts-tech-brands/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/tiktok-reels-shorts-tech-brands'
const HEADLINE = 'TikTok vs Reels vs Shorts for Tech Brands: Where Short Video Pays Off'
const META_TITLE = 'TikTok vs Reels vs Shorts for Tech Brands'
const DESCRIPTION =
  'Compare TikTok, Instagram Reels and YouTube Shorts for tech brands: audience fit, formats, creator pricing logic and when short video helps B2B.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'tiktok vs reels vs shorts for tech brands',
    'short-form video tech brands',
    'tiktok tech creators',
    'instagram reels tech sponsorship',
    'tiktok b2b tech marketing',
    'reels for saas marketing',
    'shorts vs tiktok creators',
    'youtube shorts tech brands',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-21T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Short-form Video'],
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
  datePublished: '2026-11-21',
  dateModified: '2026-11-21',
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

const PEW_2025 = 'https://www.pewresearch.org/internet/2025/11/20/americans-social-media-use-2025/'
const PEW_TIKTOK_2026 = 'https://pewresearch.org/short-reads/2026/03/02/8-facts-about-americans-and-tiktok'
const YT_SHORTS_3MIN = 'https://blog.youtube/news-and-events/tall-updates-coming-to-shorts/'
const REELS_3MIN = 'https://www.socialmediatoday.com/news/instagram-officially-expands-reels-length-3-minutes/737766/'
const SHORTS_200B = 'https://www.searchenginejournal.com/youtube-reports-200-billion-daily-views-for-shorts-format/549315/'
const TIKTOK_US_DEAL = 'https://techcrunch.com/2026/01/23/heres-whats-you-should-know-about-the-us-tiktok-deal'
const SPARK_ADS = 'https://ads.tiktok.com/help/article/how-to-use-content-suite-to-create-and-launch-spark-ads'
const PARTNERSHIP_ADS =
  'https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const compareRows = [
  {
    factor: 'US adult reach (Pew, 2025)',
    tiktok: '37% use TikTok',
    reels: '50% use Instagram',
    shorts: '84% use YouTube',
  },
  {
    factor: 'Strongest age group',
    tiktok: '63% of adults under 30',
    reels: 'About 8 in 10 adults aged 18 to 29',
    shorts: 'Broad across ages',
  },
  {
    factor: 'Max upload length',
    tiktok: 'Varies by account and upload method; check the app',
    reels: '3 minutes (since January 2025)',
    shorts: '3 minutes (since October 2024)',
  },
  {
    factor: 'Where people find it',
    tiktok: 'For You feed, search',
    reels: 'Reels tab, feed, profile grid',
    shorts: 'Shorts feed, plus the creator’s channel and search',
  },
  {
    factor: 'Path to deeper content',
    tiktok: 'Profile link, comments, longer posts',
    reels: 'Profile link, Stories, DMs',
    shorts: 'Related long video on the same channel',
  },
  {
    factor: 'Paid amplification of creator posts',
    tiktok: 'Spark Ads',
    reels: 'Partnership ads',
    shorts: 'Check current options with YouTube; confirm rights in the contract',
  },
  {
    factor: 'Best fit for tech',
    tiktok: 'Consumer apps, gadgets, AI tools for everyday users',
    reels: 'Lifestyle tech, creator tools, design and productivity apps',
    shorts: 'Developer tools, SaaS, anything needing a longer follow-up demo',
  },
]

const sources = [
  {
    label: 'Pew Research Center, Americans’ Social Media Use 2025 (November 20, 2025; survey February 5 to June 18, 2025)',
    href: PEW_2025,
  },
  {
    label: 'Pew Research Center, 8 facts about Americans and TikTok (March 2, 2026)',
    href: PEW_TIKTOK_2026,
  },
  {
    label: 'YouTube Official Blog, Tall updates coming to Shorts (October 3, 2024)',
    href: YT_SHORTS_3MIN,
  },
  {
    label: 'Social Media Today, Instagram Officially Expands Reels Length to 3 Minutes (January 18, 2025)',
    href: REELS_3MIN,
  },
  {
    label: 'Search Engine Journal, YouTube Reports 200 Billion Daily Views For Shorts Format (June 18, 2025)',
    href: SHORTS_200B,
  },
  {
    label: 'TechCrunch, Here’s what you should know about the US TikTok deal (January 23, 2026)',
    href: TIKTOK_US_DEAL,
  },
  {
    label: 'TikTok Ads Manager Help, How to use Content Suite to create and launch Spark Ads',
    href: SPARK_ADS,
  },
  {
    label: 'Meta for Developers, Partnership ads creation',
    href: PARTNERSHIP_ADS,
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

export default function TikTokReelsShortsTechBrandsPage() {
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
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Comparison</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Short-form Video
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Three apps, one vertical format, different audiences. Here is how TikTok, Instagram Reels and YouTube
            Shorts compare for tech brands, and when a B2B team should skip short video altogether.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 21, 2026</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which short-form platform is best for tech?</h2>
            <AnswerBox>
              It depends on your buyer and what you sell. YouTube Shorts reaches the widest audience and links
              viewers to longer demos on the same channel. TikTok reaches younger consumers fastest. Instagram
              Reels suits lifestyle and creator tools. Most B2B tech brands start with Shorts, then test the
              others with the same creators.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>TikTok vs Reels vs Shorts for tech brands</strong> is a channel choice: which of the three
              vertical video feeds gives your product the best mix of reach, the right audience and a path to a
              sign-up. All three show full-screen clips in an endless feed picked by an algorithm. The differences
              sit in who watches, how long clips run, and what a viewer does next.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: tech brands (consumer tech, SaaS, AI tools, dev tools) working with creators globally. Audience
              figures come from US surveys, since few public sources measure other markets the same way. Facts
              were checked on November 21, 2026. For creator marketing as a whole, read the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>
                complete guide to tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Key terms */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Key terms</h2>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <p className="text-gray-700">
                <strong>TikTok:</strong> a standalone short video app owned in most markets by ByteDance. In the US,
                the app now runs through TikTok USDS Joint Venture LLC, set up in January 2026 with ByteDance
                holding a stake of nearly 20% (
                <ExternalLink href={TIKTOK_US_DEAL}>TechCrunch, 2026</ExternalLink>).
              </p>
              <p className="text-gray-700">
                <strong>Reels:</strong> Instagram&apos;s short video format, built inside the Instagram app. Reels
                copied the TikTok feed model, so the two look alike, but Reels viewers sit inside the same app as
                their photos, Stories and DMs.
              </p>
              <p className="text-gray-700">
                <strong>Shorts:</strong> YouTube&apos;s vertical video format. A Short lives on the same channel as
                the creator&apos;s long videos, so a viewer moves from a 40-second clip to a 15-minute review in one
                tap.
              </p>
              <p className="text-gray-700">
                <strong>Hook:</strong> the first one to three seconds of a clip. In a swipe feed, the hook decides
                whether anyone sees the rest.
              </p>
              <p className="text-gray-700">
                <strong>Demo clip:</strong> a short screen recording or over-the-shoulder shot of the product doing
                one job, start to finish.
              </p>
              <p className="text-gray-700">
                <strong>Reach:</strong> the number of unique accounts shown a post. Views count repeat plays too, so
                reach is the safer number to compare.
              </p>
            </div>
          </section>

          {/* Comparison table */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">TikTok vs Reels vs Shorts: comparison table</h2>
            <AnswerBox>
              YouTube reaches the most US adults, Instagram is strongest with adults under 30, and TikTok has the
              most concentrated young audience. Shorts and Reels now both allow clips up to three minutes.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Factor</th>
                    <th className={thClass}>TikTok</th>
                    <th className={thClass}>Instagram Reels</th>
                    <th className={thClass}>YouTube Shorts</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.factor}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.factor}</td>
                      <td className={tdClass}>{row.tiktok}</td>
                      <td className={tdClass}>{row.reels}</td>
                      <td className={tdClass}>{row.shorts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              The reach figures come from Pew Research Center: 84% of US adults use YouTube, half use Instagram and
              37% use TikTok, from a survey run February to June 2025 (
              <ExternalLink href={PEW_2025}>Pew, 2025</ExternalLink>). TikTok skews young: 63% of adults under 30
              use it, against 12% of adults 65 and older (
              <ExternalLink href={PEW_TIKTOK_2026}>Pew, 2026</ExternalLink>). Pew counts platform use, not short
              video use alone, so treat these as an upper bound for each format.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Length rules changed recently. YouTube allowed Shorts up to three minutes from October 15, 2024 (
              <ExternalLink href={YT_SHORTS_3MIN}>YouTube</ExternalLink>), and Instagram raised the Reels limit from
              90 seconds to three minutes in January 2025 (
              <ExternalLink href={REELS_3MIN}>Social Media Today</ExternalLink>). Scale is not in doubt either:
              YouTube CEO Neal Mohan said in June 2025 Shorts averages 200 billion daily views (
              <ExternalLink href={SHORTS_200B}>Search Engine Journal</ExternalLink>).
            </p>
          </section>

          {/* Fit by product */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which platform fits your product?</h2>
            <AnswerBox>
              Match the platform to who signs up, not to where views are highest. A self-serve consumer app fits
              TikTok and Reels. A developer tool or SaaS product fits Shorts, where a clip leads to a longer
              tutorial from the same creator.
            </AnswerBox>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Consumer apps, gadgets and AI tools</h3>
                <p className="text-gray-700">
                  TikTok and Reels. The buyer decides alone, often on a phone, in minutes. A creator showing one
                  clever use is enough to drive an install.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Creator, design and productivity tools</h3>
                <p className="text-gray-700">
                  Reels first. Instagram is where designers, freelancers and small business owners show their
                  work, and a before-and-after clip fits the grid.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Developer tools, SaaS and cloud</h3>
                <p className="text-gray-700">
                  Shorts first. Engineers rarely buy from a 30-second clip, but they will click through to a full
                  tutorial. See our{' '}
                  <Link href="/blog/tech-youtuber-campaign-playbook" className={linkClass}>
                    tech YouTuber campaign playbook
                  </Link>{' '}
                  for the long-form side.
                </p>
              </div>
            </div>
          </section>

          {/* TikTok for B2B */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Does TikTok work for B2B brands?</h2>
            <AnswerBox>
              Yes, for awareness and hiring, less often for pipeline. TikTok works for B2B products with a
              self-serve tier, a free plan or a visual result. For a six-month enterprise sale, use TikTok to build
              recognition and measure it as such, not as a lead source.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Plenty of working professionals scroll TikTok. Pew found 44% of US adults aged 30 to 49 use it (
              <ExternalLink href={PEW_TIKTOK_2026}>Pew, 2026</ExternalLink>), the age group holding many buying roles.
              The catch is intent. People open TikTok to relax, not to compare vendors, so a B2B clip has to teach
              something useful on its own.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">When B2B should skip short video</h3>
            <Checklist
              negative
              items={[
                <>
                  <strong>Your buyer is a committee.</strong> Security reviews and procurement need proof a clip
                  never carries. Put the budget into long-form reviews or LinkedIn instead.
                </>,
                <>
                  <strong>The product has no visual moment.</strong> Back-end infrastructure with no screen to show
                  makes a weak clip.
                </>,
                <>
                  <strong>You have no landing page for cold traffic.</strong> A viewer who taps through to a demo
                  request form leaves.
                </>,
                <>
                  <strong>You expect leads in week one.</strong> Short video builds memory over many views. Judge it
                  on reach and branded search, not form fills.
                </>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Our post on{' '}
              <Link href="/blog/b2c-influencer-marketing-strategies-tech-brands-2026" className={linkClass}>
                B2C influencer strategies for tech brands
              </Link>{' '}
              covers the consumer side in more depth.
            </p>
          </section>

          {/* Rates */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do rates compare?</h2>
            <AnswerBox>
              No reliable public benchmark compares tech creator rates across the three apps. Creators price on
              their own reach, niche and usage rights. Ask for recent average views per clip on each platform,
              then compare quotes as cost per 1,000 views.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Many tech creators post the same clip to all three apps, so a fair deal names which platforms the
              fee covers. Three points move the price more than the platform itself:
            </p>
            <Checklist
              items={[
                <>
                  <strong>Usage rights.</strong> Running a creator&apos;s post as an ad costs extra. TikTok calls
                  this <ExternalLink href={SPARK_ADS}>Spark Ads</ExternalLink>; Instagram calls it{' '}
                  <ExternalLink href={PARTNERSHIP_ADS}>partnership ads</ExternalLink>. Agree the length of the
                  rights in writing.
                </>,
                <>
                  <strong>Cross-posting.</strong> One shoot, three uploads. Ask for a bundle price instead of three
                  separate fees.
                </>,
                <>
                  <strong>A long-form tie-in.</strong> A Short paired with a full YouTube review costs more, and
                  usually earns more clicks.
                </>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              For pricing ranges by format, see our{' '}
              <Link href="/blog/tech-influencer-rates-2026" className={linkClass}>
                tech influencer rates guide
              </Link>
              .
            </p>
          </section>

          {/* Creative */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Creative tips for tech short video</h2>
            <AnswerBox>
              Show the result in the first two seconds, then show how. Let the creator speak in their own voice,
              keep one feature per clip, and put the call to action on screen and in the caption.
            </AnswerBox>
            <Checklist
              items={[
                <>
                  <strong>Open on the outcome.</strong> The finished dashboard, the cleaned photo, the passing test.
                  Then rewind to the steps.
                </>,
                <>
                  <strong>One feature per clip.</strong> Three features in 40 seconds means none sticks.
                </>,
                <>
                  <strong>Real screen, readable text.</strong> Zoom in on the interface. Small text is unreadable on
                  a phone.
                </>,
                <>
                  <strong>Captions on.</strong> A viewer with sound off still gets the point.
                </>,
                <>
                  <strong>Clear paid label.</strong> Use each app&apos;s branded content or paid partnership toggle
                  plus a spoken or on-screen mention. Our{' '}
                  <Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>
                    disclosure rules guide
                  </Link>{' '}
                  covers the details.
                </>,
              ]}
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-4">A repurposing plan for one shoot</h3>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <p className="text-gray-700">
                <em>Illustrative plan, not a client case:</em> one creator records a 10-minute YouTube walkthrough of
                your product.
              </p>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>Cut three Shorts, each on one feature, each linking to the full video.</li>
                <li>Post the strongest cut as a Reel and a TikTok, with a native caption for each app.</li>
                <li>Give each upload its own tracked link or code.</li>
                <li>After two weeks, put paid spend behind the clip with the best watch time, if your rights allow it.</li>
              </ol>
              <p className="text-gray-700">
                Agree all of this in the brief before filming. Our{' '}
                <Link href="/blog/tech-creator-brief-template" className={linkClass}>
                  tech creator brief template
                </Link>{' '}
                has a section for it.
              </p>
            </div>
          </section>

          {/* Measurement */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to measure short video</h2>
            <AnswerBox>
              Track reach, average watch time and link clicks per clip, then sign-ups by tracked link or code. Add
              branded search and a &quot;How did you hear about us?&quot; field, since many viewers search for you
              later instead of tapping.
            </AnswerBox>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Ask for screenshots of native stats</h3>
                <p className="text-gray-700">
                  Each app shows the creator reach, watch time and audience country. Request these for your clip
                  and for recent unpaid clips, so you compare like with like.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. One tracked link or code per upload</h3>
                <p className="text-gray-700">
                  Separate TikTok from Reels from Shorts, even for the same clip. Our{' '}
                  <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>
                    UTM tracking guide
                  </Link>{' '}
                  shows a naming pattern.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Watch the lag</h3>
                <p className="text-gray-700">
                  Check branded search and direct sign-ups for two to four weeks after posting, not only on the
                  day.
                </p>
              </div>
            </div>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Find short-form tech creators on Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai lists tech creators on YouTube, LinkedIn, X, TikTok and Instagram. You{' '}
              <Link href="/creators" className={linkClass}>
                browse verified tech creators
              </Link>
              , filter by platform, niche and country, then message them or send a deal proposal. Want names to
              study first? Our list of the{' '}
              <Link href="/blog/best-tech-influencers-to-follow-2026" className={linkClass}>
                best tech influencers to follow
              </Link>{' '}
              is a good starting point.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Infoishai is free for brands and creators. There are no platform fees. Payments are made directly
              between brand and creator, and Infoishai keeps the record. To hand the work off, our{' '}
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
              Last updated November 21, 2026. Pew figures cover US adults and count use of each platform, not of
              its short video format alone. Platform length limits and ad products change often; check each
              app&apos;s help pages before you brief a creator. The repurposing plan is illustrative.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Browse short-form tech creators</h2>
          <p className="text-blue-800 mb-6">
            Find verified tech creators on TikTok, Instagram and YouTube, and message them directly. No platform fees
            for brands or creators.
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
