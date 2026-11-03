// src/app/blog/vet-tech-influencers-scorecard/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, Download, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/vet-tech-influencers-scorecard'
const HEADLINE = 'How to Vet a Tech Influencer: A 10-Point Scorecard for B2B Brands'
const META_TITLE = 'How to Vet Tech Influencers: 10-Point Scorecard'
const DESCRIPTION =
  'Use this 10-point scorecard to vet tech influencers before you pay. Check audience fit, engagement quality, technical credibility and brand safety.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'how to vet tech influencers',
    'tech influencer vetting checklist',
    'evaluate tech creators',
    'tech influencer audience quality',
    'tech influencer vetting scorecard template',
    'how to check if a tech influencer audience is real',
    'questions to ask a tech creator before sponsoring',
    'B2B influencer vetting',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-03T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Tech Influencers', 'Vetting', 'B2B', 'Guide'],
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
  datePublished: '2026-11-03',
  dateModified: '2026-11-03',
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

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

// Weights add up to 100. Each score runs 0 to 5, and points = weight x score / 5.
// The worked-example scores below are for two fictional creators.
const criteria = [
  { name: 'Audience relevance', weight: 20, top: 'Followers match your buyer by role, industry, and company size', a: 2, b: 5 },
  { name: 'Engagement quality', weight: 15, top: 'Comments ask specific questions and debate details', a: 3, b: 4 },
  { name: 'Technical credibility', weight: 15, top: 'Shows products in use and gets the details right', a: 2, b: 5 },
  { name: 'Content consistency', weight: 10, top: 'Steady publishing on one topic for 6 months or more', a: 5, b: 3 },
  { name: 'Past sponsor fit', weight: 10, top: 'Past sponsors sell to your buyer and sit outside your direct rivals', a: 2, b: 4 },
  { name: 'Brand safety', weight: 10, top: 'Nothing in old posts or replies you would not stand beside', a: 4, b: 5 },
  { name: 'Disclosure habits', weight: 5, top: 'Every sponsored post carries a clear label at the start', a: 4, b: 3 },
  { name: 'Audience geography', weight: 5, top: 'Most of the audience sits in markets you sell to', a: 3, b: 4 },
  { name: 'Responsiveness', weight: 5, top: 'Clear replies, on time, with data when you ask', a: 3, b: 5 },
  { name: 'Rate fairness', weight: 5, top: 'Rate holds up against benchmarks and the scope offered', a: 2, b: 4 },
]

const points = (weight: number, score: number) => (weight * score) / 5
const totalA = criteria.reduce((sum, c) => sum + points(c.weight, c.a), 0)
const totalB = criteria.reduce((sum, c) => sum + points(c.weight, c.b), 0)

// Blank scorecard offered as a CSV download. Points and total are live formulas.
const scorecardCsv = [
  'Criterion,Weight,Score (0-5),Points',
  ...criteria.map((c, i) => `${c.name},${c.weight},,=B${i + 2}*C${i + 2}/5`),
  `Total,=SUM(B2:B${criteria.length + 1}),,=SUM(D2:D${criteria.length + 1})`,
].join('\n')
const scorecardHref = `data:text/csv;charset=utf-8,${encodeURIComponent(scorecardCsv)}`

const sources = [
  {
    label: 'TopRank Marketing, B2B influencer marketing statistics and trends (August 2025)',
    href: 'https://www.toprankmarketing.com/blog/b2b-influencer-marketing-statistics-trends',
  },
  {
    label: 'MarketingProfs, The State of B2B Influencer Marketing in 2025',
    href: 'https://www.marketingprofs.com/charts/2025/53054/b2b-influencer-marketing-study-stats',
  },
  {
    label: 'LinkedIn, New analytics to understand your audience (December 2022)',
    href: 'https://news.linkedin.com/2022/december/new-analytics-to-understand-your-audience-and-grow-on-linkedin',
  },
  {
    label: 'YouTube Help, Understand your YouTube audience',
    href: 'https://support.google.com/youtube/answer/9314416',
  },
  {
    label: "FTC, The FTC's Endorsement Guides: What People Are Asking",
    href: 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
  },
  {
    label: 'FTC, final rule banning fake reviews and testimonials (August 2024)',
    href: 'https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials',
  },
  {
    label: 'ASA, Recognising ads: social media and influencer marketing',
    href: 'https://www.asa.org.uk/advice-online/recognising-ads-social-media.html',
  },
]

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
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

function Criterion({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-700 leading-relaxed">{children}</p>
    </div>
  )
}

export default function VetTechInfluencersScorecardPage() {
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
              Guide
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Strategy
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A weighted scorecard out of 100, a worked example, and platform red flags. Use it before you send a tech creator an offer.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 3, 2026</span>
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
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 mb-6">
              <p className="text-blue-900 leading-relaxed">
                To vet a tech influencer, score the creator on 10 criteria before you pay: audience relevance, engagement quality, technical credibility, consistency, past sponsors, brand safety, disclosure, geography, responsiveness, and rates. Weight audience relevance highest, add up a score out of 100, and shortlist creators at 80 or above.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Vetting means checking a creator&apos;s audience, content, and conduct against your buyer before money changes hands. Most teams find this step hard. In{' '}
              <ExternalLink href="https://www.toprankmarketing.com/blog/b2b-influencer-marketing-statistics-trends">TopRank Marketing&apos;s 2025 B2B Influencer Marketing Report</ExternalLink>, 48% of respondents named identifying, qualifying, and connecting with ideal influencers as a challenge, the top item on the list.{' '}
              <ExternalLink href="https://www.marketingprofs.com/charts/2025/53054/b2b-influencer-marketing-study-stats">MarketingProfs</ExternalLink> reports the same top challenges from a TopRank and Ascend2 survey of 404 US marketers at B2B firms with 100 or more employees.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This post picks up after you have names to review. If you still need them, start with{' '}
              <Link href="/blog/how-to-find-tech-influencers-b2b-2026" className={linkClass}>how to find B2B tech influencers</Link>. For the full process, from briefs to measurement, read{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>the complete guide to tech influencers</Link>.
            </p>
          </section>

          {/* Follower count */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why is follower count a weak signal for B2B tech?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Follower count tells you how many people subscribed. It says nothing about who they are. A B2B tech product sells to a narrow group, such as platform engineers or security leads, and those buyers are a small share of a general tech audience.
            </p>
            <p className="text-gray-700 leading-relaxed">
              A small creator whose followers run the tools you sell often beats a large channel full of hobbyists. Large numbers still matter for reach, so the scorecard does not ignore size. Size shows up through rate fairness, where you judge the price against the audience you get.
            </p>
          </section>

          {/* Metrics */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What metrics matter for B2B tech creators?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Two metrics carry the most weight: audience relevance and engagement quality. <strong>Audience relevance</strong> is the share of a creator&apos;s audience who match your buyer. <strong>Engagement rate</strong> is interactions divided by followers or views. Tools calculate it in different ways, so use one formula for every creator on your list.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Read the two together. Relevance tells you who the creator reaches. Engagement tells you whether those people respond. High engagement from the wrong audience scores low, and a relevant audience who ignores the content scores low too. You want both.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Ask for first-party data, not a tool&apos;s estimate. On LinkedIn, the creator analytics Audience tab{' '}
              <ExternalLink href="https://news.linkedin.com/2022/december/new-analytics-to-understand-your-audience-and-grow-on-linkedin">breaks followers down</ExternalLink> by job title, location, industry, seniority, company size, and company name. In{' '}
              <ExternalLink href="https://support.google.com/youtube/answer/9314416">YouTube Studio</ExternalLink>, creators see returning viewers, unique viewers, age and gender, and top geographies, though YouTube notes some of this data, such as geography and gender, is limited. A good{' '}
              <Link href="/blog/creator-media-kit-guide-tech-influencers" className={linkClass}>creator media kit</Link> includes these numbers already.
            </p>
          </section>

          {/* Criteria */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The 10 criteria</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Check each one in this order. The first three decide most of the score, so a weak creator drops out early and saves you time.
            </p>
            <Criterion title="1. Audience relevance">
              Ask for job titles or industries, then compare them with your buyer. Read commenters&apos; profiles on the last few posts. If you sell to CISOs and the comments come from students, the score falls, whatever the headline number says.
            </Criterion>
            <Criterion title="2. Engagement quality">
              Read 50 comments across recent posts. Real audiences ask about pricing, edge cases, and alternatives. Generic praise, repeated phrases, and emoji strings point the other way. Judge the words before you judge the rate.
            </Criterion>
            <Criterion title="3. Technical credibility">
              Watch or read the last ten pieces. Does the creator show the product running, explain tradeoffs, and name what it does badly? Ask someone on your engineering team to review two pieces. Tech audiences notice mistakes fast, and your brand inherits them.
            </Criterion>
            <Criterion title="4. Content consistency">
              Look at six months of output. A steady pace on one topic builds an audience who returns. A channel with long gaps or a new topic every month has a weaker hold on its followers.
            </Criterion>
            <Criterion title="5. Past sponsor fit">
              List the last ten sponsors. Do they sell to your buyer? Do they compete with you? Count sponsored posts per month as well. A feed full of ads wears out trust. Check whether the creator still uses the products they promoted.
            </Criterion>
            <Criterion title="6. Brand safety">
              Brand safety means the creator&apos;s content will not embarrass your company by association. Search old posts and replies for the creator&apos;s name plus terms such as &quot;apology&quot; or &quot;lawsuit&quot;. Look at how they treat critics in comments, since a bad reply lives on after the campaign ends.
            </Criterion>
            <Criterion title="7. Disclosure habits">
              Check whether earlier sponsored posts carry a clear label. Under the{' '}
              <ExternalLink href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking">FTC&apos;s Endorsement Guides FAQ</ExternalLink>, responsibility for clear disclosure rests with the influencer and the brand, not the platform. In the UK, the{' '}
              <ExternalLink href="https://www.asa.org.uk/advice-online/recognising-ads-social-media.html">ASA expects a prominent &quot;ad&quot; label upfront</ExternalLink>. A creator who skips labels puts your brand at risk.
            </Criterion>
            <Criterion title="8. Audience geography">
              Compare the creator&apos;s top countries with the markets you sell to. A strong creator in the wrong region is a poor fit if your product is not available there, or if your sales team does not cover it.
            </Criterion>
            <Criterion title="9. Responsiveness">
              Score the outreach itself. A creator who replies on time, answers the question, and sends data when asked will likely run the campaign the same way. Slow or vague replies before a deal rarely improve after one.
            </Criterion>
            <Criterion title="10. Rate fairness">
              Compare the quote with{' '}
              <Link href="/blog/tech-influencer-rates-2026" className={linkClass}>tech influencer rate benchmarks</Link>, then adjust for scope. Usage rights, exclusivity, and revisions all change a fair price. A low rate for the wrong audience is still poor value.
            </Criterion>
          </section>

          {/* Scoring */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you score a tech influencer out of 100?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Give each criterion a score from 0 to 5. Multiply the score by the weight, divide by 5, and add the results. A creator who scores 4 on audience relevance earns 16 of 20 points.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Criterion</th>
                    <th className={thClass}>Weight</th>
                    <th className={thClass}>What a 5 looks like</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((c) => (
                    <tr key={c.name}>
                      <td className={tdClass}>{c.name}</td>
                      <td className={tdClass}>{c.weight}</td>
                      <td className={tdClass}>{c.top}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className={`${tdClass} font-bold text-gray-900`}>Total</td>
                    <td className={`${tdClass} font-bold text-gray-900`}>100</td>
                    <td className={tdClass}></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <a
              href={scorecardHref}
              download="infoishai-tech-influencer-scorecard.csv"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mb-6 no-underline"
            >
              <Download className="w-4 h-4" />
              Download the scorecard (CSV)
            </a>
            <p className="text-gray-700 leading-relaxed mb-4">
              The file opens in Excel or Google Sheets and adds up the points for you. Use these thresholds:
            </p>
            <Checklist
              items={[
                <><strong>80 to 100:</strong> shortlist and start talks.</>,
                <><strong>65 to 79:</strong> offer a small paid test, such as one post, before a larger deal.</>,
                <><strong>Below 65:</strong> pass, or revisit next quarter.</>,
                <><strong>Hard stops:</strong> a 0 on brand safety or audience relevance ends the review, whatever the total says. A 0 on disclosure ends it too, unless the creator agrees in writing to label every sponsored post.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              These weights and thresholds are Infoishai&apos;s editorial starting points, not an industry standard, and a high score does not predict campaign results. Change the weights to fit your goal. A launch aimed at awareness might move 5 points from audience relevance to consistency. Set the weights before you score anyone, so you do not bend them toward a favorite.
            </p>
          </section>

          {/* Worked example */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">A worked example with two fictional creators</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Both creators below are made up to show the math. A fictional company sells an observability tool to DevOps teams. <strong>Creator A</strong> runs a general gadget and software channel on YouTube with 420,000 subscribers. <strong>Creator B</strong> is a site reliability engineer on LinkedIn with 18,000 followers.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Criterion (weight)</th>
                    <th className={thClass}>Creator A score</th>
                    <th className={thClass}>Creator A points</th>
                    <th className={thClass}>Creator B score</th>
                    <th className={thClass}>Creator B points</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((c) => (
                    <tr key={c.name}>
                      <td className={tdClass}>{c.name} ({c.weight})</td>
                      <td className={tdClass}>{c.a}</td>
                      <td className={tdClass}>{points(c.weight, c.a)}</td>
                      <td className={tdClass}>{c.b}</td>
                      <td className={tdClass}>{points(c.weight, c.b)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className={`${tdClass} font-bold text-gray-900`}>Total</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-gray-900`}>{totalA}</td>
                    <td className={tdClass}></td>
                    <td className={`${tdClass} font-bold text-gray-900`}>{totalB}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Creator A has about 23 times the audience and scores {totalA}, below the 65 line, so you pass. Few of those subscribers run production systems, and the reviews stay on the surface. Creator B scores {totalB}, a clear shortlist, with one gap: older sponsored posts have weak labels. You fix this in the contract by requiring a clear label on every post.
            </p>
          </section>

          {/* Red flags */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you spot fake engagement on LinkedIn, YouTube, or X?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Look for numbers without conversation. Fake or traded engagement inflates counts, but it rarely produces specific questions from real practitioners. No single sign proves fraud, so treat these as reasons to ask for more data. In the US, the{' '}
              <ExternalLink href="https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials">FTC&apos;s 2024 final rule</ExternalLink> also bans selling or buying fake indicators of social media influence, such as bot followers or views, when the buyer knew or should have known they were fake and used them to misrepresent their influence for a commercial purpose.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">YouTube</h3>
            <Checklist
              items={[
                <>View counts swing widely between similar videos, with no topic or trend to explain it.</>,
                <>Comments praise the video in general terms and never mention what it covers.</>,
                <>A large subscriber count sits beside low views on most recent uploads.</>,
                <>The creator will not share a Studio screenshot of top geographies or returning viewers.</>,
              ]}
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">LinkedIn</h3>
            <Checklist
              items={[
                <>The same small group comments on every post within minutes, a common sign of an engagement pod.</>,
                <>Comments read like templates, such as &quot;Great insights, thanks for sharing&quot;.</>,
                <>Commenters work in unrelated fields, or sell services to other creators.</>,
                <>The creator shares reach numbers but not the job title breakdown from the Audience tab.</>,
              ]}
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">X</h3>
            <Checklist
              items={[
                <>Replies come from new accounts with few followers and generic profile photos.</>,
                <>Reposts arrive in bursts from accounts with no shared interest in the topic.</>,
                <>High impressions sit beside almost no replies from people in the field.</>,
                <>The feed relies on giveaways or follow-for-follow threads to grow.</>,
              ]}
            />
          </section>

          {/* Questions */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What questions should you ask before you sign?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Send these once a creator clears your score. The answers fill gaps in the scorecard and set up your contract.
            </p>
            <Checklist
              items={[
                <>Please share a screenshot of your audience data from the last 90 days.</>,
                <>Who are your top three job titles or industries in the audience?</>,
                <>Have you used our product, or a product like it? What did you think?</>,
                <>Which sponsors did you work with in the last six months? Do any compete with us?</>,
                <>How do you label sponsored content on each platform?</>,
                <>Do you need to review the product hands-on before you publish? How long does this take?</>,
                <>What does your rate include: revisions, usage rights, and exclusivity?</>,
                <>Share results from one past sponsorship with a similar goal, if the sponsor allows it.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              A creator who answers these clearly earns points on responsiveness as well. For a first deal, our{' '}
              <Link href="/blog/first-tech-influencer-campaign-startup-guide-2026" className={linkClass}>startup campaign guide</Link> covers what to do next.
            </p>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to run this scorecard inside Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai is a free marketplace for tech brands and tech creators, with no platform fees. You run the review, and the marketplace holds the steps in one place.
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              <li>
                <Link href="/creators" className={linkClass}>Browse verified tech creators</Link> by niche, platform, and country. Infoishai covers YouTube, LinkedIn, X (Twitter), TikTok, and Instagram.
              </li>
              <li>Save your first picks to your roster, then score them in the CSV.</li>
              <li>Message creators directly with the questions above.</li>
              <li>Send an offer to the ones who clear your threshold. An accepted offer moves into a contract and deliverables tracker.</li>
              <li>Pay the creator directly. Payments are made directly between brand and creator. Infoishai keeps the record.</li>
            </ol>
            <p className="text-gray-700 leading-relaxed">
              A verified badge on a profile is a useful starting signal, not a replacement for your own score. If you would rather hand the campaign to a team, the{' '}
              <Link href="/pricing" className={linkClass}>managed service</Link> runs on a custom quote.
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
              Last updated November 3, 2026. This guide covers B2B tech sponsorships and is general information, not legal advice. Check disclosure rules for each market with your own counsel.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Put the scorecard to work</h2>
          <p className="text-blue-800 mb-6">
            Browse verified tech creators on Infoishai for free, and message the ones worth scoring.
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
