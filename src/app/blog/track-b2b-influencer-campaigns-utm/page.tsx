// src/app/blog/track-b2b-influencer-campaigns-utm/page.tsx

import Header from '@/components/header'
import PillarGuideLink from '@/components/blog/PillarGuideLink'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, User } from 'lucide-react'
import { Metadata } from 'next'
import type { ReactNode } from 'react'

export const revalidate = 86400

const PAGE_URL = 'https://infoishai.com/blog/track-b2b-influencer-campaigns-utm'
const HEADLINE = 'How to Track B2B Influencer Campaigns with UTMs, Promo Codes and Your CRM'
const META_TITLE = 'Track B2B Influencer Campaigns: UTMs, Codes and CRM'
const DESCRIPTION =
  'Set up UTM links, promo codes and CRM fields to track B2B influencer leads. Includes a naming convention and attribution windows for long sales cycles.'

export const metadata: Metadata = {
  title: META_TITLE,
  description: DESCRIPTION,
  keywords: [
    'utm tracking influencer campaigns b2b',
    'track influencer campaign roi saas',
    'utm links for influencers',
    'influencer promo codes b2b',
    'utm naming convention for influencer campaigns',
    'how to track linkedin influencer leads',
    'ga4 influencer attribution setup',
    'B2B influencer attribution',
  ],
  openGraph: {
    title: META_TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: PAGE_URL,
    publishedTime: '2026-11-04T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['UTM', 'Attribution', 'CRM', 'B2B'],
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
  datePublished: '2026-11-04',
  dateModified: '2026-11-04',
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

const GA_URL_BUILDER = 'https://support.google.com/analytics/answer/10917952?hl=en'
const GA_CHANNELS = 'https://support.google.com/analytics/answer/9756891?hl=en'
const GA_TAGGING = 'https://support.google.com/analytics/answer/14847402?hl=en'
const GA_LOOKBACK = 'https://support.google.com/analytics/answer/10597962?hl=en'
const GA_SOURCES = 'https://support.google.com/analytics/answer/11242841?hl=en'
const GA_CUSTOM_CHANNELS = 'https://support.google.com/analytics/answer/13051316?hl=en'
const HS_HIDDEN = 'https://knowledge.hubspot.com/forms/pass-contact-property-values-with-hidden-form-fields'
const HS_QUERY = 'https://knowledge.hubspot.com/forms/can-i-auto-populate-form-fields-through-a-query-string'
const HS_SOURCE = 'https://knowledge.hubspot.com/properties/understand-traffic-source-properties'
const WISE = 'https://thewisemarketer.com/research-reveals-the-complexity-of-b2b-buying-journeys'
const DREAMDATA_2022 = 'https://dreamdata.io/blog/b2b-go-to-market-benchmarks-2022'
const TECHCRUNCH = 'https://techcrunch.com/2023/08/10/youtube-is-disabling-links-on-shorts-to-cut-down-on-spam'
const X_TCO = 'https://help.x.com/en/using-x/url-shortener'
const LEADFEEDER = 'https://www.leadfeeder.com/blog/marketing-analytics/linkedin-utm-parameters/'
const DIRECTOM = 'https://www.directom.com/linkedin-referral-traffic-issue/'
const COMETLY = 'https://www.cometly.com/post/tracking-for-influencer-marketing-campaigns'

const linkClass = 'text-blue-600 hover:text-blue-700 font-medium'
const thClass = 'border-b border-gray-200 px-4 py-3 text-left font-bold text-gray-900'
const tdClass = 'border-b border-gray-100 px-4 py-3 text-gray-700 align-top'
const codeCellClass = `${tdClass} font-mono text-sm whitespace-nowrap`

// "dana_k" is a fictional creator. The campaign value stays the same on every row.
const CAMPAIGN = 'creator_2026q4_demo'
const naming = [
  { placement: 'YouTube video, description link', source: 'youtube', medium: 'video', content: 'dana_k_video1' },
  { placement: 'LinkedIn post, link in the post', source: 'linkedin', medium: 'social', content: 'dana_k_post1' },
  { placement: 'LinkedIn post, link in the first comment', source: 'linkedin', medium: 'social', content: 'dana_k_post1_comment' },
  { placement: 'LinkedIn newsletter issue', source: 'linkedin', medium: 'email', content: 'dana_k_issue1' },
  { placement: 'X post or thread', source: 'x', medium: 'social', content: 'dana_k_thread1' },
  { placement: "Creator's own email newsletter", source: 'dana_k_news', medium: 'email', content: 'dana_k_issue1' },
]

const crmFields = [
  { field: 'First-touch source', object: 'Contact', fill: 'Hidden form field, utm_source. Write once.', example: 'linkedin' },
  { field: 'First-touch campaign', object: 'Contact', fill: 'Hidden form field, utm_campaign. Write once.', example: CAMPAIGN },
  { field: 'Creator', object: 'Contact', fill: 'Workflow, from utm_content, the promo code or a confirmed self-reported answer', example: 'dana_k' },
  { field: 'Deliverable', object: 'Contact', fill: 'Hidden form field, utm_content', example: 'dana_k_post1' },
  { field: 'Promo code', object: 'Contact', fill: 'Visible form field', example: 'DANA30' },
  { field: 'Self-reported source', object: 'Contact', fill: 'Free-text form field', example: '"Dana\'s LinkedIn post"' },
  { field: 'Demo request date', object: 'Contact', fill: 'Automatic, on form submit', example: '2026-11-12' },
  { field: 'Creator-influenced', object: 'Opportunity', fill: 'Workflow, yes if any contact has a Creator value', example: 'Yes' },
  { field: 'Creator on opportunity', object: 'Opportunity', fill: 'Workflow, copied from the contact when the opportunity opens', example: 'dana_k' },
]

const reads = [
  { when: 'Launch day', tool: 'Your browser and GA4 Realtime', question: 'Do the live links reach your page with every UTM intact?' },
  { when: 'Day 30', tool: 'GA4 and your CRM', question: 'Which deliverables drove qualified visits and demo requests?' },
  { when: 'Day 90', tool: 'Your CRM', question: 'Which creators appear on opened opportunities?' },
  { when: 'Day 180, then each quarter', tool: 'Your CRM', question: 'Which creator-influenced opportunities closed, and for how much?' },
]

const checklist: ReactNode[] = [
  <>Write one naming sheet, in lowercase, and name one person as its owner.</>,
  <>Build one link per creator, per deliverable.</>,
  <>Create one code per creator, tied to a real offer.</>,
  <>Add hidden UTM fields, a code field and a free-text source field to your demo form.</>,
  <>Mark the demo request as a key event in GA4.</>,
  <>Create the CRM fields above, and test one record from click to opportunity.</>,
  <>Put the exact link and code in each creator&apos;s brief, with the disclosure label.</>,
  <>Click each live link on launch day, on desktop and on a phone.</>,
  <>Put the 30, 90 and 180-day reads in your calendar now.</>,
]

const sources = [
  { label: 'Google Analytics Help, URL builders and UTM parameters', href: GA_URL_BUILDER },
  { label: 'Google Analytics Help, Default channel group', href: GA_CHANNELS },
  { label: 'Google Analytics Help, Tagging best practices', href: GA_TAGGING },
  { label: 'Google Analytics Help, Select attribution settings', href: GA_LOOKBACK },
  { label: 'Google Analytics Help, Campaigns and traffic sources', href: GA_SOURCES },
  { label: 'HubSpot Knowledge Base, Hidden form fields (updated July 2026)', href: HS_HIDDEN },
  { label: 'HubSpot Knowledge Base, Auto-populate form fields with a query string (updated July 2026)', href: HS_QUERY },
  { label: 'HubSpot Knowledge Base, Original and Latest traffic source properties (updated August 2026)', href: HS_SOURCE },
  { label: 'The Wise Marketer, on the Dreamdata LinkedIn Ads Benchmarks Report 2025 (September 2025)', href: WISE },
  { label: 'Dreamdata, B2B Go-to-Market Benchmarks 2022', href: DREAMDATA_2022 },
  { label: 'TechCrunch, YouTube disabling links on Shorts (August 2023)', href: TECHCRUNCH },
  { label: "X Help, About X's link service", href: X_TCO },
  { label: 'Leadfeeder, LinkedIn UTM parameters (October 2026)', href: LEADFEEDER },
  { label: 'Directom, LinkedIn referral traffic issue (updated July 2026)', href: DIRECTOM },
  { label: 'Cometly, Tracking for influencer marketing campaigns (June 2026)', href: COMETLY },
]

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  )
}

function Param({ children }: { children: ReactNode }) {
  return <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-800">{children}</code>
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

export default function TrackB2BInfluencerCampaignsPage() {
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
              Measurement
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Strategy
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {HEADLINE}
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            A copy-ready UTM sheet, a CRM field map, and an honest list of what tracking misses.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>November 4, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>11 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">

          {/* Intro */}
          <section className="mb-12">
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 mb-6">
              <p className="text-blue-900 leading-relaxed">
                Track B2B influencer leads in three layers. Give each deliverable its own UTM link, give each creator a promo code or offer, then save both in your CRM with a &quot;How did you hear about us?&quot; field. Review results at 30, 90 and 180 days, because B2B deals close slowly.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              UTM tracking for B2B influencer campaigns means adding labelled parameters to each creator&apos;s link, so your analytics and CRM record which creator and which post sent a visitor. A UTM is a short tag at the end of a URL. GA4, Google&apos;s analytics product, reads those tags and reports on them.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This guide covers tracking setup for B2B software teams running creator content on YouTube, LinkedIn, X and newsletters. It does not cover ROI models or paid ad reporting. If you have not run a campaign yet, start with our guide to your{' '}
              <Link href="/blog/first-tech-influencer-campaign-startup-guide-2026" className={linkClass}>first tech influencer campaign</Link>.
            </p>
          </section>

          {/* Why harder */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why is B2B influencer attribution harder?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              B2B buying takes months and involves several people, so the person who clicks a creator&apos;s link is rarely the one who signs. Consumer tracking often ends at a checkout. Yours has to survive until a deal closes.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              The numbers show the gap. Dreamdata&apos;s 2025 LinkedIn Ads Benchmarks Report, as{' '}
              <ExternalLink href={WISE}>covered by The Wise Marketer</ExternalLink>, puts the average journey at 211 days and 76 touches before a purchase. An older{' '}
              <ExternalLink href={DREAMDATA_2022}>Dreamdata benchmark from 2022</ExternalLink>, based on 414 accounts, found B2B SaaS journeys took 233 days. It also found journeys starting on social took 222 days to a won deal, against 87 for paid. Those figures are several years old, so read them as a direction, not a forecast.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Your first-week click report will miss most of what a creator did. Plan for this before launch, and tell your finance team upfront when revenue numbers will arrive.
            </p>
          </section>

          {/* Layer 1 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Layer 1: UTM links</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Give every deliverable its own link. One link per creator tells you who drove the visit. One link per post tells you which format and message worked, and this is what you want when you plan the next round.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Naming convention</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Google says you{' '}
              <ExternalLink href={GA_URL_BUILDER}>should always use</ExternalLink> <Param>utm_source</Param>, <Param>utm_medium</Param> and <Param>utm_campaign</Param>, and it also recommends <Param>utm_id</Param>. Values are case sensitive, so <Param>LinkedIn</Param> and <Param>linkedin</Param> split into two rows. Use lowercase and underscores everywhere.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><Param>utm_source</Param>: the platform, or the newsletter name.</li>
              <li><Param>utm_medium</Param>: the type of channel, from the values below.</li>
              <li><Param>utm_campaign</Param> and <Param>utm_id</Param>: a <Param>creator_</Param> prefix, the quarter and the goal.</li>
              <li><Param>utm_content</Param>: the creator and the deliverable. Google describes this field as the way to tell creatives apart.</li>
            </ul>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>Placement</th>
                    <th className={thClass}>utm_source</th>
                    <th className={thClass}>utm_medium</th>
                    <th className={thClass}>utm_campaign</th>
                    <th className={thClass}>utm_content</th>
                  </tr>
                </thead>
                <tbody>
                  {naming.map((row) => (
                    <tr key={row.placement}>
                      <td className={tdClass}>{row.placement}</td>
                      <td className={codeCellClass}>{row.source}</td>
                      <td className={codeCellClass}>{row.medium}</td>
                      <td className={codeCellClass}>{CAMPAIGN}</td>
                      <td className={codeCellClass}>{row.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Dana K is a fictional creator. Swap in your own names, then keep this sheet in one shared file.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">A finished link looks like this:</p>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-6 text-sm overflow-x-auto">
              <code>https://example.com/demo?utm_source=linkedin&amp;utm_medium=social&amp;utm_campaign={CAMPAIGN}&amp;utm_content=dana_k_post1&amp;utm_id={CAMPAIGN}</code>
            </pre>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Why not use utm_medium=influencer?</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Because GA4 has no rule for it. Google&apos;s{' '}
              <ExternalLink href={GA_CHANNELS}>default channel group</ExternalLink> sorts traffic using set lists of sources and mediums, such as <Param>social</Param>, <Param>email</Param> and any medium containing <Param>video</Param>. Google says traffic lands in{' '}
              <ExternalLink href={GA_TAGGING}>Unassigned</ExternalLink> when a user-defined source or medium has no matching rule. So keep the medium standard, and let the <Param>creator_</Param> campaign prefix mark your creator traffic. Filter on the prefix to see every creator in one view.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Want a separate Creator channel in reports? Google offers{' '}
              <ExternalLink href={GA_CUSTOM_CHANNELS}>custom channel groups</ExternalLink> for this.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">Do UTM links work on YouTube and LinkedIn?</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Yes, in the places where those platforms show a clickable link. The link has to live in a spot your buyer is able to tap, so write the placement into each creator&apos;s brief.
            </p>
            <Checklist
              items={[
                <><strong>YouTube videos:</strong> use the description link, and ask for it near the top. Have the creator say your short URL or code out loud as well.</>,
                <><strong>YouTube Shorts:</strong> <ExternalLink href={TECHCRUNCH}>TechCrunch reported in 2023</ExternalLink> YouTube was disabling clickable links in Shorts descriptions and comments. Rely on a spoken code or short URL, and check the current behaviour before you brief.</>,
                <><strong>LinkedIn:</strong> <ExternalLink href={LEADFEEDER}>Leadfeeder notes</ExternalLink> organic posts get no automatic tags, so build each link yourself, and it warns lnkd.in short links might alter tags. Use HTTPS too. <ExternalLink href={DIRECTOM}>One practitioner test</ExternalLink> found clicks to non-HTTPS pages showing as direct visits.</>,
                <><strong>Sponsored LinkedIn posts:</strong> Leadfeeder also warns Campaign Manager&apos;s tracking parameters might not be added when you sponsor an existing post. Compare results against LinkedIn&apos;s own campaign report.</>,
                <><strong>X:</strong> links get <ExternalLink href={X_TCO}>wrapped in t.co automatically</ExternalLink>, and you cannot opt out. Keep your full tagged URL, then click the live post to confirm the tags arrive.</>,
                <><strong>Instagram and TikTok:</strong> <ExternalLink href={COMETLY}>Cometly points out</ExternalLink> Instagram feed posts have no clickable links, so use codes there. Ask TikTok creators which link options their account has.</>,
              ]}
            />
          </section>

          {/* Layer 2 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Layer 2: promo codes and landing pages</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Codes catch the buyers links miss: someone who watches on a TV, sees a post on a phone and books a demo from a laptop later. A promo code is a short word tied to one creator, which the buyer types in.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Most B2B funnels have no checkout, so a discount code has nowhere to go. Tie the code to something a buyer wants at the demo stage, such as an extended trial or an onboarding session, and add a code field to your demo form. Use one code per creator, such as <Param>DANA30</Param> for our fictional creator.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Add a short landing page for each major creator, such as <Param>example.com/dana</Param>. It is easy to say out loud in a video. Set the page to redirect with the full UTM string, or keep the tags in its form. Test it, since{' '}
              <ExternalLink href={COMETLY}>UTMs sometimes get stripped</ExternalLink> during redirects, form submissions and CRM integrations.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Treat codes as signals, not proof. People share codes, and a buyer who used one might have heard of you elsewhere first. Tracking also does not replace disclosure, so keep the sponsorship label in every brief. Our{' '}
              <Link href="/blog/tech-influencers-complete-guide" className={linkClass}>complete guide to tech influencers</Link> covers disclosure rules.
            </p>
          </section>

          {/* Layer 3 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Layer 3: your CRM and self-reported attribution</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Your CRM is where a click becomes pipeline, so UTM values have to reach it. GA4 reports on visits and key events. A CRM, or customer relationship management system, holds the people and deals, and this is the only place to tie a creator to revenue.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Pass UTMs through hidden form fields. In HubSpot,{' '}
              <ExternalLink href={HS_HIDDEN}>hidden fields</ExternalLink> save values from the page URL when a form is submitted, and{' '}
              <ExternalLink href={HS_QUERY}>a query string fills them in</ExternalLink>. HubSpot also records an{' '}
              <ExternalLink href={HS_SOURCE}>Original and Latest traffic source</ExternalLink> for each contact, with some drill-downs reading <Param>utm_campaign</Param>. In Salesforce or another CRM, create matching custom fields with your admin.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              One gap to plan for: a query string only lives on the page where it lands. If your form sits on a different page from the link target, store the values in the browser until the form loads, and check this with whoever owns your cookie consent setup.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>CRM field</th>
                    <th className={thClass}>Object</th>
                    <th className={thClass}>How it fills</th>
                    <th className={thClass}>Example</th>
                  </tr>
                </thead>
                <tbody>
                  {crmFields.map((row) => (
                    <tr key={row.field}>
                      <td className={tdClass}>{row.field}</td>
                      <td className={tdClass}>{row.object}</td>
                      <td className={tdClass}>{row.fill}</td>
                      <td className={codeCellClass}>{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Example values are fictional. Field names are our suggestion, not a CRM default.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The free-text field does the most work for the least effort. Keep it optional, and leave it open rather than a dropdown, so people write the creator&apos;s name in their own words. Have your sales team confirm the answer on the first call, then correct the field if needed.
            </p>
            <p className="text-gray-700 leading-relaxed mt-6">
              Here is a fictional example of the full chain. A buyer clicks Dana&apos;s LinkedIn post, reads your page and leaves. Three weeks later, a colleague books a demo from a laptop and types &quot;Dana&apos;s post&quot; in the source field. The UTM fields show nothing for the colleague, yet the free-text answer still marks the opportunity as creator-influenced. Without this field, the deal reads as direct.
            </p>
          </section>

          {/* Window */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What attribution window should B2B use?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Use 30 days as your first read, not your final answer, then follow pipeline in your CRM for six months or more. An attribution window is how long after a touch you still give it credit. No standard or rule sets this number, so the schedule below is our suggested starting point.
            </p>
            <div className="overflow-x-auto mb-6 rounded-lg shadow-sm border">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={thClass}>When</th>
                    <th className={thClass}>Where</th>
                    <th className={thClass}>Question to answer</th>
                  </tr>
                </thead>
                <tbody>
                  {reads.map((row) => (
                    <tr key={row.when}>
                      <td className={tdClass}>{row.when}</td>
                      <td className={tdClass}>{row.tool}</td>
                      <td className={tdClass}>{row.question}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              GA4 will not cover the full journey. Its{' '}
              <ExternalLink href={GA_LOOKBACK}>attribution settings</ExternalLink> default to a 90-day lookback for most key events, with 30 or 60 days as the other choices, and 30 days for acquisition events. Keep the 90-day setting. Against a 211-day average journey, this still falls short, which is why your revenue read belongs in the CRM.
            </p>
            <p className="text-gray-700 leading-relaxed">
              If your own sales cycle is shorter or longer, move the later reads to match. Your median time from first touch to closed deal is the best guide you have.
            </p>
          </section>

          {/* Cannot measure */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What will tracking miss?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              You will not see most private sharing, and you should say so in your report. Dark social is the term for sharing in private channels such as DMs, Slack and email, where the link often loses its tags or no one clicks at all.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Direct traffic:</strong> GA4 <ExternalLink href={GA_SOURCES}>treats a session as direct</ExternalLink> when no referral information is available. A buyer who types your URL after a video shows up here.</li>
              <li><strong>Device changes:</strong> a click on a phone and a form on a work laptop often look like two people.</li>
              <li><strong>Buying committees:</strong> a VP who saw the post and told a manager to book a demo leaves no trace on your form.</li>
              <li><strong>Consent and blockers:</strong> visitors who decline cookies or run ad blockers often drop out of your data. HubSpot notes ad blockers affect its source values in some cases.</li>
              <li><strong>Views without clicks:</strong> most people who watch or read will not click. Their later interest has no link attached.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-6">
              So report tracked and self-reported results as separate lines, and do not add them together, since one lead often appears in both. Label the total as a minimum, not the full effect.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Add a rough directional check too. Compare branded search and direct demo requests in the weeks before and after a big post. Other campaigns affect these numbers, so treat a change as a clue. Fit matters more than any report, so pick creators with our{' '}
              <Link href="/blog/vet-tech-influencers-scorecard" className={linkClass}>10-point vetting scorecard</Link> before you spend time on tracking.
            </p>
          </section>

          {/* Checklist */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Your pre-launch tracking checklist</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Work through this list before the first post goes live. Links and form fields are hard to fix after a creator publishes.
            </p>
            <Checklist items={checklist} />
          </section>

          {/* Infoishai */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How Infoishai fits with your tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Infoishai does not create UTM links or connect to your CRM. Your analytics stack keeps this job. What Infoishai gives you is a free place to run the work around it, with no platform fees.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Post a brief with our{' '}
              <Link href="/campaigns" className={linkClass}>campaign management tools</Link>, or{' '}
              <Link href="/creators" className={linkClass}>browse verified tech creators</Link> and message them directly. Add each tagged link and code to the brief. Once a creator is on your campaign, the tracker keeps each deliverable&apos;s posted link, along with views, clicks, other engagement numbers and screenshots, so your platform numbers sit next to the deal.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Want a team to run the campaign? Our{' '}
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
              Last updated November 4, 2026. Platform link behaviour and GA4 settings change, so test your own links before each launch. Journey figures come from Dreamdata customer data, not an independent census. Infoishai does not publish its own attribution data here.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Launch a tracked campaign on Infoishai</h2>
          <p className="text-blue-800 mb-6">
            Post your brief, add your tagged links and codes, and keep every deliverable in one place. Infoishai is free for brands and creators.
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
