// src/app/blog/tech-influencer-campaign-budget/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/tech-influencer-campaign-budget'
const HEADLINE = 'How to Budget a Tech Influencer Campaign: Pilot Plans from $5k to $50k'
const META_TITLE = 'Tech Influencer Campaign Budget: $5k to $50k Plans'
const DESCRIPTION =
  'Plan a tech influencer campaign budget with three sample pilots from $5k to $50k, a creator-tier split, and the hidden costs most first-time brands forget.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'tech influencer marketing budget',
    'how much to spend on influencer marketing b2b',
    'influencer campaign budget template',
    'startup influencer budget',
    'influencer marketing budget for saas startup',
    'how to split influencer budget between creators',
    'b2b influencer budget percentage',
    'influencer pilot budget',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-13T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Budget', 'Tech Influencers', 'Strategy', 'Pricing'],
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
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
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
const FAVIKON =
  'https://www.favikon.com/blog/the-complete-b2b-influencer-pricing-guide-2026-benchmarks-geography-industry-format'
const CONTENTGRIP = 'https://www.contentgrip.com/influencer-marketing-budget/'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

type ScenarioRow = { line: string; math: string; cost: string }

const scenario5k: ScenarioRow[] = [
  { line: '3 LinkedIn posts', math: '3 x $800', cost: '$2,400' },
  { line: '1 YouTube integration', math: '20,000 expected views x $60 CPM', cost: '$1,200' },
  { line: 'Usage rights on 1 LinkedIn post', math: '25% of $800', cost: '$200' },
  { line: 'Product access and seeding', math: 'Demo accounts, credits, shipping', cost: '$200' },
  { line: 'Rebooking reserve', math: 'One extra post from the best performer', cost: '$500' },
  { line: 'Contingency', math: '10% of total', cost: '$500' },
]

const scenario20k: ScenarioRow[] = [
  { line: '2 YouTube integrations', math: '2 x (40,000 views x $60 CPM)', cost: '$4,800' },
  { line: '1 dedicated YouTube video', math: '50,000 views x $60 CPM x 1.4', cost: '$4,200' },
  { line: '6 LinkedIn posts', math: '6 x $800', cost: '$4,800' },
  { line: 'Usage rights on both video formats', math: '25% of $6,600, three months of ads', cost: '$1,650' },
  { line: 'Paid amplification', math: 'Running the best clip as an ad', cost: '$1,750' },
  { line: 'Landing page, tracking and tools', math: 'Offer page, UTM setup, one month of tooling', cost: '$800' },
  { line: 'Contingency', math: '10% of total', cost: '$2,000' },
]

const scenario50k: ScenarioRow[] = [
  { line: '3 dedicated YouTube videos', math: '3 x (80,000 views x $60 CPM x 1.4)', cost: '$20,160' },
  { line: '3 YouTube integrations', math: '3 x (40,000 views x $60 CPM)', cost: '$7,200' },
  { line: '8 LinkedIn posts, smaller creators', math: '8 x $800', cost: '$6,400' },
  { line: '2 LinkedIn posts, 100K+ follower creators', math: '2 x $2,000', cost: '$4,000' },
  { line: 'Usage rights on the dedicated videos', math: 'About 25% of $20,160', cost: '$5,000' },
  { line: 'Paid amplification and production', math: 'Ads, cut-downs, hardware shipping', cost: '$2,240' },
  { line: 'Contingency', math: '10% of total', cost: '$5,000' },
]

const sources = [
  {
    label: 'Outlier Kit, YouTube sponsorship rates (updated September 13, 2026; planning estimates, not survey data)',
    href: OUTLIERKIT,
  },
  {
    label: 'Favikon, The Complete B2B Influencer Pricing Guide 2026 (July 22, 2026)',
    href: FAVIKON,
  },
  {
    label: 'ContentGrip, Influencer marketing budget calculator: how to allocate spend in 2026 (published 2026-05-24)',
    href: CONTENTGRIP,
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

function ScenarioTable({ rows, total }: { rows: ScenarioRow[]; total: string }) {
  return (
    <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
      <table className="w-full border-collapse bg-white text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className={thClass}>Line item</th>
            <th className={thClass}>Assumption</th>
            <th className={thClass}>Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.line}>
              <td className={`${tdClass} font-semibold text-gray-900`}>{row.line}</td>
              <td className={tdClass}>{row.math}</td>
              <td className={tdClass}>{row.cost}</td>
            </tr>
          ))}
          <tr className="bg-gray-50">
            <td className={`${tdClass} font-bold text-gray-900`}>Total</td>
            <td className={tdClass} />
            <td className={`${tdClass} font-bold text-gray-900`}>{total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function TechInfluencerCampaignBudgetPage() {
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
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              Budgeting
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            You have a first budget and a boss who wants a number. This guide shows what drives the cost, three worked pilot plans at $5k, $20k and $50k, how to split money across creator tiers, and the costs first-time brands leave out.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 13, 2026</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How much should a B2B startup spend on influencers?</h2>
            <AnswerBox>
              Start with a fixed pilot, not a percentage. A $5k pilot tests three or four creators on one platform. A $20k pilot tests two platforms and one longer video. A $50k pilot runs a launch. Keep 10% as contingency, and budget 1.4 to 1.6 times your creator fees for the full program.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>tech influencer marketing budget</strong> is the total amount you set aside to pay creators who cover software, AI, developer tools or hardware, plus every cost around those posts: usage rights, production, tools, ads and your team&apos;s time. Creator fees are the biggest line, but they are not the whole bill.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              For context, <ExternalLink href={CONTENTGRIP}>ContentGrip</ExternalLink> reports B2B companies tend to spend 5% to 10% of their marketing budget on influencer marketing, and puts the true program cost at about 1.4 to 1.6 times the creator fee budget. Use those figures as a sense check, not a target. A startup with no influencer history learns more from a fixed pilot with clear goals.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: global, in US dollars, for B2B tech brands. The scenarios below are labelled examples with stated assumptions, not forecasts. Last updated November 13, 2026. New to the topic? Start with the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>complete guide to tech influencers</Link>.
            </p>
          </section>

          {/* Cost drivers */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What drives the total cost?</h2>
            <AnswerBox>
              Five things set the price: the platform, the creator&apos;s real reach (views, not followers), the format, the add-ons such as usage rights and exclusivity, and the work around the posts. Change any one and the total moves.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Platform and reach.</strong> YouTube sponsorships are priced against expected views. <ExternalLink href={OUTLIERKIT}>Outlier Kit</ExternalLink> estimates integration CPMs of $40 to $80 for B2B SaaS and developer tool channels and $25 to $45 for general tech review channels (updated September 2026, planning estimates). LinkedIn posts are priced per post. In <ExternalLink href={FAVIKON}>Favikon&apos;s 2026 guide</ExternalLink>, the median transacted LinkedIn deal was $798 per post across 135 deals, and about 81% of creators in its dataset price between $200 and $2,000 per post.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Format.</strong> A dedicated video costs more than an integration. Outlier Kit estimates dedicated videos at 1.3 to 1.5 times the integration rate.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Add-ons.</strong> Usage rights let you run the creator&apos;s content as your ad. Exclusivity stops the creator from working with rivals for a set time. Favikon lists both at plus 20% to 50% each, citing third-party rate data.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Work around the posts.</strong> Briefs, reviews, tracking, landing pages and payment records take time. Someone on your team does this work, or you pay an agency. For full rate tables, read our guides to{' '}
              <Link href="/blog/tech-influencer-rates-2026" className={linkClass}>tech influencer rates</Link>,{' '}
              <Link href="/blog/youtube-sponsorship-cost-b2b-saas" className={linkClass}>YouTube sponsorship cost for B2B SaaS</Link> and{' '}
              <Link href="/blog/linkedin-tech-creator-rates" className={linkClass}>LinkedIn tech creator rates</Link>.
            </p>
          </section>

          {/* Scenarios */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What is a realistic pilot?</h2>
            <AnswerBox>
              A realistic pilot tests one clear question with enough creators to compare. At $5k, test whether LinkedIn or a small YouTube channel drives sign-ups. At $20k, compare two platforms. At $50k, back a launch with several videos and ad rights.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>pilot budget</strong> is a fixed amount for a first test with a set end date and one success metric, such as cost per trial sign-up. The three scenarios below are illustrative. Every number comes from the same assumptions, so you see how each choice changes the total:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>YouTube at a $60 CPM, the midpoint of Outlier Kit&apos;s B2B SaaS range.</li>
              <li>Dedicated videos at 1.4 times the integration price.</li>
              <li>LinkedIn posts at $800, close to Favikon&apos;s transacted median, and $2,000 for creators above 100,000 followers, where Favikon reports the median roughly triples.</li>
              <li>Usage rights at 25%, inside the 20% to 50% range.</li>
              <li>A 10% contingency in every plan.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-6">
              Your quotes will differ. Swap in real prices from creators as they reply.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Scenario A: the $5k pilot</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Goal: learn which format brings trial sign-ups from one audience, such as backend developers. Timeline: six to eight weeks. This plan buys four pieces of content and keeps money aside to rebook the winner.
            </p>
            <ScenarioTable rows={scenario5k} total="$5,000" />

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Scenario B: the $20k pilot</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Goal: compare YouTube and LinkedIn on cost per sign-up, and test one dedicated video. Timeline: about one quarter. Usage rights let you turn the best video into an ad.
            </p>
            <ScenarioTable rows={scenario20k} total="$20,000" />

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Scenario C: the $50k launch pilot</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Goal: back a product launch with several in-depth videos and LinkedIn reach on launch week. Timeline: book eight to ten weeks before launch, since popular channels fill sponsor slots early.
            </p>
            <ScenarioTable rows={scenario50k} total="$50,000" />
            <p className="text-gray-700 leading-relaxed">
              Running your{' '}
              <Link href="/blog/first-tech-influencer-campaign-startup-guide-2026" className={linkClass}>first tech influencer campaign</Link>? Scenario A is the safest start. Learn from it before you commit to B or C.
            </p>
          </section>

          {/* Tier split */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you split budget across creators?</h2>
            <AnswerBox>
              Put most of a pilot into smaller, specialist creators, a smaller share into one or two bigger names, and hold a slice for testing. A common split is 50% to 60% for nano and micro creators, 20% to 30% for mid-tier and macro, and 10% to 20% for tests.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Creator tiers</strong> group creators by audience size: nano and micro at the small end, mid-tier and macro above them. The split above comes from <ExternalLink href={CONTENTGRIP}>ContentGrip&apos;s 2026 budget guide</ExternalLink>. The link between pilot budget and creator tiers is simple. A small pilot has room for one big creator or several small ones, and several small ones give you a comparison. A larger pilot adds bigger names once you know which message works.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Tier is not the same as price in B2B. Favikon found nano LinkedIn creators under 10,000 followers out-priced micro creators in its data. Judge each creator on audience fit and past results, not follower count alone.
            </p>
            <Checklist
              items={[
                <><strong>Spread risk.</strong> Never give one creator more than about a third of a pilot budget.</>,
                <><strong>Match tier to goal.</strong> Specialist creators for sign-ups, bigger names for launch reach.</>,
                <><strong>Keep the test slice.</strong> Use it for a new platform, such as a short-form clip on TikTok or Instagram.</>,
                <><strong>Rebook winners.</strong> Hold money back to buy a second post from the creator who performed best.</>,
              ]}
            />
          </section>

          {/* Hidden costs */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which hidden costs do first-time brands forget?</h2>
            <AnswerBox>
              The common misses are usage rights, exclusivity, production, management time, paid amplification and a contingency line. Each one is small alone. Together they push the bill well past the creator fees.
            </AnswerBox>
            <Checklist
              items={[
                <><strong>Usage rights.</strong> Running a creator&apos;s video as your ad is a separate right with a price and an end date. ContentGrip puts usage rights and whitelisting at 15% to 30% on top of the base rate.</>,
                <><strong>Exclusivity.</strong> Blocking a creator from rivals costs extra. Ask for a short window and a named list of competitors.</>,
                <><strong>Production.</strong> Hardware units, shipping, demo accounts, test data and offer landing pages.</>,
                <><strong>Management fee or team time.</strong> Briefs, outreach, reviews, tracking and reports. Count the hours, even if no invoice arrives.</>,
                <><strong>Paid amplification.</strong> Ad spend to show the best creator content to more of your buyers. ContentGrip puts it at 20% to 40% of creator fee spend for brands who amplify.</>,
                <><strong>Payment costs.</strong> Transfer fees and currency conversion when you pay creators in other countries.</>,
                <><strong>Contingency.</strong> Keep 10% for reshoots, a late creator replacement or a rate higher than planned.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Write every add-on into the agreement with a time limit. A <strong>rate card</strong> is a creator&apos;s list of standard prices per format. It is a starting point for talks, not a final price.
            </p>
          </section>

          {/* Calculator */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you build a budget calculator?</h2>
            <AnswerBox>
              Build a sheet with one row per creator post. Multiply expected views by CPM by format multiplier for video, or enter the flat price for a LinkedIn post. Add add-on percentages, sum the rows, then add production, tools and a 10% contingency.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              You do not need special software. Set up these columns in any spreadsheet:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Creator and platform.</strong> One row per post.</li>
              <li><strong>Expected views.</strong> Use the median views of the creator&apos;s last 10 videos or posts, not the best one.</li>
              <li><strong>CPM.</strong> Your planning CPM for the niche, such as $60.</li>
              <li><strong>Format multiplier.</strong> 1.0 for an integration, 1.4 for a dedicated video.</li>
              <li><strong>Base fee.</strong> Views divided by 1,000, times CPM, times multiplier. For flat-priced posts, type the quote instead.</li>
              <li><strong>Add-ons %.</strong> Usage rights plus exclusivity, for example 25%.</li>
              <li><strong>Row total.</strong> Base fee times (1 + add-ons %).</li>
              <li><strong>Program costs.</strong> Below the rows: production, tools, paid amplification.</li>
              <li><strong>Contingency.</strong> 10% of everything above.</li>
              <li><strong>Grand total and cost per result.</strong> Divide the total by your target sign-ups to see the cost per sign-up you need to hit.</li>
            </ol>
            <p className="text-gray-700 leading-relaxed">
              Replace the planning numbers with real quotes as creators reply. The sheet then shows you, line by line, where your plan moved.
            </p>
          </section>

          {/* Scale */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">When should you scale the budget?</h2>
            <AnswerBox>
              Scale once a pilot shows a cost per sign-up or per qualified lead you accept next to your other channels, and at least one creator performs well enough to rebook. Measure at 30 and 90 days before you decide, since tech content keeps earning search traffic.
            </AnswerBox>
            <Checklist
              items={[
                <><strong>Clear winner.</strong> At least one creator beat your target cost per sign-up.</>,
                <><strong>Repeatable result.</strong> A second post from the winner held up.</>,
                <><strong>Clean tracking.</strong> UTM links and a &quot;how did you hear about us&quot; field both point the same way.</>,
                <><strong>Team capacity.</strong> Someone owns briefs, reviews and reporting at the bigger size.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              If the numbers are unclear, fix tracking before you spend more. Our guide to{' '}
              <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>tracking B2B influencer campaigns with UTMs</Link> walks through the setup.
            </p>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Where Infoishai fits in your budget</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai is a free marketplace for tech creators. You{' '}
              <Link href="/creators" className={linkClass}>browse verified tech creators</Link> on YouTube, LinkedIn, X, TikTok and Instagram, message them directly and send offers. There are no platform fees for brands or creators, so every dollar of your creator budget goes to creators. Payments are made directly between brand and creator. Infoishai keeps the record.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Short on team time? Our{' '}
              <Link href="/pricing" className={linkClass}>managed influencer marketing service</Link> builds the shortlist and runs the campaign for you. Pricing is a custom quote for each project.
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
              Last updated November 13, 2026. Rates are third-party estimates and reported deal data, not Infoishai data. The three scenarios are illustrative plans built from stated assumptions. They are not forecasts or guaranteed prices.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Get a quote for your campaign</h2>
          <p className="text-blue-800 mb-6">
            Tell us your goal and budget, and our team will send a custom quote for a managed campaign. Prefer to run it yourself? Infoishai is free for brands and creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Request a Quote
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
