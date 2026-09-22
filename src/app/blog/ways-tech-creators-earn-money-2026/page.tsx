// src/app/blog/ways-tech-creators-earn-money-2026/page.tsx

import Header from '@/components/header'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, User, Clock, Link2, Briefcase, Youtube, Mail, GraduationCap, Users, Heart, Mic, Repeat, Code2, Layers } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Top 10 Ways Tech Creators Earn Money in 2026',
  description: '10 proven income streams for tech creators in 2026. Brand deals, affiliates, newsletters, courses, consulting, and more. Real earning benchmarks included.',
  keywords: [
    'tech creators earn money',
    'how tech influencers make money',
    'tech creator income',
    'monetize tech content',
    'tech YouTuber income',
    'creator monetization 2026',
  ],
  openGraph: {
    title: 'Top 10 Ways Tech Creators Earn Money in 2026',
    description: '10 proven income streams for tech creators. Brand deals, affiliates, newsletters, courses, consulting, and platform revenue with real benchmarks.',
    type: 'article',
    publishedTime: '2026-08-12T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Creators', 'Monetization', 'Tech Influencers', 'Income'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top 10 Ways Tech Creators Earn Money in 2026',
    description: '10 proven income streams for tech creators. Brand deals, affiliates, newsletters, courses, consulting, and platform revenue with real benchmarks.',
  },
  alternates: {
    canonical: 'https://infoishai.com/blog/ways-tech-creators-earn-money-2026'
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Top 10 Ways Tech Creators Earn Money in 2026',
  description: '10 proven income streams for tech creators. Brand deals, affiliates, newsletters, courses, consulting, and platform revenue with real benchmarks.',
  image: 'https://infoishai.com/blog/tech-creators-earn-money-2026.jpg',
  datePublished: '2026-08-12',
  dateModified: '2026-08-12',
  author: {
    '@type': 'Person',
    name: 'Infoishai Team'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Infoishai',
    logo: {
      '@type': 'ImageObject',
      url: 'https://infoishai.com/logo.png'
    }
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://infoishai.com/blog/ways-tech-creators-earn-money-2026'
  }
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much do tech creators earn in 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tech creator earnings vary widely. Creators with 10K-50K followers earn $500-$3,000 per month from a mix of sponsorships, affiliates, and ad revenue. Creators with 50K-200K followers earn $3,000-$15,000 per month. Creators with 200K+ followers earn $15,000-$50,000+ per month. Top tech creators earning from multiple income streams exceed $100,000 per year.'
      }
    },
    {
      '@type': 'Question',
      name: 'What is the best income stream for small tech creators?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Affiliate marketing is the best starting income stream for small tech creators. No minimum audience size required. Sign up for affiliate programmes from tools you already use and include links in your content. A single well-placed affiliate link generates $50-$500 per month in passive income. Brand sponsorships become viable at 5K-10K engaged followers.'
      }
    }
  ]
}

interface IncomeStream {
  number: number
  title: string
  icon: typeof Link2
  earning: string
  minAudience: string
  timeToFirstDollar: string
  body: string[]
}

const streams: IncomeStream[] = [
  {
    number: 1,
    title: 'Affiliate Marketing',
    icon: Link2,
    earning: '$50 to $5,000+ per month',
    minAudience: 'None (works at any size)',
    timeToFirstDollar: '1 to 4 weeks',
    body: [
      'Affiliate marketing pays you a commission every time someone signs up for a product through your unique referral link. You review a SaaS tool, include your affiliate link, and earn 15 to 30% of the subscription fee — often recurring monthly for the customer\'s lifetime.',
      'The math compounds. Refer 50 paying customers at $50/month with a 20% commission and you earn $500/month in passive income from one product. Promote 5 similar products and affiliate income alone reaches $2,500/month.',
      'Strong tech affiliate programmes: hosting platforms (20-30% commissions), SaaS tools (15-25%), design software (10-20%), developer platforms (15-30%), and online course platforms (20-40%).',
      'Start here: sign up for affiliate programmes from 3 to 5 tools you already use and recommend, and add links to your existing content. No minimum audience required.',
    ],
  },
  {
    number: 2,
    title: 'Brand Sponsorships',
    icon: Briefcase,
    earning: '$500 to $25,000+ per deal',
    minAudience: '5K to 10K engaged followers',
    timeToFirstDollar: '2 to 8 weeks',
    body: [
      'The most visible income stream. A brand pays you a flat fee to create content featuring their product — dedicated YouTube reviews, LinkedIn posts, Twitter/X threads, Instagram Reels, newsletter mentions, and podcast spots all qualify.',
      'Rates for tech creators in 2026 range from $500 (micro-influencer YouTube video) to $25,000+ (top-tier dedicated review). Mid-tier creators with 50K-200K subscribers earn $2,000-$5,000 per YouTube sponsorship.',
      'Two paths exist: inbound (brands find you) and outbound (you pitch brands). Most creators start with outbound and shift to inbound as their channel grows.',
    ],
  },
  {
    number: 3,
    title: 'YouTube Ad Revenue (AdSense)',
    icon: Youtube,
    earning: '$200 to $5,000+ per month',
    minAudience: '1,000 subscribers + 4,000 watch hours',
    timeToFirstDollar: '1 to 6 months (after threshold)',
    body: [
      'YouTube pays creators a share of ad revenue from pre-roll, mid-roll, and display ads. Tech content earns higher CPMs than most categories because tech audiences attract premium advertisers.',
      'Tech YouTube CPMs in 2026: $8 to $25 per 1,000 views for English-language tech content. Developer and enterprise topics earn at the higher end; consumer tech and tutorials at the lower end.',
      'A channel averaging 50,000 monthly views at a $15 CPM earns $750/month. A channel averaging 200,000 monthly views earns $3,000/month. Ad revenue grows linearly with views and requires no additional work.',
      'Ad revenue is passive but slow to build. Treat it as baseline income while building higher-value streams like sponsorships and affiliates.',
    ],
  },
  {
    number: 4,
    title: 'Paid Newsletter',
    icon: Mail,
    earning: '$500 to $10,000+ per month',
    minAudience: '1,000 email subscribers',
    timeToFirstDollar: '2 to 4 weeks (after building a list)',
    body: [
      'Tech newsletters are one of the highest-value formats — every reader opted in, and open rates of 35-50% are standard for curated tech newsletters.',
      'Sponsorship model: keep the newsletter free and sell sponsorship slots. A newsletter with 5,000 subscribers charges $300-$600 per sponsored mention; weekly with one sponsor per issue generates $1,200-$2,400/month.',
      'Subscription model: charge readers directly, $5-$15/month or $50-$150/year. 200 paying subscribers at $10/month generates $2,000/month. Substack, Beehiiv, and ConvertKit all support paid subscriptions.',
      'Start a free newsletter, build to 1,000 subscribers, then add sponsorships or a paid tier. The email list is an asset you own, unlike social media followers.',
    ],
  },
  {
    number: 5,
    title: 'Online Courses and Digital Products',
    icon: GraduationCap,
    earning: '$1,000 to $20,000+ per month',
    minAudience: '5,000 followers (any platform)',
    timeToFirstDollar: '4 to 8 weeks (course creation time)',
    body: [
      'Your audience follows you because you know something they want to learn. Package that knowledge into a course, template pack, or digital guide and sell it directly.',
      'Tech course topics that sell well: full-stack app development ($49-$199), data science bootcamps ($79-$299), DevOps fundamentals ($99-$249), freelancing playbooks ($29-$99).',
      'Sell through Gumroad, Teachable, Udemy, or your own website. A creator with 50K subscribers converting 0.5% of viewers at $99 sells 250 courses for $24,750 in revenue.',
      'Digital products (templates, cheat sheets, boilerplates, Notion templates) sell at lower price points ($9-$49) but require less production effort — 100 copies/month at $19 generates $1,900/month.',
    ],
  },
  {
    number: 6,
    title: 'Consulting and Advisory Work',
    icon: Users,
    earning: '$2,000 to $15,000+ per month',
    minAudience: '10,000 followers (credibility threshold)',
    timeToFirstDollar: '1 to 2 weeks (if positioned correctly)',
    body: [
      'As your reputation grows, companies hire you for more than content — they hire you for your expertise.',
      'Formats: one-on-one advisory calls ($100-$500/hour), product feedback sessions ($500-$2,000/session), developer advocacy retainers ($2,000-$5,000/month), startup advisory roles ($1,000-$3,000/month plus equity).',
      '4 advisory calls per month at $300/hour earns $1,200/month from a few hours of work. 2 advisory retainers at $2,000/month earns $4,000/month.',
      'Consulting income scales with reputation, not audience size. A creator with 15K highly engaged followers in a specialised niche commands higher rates than a general creator with 200K followers.',
    ],
  },
  {
    number: 7,
    title: 'GitHub Sponsors and Patreon',
    icon: Heart,
    earning: '$100 to $5,000+ per month',
    minAudience: '1,000 followers',
    timeToFirstDollar: '1 to 4 weeks',
    body: [
      'Community-funded models let your audience support you directly. GitHub Sponsors works for developers sharing open-source code, tools, or educational resources. Patreon and Buy Me a Coffee work for broader tech content.',
      'Offer tiers: $3/month for early access, $10/month for exclusive tutorials, $25/month for monthly Q&A calls. 200 supporters at an average of $8/month earns $1,600/month.',
      'Works best for creators who build personal relationships with their audience — an active comment section and a connected viewer base generate meaningful income.',
    ],
  },
  {
    number: 8,
    title: 'Speaking and Events',
    icon: Mic,
    earning: '$500 to $10,000 per event',
    minAudience: '10,000 followers (credibility threshold)',
    timeToFirstDollar: 'Variable',
    body: [
      'Tech conferences, corporate events, and webinars pay speakers. As a creator with an established audience, you bring both expertise and an audience to the event.',
      'Speaking fees: local meetups and webinars ($0-$500), regional conferences ($500-$2,000), national conferences ($2,000-$5,000), corporate keynotes ($5,000-$15,000).',
      'Start with free speaking at local meetups and virtual events, build a portfolio, and pitch paid conferences after 3-5 appearances.',
      'Speaking income is episodic, not recurring — use it to grow your audience and attract sponsorship leads rather than as a primary income stream.',
    ],
  },
  {
    number: 9,
    title: 'Licensing and Content Syndication',
    icon: Repeat,
    earning: '$200 to $3,000 per deal',
    minAudience: 'Any size',
    timeToFirstDollar: 'Variable',
    body: [
      'Brands and media companies pay to reuse your content on their own channels. A brand sponsoring a YouTube review may pay an additional $500-$2,000 for the right to use clips on their website, social channels, or paid ads.',
      'Content licensing adds income without additional production work — the content already exists, and you sell permission to use it in new contexts.',
      'Negotiate licensing terms upfront. Many creators include basic licensing in the sponsorship fee; charging separately for extended usage rights (paid ads, website embeds, email campaigns) adds 20-50% on top of the base fee.',
    ],
  },
  {
    number: 10,
    title: 'Building and Selling Tools',
    icon: Code2,
    earning: '$1,000 to $50,000+ per month',
    minAudience: '10,000 followers',
    timeToFirstDollar: '2 to 6 months (development time)',
    body: [
      'Some tech creators build and sell their own software products — the highest-ceiling income stream, but it requires development skills and significant time investment.',
      'Examples: a web dev creator builds a boilerplate template marketplace, a productivity creator builds a Notion integration, an AI-tools creator builds a custom AI wrapper product.',
      'Your existing audience is your distribution channel. A creator with 100K subscribers launching a $29/month tool converting 0.5% of their audience gets 500 paying customers and $14,500/month in recurring revenue.',
      'This model combines creator income with startup income — the audience replaces paid marketing, and the product generates recurring revenue independent of content production.',
    ],
  },
]

const stackProgression = [
  { range: '0 - 5K followers', description: 'Start with affiliates (stream 1). Sign up for 3-5 affiliate programmes and add links to all content — your first creator income with zero minimum audience.' },
  { range: '5K - 20K followers', description: 'Add brand sponsorships (stream 2) and YouTube ad revenue (stream 3). Create an Infoishai profile to receive inbound sponsorship inquiries.' },
  { range: '20K - 50K followers', description: 'Add a paid newsletter (stream 4) or a digital product (stream 5) — start building assets that generate income independent of individual content pieces.' },
  { range: '50K - 100K followers', description: 'Add consulting (stream 6) and community funding (stream 7). Your reputation now supports premium-priced services.' },
  { range: '100K+ followers', description: 'Add speaking (stream 8), licensing (stream 9), and consider building your own tool (stream 10). Your brand and audience support diversified income across 5+ streams.' },
]

export default function WaysTechCreatorsEarnMoneyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
              Strategy
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              Featured Guide
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Top 10 Ways Tech Creators Earn Money in 2026
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            The highest-earning tech creators never rely on one income source. Here are 10 proven revenue streams, ranked by accessibility, with real earning benchmarks.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Infoishai Team</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>August 12, 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>17 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">

          {/* Intro */}
          <section className="mb-12">
            <p className="text-gray-700 leading-relaxed mb-6">
              Tech content creation is a career. Not a hobby with occasional perks. Creators who treat the work professionally build multiple income streams generating $3,000 to $50,000+ per month.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The key word is &quot;multiple.&quot; The highest-earning tech creators do not rely on one source. They combine 3 to 5 income streams so no single source accounts for more than 40% of their total revenue. If a brand pauses sponsorships for a quarter, affiliate income and newsletter revenue keep the bills paid. Here are 10 ways tech creators earn money in 2026, ranked by accessibility (easiest to start first).
            </p>
          </section>

          {/* Income Streams */}
          <section className="mb-12">
            <div className="space-y-6">
              {streams.map((stream) => (
                <div key={stream.number} className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <stream.icon className="w-6 h-6 text-violet-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{stream.number}. {stream.title}</h2>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">Earning potential</p>
                      <p className="text-gray-900 font-semibold text-sm">{stream.earning}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">Minimum audience</p>
                      <p className="text-gray-900 font-semibold text-sm">{stream.minAudience}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">Time to first dollar</p>
                      <p className="text-gray-900 font-semibold text-sm">{stream.timeToFirstDollar}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {stream.body.map((paragraph, i) => (
                      <p key={i} className="text-gray-700 leading-relaxed">{paragraph}</p>
                    ))}
                  </div>
                  {stream.number === 2 && (
                    <p className="text-gray-700 leading-relaxed mt-3">
                      To accelerate inbound deals, create a profile on{' '}
                      <Link href="/signup/creator" className="text-blue-600 hover:text-blue-700 font-medium">Infoishai</Link>. Brands search for creators by niche, platform, and audience size — your profile appears when a brand looks for someone in your category, and you receive direct messages with campaign details and budgets. No pitching required. For rate benchmarks, read{' '}
                      <Link href="/blog/tech-creator-sponsorship-rates-2026" className="text-blue-600 hover:text-blue-700 font-medium">
                        How Much Should Tech Creators Charge for Sponsorships?
                      </Link>, and for step-by-step guidance, read{' '}
                      <Link href="/blog/tech-creators-guide-how-to-get-brand-deals-2026" className="text-blue-600 hover:text-blue-700 font-medium">
                        Tech Creator&apos;s Guide: How to Get Brand Deals
                      </Link>.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Building Your Income Stack */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Layers className="w-8 h-8 text-blue-600 flex-shrink-0" />
              Building Your Income Stack
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Do not try all 10 at once. Build income streams sequentially based on your audience size.
            </p>
            <div className="space-y-4 mb-6">
              {stackProgression.map((stage) => (
                <div key={stage.range} className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">At {stage.range}</h3>
                  <p className="text-gray-700">{stage.description}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-800">
                The goal: no single income stream accounts for more than 40% of total revenue. Diversification protects your income from platform changes, algorithm shifts, and seasonal sponsorship fluctuations.
              </p>
            </div>
          </section>

          {/* Getting Started */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Start Earning From Your Tech Content Today</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Create your free creator profile on{' '}
              <Link href="/signup/creator" className="text-blue-600 hover:text-blue-700 font-medium">Infoishai</Link>{' '}
              and get discovered by brands, or browse the{' '}
              <Link href="/creators" className="text-blue-600 hover:text-blue-700 font-medium">creator directory</Link>{' '}
              to see how other creators present themselves.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Build your{' '}
              <Link href="/blog/creator-media-kit-guide-tech-influencers" className="text-blue-600 hover:text-blue-700 font-medium">
                media kit
              </Link>, set your{' '}
              <Link href="/blog/tech-creator-sponsorship-rates-2026" className="text-blue-600 hover:text-blue-700 font-medium">
                sponsorship rates
              </Link>, and learn{' '}
              <Link href="/blog/tech-creators-guide-how-to-get-brand-deals-2026" className="text-blue-600 hover:text-blue-700 font-medium">
                how to land brand deals
              </Link>.
            </p>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How much do tech creators earn in 2026?</h3>
                <p className="text-gray-700">
                  Tech creator earnings vary widely. Creators with 10K-50K followers earn $500-$3,000 per month from a mix of sponsorships, affiliates, and ad revenue. Creators with 50K-200K followers earn $3,000-$15,000 per month. Creators with 200K+ followers earn $15,000-$50,000+ per month. Top tech creators earning from multiple income streams exceed $100,000 per year.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What is the best income stream for small tech creators?</h3>
                <p className="text-gray-700">
                  Affiliate marketing is the best starting income stream for small tech creators. No minimum audience size required. Sign up for affiliate programmes from tools you already use and include links in your content. A single well-placed affiliate link generates $50-$500 per month in passive income. Brand sponsorships become viable at 5K-10K engaged followers.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h3 className="text-2xl font-bold text-blue-900 mb-4">Get Discovered by Brands on Infoishai</h3>
          <p className="text-blue-800 mb-6">
            Create your free creator profile, display your rates and audience metrics, and let verified brands message you directly — no platform fees on your earnings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup/creator"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Join as a Creator
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/creators"
              className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-3 rounded-lg font-medium border border-blue-300 transition-colors"
            >
              See Creator Profiles
            </Link>
          </div>
          <p className="text-sm text-blue-700 mt-4">No credit card required • No exclusivity requirements • Set your own rates</p>
        </div>

        {/* Related Articles */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/blog/tech-creator-sponsorship-rates-2026" className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all">
              <span className="text-sm text-blue-600 font-medium">Strategy</span>
              <h4 className="font-bold text-gray-900 mt-2 text-lg group-hover:text-blue-600 transition-colors">How Much Should Tech Creators Charge for Sponsorships? (2026)</h4>
              <p className="text-gray-600 text-sm mt-2">Pricing formulas, rate benchmarks, and negotiation rules.</p>
            </Link>
            <Link href="/blog/creator-media-kit-guide-tech-influencers" className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all">
              <span className="text-sm text-blue-600 font-medium">Strategy</span>
              <h4 className="font-bold text-gray-900 mt-2 text-lg group-hover:text-blue-600 transition-colors">How to Build a Creator Media Kit: Guide for Tech Influencers</h4>
              <p className="text-gray-600 text-sm mt-2">The 7 sections every tech creator media kit needs.</p>
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
