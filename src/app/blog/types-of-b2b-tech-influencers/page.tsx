// src/app/blog/types-of-b2b-tech-influencers/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/types-of-b2b-tech-influencers'
const HEADLINE = 'The Six Types of B2B Tech Influencers and When to Hire Each'
const META_TITLE = '6 Types of B2B Tech Influencers and When to Hire Them'
const DESCRIPTION =
  'Analysts, developer advocates, practitioners, YouTubers and more: learn the six types of B2B tech influencers and which one fits your product and funnel stage.'

export const metadata: Metadata = {
  title: META_TITLE,
  description: DESCRIPTION,
  keywords: [
    'types of b2b tech influencers',
    'b2b tech influencers',
    'who are b2b influencers',
    'tech influencer categories',
    'developer advocates vs tech youtubers',
    'linkedin operators vs analysts influencer',
    'practitioner influencers b2b',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-05T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['B2B', 'Creator Types', 'Tech Influencers'],
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
  datePublished: '2026-11-05',
  dateModified: '2026-11-05',
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

const TOPRANK_PDF = 'https://toprankmarketing.com/wp-content/uploads/2025/01/Influencer-Marketing-Report-2025-2.pdf'
const TOPRANK_BLOG = 'https://www.toprankmarketing.com/blog/b2b-influencer-marketing-statistics-trends'
const MARKETINGPROFS = 'https://www.marketingprofs.com/charts/2025/53054/b2b-influencer-marketing-study-stats'
const OKTOPOST = 'https://www.oktopost.com/glossary/what-are-b2b-influencers-a-guide-for-marketers/'
const TECHTARGET = 'https://www.techtarget.com/it-infrastructure/tip/What-does-a-developer-advocate-do'
const STACK_OVERFLOW =
  'https://stackoverflow.co/advertising/resources/stack-overflow-developer-survey-for-b2b-tech-marketers/insight-2/'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const matrix = [
  {
    type: 'Industry analysts',
    stage: 'Bottom, plus vendor shortlists',
    fit: 'Enterprise software, security, cloud platforms',
    weak: 'Early products with few customers',
  },
  {
    type: 'Developer advocates',
    stage: 'Top and middle',
    fit: 'APIs, SDKs, dev tools, open source',
    weak: 'Business apps with no technical buyer',
  },
  {
    type: 'Practitioner creators',
    stage: 'Middle and bottom',
    fit: 'DevOps, security, data, and vertical SaaS',
    weak: 'Mass awareness goals',
  },
  {
    type: 'LinkedIn operators',
    stage: 'Top and middle',
    fit: 'SaaS sold to managers and executives',
    weak: 'Hands-on technical proof',
  },
  {
    type: 'Long-form YouTubers',
    stage: 'Top and middle',
    fit: 'Products with a visible workflow to demo',
    weak: 'Products with no screen worth showing',
  },
  {
    type: 'Podcast and newsletter hosts',
    stage: 'Top and middle',
    fit: 'Complex topics and narrow job roles',
    weak: 'Goals needing an instant click count',
  },
]

const delivery = [
  {
    type: 'Industry analysts',
    work: 'Vendor briefing, research mention, paid advisory session',
    lead: '3 to 6 months or more',
  },
  {
    type: 'Developer advocates',
    work: 'Tutorial, proof of concept, walk-through video, conference talk',
    lead: '4 to 8 weeks',
  },
  {
    type: 'Practitioner creators',
    work: 'Product teardown, workflow post, honest review',
    lead: '2 to 4 weeks',
  },
  {
    type: 'LinkedIn operators',
    work: 'Sponsored post, document post, newsletter issue, live session',
    lead: '1 to 3 weeks',
  },
  {
    type: 'Long-form YouTubers',
    work: 'Dedicated review, integrated segment, tutorial',
    lead: '4 to 8 weeks',
  },
  {
    type: 'Podcast and newsletter hosts',
    work: 'Sponsor slot, guest episode, dedicated issue',
    lead: '2 to 8 weeks, often set by booked slots',
  },
]

const mismatches: { title: string; detail: string }[] = [
  {
    title: 'A gadget reviewer for a security SaaS.',
    detail: 'Large views, wrong viewers. A phone review audience rarely includes the person who buys security software.',
  },
  {
    title: 'A LinkedIn operator for a developer SDK.',
    detail: 'The post reads well, and your developers ignore it. They want working code, so send a developer advocate.',
  },
  {
    title: 'An analyst pitch before you have customers.',
    detail: 'Analysts need evidence from your market. Without it, you spend a briefing on your roadmap and gain little.',
  },
  {
    title: 'A practitioner for a mass awareness target.',
    detail: 'Small, specialist audiences earn trust, not reach. Judge them on qualified replies and demos.',
  },
  {
    title: 'A newsletter sponsor judged on week-one clicks.',
    detail: 'Readers often act later, or forward the issue to a colleague. Read the results over a longer window.',
  },
]

const finding: { type: string; where: ReactNode }[] = [
  {
    type: 'Industry analysts',
    where: 'Start with the firm covering your category, then read who wrote the latest reports. Your analyst relations lead or PR agency usually knows the names.',
  },
  {
    type: 'Developer advocates',
    where: 'Check conference speaker lists, vendor engineering blogs, and developer communities. Search LinkedIn and X for the job title plus your stack.',
  },
  {
    type: 'Practitioner creators',
    where: 'Ask your customers who they follow. Then search LinkedIn, X, and YouTube for job titles and the problems your product solves.',
  },
  {
    type: 'LinkedIn operators',
    where: 'Search by job function, and read who your buyers comment on. Look for detail from real work, not recycled advice.',
  },
  {
    type: 'Long-form YouTubers',
    where: 'Search YouTube for your category plus "tutorial" or "review", then study the comments for signs of your buyer.',
  },
  {
    type: 'Podcast and newsletter hosts',
    where: 'Ask your sales calls what buyers listen to and read. Then check each show or issue for past sponsors and audience details.',
  },
]

const sources = [
  { label: 'TopRank Marketing, 2025 B2B Influencer Marketing Report (PDF)', href: TOPRANK_PDF },
  { label: 'TopRank Marketing, B2B influencer marketing statistics and trends (August 2025)', href: TOPRANK_BLOG },
  { label: 'MarketingProfs, summary of the TopRank and Ascend2 survey (2025)', href: MARKETINGPROFS },
  { label: 'Oktopost glossary, What are B2B influencers?', href: OKTOPOST },
  { label: 'TechTarget, What does a developer advocate do? (September 2023)', href: TECHTARGET },
  { label: 'Stack Overflow, Developer Survey insights for B2B tech marketers', href: STACK_OVERFLOW },
]

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  )
}

export default function TypesOfB2BTechInfluencersPage() {
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
              Creator Types
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Guide
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Who each type reaches, what they deliver, how long the work takes, and where brands pick wrong.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 5, 2026</span>
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
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 mb-6">
              <p className="text-blue-900 leading-relaxed">
                A B2B tech influencer is a person whose expertise shapes how software, cloud, AI, or security buyers think and choose. Most fit six types: industry analysts, developer advocates, practitioner creators, LinkedIn operators, long-form YouTubers, and podcast or newsletter hosts. Pick the type by your buyer, product, and funnel stage, not follower count.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              This guide is for marketers new to B2B influence. It explains each type, then gives you a decision matrix, a list of deliverables and lead times, and the mismatches to avoid. It does not cover rates or contracts. For the full process, read our{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>complete guide to tech influencers</Link>.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The six types are our own working categories, not an industry standard. Real people often straddle two.
            </p>
          </section>

          {/* What counts */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What counts as a B2B tech influencer?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              A person counts when people in your buying group trust their view on a technical or business decision. Oktopost&apos;s{' '}
              <ExternalLink href={OKTOPOST}>glossary definition</ExternalLink> centres on the same idea: professionals with credibility, authority, or expertise in a specific B2B industry. Reach alone does not qualify anyone. Our guide to{' '}
              <Link href="/blog/b2b-vs-b2c-influencer-marketing-tech-2026" className={linkClass}>B2B vs B2C tech influencer marketing</Link> explains why buyers weigh expertise over audience size.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Choosing the right person is the hard part. In{' '}
              <ExternalLink href={TOPRANK_PDF}>TopRank Marketing&apos;s 2025 report</ExternalLink>, 48% of respondents ranked identifying, qualifying, and connecting with ideal influencers as their top challenge. The same report shows 81% with a dedicated budget (53% growing, 24% flat, 4% shrinking). On results, 43% report outstanding results, 48% some effectiveness, and 9% call their strategy ineffective.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Read those numbers with care. <ExternalLink href={MARKETINGPROFS}>MarketingProfs</ExternalLink> describes the survey as 404 US marketers at B2B firms with 100 or more employees, run by TopRank and Ascend2. Results are self-reported, and TopRank is a marketing agency. The survey also does not split results by influencer type, so no figure here ranks one type above another.
            </p>
          </section>

          {/* Six types */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The six types, explained</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Industry analysts: are they influencers?</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Yes in effect, though you rarely hire one like a creator. An <strong>industry analyst</strong> is a researcher, at a firm such as Gartner or Forrester or working independently, who evaluates a market and advises buyers. Their work often appears when a buyer builds a vendor shortlist.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              You work with analysts through briefings and evidence, a practice called analyst relations. Do not plan around buying a favourable rating. Ask each firm how its paid services relate to its research, and ask independents how they disclose paid work.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Developer advocates</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>developer advocate</strong> teaches developers how to use a technology. <ExternalLink href={TECHTARGET}>TechTarget</ExternalLink> calls the role &quot;part teacher, part listener, part problem-solver and part programmer&quot; and says it typically reports through marketing. Duties include tutorials, proofs of concept, and video walk-throughs.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              This format fits how developers learn. <ExternalLink href={STACK_OVERFLOW}>Stack Overflow reports</ExternalLink> 82% of developers learn to code with online resources, with technical documentation (83%) at the top of the list of resources they consult.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              One catch: many advocates work for a vendor, so ask whether their employer allows outside sponsorships. Former advocates who now create independently are often easier to hire.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Here is how the first two types relate. An industry analyst judges a market from outside, for the people who sign. A developer advocate teaches a tool from close up, for the people who use it. A dev tool sold to enterprises often needs both, at different stages.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Practitioner creators</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>practitioner creator</strong> does the job your buyer does, such as security engineer or product manager, and shares what works. Audiences tend to be small, but they share a job title with your buyer. Their approval reads as peer advice. Check their employer&apos;s rules on paid posts, and let them say what they dislike about your product.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4. LinkedIn operators</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>LinkedIn operator</strong> has run a business function, such as revenue operations, growth, or product, and posts about it on LinkedIn. This is our label for the type. Operators reach managers and executives who rarely watch a product tutorial. Compared with an analyst, an operator shares one person&apos;s experience, not market-wide research. Budgeting one? Read our{' '}
              <Link href="/blog/linkedin-tech-creator-rates" className={linkClass}>LinkedIn tech creator rates</Link> guide.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Long-form YouTubers</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              A long-form YouTuber makes in-depth tutorials, reviews, or comparisons. Length lets them show your product doing real work, and viewers often find older videos through search. So the difference between a developer advocate and a tech YouTuber is mostly motive: the advocate&apos;s job is adoption of a technology, while an independent YouTuber answers to an audience. Before you shortlist, separate B2B channels from consumer gadget channels with our guide to{' '}
              <Link href="/blog/how-to-find-tech-youtubers-product-reviews-2026" className={linkClass}>finding tech YouTubers</Link>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Podcast and newsletter hosts</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              These hosts own a recurring show or email list on a narrow topic. Their audiences opt in, and the format suits complex subjects. In TopRank&apos;s ranking of influencer content types, 22% chose podcasts and 13% newsletters, against 56% for social media posts and 29% for video.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Infoishai does not list podcasts or newsletters as platforms, so you book these hosts directly.
            </p>
          </section>

          {/* Matrix */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which type fits your funnel stage and product?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Match the type to what your buyer needs next. Use awareness types early, and proof types close to the decision. This matrix is our editorial judgment, not survey data, so test it against your own pipeline.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Type</th>
                    <th className={thClass}>Funnel stage</th>
                    <th className={thClass}>Best product fit</th>
                    <th className={thClass}>Weak fit</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row) => (
                    <tr key={row.type}>
                      <td className={`${tdClass} font-medium`}>{row.type}</td>
                      <td className={tdClass}>{row.stage}</td>
                      <td className={tdClass}>{row.fit}</td>
                      <td className={tdClass}>{row.weak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Dev tool */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which type of creator suits a dev tool?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Start with developer advocates and practitioner creators who already work in your stack. Developers judge a tool by trying it, so a working tutorial beats a broad endorsement. Add a long-form YouTuber once you have a demo worth watching.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Here is a fictional example. An API monitoring startup hires a former advocate for a tutorial, then two platform engineers for workflow posts. Six months later, with enterprise customers on board, it books its first analyst briefing. The order follows the evidence: usage first, then market recognition.
            </p>
          </section>

          {/* Deliverables */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What does each type deliver, and how long does it take?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Plan weeks for creators and months for analysts. Lead time here means your first contact to published work. These ranges are our planning suggestions, not published benchmarks, so confirm dates with each person.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Type</th>
                    <th className={thClass}>Typical deliverables</th>
                    <th className={thClass}>Planning lead time</th>
                  </tr>
                </thead>
                <tbody>
                  {delivery.map((row) => (
                    <tr key={row.type}>
                      <td className={`${tdClass} font-medium`}>{row.type}</td>
                      <td className={tdClass}>{row.work}</td>
                      <td className={tdClass}>{row.lead}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mismatches */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Common mismatches to avoid</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Most bad picks come from buying audience size when you needed audience fit. Watch for these five.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              {mismatches.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong> {item.detail}
                </li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Once you pick a type, test each person with our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>10-point vetting scorecard</Link>.
            </p>
          </section>

          {/* Finding */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to find each type</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Each type gathers in different places, so run a separate search for each. For a full workflow, read{' '}
              <Link href="/blog/how-to-find-tech-influencers-b2b-2026" className={linkClass}>how to find B2B tech influencers</Link>.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Type</th>
                    <th className={thClass}>Where to look</th>
                  </tr>
                </thead>
                <tbody>
                  {finding.map((row) => (
                    <tr key={row.type}>
                      <td className={`${tdClass} font-medium`}>{row.type}</td>
                      <td className={tdClass}>{row.where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Where Infoishai fits</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai helps most with creators on YouTube, LinkedIn, X (Twitter), TikTok, and Instagram. You{' '}
              <Link href="/creators" className={linkClass}>browse verified tech creators</Link>, filter by niche and platform, and message them directly. Our profiles do not use these six labels, so read each profile and recent work to judge the type.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Infoishai is free for brands and creators, with no platform fees. You pay creators directly, and Infoishai keeps the record. Want a team to run the work? Our{' '}
              <Link href="/pricing" className={linkClass}>managed service</Link> works on a custom quote.
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
              Last updated November 5, 2026. Survey figures come from TopRank and Stack Overflow and cover the periods those publishers reported. The six types, the matrix, and the lead times are Infoishai&apos;s editorial guidance. Infoishai does not publish its own performance data here.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Filter creators by niche and platform</h2>
          <p className="text-blue-800 mb-6">
            Know the type you need? Search verified tech creators and message them directly. Infoishai is free for brands and creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/creators"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Browse Creators
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
