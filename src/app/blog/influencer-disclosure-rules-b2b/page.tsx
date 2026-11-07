// src/app/blog/influencer-disclosure-rules-b2b/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/influencer-disclosure-rules-b2b'
const HEADLINE = 'Influencer Disclosure Rules for B2B Tech Campaigns: What Brands Must Brief'
const META_TITLE = 'Influencer Disclosure Rules for B2B Tech Campaigns'
const DESCRIPTION =
  'Plain-English guide to FTC and ASA disclosure for B2B tech influencer campaigns: what counts as a material connection, where to disclose, and what to brief.'

export const metadata: Metadata = {
  title: META_TITLE,
  description: DESCRIPTION,
  keywords: [
    'ftc disclosure rules b2b influencer marketing',
    'influencer disclosure requirements',
    'ftc endorsement guides influencer',
    'sponsored content disclosure linkedin',
    'how to disclose sponsored linkedin post',
    'ftc rules for youtube sponsorship tech',
    'brand liability influencer disclosure',
    '16 CFR Part 255',
    'ASA influencer ad label',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-07T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Compliance', 'FTC', 'ASA', 'B2B'],
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
  datePublished: '2026-11-07',
  dateModified: '2026-11-07',
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

const ECFR = 'https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255'
const FED_REG =
  'https://www.federalregister.gov/documents/2023/07/26/2023-14795/guides-concerning-the-use-of-endorsements-and-testimonials-in-advertising'
const FTC_FAQ = 'https://consumer.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking'
const FTC_101 = 'https://www.ftc.gov/system/files/ftc_gov/pdf/1001A_Influencer%20Guide_508.pdf'
const YT_HELP = 'https://support.google.com/youtube/answer/154235?hl=en'
const X_POLICY = 'https://help.twitter.com/rules-and-policies/paid-partnerships'
const X_LABEL =
  'https://www.emarketer.com/content/x-adds-paid-partnership-labels-creators--catching-up-instagram-tiktok-on-disclosures'
const LI_LABEL = 'https://www.socialmediatoday.com/news/linkedin-rolls-out-brand-partnership-tags/691582/'
const DGLAW =
  'https://www.dglaw.com/ad-age-b2b-brands-and-influencers-arent-meeting-ad-disclosure-rules-heres-what-they-risk/'
const ASA_GUIDE = 'https://www.asa.org.uk/resource/influencers-guide.html'
const CAP_02 = 'https://www.asa.org.uk/type/non_broadcast/code_section/02.html'
const CAP_OVERVIEW = 'https://www.asa.org.uk/advice-online/recognising-marketing-communications-overview.html'
const EU_BRIEF = 'https://commission.europa.eu/system/files/2023-10/Legal%20brief%206.pdf'
const OSBORNE = 'https://www.osborneclarke.com/insights/digital-fairness-act-unpacked-social-media-influencers'
const GT_LAW = 'https://www.gtlaw.com/en/insights/2025/4/influencer-marketing-practices-under-scrutiny-in-europe'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'

const placements = [
  {
    format: 'YouTube video',
    where: 'Spoken and on screen near the start, plus the paid promotion setting',
    avoid: 'A line in the description only, or a mention at the end',
  },
  {
    format: 'YouTube live stream',
    where: 'Said and shown at the start, then repeated during the stream',
    avoid: 'One mention at the start of a long stream',
  },
  {
    format: 'LinkedIn post',
    where: '"Ad" or "Paid partnership with [brand]" in the first line, plus the Brand Partnership tag',
    avoid: 'A label after the "see more" cut, or a mention in the comments',
  },
  {
    format: 'LinkedIn newsletter or article',
    where: 'A label above the first paragraph and next to the sponsored section',
    avoid: 'A note in the footer',
  },
  {
    format: 'X post or thread',
    where: '"#ad" in the first post, before the product claim, plus the Paid partnership label',
    avoid: 'A label in the last post of the thread only',
  },
  {
    format: 'Podcast or audio',
    where: 'Spoken before the sponsored segment',
    avoid: 'A note in the show notes only',
  },
]

const clauses: { title: string; text: string }[] = [
  {
    title: 'Label',
    text: 'You will label every sponsored deliverable with "Ad" or "Paid partnership with [Brand]" at the start of the content, before any product claim.',
  },
  {
    title: 'Video and audio',
    text: 'In video, you will say the disclosure out loud and show it on screen in the first 30 seconds. In live streams, you will repeat it at regular intervals.',
  },
  {
    title: 'Platform tools',
    text: 'You will switch on the platform\'s own label (YouTube paid promotion, LinkedIn Brand Partnership, X Paid partnership) in addition to your written or spoken label, not in place of it.',
  },
  {
    title: 'Honest opinion',
    text: 'You will share your own view of the product. You will not say you have used a feature you have not tested.',
  },
  {
    title: 'Claims',
    text: 'You will make no claims about security, compliance certifications, uptime or results beyond the approved claims list attached to this brief.',
  },
  {
    title: 'Review',
    text: 'You will send a draft or link to [Brand] before publishing. [Brand] will check the disclosure and factual claims only, not your opinion.',
  },
  {
    title: 'Fixes',
    text: 'If a disclosure is missing or unclear after publishing, you will fix it within 24 hours of a request from [Brand].',
  },
  {
    title: 'Reuse',
    text: 'If [Brand] reshares or promotes your content, the disclosure stays visible in every version.',
  },
]

const checklist: ReactNode[] = [
  <>List every connection: fee, free licence, extended trial, affiliate link, event travel, employment, advisory role.</>,
  <>Pick one label for the campaign, such as &quot;Ad&quot;, and put the exact wording in the brief.</>,
  <>Write the placement for each format: first line, first 30 seconds, said and shown.</>,
  <>Ask creators to switch on platform labels as well as the written label.</>,
  <>Attach an approved claims list, and mark claims needing proof, such as security or compliance claims.</>,
  <>Add the disclosure clauses to the contract, not only the brief.</>,
  <>Review each draft for the label and the claims before it goes live.</>,
  <>Check each live post on a phone, where captions get cut off first.</>,
  <>Keep screenshots of each live post with the date.</>,
  <>For UK or EU audiences, have local counsel review the brief before launch.</>,
]

const sources = [
  { label: 'eCFR, 16 CFR Part 255, Guides Concerning Use of Endorsements and Testimonials in Advertising', href: ECFR },
  { label: 'Federal Register, Revised Endorsement Guides, 88 FR 48092 (July 26, 2023)', href: FED_REG },
  { label: "FTC, FTC's Endorsement Guides: What People Are Asking", href: FTC_FAQ },
  { label: 'FTC, Disclosures 101 for Social Media Influencers (November 2019)', href: FTC_101 },
  { label: 'YouTube Help, Add paid product placements, sponsorships and endorsements', href: YT_HELP },
  { label: 'X Help, Paid Partnerships policy', href: X_POLICY },
  { label: 'eMarketer, X adds paid partnership labels for creators', href: X_LABEL },
  { label: 'Social Media Today, LinkedIn rolls out Brand Partnership tags (August 2023)', href: LI_LABEL },
  { label: 'Davis+Gilbert, on Ad Age coverage of B2B disclosure (July 2025)', href: DGLAW },
  { label: "ASA and CAP, Influencers' guide to making clear ads are ads (October 2026)", href: ASA_GUIDE },
  { label: 'CAP Code, Section 2: Recognition of marketing communications', href: CAP_02 },
  { label: 'ASA, Recognising marketing communications: overview', href: CAP_OVERVIEW },
  { label: 'European Commission, Influencer Legal Hub, Legal brief 6: How to disclose advertising', href: EU_BRIEF },
  { label: 'Osborne Clarke, Digital Fairness Act unpacked: social media influencers (September 2025)', href: OSBORNE },
  { label: 'Greenberg Traurig, Influencer marketing practices under scrutiny in Europe (April 2025)', href: GT_LAW },
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

function Example({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border mb-4">
      <p className="text-sm font-semibold text-gray-500 mb-2">{label}</p>
      <p className="text-gray-800 font-mono text-sm whitespace-pre-line">{children}</p>
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

export default function InfluencerDisclosureRulesB2BPage() {
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
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
              Compliance
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              Guide
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Where the label goes on YouTube, LinkedIn and X, why your company shares the risk, and brief clauses you are free to copy.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 7, 2026</span>
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
              Yes. If you pay a creator, give them free software, or have any other connection their audience would not expect, the post needs a clear label such as &quot;Ad&quot;. We found no B2B exception in the FTC&apos;s endorsement guidance, and the UK&apos;s CAP Code covers all marketing communications. The label goes in the content itself, up front.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Many B2B teams assume disclosure is a consumer problem. A developer tool or a security platform feels far from a skincare ad. The rules do not draw this line. A post from a respected engineer about your product is an endorsement, and a busy buyer weighs it differently once they know you paid for it.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-800">
                <strong>Scope:</strong> this guide covers US rules (FTC) with notes on the UK and EU, for brands running paid or gifted creator content. It is general information, not legal advice. Have a lawyer review your briefs and contracts before you launch. Last updated November 7, 2026.
              </p>
            </div>
          </section>

          {/* What triggers */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What triggers a disclosure in a B2B campaign?</h2>
            <AnswerBox>
              Any material connection between your company and the creator. A material connection is a relationship the audience would not expect and which might change how they judge the endorsement. Payment is the obvious one, but free products, trials and employment count too.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              B2B campaigns create connections consumer campaigns rarely do. Watch for these:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Fees:</strong> a flat fee, a retainer or a CPM deal.</li>
              <li><strong>Free access:</strong> a paid licence, an extended trial or credits given for the review.</li>
              <li><strong>Affiliate and referral deals:</strong> a commission on signups or a referral code.</li>
              <li><strong>Events:</strong> travel, tickets or a speaking slot at your conference.</li>
              <li><strong>Roles:</strong> advisors, investors, customer advisory board members and partners.</li>
              <li><strong>Employees:</strong> staff posting about your product on LinkedIn.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              The last one surprises people. The FTC&apos;s{' '}
              <ExternalLink href={FTC_FAQ}>Endorsement Guides FAQ</ExternalLink> says an ad featuring a relative or employee of the marketer misleads unless the connection is made clear. It also says listing your employer on your profile page is not enough. So an employee advocacy program needs a disclosure line too.
            </p>
          </section>

          {/* FTC plain English */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What do the FTC Endorsement Guides say in plain English?</h2>
            <AnswerBox>
              The FTC Endorsement Guides, published as 16 CFR Part 255, explain how the FTC applies its law against deceptive ads to endorsements. The current version took effect on July 26, 2023. They say a disclosure must be clear and conspicuous, and brands are liable for undisclosed connections.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              The <strong>FTC</strong> is the Federal Trade Commission, the US agency behind consumer protection law. <strong>16 CFR Part 255</strong> is where its Endorsement Guides sit in the Code of Federal Regulations. The FTC adopted the revised Guides in{' '}
              <ExternalLink href={FED_REG}>88 FR 48092</ExternalLink>, effective July 26, 2023. Guides are not a statute. They explain how the FTC reads the law, and the FTC uses them when it decides whether a post deceives people.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Clear and conspicuous</strong> has a set meaning in{' '}
              <ExternalLink href={ECFR}>section 255.0(f)</ExternalLink>. The disclosure has to be difficult to miss and easy to understand. Three points matter most for creators:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>On social media and other interactive media, the disclosure should be unavoidable.</li>
              <li>If the message uses sound and visuals, the disclosure goes in both.</li>
              <li>An example in the Guides says relying only on a platform&apos;s built-in disclosure tool makes a label easy to miss.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Wording matters too. The FTC&apos;s{' '}
              <ExternalLink href={FTC_101}>Disclosures 101</ExternalLink> guide names &quot;ad&quot;, &quot;advertisement&quot; and &quot;sponsored&quot; as clear. It warns against &quot;sp&quot;, &quot;spon&quot; and &quot;collab&quot;, and against stand-alone words such as &quot;thanks&quot; or &quot;ambassador&quot;. It also says US law applies to a creator posting from abroad when the post will foreseeably reach US consumers.
            </p>
          </section>

          {/* Where by platform */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Where should the disclosure appear on each platform?</h2>
            <AnswerBox>
              With the endorsement, before the claim, in the part people see without clicking. Disclosures 101 says a label is likely to be missed on a profile page, at the end of a post or video, or behind a &quot;more&quot; link. Use the platform&apos;s own label as well, never instead.
            </AnswerBox>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Format</th>
                    <th className={thClass}>Put the label here</th>
                    <th className={thClass}>Not enough on its own</th>
                  </tr>
                </thead>
                <tbody>
                  {placements.map((row) => (
                    <tr key={row.format}>
                      <td className={`${tdClass} font-medium text-gray-900`}>{row.format}</td>
                      <td className={tdClass}>{row.where}</td>
                      <td className={tdClass}>{row.avoid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mb-8">
              Our summary of the FTC, YouTube, LinkedIn and X guidance linked in this section. The examples below use a fictional product, Acme Deploy.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Where should disclosure appear on a YouTube video?</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              In the video, early, said and shown. Disclosures 101 says a label in the description alone is not enough. YouTube asks creators to tick its{' '}
              <ExternalLink href={YT_HELP}>paid promotion setting</ExternalLink>, which adds a label at the start of the video, and says creators and their partners stay responsible for the law. For live streams, the FTC says to repeat the disclosure, since viewers join partway.
            </p>
            <Example label="Illustrative YouTube opening, fictional">
              {'[On screen: "Paid partnership with Acme Deploy"]\nSpoken: "This video is sponsored by Acme Deploy. They paid for this video, and I\'ll tell you where it fell short too."'}
            </Example>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-8">How do you disclose a sponsored LinkedIn post?</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Put the label in the first line, above the &quot;see more&quot; cut, and switch on LinkedIn&apos;s Brand Partnership tag.{' '}
              <ExternalLink href={LI_LABEL}>Social Media Today reported</ExternalLink> in August 2023 LinkedIn was rolling the tag out to all users, and members paid by a third party for a post need to add it. The tag shows under the creator&apos;s name. Add your own words too, since the Guides warn against relying on a platform tool alone.
            </p>
            <Example label="Illustrative LinkedIn opening, fictional">
              {'Ad | Paid partnership with Acme Deploy\nWe moved our staging deploys to Acme Deploy last month. Here is what changed for our on-call team...'}
            </Example>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-8">How do you disclose on X?</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              In the first post, before the claim. X&apos;s{' '}
              <ExternalLink href={X_POLICY}>Paid Partnerships policy</ExternalLink> asks for clear and prominent disclosures, with &quot;#ad&quot;, &quot;#paidpartnership&quot; and &quot;#sponsored&quot; as examples. X has also{' '}
              <ExternalLink href={X_LABEL}>added a Paid Partnership label</ExternalLink> creators attach to sponsored posts. In a thread, label the first post, since replies and quotes often show it alone.
            </p>
            <Example label="Illustrative X post, fictional">
              {'#ad I tested Acme Deploy on a side project this week. Three things I liked and one I didn\'t.'}
            </Example>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-8">Newsletters and podcasts</h3>
            <p className="text-gray-700 leading-relaxed">
              The same rule applies: the label sits with the message. In a newsletter, mark the sponsored section where it starts, not in the footer. In a podcast, say it out loud before the segment, because listeners rarely read show notes.
            </p>
          </section>

          {/* Liability */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Is the brand liable if the creator forgets #ad?</h2>
            <AnswerBox>
              Yes, you share the risk. Section 255.1(d) says advertisers are subject to liability for failing to disclose unexpected material connections with their endorsers. The Guides say brands should give endorsers guidance on disclosure and monitor their compliance.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              <ExternalLink href={ECFR}>Section 255.1(d)</ExternalLink> reads: &quot;Advertisers are subject to liability for misleading or unsubstantiated statements made through endorsements or for failing to disclose unexpected material connections between themselves and their endorsers.&quot; Note the first half. A creator&apos;s false claim about your product, such as an uptime figure or a compliance badge you do not hold, is your problem too.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              The FTC&apos;s FAQ suggests reviewing posts before they go live, since checking first is easier than searching for posts later. A monitoring routine for a small team looks like this:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>Put the disclosure rules in the brief and the contract.</li>
              <li>Review drafts for the label and factual claims.</li>
              <li>Check the live post within a day, and save a dated screenshot.</li>
              <li>Ask for fixes in writing, and end work with creators who repeat the problem.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Enforcement comes from more than the FTC. A July 2025{' '}
              <ExternalLink href={DGLAW}>Davis+Gilbert summary of Ad Age coverage</ExternalLink> on B2B disclosure says the FTC had not been prioritizing monetary penalties, while the National Advertising Division, an industry self-regulator, had stepped up its work. NAD issues no fines, but its cases are public.
            </p>
          </section>

          {/* Brief clauses */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What disclosure clauses belong in your brief?</h2>
            <AnswerBox>
              Name the exact label, its placement per format, the platform tools to switch on, an approved claims list, a review step and a deadline for fixes. Write the same terms into the contract, so the brief and the contract never disagree.
            </AnswerBox>
            <p className="text-gray-700 leading-relaxed mb-6">
              Copy and adapt these clauses. They are a starting point written in plain words, not legal advice, and your lawyer should review them against your own contract.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
              <ol className="space-y-4 list-decimal list-inside">
                {clauses.map((clause) => (
                  <li key={clause.title} className="text-gray-700">
                    <strong className="text-gray-900">{clause.title}:</strong> {clause.text}
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-gray-700 leading-relaxed">
              The claims clause matters most in B2B. Technical buyers check claims about security, certifications and benchmarks, and a wrong one hurts both of you. If you track creator links with UTMs, keep the label next to the link in the brief, as our{' '}
              <Link href="/blog/track-b2b-influencer-campaigns-utm" className={linkClass}>B2B campaign tracking guide</Link> suggests.
            </p>
          </section>

          {/* UK and EU */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What about creators in the UK and EU?</h2>
            <AnswerBox>
              In the UK, CAP Code rule 2.1 says marketing must be obviously identifiable, and the ASA recommends an &quot;Ad&quot; label up front. In the EU, the Unfair Commercial Practices Directive bans hidden advertising. Both expect brands to share responsibility. Have local counsel check your brief.
            </AnswerBox>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">United Kingdom</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              The <strong>ASA</strong> (Advertising Standards Authority) enforces the CAP Code. <ExternalLink href={CAP_02}>Rule 2.1</ExternalLink> says marketing communications must be obviously identifiable as such, and the ASA says these rules{' '}
              <ExternalLink href={CAP_OVERVIEW}>apply to all marketing communications</ExternalLink>, regardless of targeting. The ASA and CAP{' '}
              <ExternalLink href={ASA_GUIDE}>influencer guide</ExternalLink>, updated in October 2026, recommends a clear &quot;Ad&quot; label up front. It lists labels the ASA has ruled insufficient, including &quot;Gifted&quot;, &quot;Collab&quot;, &quot;Sponsored&quot; and &quot;Spon&quot;. Note the difference from the US, where the FTC names &quot;sponsored&quot; as clear. For UK audiences, use &quot;Ad&quot;. The guide also says the brand and any agents share responsibility for labelling. Our{' '}
              <Link href="/blog/uk-tech-influencers-b2b-brands-2026" className={linkClass}>UK tech influencer guide</Link> covers the market in more detail.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">European Union</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              The European Commission&apos;s{' '}
              <ExternalLink href={EU_BRIEF}>Influencer Legal Hub brief</ExternalLink> points to Annex I point 11 of the Unfair Commercial Practices Directive, which prohibits undisclosed advertorials. Law firm{' '}
              <ExternalLink href={OSBORNE}>Osborne Clarke notes</ExternalLink> brands commissioning the posts are liable as well as the influencers, and the Digital Services Act requires platforms to offer a labelling function. The Commission opened a consultation on a Digital Fairness Act in July 2025, with influencer disclosure among its questions.
            </p>
            <p className="text-gray-700 leading-relaxed">
              One open point for B2B: <ExternalLink href={GT_LAW}>Greenberg Traurig describes</ExternalLink> the Directive as covering business-to-consumer practices, and national rules differ for B2B advertising. Do not treat this as a loophole. Creator audiences mix buyers and consumers, and each country adds its own rules, so ask counsel in each market.
            </p>
          </section>

          {/* Checklist */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Your disclosure checklist</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Run through this list before you send a brief. For the rest of the launch, see our guide to your{' '}
              <Link href="/blog/first-tech-influencer-campaign-startup-guide-2026" className={linkClass}>first tech influencer campaign</Link>.
            </p>
            <Checklist items={checklist} />
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How Infoishai fits</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai is a free marketplace for tech brands and creators, with no platform fees. Post a brief with our{' '}
              <Link href="/campaigns" className={linkClass}>campaign management tools</Link> and paste in the disclosure clauses above, or{' '}
              <Link href="/creators" className={linkClass}>browse verified tech creators</Link> and message them directly. Once a creator joins your campaign, the tracker keeps the offer, contract, deliverables and posted links in one place, so your review and screenshots sit next to the deal.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Infoishai does not give legal advice or check posts for compliance. You and the creator stay responsible for disclosure. Questions about the platform? Visit our{' '}
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
              Last updated November 7, 2026. Platform labels and regulator guidance change, so check each source before a launch. This article is general information, not legal advice.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Run your next campaign with clear briefs</h2>
          <p className="text-blue-800 mb-6">
            Post a campaign, add your disclosure terms, and keep every deliverable in one place. Infoishai is free for brands and creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/campaigns"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              See Campaigns
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
