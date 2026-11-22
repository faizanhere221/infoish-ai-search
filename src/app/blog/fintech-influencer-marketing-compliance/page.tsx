// src/app/blog/fintech-influencer-marketing-compliance/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/fintech-influencer-marketing-compliance'
const HEADLINE = 'Fintech Influencer Marketing: Working with Creators Under Regulatory Scrutiny'
const META_TITLE = 'Fintech Influencer Marketing: Creators and Compliance'
const DESCRIPTION =
  'Fintech brands work with creators safely when compliance leads the process. Learn review workflows, disclosure habits and how to choose credible fintech voices.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'fintech influencer marketing compliance',
    'fintech influencers',
    'fintech creators sponsorship',
    'regulated influencer campaigns',
    'fintech influencers singapore',
    'financial promotion influencer rules',
    'fintech creator brief compliance',
    'FCA finfluencer guidance',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-22T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Fintech', 'Compliance', 'Financial Promotions', 'B2B Marketing'],
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
  datePublished: '2026-11-22',
  dateModified: '2026-11-22',
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

const FCA_FG24_1 =
  'https://www.fca.org.uk/publications/finalised-guidance/fg24-1-finalised-guidance-financial-promotions-social-media'
const FCA_FG24_1_PDF = 'https://www.fca.org.uk/publication/finalised-guidance/fg24-1.pdf'
const FCA_SENTENCE =
  'https://www.fca.org.uk/news/press-releases/geordie-shore-star-illegal-finfluencer-sentenced-promoting-high-risk-investments-social-media'
const FCA_GLOBAL =
  'https://www.fca.org.uk/news/press-releases/fca-spearheads-global-action-stop-illegal-finfluencers'
const MAS_DPT =
  'https://www.mas.gov.sg/news/media-releases/2022/mas-issues-guidelines-to-discourage-cryptocurrency-trading-by-general-public'
const ASAS_GUIDE =
  'https://www.twobirds.com/en/insights/2016/singapore/new-guidelines-released-to-regulate-advertising-on-digital-platforms'
const FTC_GUIDES =
  'https://www.federalregister.gov/documents/2023/07/26/2023-14795/guides-concerning-the-use-of-endorsements-and-testimonials-in-advertising'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const jurisdictionRows = [
  {
    market: 'United Kingdom',
    rule: 'Section 21 FSMA financial promotion restriction; FCA guidance FG24/1 on social media',
    pointer:
      'A promotion of a regulated product needs an authorised firm to communicate or approve it. The firm stays responsible for promotions it causes an influencer to make.',
    ask: 'Is this product regulated? Who approves the content? Does the format need a prescribed risk warning?',
  },
  {
    market: 'United Kingdom',
    rule: 'CAP Code, enforced by the ASA',
    pointer: 'Paid content is labelled as an ad upfront, including affiliate links.',
    ask: 'Which label do we require, and where in the post?',
  },
  {
    market: 'Singapore',
    rule: 'MAS guidelines on digital payment token (crypto) services, January 2022',
    pointer:
      'Crypto service providers are expected not to engage influencers to promote their services to the general public in Singapore.',
    ask: 'Does any part of our product count as a DPT service?',
  },
  {
    market: 'Singapore',
    rule: 'ASAS guidelines on interactive marketing and social media, 2016',
    pointer: 'A paid relationship needs a clear, prominent disclosure placed early in the post.',
    ask: 'Do other MAS rules cover our product (advisory, lending, insurance)?',
  },
  {
    market: 'United States',
    rule: 'FTC Endorsement Guides, revised 2023',
    pointer: 'Material connections between brand and creator are disclosed clearly. Claims need substantiation.',
    ask: 'Do SEC, FINRA or state rules apply to our product or to the creator?',
  },
]

const sources = [
  {
    label: 'FCA, FG24/1: Finalised guidance on financial promotions on social media (March 26, 2024)',
    href: FCA_FG24_1,
  },
  {
    label: 'FCA, FG24/1 full guidance document (PDF, March 2024)',
    href: FCA_FG24_1_PDF,
  },
  {
    label: 'FCA, press release on the sentencing of two finfluencers (November 19, 2026)',
    href: FCA_SENTENCE,
  },
  {
    label: 'FCA, global week of action against illegal finfluencers (April 24, 2026)',
    href: FCA_GLOBAL,
  },
  {
    label: 'MAS, guidelines to discourage cryptocurrency trading by the general public (January 17, 2022)',
    href: MAS_DPT,
  },
  {
    label: 'Bird & Bird, summary of the ASAS guidelines on interactive marketing and social media (2016)',
    href: ASAS_GUIDE,
  },
  {
    label: 'Federal Register, FTC Guides Concerning the Use of Endorsements and Testimonials (July 26, 2023)',
    href: FTC_GUIDES,
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

const workflowSteps = [
  {
    title: '1. Classify the product before you brief anyone',
    body: 'Ask compliance one question first: is this product regulated, and in which markets? A B2B payments API sold to developers sits under different rules than a retail investment app. The answer decides every later step.',
  },
  {
    title: '2. Write the claims sheet with compliance',
    body: 'List the approved claims, the banned claims (returns, "safe", "guaranteed") and any required risk wording, word for word. Creators work from this sheet, not from your sales deck.',
  },
  {
    title: '3. Put the review step in the contract',
    body: 'The contract names who approves the content, how many review rounds you get and the turnaround time. It also says the creator posts nothing about the product before approval and edits nothing after it.',
  },
  {
    title: '4. Review the final cut, not the script',
    body: 'Your approver checks the exact video, caption and thumbnail going live. A risk warning in the script means nothing if the edit drops it or the platform truncates it.',
  },
  {
    title: '5. Keep the record',
    body: 'Save the approved version, the approval date and the approver name. Regulators ask for this record. So do your auditors.',
  },
  {
    title: '6. Monitor after posting',
    body: 'Check comments and reposts for the first week. Creators often answer follow-up questions in replies, and a casual reply about returns is a new promotion.',
  },
]

export default function FintechInfluencerMarketingCompliancePage() {
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
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Fintech</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A playbook for regulated fintech marketers: the rules to check in the UK, Singapore and the US, a
            compliance review workflow for creator content, and how to pick creators who stay inside the lines.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 22, 2026</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Are fintech brands allowed to use influencers?</h2>
            <AnswerBox>
              Yes, with conditions. In most markets, a creator post about a regulated financial product counts as a
              financial promotion or an ad, and your firm stays responsible for it. Fintech brands run creator
              campaigns safely when compliance approves the claims, reviews the final content and keeps a record of
              each approval.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Fintech influencer marketing compliance</strong> is the set of checks a financial technology
              company runs before, during and after paying a creator to talk about its product. The checks cover
              who approves the content, which claims are allowed, which risk warnings appear and how the paid
              relationship is disclosed.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: fintech brands marketing to the UK, Singapore and the US, with B2B and B2C products. This post
              is a practical guide, not legal advice. Every rule below needs confirmation from your own counsel for
              your product and market. Facts were checked on November 22, 2026. For creator marketing as a whole,
              read the{' '}
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
                <strong>Fintech:</strong> companies using software to deliver financial services, such as payments,
                lending, investing, banking, insurance or crypto. Some fintech products are regulated financial
                services; others, such as accounting software, are not.
              </p>
              <p className="text-gray-700">
                <strong>Financial promotion:</strong> in UK law, an invitation or inducement to engage in investment
                activity, communicated in the course of business. A fintech brand becomes subject to financial
                promotion rules once its product is a regulated financial service and its marketing invites people
                to use it. A creator video about your investing app is a financial promotion; a video about your
                developer API for invoices usually is not.
              </p>
              <p className="text-gray-700">
                <strong>FCA:</strong> the Financial Conduct Authority, the UK regulator for financial services firms
                and for financial promotions.
              </p>
              <p className="text-gray-700">
                <strong>MAS:</strong> the Monetary Authority of Singapore, the central bank and financial regulator
                of Singapore.
              </p>
            </div>
          </section>

          {/* Why fintech is different */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why fintech is different</h2>
            <AnswerBox>
              In most tech categories, a bad creator post costs you reputation. In regulated finance, an unapproved
              post is a legal problem for the creator and for the firm behind it. Regulators now treat creators as
              a priority.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The UK shows the trend. In its social media guidance, the FCA says firms working with affiliate
              marketers, such as influencers, &quot;should take proactive responsibility&quot; for how those
              affiliates communicate financial promotions (
              <ExternalLink href={FCA_FG24_1_PDF}>FCA FG24/1, 2024</ExternalLink>). A breach of the financial
              promotion restriction is a criminal offence, punishable by up to two years in prison, an unlimited
              fine or both.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Enforcement is active. In April 2026, the FCA led a week of action with 17 regulators worldwide,
              including MAS. In the UK alone, the FCA found 1,267 illegal financial adverts on Meta platforms,
              reaching at least 2.3 million UK accounts (
              <ExternalLink href={FCA_GLOBAL}>FCA, April 2026</ExternalLink>). On November 19, 2026, the FCA
              announced the sentencing of a reality TV star with more than 2 million Instagram followers and a
              second finfluencer, both for promoting an unauthorised foreign exchange trading scheme (
              <ExternalLink href={FCA_SENTENCE}>FCA, November 2026</ExternalLink>).
            </p>
            <p className="text-gray-700 leading-relaxed">
              Those cases involved unauthorised schemes, not licensed fintech brands. The lesson still applies to
              you: regulators read creator content closely, and a creator who improvises a claim about returns puts
              your licence in the frame.
            </p>
          </section>

          {/* Rules */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What financial promotion rules apply?</h2>
            <AnswerBox>
              It depends on the product and the market. Check three layers: financial regulation (who approves the
              promotion and which warnings it needs), advertising rules (how the paid relationship is disclosed) and
              product-specific limits, such as crypto marketing restrictions.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The table lists pointers to raise with your counsel. Treat it as a question list, not a rulebook.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Market</th>
                    <th className={thClass}>Rule to check</th>
                    <th className={thClass}>Pointer</th>
                    <th className={thClass}>Question for counsel</th>
                  </tr>
                </thead>
                <tbody>
                  {jurisdictionRows.map((row) => (
                    <tr key={row.rule}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.market}</td>
                      <td className={tdClass}>{row.rule}</td>
                      <td className={tdClass}>{row.pointer}</td>
                      <td className={tdClass}>{row.ask}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Three UK details creators often miss</h3>
            <Checklist
              items={[
                <>
                  <strong>Each post stands alone.</strong> The FCA expects every financial promotion to be
                  compliant on its own (<ExternalLink href={FCA_FG24_1}>FCA FG24/1</ExternalLink>). A balanced
                  thread does not rescue one misleading post in it.
                </>,
                <>
                  <strong>A caption is not enough for risk warnings.</strong> The guidance says a short-form video
                  with the risk warning only in the caption does not comply. The warning belongs in the video.
                </>,
                <>
                  <strong>Character limits are your problem.</strong> If a format is too short for the required
                  information, the FCA asks firms to consider whether the format suits the product at all.
                </>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed mb-6">
              In Singapore, the strictest limit applies to crypto. MAS guidelines from January 2022 say digital
              payment token service providers should not engage third parties, such as social media influencers,
              to promote their services to the general public in Singapore (
              <ExternalLink href={MAS_DPT}>MAS, 2022</ExternalLink>). For disclosure, the ASAS guidelines ask for
              prominent disclosure of a paid relationship, placed so readers see it early (
              <ExternalLink href={ASAS_GUIDE}>Bird &amp; Bird summary</ExternalLink>).
            </p>
            <p className="text-gray-700 leading-relaxed">
              In the US, the FTC Endorsement Guides, revised in 2023, require clear disclosure of material
              connections between brands and endorsers (
              <ExternalLink href={FTC_GUIDES}>Federal Register, 2023</ExternalLink>). Investment, lending and
              insurance products add their own regulators on top. Our{' '}
              <Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>
                B2B influencer disclosure rules guide
              </Link>{' '}
              covers labels in more detail.
            </p>
          </section>

          {/* Workflow */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you handle legal review?</h2>
            <AnswerBox>
              Bring compliance in before the brief, not after the draft. Agree the approved claims, put the review
              step and timing in the creator contract, approve the final cut, and store the approval record.
            </AnswerBox>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              {workflowSteps.map((step) => (
                <div key={step.title}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-700">{step.body}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Plan for time. A regulated review adds days, so tell creators the timeline at the first message. Our{' '}
              <Link href="/blog/tech-creator-brief-template" className={linkClass}>
                tech creator brief template
              </Link>{' '}
              has space for a claims sheet and review dates.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <em>Illustrative example, not a client case:</em> a UK business banking app sponsors a LinkedIn
              creator who writes about running a small agency. Compliance approves three claims about invoicing
              features and bans any mention of interest rates. The creator drafts a post on chasing late invoices,
              compliance approves the final text and image, and the marketer saves the approved file with the
              date.
            </p>
          </section>

          {/* Creator selection */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to choose creators for regulated claims</h2>
            <AnswerBox>
              Pick creators who explain products, not creators who promise outcomes. Look for a record of accurate
              content, comfort with review steps and an audience matched to your licence and market.
            </AnswerBox>
            <Checklist
              items={[
                <>
                  <strong>Explainers over hype.</strong> Their past posts teach how a product works rather than
                  promise returns or quick wins.
                </>,
                <>
                  <strong>Review-friendly.</strong> They have worked with regulated brands before and accept a
                  review step in writing.
                </>,
                <>
                  <strong>Audience in your licensed markets.</strong> Ask for country data from platform
                  analytics. A Singapore-heavy audience matters if your licence covers only the UK.
                </>,
                <>
                  <strong>Professional context.</strong> For B2B fintech, founders, finance leads and developers on
                  LinkedIn, X and YouTube often fit better than personal finance entertainers.
                </>,
                <>
                  <strong>Clean disclosure habits.</strong> Their sponsored posts carry clear labels today.
                </>,
              ]}
            />
            <Checklist
              negative
              items={[
                <>Screenshots of trading profits or income claims in recent posts.</>,
                <>Promotions of unregulated schemes, signal groups or high-leverage products.</>,
                <>Refusal to accept any review of sponsored content.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>
                tech influencer vetting scorecard
              </Link>{' '}
              turns these checks into a score. For market-specific shortlists, see{' '}
              <Link href="/influencers/singapore" className={linkClass}>
                tech influencers in Singapore
              </Link>
              ,{' '}
              <Link href="/influencers/uk" className={linkClass}>
                tech influencers in the UK
              </Link>{' '}
              and our list of{' '}
              <Link href="/blog/top-tech-influencers-singapore-2026" className={linkClass}>
                top tech influencers in Singapore
              </Link>
              .
            </p>
          </section>

          {/* Measurement */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to measure a regulated campaign</h2>
            <AnswerBox>
              Track sign-ups or demo requests per creator with tracked links and codes, and track compliance health
              alongside them: approval time, revisions per post and zero unapproved posts.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Give each creator a tracked link and, where your onboarding allows it, a referral code. Report
              qualified sign-ups, completed onboarding (for example, a verified account) and, for B2B, demo
              requests and pipeline. Our{' '}
              <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>
                UTM tracking guide
              </Link>{' '}
              shows a naming pattern.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Add a compliance scorecard. Measure days from draft to approval, rounds of revisions and any post
              published without approval. A creator who delivers strong numbers and one unapproved post is a
              problem, not a win. To show the results to finance, read our guide to{' '}
              <Link href="/blog/b2b-influencer-marketing-roi" className={linkClass}>
                B2B influencer marketing ROI
              </Link>
              .
            </p>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Run regulated creator campaigns with Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai lists tech creators on YouTube, LinkedIn, X, TikTok and Instagram across nine countries,
              including the UK and Singapore. You{' '}
              <Link href="/creators" className={linkClass}>
                browse verified tech creators
              </Link>
              , message them and send deal proposals. Once a creator joins your campaign, the campaign tools track
              the offer, contract, deliverables and payment status in one place, which helps you keep the approval
              record your compliance team needs.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Infoishai is free for brands and creators. There are no platform fees. Payments are made directly
              between brand and creator, and Infoishai keeps the record. Infoishai does not give legal advice or
              approve financial promotions; your compliance team or an authorised approver does. To hand the
              campaign work off, our{' '}
              <Link href="/pricing" className={linkClass}>
                managed influencer marketing service
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
              Last updated November 22, 2026. This post is general information, not legal advice. Rules change and
              depend on your product, licence and audience; confirm each point with qualified counsel before you
              launch a campaign. The UK advert and reach figures come from the FCA&apos;s April 2026 week of action
              and refer to Meta platforms. The business banking example is illustrative.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Talk to us about regulated campaigns</h2>
          <p className="text-blue-800 mb-6">
            Our managed service plans and runs creator campaigns around your compliance process. Pricing is by
            custom quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Talk to Us About Your Campaign
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
