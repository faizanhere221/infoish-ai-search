// src/app/blog/youtube-sponsorship-cost-b2b-saas/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/youtube-sponsorship-cost-b2b-saas'
const HEADLINE = 'YouTube Sponsorship Cost for B2B SaaS: Dedicated Videos, Integrations and CPM'
const META_TITLE = 'YouTube Sponsorship Cost for B2B SaaS Brands (2026)'
const DESCRIPTION =
  'How much does a tech YouTube sponsorship cost for SaaS? See CPM math, dedicated vs integration pricing, and a sample budget before you contact a creator.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'youtube sponsorship cost for b2b saas',
    'tech youtuber sponsorship rates',
    'how much to pay tech youtuber',
    'youtube integration vs dedicated video cost',
    'youtube sponsorship cpm tech',
    'saas youtube sponsorship price per video',
    'tech youtuber rate per 10k views',
    'youtube shorts sponsorship cost',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-08T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['YouTube', 'Tech Influencers', 'Rates', 'B2B SaaS'],
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
  datePublished: '2026-11-08',
  dateModified: '2026-11-08',
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
const ONEOF10 = 'https://www.1of10.com/blog/youtube-sponsorship-rates/'
const GOOGLE_ADS = 'https://support.google.com/google-ads/answer/15223349?hl=en'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

// Sponsor CPM per 1,000 views, as published. Both are estimates, not transacted deals.
const cpmRows = [
  { niche: 'B2B SaaS / developer tools', cpm: '$40 to $80', source: 'Outlier Kit' },
  { niche: 'B2B, SaaS and tech', cpm: '$30 to $50', source: '1of10' },
  { niche: 'AI tools / productivity', cpm: '$28 to $55', source: 'Outlier Kit' },
  { niche: 'Tech / reviews', cpm: '$25 to $45', source: 'Outlier Kit' },
  { niche: 'Business and marketing', cpm: '$25 to $40', source: '1of10' },
  { niche: 'Gaming (for contrast)', cpm: '$10 to $20', source: '1of10' },
]

const formatRows = [
  { format: '60 to 90 second integration', oneOf10: '1x (the baseline)', outlier: '1x (the baseline)' },
  { format: 'Dedicated video', oneOf10: '2x to 4x', outlier: '1.3x to 1.5x the CPM' },
  { format: 'Short mention or shoutout', oneOf10: '0.5x to 0.7x (30 seconds)', outlier: '0.7x to 0.9x (under 60 seconds)' },
  { format: 'Sponsored Short', oneOf10: '0.25x to 0.5x', outlier: '0.4x to 0.6x of long-form CPM' },
]

const addOnRows = [
  { item: 'Paid usage rights (your ads run the video)', oneOf10: '+30% to +100%', outlier: '+25% to +100%' },
  { item: 'Category exclusivity, 30 to 90 days', oneOf10: '+20% to +50%', outlier: '+25% to +50%' },
  { item: 'Whitelisting or dark posts', oneOf10: 'Not listed', outlier: '+25% per 30 days' },
  { item: 'Rush delivery, under 7 days', oneOf10: '+25% to +50%', outlier: '+25% to +50%' },
  { item: 'Package of several videos', oneOf10: '10% to 20% off per video', outlier: '20% to 30% off (3+ videos)' },
]

// Illustrative worked example. Fictional channels, assumed CPM.
const CPM = 45
const creators = [
  { name: 'Channel A (fictional)', subs: '40,000', views: 18000, fit: 0.5 },
  { name: 'Channel B (fictional)', subs: '250,000', views: 30000, fit: 0.15 },
]
const integrationFee = (views: number) => Math.round((views / 1000) * CPM)
const usd = (value: number) => `$${value.toLocaleString('en-US')}`

// Illustrative pilot budget. Every fee is an assumption, not a quote.
const pilotLines = [
  { item: '3 integrations with mid-sized tech channels', basis: '3 x 20,000 views x $45 CPM', cost: 3 * integrationFee(20000) },
  { item: '1 dedicated tutorial video', basis: '20,000 views x $45 CPM x 2.5', cost: Math.round(integrationFee(20000) * 2.5) },
  { item: 'Paid usage rights on the dedicated video, 90 days', basis: '50% of its fee', cost: Math.round(integrationFee(20000) * 2.5 * 0.5) },
  { item: 'Exclusivity on the dedicated video, 30 days, named rivals', basis: '25% of its fee', cost: Math.round(integrationFee(20000) * 2.5 * 0.25) },
  { item: 'Ad spend behind the dedicated video', basis: 'Your choice, paid to Google', cost: 2500 },
]
const PILOT_TOTAL = 12000
const pilotSubtotal = pilotLines.reduce((sum, line) => sum + line.cost, 0)
const pilotReserve = PILOT_TOTAL - pilotSubtotal

const sources = [
  { label: 'Outlier Kit, YouTube sponsorship rates (updated September 13, 2026)', href: OUTLIERKIT },
  { label: '1of10, YouTube sponsorships: 2026 rates by channel size (updated October 6, 2026)', href: ONEOF10 },
  { label: 'Google Ads Help, creator partnerships for YouTube videos', href: GOOGLE_ADS },
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
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function YouTubeSponsorshipCostPage() {
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
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Pricing
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Strategy
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            How tech YouTubers price a sponsorship, the CPM math behind a fair quote, and a worked budget for a SaaS pilot.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 8, 2026</span>
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
            <AnswerBox>
              A tech YouTube sponsorship usually costs $25 to $80 for every 1,000 views a video gets, based on 2026 estimates from 1of10 and Outlier Kit. For a channel averaging 20,000 views, a 60-second integration comes to about $500 to $1,600. Dedicated videos cost more, and usage rights or exclusivity add 20% to 100%.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>YouTube sponsorship cost for B2B SaaS</strong> is the fee a software company pays a creator to feature its product in a YouTube video, either as a segment inside a normal video or as a whole video about the product. The fee depends on how many people watch, what they watch for, and which extra rights you buy.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This guide covers YouTube only, in US dollars, and shows where each number comes from. For LinkedIn, X and other platforms, see our{' '}
              <Link href="/blog/tech-influencer-rates-2026" className={linkClass}>tech influencer rates</Link> guide. For the wider picture, start with the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>complete guide to tech influencers</Link>.
            </p>
          </section>

          {/* How priced */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How is a YouTube sponsorship priced?</h2>
            <AnswerBox>
              Most creators price on expected views, not subscribers. The formula is average views divided by 1,000, multiplied by a CPM rate for the niche. Format, rights and timing then move the price up or down.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>CPM</strong> means cost per mille, the price for every 1,000 views. <strong>Average views</strong> is the number of views a creator&apos;s recent videos reach, usually measured over a set period. The two connect in one line:
            </p>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
              <p className="text-gray-900 font-semibold text-center">
                Sponsorship fee = (average views / 1,000) x CPM
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Read it the other way too. A $40 CPM equals $400 per 10,000 views. If a creator quotes $1,200 and averages 15,000 views, the implied CPM is $80. Outlier Kit puts it plainly: rates are calculated against views, not subscribers. 1of10 makes the same point with an example, where a 40,000-subscriber channel averaging 60,000 views out-earns a 200,000-subscriber channel averaging 15,000.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Use the median views of the last 10 long-form videos, the method 1of10 recommends for a floor price. A median ignores one viral hit, so it gives you a fairer read than the channel&apos;s best video.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">What CPM do tech and SaaS channels charge?</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Both sources we checked put B2B, SaaS and developer content near the top of the CPM range, alongside finance. Neither is a survey of real deals. Outlier Kit calls its numbers planning estimates, and 1of10 compiles public creator-reported rates and marketplace listings.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Niche</th>
                    <th className={thClass}>Sponsor CPM (per 1,000 views)</th>
                    <th className={thClass}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {cpmRows.map((row) => (
                    <tr key={row.niche}>
                      <td className={tdClass}>{row.niche}</td>
                      <td className={tdClass}>{row.cpm}</td>
                      <td className={tdClass}>{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Sources: <ExternalLink href={OUTLIERKIT}>Outlier Kit</ExternalLink> (integration CPM by niche, updated September 2026) and{' '}
              <ExternalLink href={ONEOF10}>1of10</ExternalLink> (typical sponsorship CPM by niche, updated October 2026). Both are estimates.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Outlier Kit also offers a rule of thumb of $0.10 to $0.20 or more per subscriber for B2B SaaS. Use it only as a sanity check. A channel with many subscribers and few recent views will look far more expensive by this rule than by the view math.
            </p>
          </section>

          {/* Dedicated vs integration */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Dedicated video vs integration: which is better for SaaS?</h2>
            <AnswerBox>
              An integration is a 60 to 90 second segment inside a regular video. A dedicated video is about your product from start to finish. Integrations cost less and suit simple products. Dedicated videos suit products a viewer needs to see working before they sign up.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The price gap between the two is where published sources disagree most. Compare them side by side:
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Format</th>
                    <th className={thClass}>1of10 multiple</th>
                    <th className={thClass}>Outlier Kit multiple</th>
                  </tr>
                </thead>
                <tbody>
                  {formatRows.map((row) => (
                    <tr key={row.format}>
                      <td className={tdClass}>{row.format}</td>
                      <td className={tdClass}>{row.oneOf10}</td>
                      <td className={tdClass}>{row.outlier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              1of10 calls 2x &quot;a floor, not a target&quot; for dedicated videos. Outlier Kit gives a 1.3x to 1.5x CPM rule, yet its own tier table shows dedicated prices well above integration prices at every size. Expect a dedicated quote between 1.5x and 4x the integration fee, and ask the creator what drives their number.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">When each wins for SaaS</h3>
            <Checklist
              items={[
                <><strong>Pick an integration</strong> when your product is easy to explain in one minute, such as a browser extension or a password manager, or when you want to test several channels before you commit.</>,
                <><strong>Pick a dedicated video</strong> when the product needs a walkthrough: setup, a real workflow, or a comparison with tools the viewer already uses. Developer tools, data platforms and security products often fall here.</>,
                <><strong>Pick a dedicated video</strong> when search matters. A tutorial titled with a problem your buyer types into YouTube keeps earning views long after launch. This is our reasoning, not a measured result, so track it with your own data.</>,
                <><strong>Pick an integration</strong> when the creator&apos;s audience fits but their content rarely goes deep on tools. Forcing a tutorial on a commentary channel rarely works.</>,
              ]}
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Where do YouTube Shorts fit?</h3>
            <p className="text-gray-700 leading-relaxed">
              Shorts cost the least per placement. 1of10 prices a sponsored Short at a quarter to half of an integration. Outlier Kit puts Shorts at roughly 0.4x to 0.6x of long-form CPM and says Shorts views convert at a lower rate. For a B2B product, treat Shorts as an add-on to a long-form deal, not the main buy.
            </p>
          </section>

          {/* CPM math */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">CPM math with a worked SaaS example</h2>
            <AnswerBox>
              Price each channel with the same CPM, then divide by the share of viewers who match your buyer. The cheaper quote is often not the cheaper reach once audience fit is counted.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              This example is illustrative. The channels are fictional, and the ${CPM} CPM is an assumption inside the published tech ranges above. A fictional SaaS company sells an observability tool to backend engineers and compares two channels for a 60-second integration.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Channel</th>
                    <th className={thClass}>Subscribers</th>
                    <th className={thClass}>Median views</th>
                    <th className={thClass}>Fee at ${CPM} CPM</th>
                    <th className={thClass}>Viewers who fit</th>
                    <th className={thClass}>Cost per 1,000 fitting viewers</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((row) => {
                    const fee = integrationFee(row.views)
                    const fitting = row.views * row.fit
                    return (
                      <tr key={row.name}>
                        <td className={tdClass}>{row.name}</td>
                        <td className={tdClass}>{row.subs}</td>
                        <td className={tdClass}>{row.views.toLocaleString('en-US')}</td>
                        <td className={tdClass}>{usd(fee)}</td>
                        <td className={tdClass}>{Math.round(row.fit * 100)}%</td>
                        <td className={tdClass}>{usd(Math.round((fee / fitting) * 1000))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Channel B reaches more people and costs more. Once you count only the viewers who build backend systems, Channel A delivers each relevant viewer at a lower price. The fit share is your estimate: check the creator&apos;s audience data, the comments, and the topics of their best videos. Our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>10-point vetting scorecard</Link> walks you through it.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Follow the same steps for any quote: take the median views, apply the CPM, compare the result with the quote, then adjust for audience fit. A quote far above the math needs a reason, such as strong search traffic or a proven record with similar products.
            </p>
          </section>

          {/* Add-ons */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which add-ons raise the price?</h2>
            <AnswerBox>
              Usage rights, exclusivity, whitelisting and rush delivery each add a percentage to the base fee. Packages of several videos bring the per-video price down. Agree each one in writing before the creator starts.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Add-on</th>
                    <th className={thClass}>1of10</th>
                    <th className={thClass}>Outlier Kit</th>
                  </tr>
                </thead>
                <tbody>
                  {addOnRows.map((row) => (
                    <tr key={row.item}>
                      <td className={tdClass}>{row.item}</td>
                      <td className={tdClass}>{row.oneOf10}</td>
                      <td className={tdClass}>{row.outlier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Usage rights</strong> let you reuse the video in your own ads or channels. 1of10 calls this a separate license and says 90 days to 12 months is a normal term. <strong>Exclusivity</strong> stops the creator from working with your competitors for a set time. <strong>Whitelisting</strong> means running ads through the creator&apos;s account or content, so the ad looks like it comes from them.
            </p>
            <p className="text-gray-700 leading-relaxed">
              On YouTube, Google Ads lets brands run a creator&apos;s organic video as an ad once the creator links it to the brand&apos;s account. Google&apos;s{' '}
              <ExternalLink href={GOOGLE_ADS}>help page on creator partnerships</ExternalLink> says you are responsible for securing the rights to use the video as an ad, which often means a separate agreement with the creator. Put the term, the ad platforms and the end date in your contract.
            </p>
          </section>

          {/* Negotiation */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you negotiate with a tech YouTuber?</h2>
            <AnswerBox>
              Negotiate on scope first and price second. Bring the view math, ask for data, and trade rights or deadlines for a lower fee rather than asking for a discount on the same deal.
            </AnswerBox>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              <li>Ask for a rate card and a screenshot of views per video for the last 90 days.</li>
              <li>Work out the implied CPM of the quote and compare it with the tech ranges above.</li>
              <li>Narrow exclusivity to named competitors for 30 days instead of a whole category.</li>
              <li>Ask for organic usage only, and buy paid usage later if the video performs.</li>
              <li>Give the creator at least two weeks, so you avoid a rush fee.</li>
              <li>Offer a package of two or three videos once the first one meets your goal.</li>
              <li>Set one reviewer and one review round in the brief, then pay on the agreed date.</li>
            </ol>
            <p className="text-gray-700 leading-relaxed">
              Write the disclosure into the brief too. Our guide to{' '}
              <Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>influencer disclosure rules for B2B</Link> covers where the label goes on a YouTube video.
            </p>
          </section>

          {/* Budget */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Budget template: a sample $12k YouTube pilot</h2>
            <AnswerBox>
              A first YouTube pilot for a SaaS product often mixes a few integrations with one dedicated tutorial. Keep a reserve for extra edits or a follow-up video.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              This budget is illustrative. It is not a quote or a past campaign. It assumes channels with about 20,000 median views, a ${CPM} CPM, a 2.5x multiple for the dedicated video, and add-on rates inside the published ranges. Swap in the quotes you receive.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Line item</th>
                    <th className={thClass}>Basis</th>
                    <th className={thClass}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {pilotLines.map((line) => (
                    <tr key={line.item}>
                      <td className={tdClass}>{line.item}</td>
                      <td className={tdClass}>{line.basis}</td>
                      <td className={tdClass}>{usd(line.cost)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className={tdClass}>Reserve for edits or a follow-up video</td>
                    <td className={tdClass}>Whatever remains</td>
                    <td className={tdClass}>{usd(pilotReserve)}</td>
                  </tr>
                  <tr>
                    <td className={`${tdClass} font-bold text-gray-900`}>Total</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-gray-900`}>{usd(pilotSubtotal + pilotReserve)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Set your success measure before the videos go live, such as trial signups or demo requests per 1,000 views. Give each creator a tracked link, as our guide to{' '}
              <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>tracking B2B influencer campaigns with UTMs</Link> shows, and judge results over weeks, not days.
            </p>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to book tech YouTubers with Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              You have two routes. To run the campaign yourself,{' '}
              <Link href="/creators" className={linkClass}>browse verified tech creators</Link> on the free marketplace, message them, and send offers. There are no platform fees. Payments are made directly between brand and creator. Infoishai keeps the record. Our guide to{' '}
              <Link href="/blog/how-to-find-tech-youtubers-product-reviews-2026" className={linkClass}>finding tech YouTubers for reviews</Link> covers the search itself.
            </p>
            <p className="text-gray-700 leading-relaxed">
              To hand the work to a team, request a creator shortlist and quote through our{' '}
              <Link href="/pricing" className={linkClass}>managed influencer marketing service</Link>. Each quote is custom to your campaign.
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
              Last updated November 8, 2026. The rate figures are vendor estimates, not transacted deal data, and the two sources disagree in places. Use them as starting points and check every quote against the creator&apos;s own view data. Infoishai does not publish its own YouTube rate data here.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Plan your YouTube campaign</h2>
          <p className="text-blue-800 mb-6">
            Request a creator shortlist and a custom quote for a managed YouTube campaign. Prefer to run it yourself? The marketplace is free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Request a Shortlist and Quote
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
