// src/app/blog/cybersecurity-influencer-marketing/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User, XCircle } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/cybersecurity-influencer-marketing'
const HEADLINE = 'Cybersecurity Influencer Marketing: Earning Trust from Sceptical Practitioners'
const META_TITLE = 'Cybersecurity Influencer Marketing: Earn Practitioner Trust'
const DESCRIPTION =
  'How security vendors work with creators and researchers: choose credible voices, brief for accuracy, handle sceptical audiences and keep disclosures clean.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'cybersecurity influencer marketing',
    'security influencers for vendors',
    'cybersecurity creators sponsorship',
    'infosec content creators',
    'how security vendors work with youtubers',
    'cyber influencer marketing trust',
    'security researcher sponsorship ethics',
    'CISO influencers',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-19T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Cybersecurity', 'Security Marketing', 'B2B Tech', 'Strategy'],
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
  datePublished: '2026-11-19',
  dateModified: '2026-11-19',
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

const PONEMON_STUDY =
  'https://ponemonsullivanreport.com/2026/06/the-state-of-cybersecurity-marketing-influence-2026-from-awareness-to-selection-how-buyers-evaluate-vendors/'
const CISA_CVD = 'https://www.cisa.gov/coordinated-vulnerability-disclosure-process'
const FTC_255_1 = 'https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255/section-255.1'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const creatorRows = [
  {
    type: 'Practitioner educators',
    who: 'Analysts, pentesters and engineers who teach on YouTube: labs, tool walkthroughs, incident breakdowns',
    strength: 'Hands-on proof in front of the people who run the tools',
    watch: 'Audience skews toward learners; check how many viewers work in security today',
  },
  {
    type: 'Security researchers',
    who: 'People who find and publish vulnerabilities, speak at conferences and write deep technical posts',
    strength: 'Highest technical credibility with practitioners',
    watch: 'Independence is their brand; expect them to refuse any say over findings',
  },
  {
    type: 'CISOs and security leaders',
    who: 'Current or former heads of security who post on LinkedIn and speak on panels',
    strength: 'Reach to budget holders and peers of your buyer',
    watch: 'Employer rules often limit paid endorsements; many accept only advisory or speaking work',
  },
  {
    type: 'News and threat commentators',
    who: 'Accounts on X and LinkedIn who summarise breaches, advisories and research',
    strength: 'Speed and daily attention from practitioners',
    watch: 'A sponsored post next to breach news reads as opportunistic if timed badly',
  },
  {
    type: 'Short-form explainers',
    who: 'Creators on TikTok, Instagram and YouTube Shorts who explain security for wider audiences',
    strength: 'Awareness, hiring and consumer or SMB products',
    watch: 'Rarely reaches enterprise buyers on its own',
  },
]

const funnelRows = [
  {
    stage: 'Awareness',
    goal: 'Get known by practitioners outside your customer base',
    formats: 'Short explainers, threat commentary threads, a sponsored segment in an educator video',
    measure: 'Reach inside the right audience, new followers, branded search',
  },
  {
    stage: 'Consideration',
    goal: 'Show the product works on a real problem',
    formats: 'Full lab walkthroughs, detection engineering tutorials, live streams with Q&A',
    measure: 'Tracked visits to docs and trials, watch time, questions asked',
  },
  {
    stage: 'Evaluation',
    goal: 'Give buyers evidence they trust',
    formats: 'Independent test write-ups, LinkedIn posts from leaders on rollout lessons, webinars',
    measure: 'Demo requests and trials by source, mentions in sales calls',
  },
  {
    stage: 'Adoption and renewal',
    goal: 'Help users get value and stay',
    formats: 'Advanced tutorials, configuration deep dives, community sessions',
    measure: 'Feature use, retention, support tickets avoided',
  },
]

const sources = [
  {
    label:
      'Ponemon Institute and NOLA Marketing, The State of Cybersecurity Marketing Influence 2026 (320 enterprise security decision-makers), posted June 15, 2026',
    href: PONEMON_STUDY,
  },
  {
    label: 'CISA, Coordinated Vulnerability Disclosure Process',
    href: CISA_CVD,
  },
  {
    label: 'U.S. eCFR, 16 CFR 255.1, Guides Concerning the Use of Endorsements and Testimonials in Advertising',
    href: FTC_255_1,
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

export default function CybersecurityInfluencerMarketingPage() {
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
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Strategy</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Cybersecurity</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">{HEADLINE}</h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A playbook for security vendor marketers: which creators practitioners trust, how to brief for technical
            accuracy, where the ethical lines sit, and which formats fit each stage of the funnel.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 19, 2026</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Do influencers work for cybersecurity brands?</h2>
            <AnswerBox>
              Yes, when the creator is a credible practitioner and the content teaches something real. Security
              buyers lean on peers more than on vendor marketing, so an independent expert who tests your product in
              public carries weight. Scripted praise, hidden payment or paid verdicts do the opposite and damage your
              brand with the people you need most.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Cybersecurity influencer marketing</strong> is the practice of partnering with security
              practitioners, researchers and leaders who have their own audience, so they show, test or discuss your
              product in their own words. The goal is trust with defenders, not mass reach.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: B2B security vendors selling to security teams, from startups to established firms. This guide
              covers creator selection, briefing, ethics, disclosure and formats. It is general information, not
              legal advice. Facts were checked on November 19, 2026. New to creator marketing? Start with the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>
                complete guide to tech influencers
              </Link>
              .
            </p>
          </section>

          {/* Key terms */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The people and terms in this guide</h2>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
              <p className="text-gray-700">
                <strong>CISO:</strong> the chief information security officer, the executive responsible for an
                organisation&apos;s security program and, often, its security budget.
              </p>
              <p className="text-gray-700">
                <strong>Security researcher:</strong> a specialist who studies systems to find vulnerabilities and
                attack techniques, then publishes or reports the findings. Researchers often work inside vendors,
                consultancies or universities, or independently.
              </p>
              <p className="text-gray-700">
                <strong>How the two relate:</strong> a CISO decides what to buy and how to defend. A security
                researcher produces much of the evidence the CISO&apos;s team reads before deciding. The CISO trusts
                the researcher&apos;s findings because the researcher is independent of the vendors involved.
              </p>
              <p className="text-gray-700">
                <strong>Practitioner trust:</strong> the confidence hands-on security staff place in a source, based
                on technical depth, a track record of being right, and independence from sellers.
              </p>
              <p className="text-gray-700">
                <strong>Vulnerability disclosure:</strong> the process of reporting a security flaw to the affected
                vendor and publishing details once a fix or mitigation exists. Coordinated vulnerability disclosure
                (CVD) means the reporter, the vendor and sometimes a coordinator publish together.
              </p>
            </div>
          </section>

          {/* Why trust */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why trust is the product</h2>
            <AnswerBox>
              Security buyers rank peer recommendations above every other source, and half of them say vendor
              messaging lacks technical depth. A creator partnership works only when it gives them the peer voice
              and the depth your own marketing struggles to provide.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              In a 2026 study of 320 enterprise cybersecurity decision-makers by the Ponemon Institute and NOLA
              Marketing, peer recommendations ranked as the top influence at 55%, ahead of analysts, consultants and
              traditional marketing. In the same study, 52% said vendor messaging lacks technical depth and 49% cited
              weak ROI justification (
              <ExternalLink href={PONEMON_STUDY}>Ponemon and NOLA Marketing, 2026</ExternalLink>).
            </p>
            <p className="text-gray-700 leading-relaxed">
              Read those two numbers together. Your buyers want to hear from people like them, and they find most
              vendor content too shallow. A respected practitioner who runs your product against a real problem
              fixes both gaps. A practitioner who reads your talking points fixes neither, and the audience notices
              within a minute.
            </p>
          </section>

          {/* Creator categories */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Which security creators fit your goal?</h2>
            <AnswerBox>
              Match the creator type to the job. Practitioner educators prove the product works, researchers give
              technical credibility, CISOs reach budget holders, commentators bring daily attention and short-form
              explainers build broad awareness.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Creator type</th>
                    <th className={thClass}>Who they are</th>
                    <th className={thClass}>Best for</th>
                    <th className={thClass}>Watch out for</th>
                  </tr>
                </thead>
                <tbody>
                  {creatorRows.map((row) => (
                    <tr key={row.type}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.type}</td>
                      <td className={tdClass}>{row.who}</td>
                      <td className={tdClass}>{row.strength}</td>
                      <td className={tdClass}>{row.watch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Conference talks matter in this field. Many respected voices built their name on stage before they
              built a channel, and a talk recording often outlives any sponsored post. When you vet a creator, look
              at their talks, published research and GitHub work, not only follower counts. Our guide on{' '}
              <Link href="/blog/how-to-find-tech-influencers-b2b-2026" className={linkClass}>
                how to find B2B tech influencers
              </Link>{' '}
              covers the full vetting process.
            </p>
          </section>

          {/* Scepticism */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you avoid practitioner scepticism?</h2>
            <AnswerBox>
              Give the creator real access and full editorial control, ask for a real test instead of a feature tour,
              label the sponsorship clearly, and accept criticism in public. Practitioners forgive a product with
              limits. They do not forgive a vendor caught shaping a review.
            </AnswerBox>
            <Checklist
              items={[
                <>
                  <strong>Real access.</strong> A full trial or lab environment with no hidden limits, plus an
                  engineer who answers questions within a day.
                </>,
                <>
                  <strong>A real problem.</strong> Ask the creator to detect a known attack technique, harden a
                  setup or investigate a sample incident. Let them pick the scenario.
                </>,
                <>
                  <strong>Room to criticise.</strong> State in the contract the creator keeps the right to name
                  weaknesses. Weak points in a sponsored review make the strong points believable.
                </>,
                <>
                  <strong>Comparisons allowed.</strong> Practitioners already compare tools, including open-source
                  ones. Content pretending alternatives do not exist reads as an ad.
                </>,
                <>
                  <strong>Your experts in the comments.</strong> Have an engineer reply to technical questions under
                  the content with facts, never with marketing copy.
                </>,
                <>
                  <strong>Repeat work.</strong> One sponsored video rarely moves a security team. A creator who
                  covers your product across several months, honestly, builds more trust.
                </>,
              ]}
            />
          </section>

          {/* Accuracy workflow */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Briefing for accuracy: a technical review workflow</h2>
            <AnswerBox>
              Review facts, not opinions. Give the creator a technical brief, let them build and test on their own,
              then have one engineer check the draft for factual errors and secrets only. The creator decides what to
              change.
            </AnswerBox>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Write a technical brief</h3>
                <p className="text-gray-700">
                  Cover what the product does, what it does not do, supported environments, known limits and the
                  audience you want to reach. Our{' '}
                  <Link href="/blog/tech-creator-brief-template" className={linkClass}>
                    tech creator brief template
                  </Link>{' '}
                  gives a structure.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Run a kickoff call with an engineer</h3>
                <p className="text-gray-700">
                  A product or sales engineer walks the creator through setup and answers questions. Marketing joins
                  to agree dates and deliverables, not to shape the message.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Let the creator test independently</h3>
                <p className="text-gray-700">
                  The creator chooses the scenario and runs it without your team in the room. Agree in writing on
                  where test data comes from and confirm the lab holds no real customer data.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Do one accuracy review</h3>
                <p className="text-gray-700">
                  One named engineer reviews the draft against a short checklist: factual errors about the product,
                  exposed secrets such as API keys or internal hostnames, and security risks in the demo. Every
                  comment must point to a fact. Comments on tone or verdict are out of scope.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Agree on corrections after publishing</h3>
                <p className="text-gray-700">
                  If a fact turns out wrong, the creator adds a pinned correction. If the product changes, you share
                  the release note and the creator decides whether to update.
                </p>
              </div>
            </div>
          </section>

          {/* Ethics */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ethical lines security vendors should not cross</h2>
            <AnswerBox>
              Never pay for a verdict, never control test results, never ask a creator to hide a flaw they find, and
              never sponsor live demos of unpatched vulnerabilities. Route any flaw a creator finds in your product
              through your vulnerability disclosure process.
            </AnswerBox>
            <Checklist
              negative
              items={[
                <>
                  <strong>Pay for a verdict.</strong> The fee covers time and production, never a positive
                  conclusion. No bonus tied to a rating or score.
                </>,
                <>
                  <strong>Shaped testing.</strong> Pre-tuning the product for the creator&apos;s scenario, or
                  choosing the attacks for them, turns a test into an ad.
                </>,
                <>
                  <strong>Burying a flaw.</strong> A sponsored researcher who finds a vulnerability in your product
                  must be free to report it. Asking for silence destroys their credibility and yours.
                </>,
                <>
                  <strong>Exploits against unpatched software.</strong> Sponsored content should not walk viewers
                  through attacking a flaw without a fix, in your product or anyone else&apos;s.
                </>,
                <>
                  <strong>Fear selling.</strong> Tying a sponsored post to a fresh breach headline, with a sales pitch
                  attached, reads as profiting from victims.
                </>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Put a disclosure path in the contract. If the creator finds a flaw, they report it through your
              published security contact, and both sides agree on a timeline. The U.S. Cybersecurity and
              Infrastructure Security Agency (CISA) runs a coordinated vulnerability disclosure program whose goal
              is for the coordinator, the vendor and the reporter to disclose at the same time. Where a vendor is
              unresponsive or will not set a reasonable timeframe, CISA states it reserves the option to publish as early as 45 days
              after first trying to contact the vendor (
              <ExternalLink href={CISA_CVD}>CISA CVD process</ExternalLink>). Plan your own response times with
              this kind of public timeline in mind.
            </p>
          </section>

          {/* Disclosure */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What disclosure applies to security reviews?</h2>
            <AnswerBox>
              Any paid, gifted or free-access review needs a clear label at the start of the content, in the
              platform&apos;s paid partnership tool where one exists and in the words of the post. Under U.S. rules
              the review must reflect the creator&apos;s honest findings, and the vendor shares liability for
              misleading claims.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The FTC&apos;s Endorsement Guides state endorsements must reflect the honest opinions, findings,
              beliefs or experience of the endorser, and advertisers are subject to liability for misleading or
              unsubstantiated statements made through endorsements (
              <ExternalLink href={FTC_255_1}>16 CFR 255.1</ExternalLink>). In practice, a creator who says your tool
              &quot;blocks every ransomware strain&quot; puts you at risk, even if you never wrote the line.
            </p>
            <Checklist
              items={[
                <>Label the content as sponsored before any product claim, in video and in text.</>,
                <>Disclose free licences, hardware and paid travel to your event, not only cash.</>,
                <>Employees and paid advisers who post about your product state the relationship too.</>,
                <>Keep claims to what the creator tested. Ask for a fix if a claim goes beyond the test.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Rules differ by country. Our guide to{' '}
              <Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>
                influencer disclosure rules for B2B
              </Link>{' '}
              covers the main markets. This is general information, not legal advice.
            </p>
          </section>

          {/* Formats */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Formats by funnel stage</h2>
            <AnswerBox>
              Use short explainers and commentary for awareness, hands-on labs for consideration, independent tests
              and leader posts for evaluation, and advanced tutorials for adoption. Measure each stage on its own
              goal, not on last-click revenue.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Stage</th>
                    <th className={thClass}>Goal</th>
                    <th className={thClass}>Formats</th>
                    <th className={thClass}>What to measure</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelRows.map((row) => (
                    <tr key={row.stage}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.stage}</td>
                      <td className={tdClass}>{row.goal}</td>
                      <td className={tdClass}>{row.formats}</td>
                      <td className={tdClass}>{row.measure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Security sales cycles are long and involve several people, so a creator rarely gets the last click.
              Tag every link, ask new leads where they heard about you, and judge the program over your full sales
              cycle. Our post on{' '}
              <Link href="/blog/b2b-vs-b2c-influencer-marketing-tech-2026" className={linkClass}>
                B2B vs B2C tech influencer marketing
              </Link>{' '}
              explains why longer buying cycles change what you measure.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <em>Illustrative example (fictional):</em> a small cloud detection startup sponsors two YouTube
              educators to build a detection for a common credential theft technique, one using the product and one
              comparing it with an open-source rule set. One educator points out a gap in macOS coverage. The startup
              thanks them in the comments, ships a fix and shares the release note. The honest gap does more for
              credibility than the praise.
            </p>
          </section>

          {/* Pitfalls */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Common pitfalls</h2>
            <Checklist
              negative
              items={[
                <>Choosing creators by follower count instead of technical track record.</>,
                <>Sending a feature list and asking for a script read in a security audience&apos;s feed.</>,
                <>Letting marketing review drafts for tone, so the creator&apos;s voice disappears.</>,
                <>A demo environment with real customer data, internal hostnames or live keys on screen.</>,
                <>No plan for a creator who finds a flaw, so the first response is panic.</>,
                <>Judging a consideration-stage tutorial on month-one revenue.</>,
              ]}
            />
          </section>

          {/* Getting started */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to find security creators on Infoishai</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              On Infoishai you{' '}
              <Link href="/creators" className={linkClass}>
                browse verified tech creators
              </Link>{' '}
              on YouTube, LinkedIn, X, TikTok and Instagram, and filter by platform, niche and country across nine
              countries. Message creators directly, send a deal proposal, or post a campaign creators apply to. Once
              a creator joins, one tracker holds the offer, contract, deliverables and payment records. Infoishai is
              free for brands and creators. There are no platform fees. Payments are made directly between brand and
              creator, and Infoishai keeps the record.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Prefer to hand the work off? Our{' '}
              <Link href="/pricing" className={linkClass}>
                managed service
              </Link>{' '}
              runs creator campaigns for you, priced by custom quote.
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
              Last updated November 19, 2026. The Ponemon and NOLA Marketing figures describe enterprise security
              decision-makers surveyed for the 2026 study. The FTC guidance applies in the United States, and the
              CISA process describes CISA&apos;s own program; other countries and organisations have their own rules.
              The cloud detection example is fictional.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Browse cybersecurity creators</h2>
          <p className="text-blue-800 mb-6">
            Find verified tech creators who cover security, and message them directly. No platform fees for brands or
            creators.
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
