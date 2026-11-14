// src/app/blog/tech-creator-brief-template/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/tech-creator-brief-template'
const HEADLINE = 'Tech Creator Brief Template: What to Include for Developer and B2B Audiences'
const META_TITLE = 'Tech Creator Brief Template for B2B Campaigns'
const DESCRIPTION =
  'Copy a tech creator brief template covering goals, key messages, technical accuracy checks, disclosure and approvals, with tips on creative freedom.'

export const metadata: Metadata = {
  title: `${META_TITLE} | Infoishai`,
  description: DESCRIPTION,
  keywords: [
    'influencer brief template for tech creators',
    'creator brief template b2b',
    'influencer campaign brief example',
    'how to brief a tech influencer',
    'influencer brief checklist saas',
    'what to include in creator brief',
    'technical accuracy review influencer brief',
    'influencer approval workflow',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-14T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Briefs', 'Tech Influencers', 'Campaigns', 'B2B'],
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
  datePublished: '2026-11-14',
  dateModified: '2026-11-14',
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

const ECFR_255_1 = 'https://www.law.cornell.edu/cfr/text/16/255.1'
const FTC_101 = 'https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers'
const YT_PAID = 'https://support.google.com/youtube/answer/154235?hl=en'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

type SectionRow = { section: string; write: string; example: string }

const templateSections: SectionRow[] = [
  {
    section: '1. Goal and success metric',
    write: 'One business goal and the one number you judge the post on.',
    example: 'Trial sign-ups from backend developers, tracked with a UTM link.',
  },
  {
    section: '2. Audience',
    write: 'Who the creator speaks to, and what they already know.',
    example: 'Engineers who deploy to Kubernetes weekly. Skip the basics.',
  },
  {
    section: '3. Key message',
    write: 'One sentence the viewer should remember.',
    example: 'Acme Deploy rolls back a bad release in one command.',
  },
  {
    section: '4. Talking points',
    write: 'Three to five facts the creator picks from and phrases in their own words.',
    example: 'Free tier limits, GitHub integration, audit log.',
  },
  {
    section: '5. Must-say claims',
    write: 'The short list of exact statements needed, each with its proof source.',
    example: '"SOC 2 Type II report available on request" (link to trust page).',
  },
  {
    section: '6. Do-not-say list',
    write: 'Claims, comparisons and words to avoid.',
    example: 'No "unhackable", no named competitor comparisons.',
  },
  {
    section: '7. Technical accuracy and security',
    write: 'Demo setup, fact sheet, review owner, what never appears on screen.',
    example: 'Demo account only. No real keys, tokens or customer data.',
  },
  {
    section: '8. Deliverables and format',
    write: 'Platform, format, length, placement, number of posts.',
    example: 'One 60 to 90 second YouTube integration in the first third.',
  },
  {
    section: '9. CTA and tracking',
    write: 'The single action, the link, any code.',
    example: 'Start a free trial at the creator UTM link.',
  },
  {
    section: '10. Disclosure',
    write: 'Required label, placement and platform tool.',
    example: 'Say it in the video, plus the YouTube paid promotion setting.',
  },
  {
    section: '11. Approval and deadlines',
    write: 'Review rounds, turnaround times, go-live date.',
    example: 'Draft by day 10, one review round, live on day 14.',
  },
  {
    section: '12. Contacts and rights',
    write: 'Who answers questions, usage rights, exclusivity.',
    example: 'Product contact named. No ad usage without a separate deal.',
  },
]

type CompareRow = { area: string; weak: string; good: string }

const compareRows: CompareRow[] = [
  {
    area: 'Goal',
    weak: '"Raise awareness of our platform."',
    good: '"Drive trial sign-ups from backend developers. Success = sign-ups per 1,000 views."',
  },
  {
    area: 'Message',
    weak: 'Eight features listed with equal weight.',
    good: 'One key message and four talking points to pick from.',
  },
  {
    area: 'Claims',
    weak: '"Mention we are the fastest and most secure."',
    good: 'Two must-say claims, each linked to a public proof page.',
  },
  {
    area: 'Script',
    weak: 'A full script to read word for word.',
    good: 'The creator writes the script. You check facts and the CTA.',
  },
  {
    area: 'Security',
    weak: 'Nothing said. The creator demos on a real workspace.',
    good: 'Demo account, test data, and a rule to blur any key or email on screen.',
  },
  {
    area: 'Disclosure',
    weak: '"Add #ad somewhere."',
    good: 'A spoken and on-screen label up front, plus the platform paid label.',
  },
  {
    area: 'Approval',
    weak: '"Send it over when ready."',
    good: 'Named reviewer, one round, 48-hour turnaround, fixed go-live date.',
  },
]

const sources = [
  {
    label: '16 CFR 255.1, FTC Guides Concerning the Use of Endorsements and Testimonials in Advertising (Cornell LII copy, current version effective July 26, 2023)',
    href: ECFR_255_1,
  },
  {
    label: 'FTC, Disclosures 101 for Social Media Influencers (November 2019)',
    href: FTC_101,
  },
  {
    label: 'YouTube Help, Add paid product placements, sponsorships and endorsements',
    href: YT_PAID,
  },
]

const TEMPLATE_TEXT = `TECH CREATOR BRIEF

Campaign: ____________   Brand contact: ____________   Date: ____________

1. GOAL
   Business goal: ____________
   Success metric (one number): ____________

2. AUDIENCE
   Who they are: ____________
   What they already know: ____________

3. KEY MESSAGE (one sentence)
   ____________

4. TALKING POINTS (pick 2 to 3, use your own words)
   - ____________
   - ____________
   - ____________

5. MUST-SAY CLAIMS (exact wording + proof link)
   - Claim: ____________   Proof: ____________

6. DO NOT SAY
   - ____________

7. TECHNICAL ACCURACY AND SECURITY REVIEW
   Demo environment: ____________ (demo account, test data only)
   Fact sheet link: ____________
   Version / pricing shown: ____________ (as of date)
   Never on screen: API keys, tokens, real customer data, internal URLs
   Technical reviewer (name + role): ____________
   Security check done by: ____________

8. DELIVERABLES
   Platform / format / length: ____________
   Placement in content: ____________
   Number of posts: ____________

9. CTA AND TRACKING
   Action: ____________   Link (UTM): ____________   Code: ____________

10. DISCLOSURE
   Label wording: ____________   Placement: up front, in the content
   Platform tool: ____________

11. APPROVAL AND DEADLINES
   Draft due: ____________   Review rounds: ____________
   Brand turnaround: ____________   Go-live: ____________

12. CONTACTS AND RIGHTS
   Product questions: ____________
   Usage rights: ____________   Exclusivity: ____________`

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

export default function TechCreatorBriefTemplatePage() {
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
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              Guide
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Templates
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Developers and B2B buyers spot a scripted ad in seconds, and one wrong technical claim costs the creator their trust. This guide gives you a fill-in brief with technical accuracy and security fields, a good vs weak comparison, and an approval workflow you hand to a designer.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 14, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>9 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">

          {/* Direct answer */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What should an influencer brief include?</h2>
            <AnswerBox>
              A tech creator brief needs one goal with one success metric, the audience, a single key message, a few talking points, must-say claims with proof, a do-not-say list, technical and security rules for the demo, deliverables, one CTA, disclosure wording, approval steps with deadlines, and contacts. Keep it to one or two pages.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              An <strong>influencer brief template for tech creators</strong> is a reusable document a brand fills in before each collaboration. It tells a creator who covers software, AI, developer tools or cloud what the brand needs from the post, and leaves the creator in charge of how to say it.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              A few terms used below. <strong>Talking points</strong> are facts about your product the creator picks from and phrases in their own words. <strong>Must-say claims</strong> are the few exact statements the post has to include, each backed by a proof source you hold. The <strong>approval workflow</strong> is the set of review steps between the creator&apos;s draft and the live post. The brief holds all three: it sets the goal and audience, the talking points carry the message, and the approval workflow checks the result against both.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Scope: paid or gifted creator content for B2B tech brands on YouTube, LinkedIn, X, TikTok and Instagram. Disclosure notes follow US FTC guidance. This is general information, not legal advice. Last updated November 14, 2026. New to creator campaigns? Start with the{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>complete guide to tech influencers</Link>.
            </p>
          </section>

          {/* Purpose */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What is a creator brief for?</h2>
            <AnswerBox>
              A brief aligns you and the creator on the goal, the facts and the rules before any content exists. It prevents three costly problems: a post with no clear CTA, a wrong technical claim, and a missing disclosure.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Tech audiences are harder to fool than most. A developer watching a deployment demo notices a wrong command or a fake terminal. A security buyer notices a vague compliance claim. Your brief exists to give the creator correct facts and a safe demo setup, so their honest take stays accurate.
            </p>
            <p className="text-gray-700 leading-relaxed">
              It also protects you. Under the FTC Endorsement Guides,{' '}
              <ExternalLink href={ECFR_255_1}>16 CFR 255.1(d)</ExternalLink> makes advertisers subject to liability for misleading or unsubstantiated statements made through endorsements. The same section says advertisers should give endorsers guidance, monitor their compliance and act on problems. A written brief and a review step are the simplest way to do both.
            </p>
          </section>

          {/* Template sections */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The 12 sections of a tech creator brief</h2>
            <AnswerBox>
              Use 12 short sections, in this order: goal, audience, key message, talking points, must-say claims, do-not-say list, technical and security review, deliverables, CTA and tracking, disclosure, approval and deadlines, contacts and rights.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The examples use <strong>Acme Deploy</strong>, a fictional deployment tool, to show how each line reads once filled in.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Section</th>
                    <th className={thClass}>What to write</th>
                    <th className={thClass}>Example (fictional)</th>
                  </tr>
                </thead>
                <tbody>
                  {templateSections.map((row) => (
                    <tr key={row.section}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.section}</td>
                      <td className={tdClass}>{row.write}</td>
                      <td className={tdClass}>{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Keep must-say claims to two or three. Every extra line pushes the post toward an ad read. For the CTA, give each creator their own tracked link, as set out in our guide to{' '}
              <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>tracking B2B influencer campaigns with UTMs</Link>.
            </p>
          </section>

          {/* Good vs weak */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Good brief vs weak brief</h2>
            <AnswerBox>
              A weak brief is vague on the goal and strict on the script. A good brief is the reverse: strict on the goal, facts, security and disclosure, and open on how the creator tells the story.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Area</th>
                    <th className={thClass}>Weak brief</th>
                    <th className={thClass}>Good brief</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.area}>
                      <td className={`${tdClass} font-semibold text-gray-900`}>{row.area}</td>
                      <td className={tdClass}>{row.weak}</td>
                      <td className={tdClass}>{row.good}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The weak &quot;fastest and most secure&quot; line is a real risk. The FTC&apos;s{' '}
              <ExternalLink href={FTC_101}>Disclosures 101</ExternalLink> tells creators not to make up claims needing proof the advertiser does not have. If you put a superlative in the brief, you own it.
            </p>
          </section>

          {/* Technical review */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How do you handle technical review?</h2>
            <AnswerBox>
              Give the creator a fact sheet and a demo account before they start. Then have one named engineer or product person check the draft for factual errors, version and pricing accuracy, and anything sensitive on screen. They correct facts, not opinions.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              A <strong>technical accuracy review</strong> is a check of the draft against your product as it ships today. A <strong>security review</strong> is a check for anything on screen or in the audio no outsider should see. Both fit in one pass if your reviewer has a checklist:
            </p>
            <Checklist
              items={[
                <><strong>Commands and code run.</strong> Any command or snippet shown works on the current version.</>,
                <><strong>Version and pricing are dated.</strong> Prices and plan limits match your pricing page on the go-live date.</>,
                <><strong>Claims match proof.</strong> Every must-say claim links to a public source, such as a docs or trust page.</>,
                <><strong>Nothing secret on screen.</strong> No API keys, tokens, passwords, internal URLs, customer names or real user data. Blur anything missed.</>,
                <><strong>Demo environment only.</strong> The creator used the demo account and test data you supplied, not a production workspace.</>,
                <><strong>Opinions untouched.</strong> Criticism of your product stays. Endorsements must reflect the creator&apos;s honest opinion under{' '}
                  <ExternalLink href={ECFR_255_1}>16 CFR 255.1(a)</ExternalLink>.</>,
              ]}
            />
            <p className="text-gray-700 leading-relaxed">
              Two more FTC points belong here. A creator who says they use your product must be a real user of it, per section 255.1(c), and Disclosures 101 tells creators not to describe experience with a product they have not tried. So send access early and give the creator time to use it before filming. For YouTube timelines, see our{' '}
              <Link href="/blog/tech-youtuber-campaign-playbook" className={linkClass}>tech YouTuber campaign playbook</Link>.
            </p>
          </section>

          {/* Creative freedom */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How much creative freedom should creators get?</h2>
            <AnswerBox>
              Give creators full control of the story, the script, the tone and the format. Fix only the goal, the facts, the must-say claims, the security rules, the CTA and the disclosure. Creators know what their audience trusts. You know your product.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Split the brief into two lists and label them clearly in the document:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Fixed by the brand</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Goal and success metric</li>
                  <li>Product facts and must-say claims</li>
                  <li>Do-not-say list</li>
                  <li>Security rules for the demo</li>
                  <li>CTA, link and disclosure</li>
                  <li>Deadlines</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Owned by the creator</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Script, hook and structure</li>
                  <li>Which talking points to use</li>
                  <li>Tone, humor and examples</li>
                  <li>Honest pros and cons</li>
                  <li>Editing and visuals</li>
                </ul>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">
              If a creator wants to change a fixed item, such as the CTA, ask them to raise it before filming. A short call at the start saves a full reshoot later.
            </p>
          </section>

          {/* Approval and disclosure */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Approval workflow and disclosure</h2>
            <AnswerBox>
              Use one review round with a named reviewer and a set turnaround, such as 48 hours. Check facts, security, CTA and disclosure. The disclosure goes in the content itself, up front, plus the platform&apos;s paid label where one exists.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The workflow below is written so a designer turns it into a diagram: six boxes in a left-to-right line, with one loop arrow from step 4 back to step 3.
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Brief sent.</strong> Brand shares the brief, fact sheet and demo access. Owner: brand.</li>
              <li><strong>Kickoff questions.</strong> Creator confirms the angle and asks questions within two working days. Owner: creator.</li>
              <li><strong>Draft submitted.</strong> Script or rough cut, by the date in the brief. Owner: creator.</li>
              <li><strong>Brand review.</strong> One reviewer checks facts, security, CTA and disclosure within 48 hours. Loop arrow: &quot;changes requested&quot; returns to step 3, once. Owner: brand.</li>
              <li><strong>Approved and scheduled.</strong> Final file and post date confirmed. Owner: both.</li>
              <li><strong>Posted and checked.</strong> Brand checks the live post for the label, link and any late edits. Owner: brand.</li>
            </ol>
            <p className="text-gray-700 leading-relaxed mb-6">
              On disclosure, the FTC&apos;s{' '}
              <ExternalLink href={FTC_101}>Disclosures 101</ExternalLink> names &quot;ad&quot;, &quot;advertisement&quot; and &quot;sponsored&quot; as clear terms. For video, it says the disclosure belongs in the video itself, not only in the description, and warns a label at the end of a post or video is likely to be missed. On YouTube, also ask the creator to turn on the{' '}
              <ExternalLink href={YT_PAID}>paid promotion setting</ExternalLink>. Write the exact label and its placement into the brief, so nobody guesses.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Platform labels differ for LinkedIn, X, TikTok and Instagram. Our guide to{' '}
              <Link href="/blog/influencer-disclosure-rules-b2b" className={linkClass}>influencer disclosure rules for B2B tech</Link> covers each one, plus UK and EU notes.
            </p>
          </section>

          {/* Copy template */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Copy the brief template</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Paste this into a doc, fill in the blanks for each creator, and send it with the fact sheet and demo access.
            </p>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto text-sm leading-relaxed mb-6 whitespace-pre">
              {TEMPLATE_TEXT}
            </pre>
            <p className="text-gray-700 leading-relaxed">
              Running your{' '}
              <Link href="/blog/first-tech-influencer-campaign-startup-guide-2026" className={linkClass}>first tech influencer campaign</Link>? Fill in sections 1 to 3 before you contact any creator. If you struggle to write one key message, the campaign is not ready yet.
            </p>
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Where Infoishai fits</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai is a free marketplace for tech creators on YouTube, LinkedIn, X, TikTok and Instagram. With our{' '}
              <Link href="/campaigns" className={linkClass}>campaign management tools</Link> you post a campaign with its objective, creator requirements, deliverables, budget and dates, then track each creator through offer, contract, draft review and posting. Creators submit drafts and you approve them or request changes in one place, which matches the workflow above.
            </p>
            <p className="text-gray-700 leading-relaxed">
              There are no platform fees for brands or creators. Payments are made directly between brand and creator. Infoishai keeps the record. Questions about setup? Visit the{' '}
              <Link href="/help" className={linkClass}>help center</Link>.
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
              Last updated November 14, 2026. Acme Deploy and all brief examples are fictional and for illustration only. Review times such as 48 hours are suggestions, not rules. This guide is general information, not legal advice.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Put your brief to work</h2>
          <p className="text-blue-800 mb-6">
            Post a campaign, review creator drafts and track every deliverable in one place. Infoishai is free for brands and creators. There are no platform fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/campaigns"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Use Infoishai Campaign Tools
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
