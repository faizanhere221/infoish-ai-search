// src/app/blog/creator-media-kit-guide-tech-influencers/page.tsx

import Header from '@/components/header'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Calendar, User, Clock, CheckCircle, FileText, BarChart3, Globe, DollarSign, Award, PlayCircle, Mail, XCircle, Wrench, RefreshCw } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Build a Creator Media Kit: Guide for Tech Influencers',
  description: 'Build a media kit as a tech creator. Free template with audience stats, rate cards, and past results. Land more brand deals with a professional one-pager.',
  keywords: [
    'creator media kit',
    'influencer media kit',
    'media kit template',
    'tech creator media kit',
    'how to build media kit',
    'influencer rate card',
  ],
  openGraph: {
    title: 'How to Build a Creator Media Kit: Guide for Tech Influencers',
    description: 'Step-by-step guide to building a media kit as a tech creator. Includes template structure, what to include, and what to skip.',
    type: 'article',
    publishedTime: '2026-08-12T00:00:00.000Z',
    authors: ['Infoishai Team'],
    tags: ['Creators', 'Media Kit', 'Tech Influencers', 'Sponsorships'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Build a Creator Media Kit: Guide for Tech Influencers',
    description: 'Step-by-step guide to building a media kit as a tech creator. Includes template structure, what to include, and what to skip.',
  },
  alternates: {
    canonical: 'https://infoishai.com/blog/creator-media-kit-guide-tech-influencers'
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'How to Build a Creator Media Kit: Guide for Tech Influencers',
  description: 'Step-by-step guide to building a media kit as a tech creator. Includes template structure, what to include, and what to skip.',
  image: 'https://infoishai.com/blog/creator-media-kit-guide.jpg',
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
    '@id': 'https://infoishai.com/blog/creator-media-kit-guide-tech-influencers'
  }
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a creator media kit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A creator media kit is a one-page or two-page PDF document summarising your audience, content, engagement metrics, past brand partnerships, and sponsorship rates. Brands use media kits to evaluate whether a creator fits their campaign. A professional media kit speeds up the partnership process and signals professionalism.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do tech creators need a media kit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. A media kit separates professional creators from hobbyists in the eyes of brand managers. When a brand evaluates 10 creators, the ones with clear media kits get prioritised. Alternatively, a complete Infoishai profile replaces the need for a standalone media kit by displaying all the same information in a searchable format.'
      }
    }
  ]
}

const problems = [
  { title: 'Scrambling for stats', description: 'Brands ask "what are your stats?" and you scramble to pull numbers from five different dashboards. A media kit has everything in one document — you send the PDF and the conversation moves forward.' },
  { title: 'Competing without polish', description: 'You compete against creators who present themselves professionally. A clean media kit signals you have done this before, and brands feel confident you will deliver on time and on brief.' },
  { title: 'Undervaluing your work', description: 'You undervalue your work because you do not have your data organised. Seeing your numbers laid out clearly gives you confidence to price at market rates instead of guessing from memory.' },
]

const sections = [
  {
    number: 1,
    title: 'Your Name and Tagline',
    icon: User,
    body: 'Your name (or channel name) at the top. Below the name, one sentence describing what you do and who your audience is.',
    examples: [
      'Alex Chen | AI and Machine Learning Tool Reviews | 85K YouTube Subscribers',
      'DevFlow | Developer Productivity Content | 42K LinkedIn Followers',
      'Sara Tech | SaaS Reviews for Startup Teams | 28K YouTube, 15K Twitter/X',
    ],
    note: 'Do not write a paragraph. One line. The brand manager needs to understand your niche in 3 seconds.',
  },
  {
    number: 2,
    title: 'Platform Stats',
    icon: BarChart3,
    body: 'List every platform where you create content. For each platform, include follower/subscriber count and average engagement metrics.',
    examples: [
      'YouTube: 85,000 subscribers | 22,000 avg views/video | 5.8% engagement rate',
      'LinkedIn: 34,000 followers | 6,500 avg impressions/post | 4.2% engagement rate',
      'Twitter/X: 18,000 followers | 12,000 avg impressions/thread | 3.1% engagement rate',
      'Newsletter: 5,200 subscribers | 44% open rate | 8% click rate',
    ],
    note: 'List platforms largest first. Include only platforms where you actively post — a weak platform dilutes the strong ones. Update these numbers monthly.',
  },
  {
    number: 3,
    title: 'Audience Demographics',
    icon: Globe,
    body: 'Brands pay for access to your audience. Demographics tell the brand whether your audience matches their buyer. Pull this data from YouTube Studio (audience tab), Instagram Insights, LinkedIn Analytics, or your newsletter platform.',
    examples: [
      'Top 3 countries by percentage (e.g., "USA 45%, India 22%, UK 12%")',
      'Age breakdown (e.g., "25-34: 48%, 35-44: 28%, 18-24: 15%")',
      'Gender split (e.g., "Male 72%, Female 26%, Other 2%")',
      'Professional roles if available (e.g., "Software engineers 38%, Product managers 18%, Startup founders 15%")',
    ],
    note: 'Professional role data is the most valuable metric for tech creators — a brand selling a project management tool wants to know your audience includes product managers and team leads.',
  },
  {
    number: 4,
    title: 'Content Formats and Rates',
    icon: DollarSign,
    body: 'List every content format you offer with the price for each.',
    examples: [
      'Dedicated YouTube video (8-15 min): $2,500',
      'YouTube integration (30-60 sec): $800',
      'YouTube Shorts: $500',
      'LinkedIn post: $700',
      'Twitter/X thread (5-8 tweets): $400',
      'Newsletter mention: $300',
      'Bundle (YouTube + LinkedIn + Twitter): $3,200',
    ],
    note: 'Be specific about what each format includes. "Dedicated YouTube video (8-15 min)" is clearer than "YouTube sponsorship."',
  },
  {
    number: 5,
    title: 'Past Brand Partnerships',
    icon: Award,
    body: 'List 3 to 5 brands you have worked with. For each, include the brand name, content format, and one result metric.',
    examples: [
      'CloudStack Pro: Dedicated YouTube review. 35,000 views, 280 signups tracked.',
      'DevTools Inc: LinkedIn post + Twitter thread. 12,000 impressions, 95 link clicks.',
      'BuildFast: YouTube integration. 18,000 views, 120 trial activations.',
    ],
    note: 'No sponsored content yet? List products you have reviewed or featured, even unpaid. Do not fabricate results — brands verify, and an inflated number gets caught.',
  },
  {
    number: 6,
    title: 'Content Samples',
    icon: PlayCircle,
    body: 'Include links to 2 to 3 of your best pieces of content: your best production quality, a product review or sponsored piece (if you have one), and your most-viewed or highest-engagement post.',
    examples: [
      '"AI Code Review Tools Compared" (YouTube, 45K views): [link]',
      '"Why I Switched to Linear for Project Management" (LinkedIn, 890 likes): [link]',
      '"Top 5 Developer Productivity Apps" (Twitter/X, 2,100 retweets): [link]',
    ],
    note: 'Choose content relevant to the brands you want to attract. Want SaaS partnerships? Show SaaS-related content.',
  },
  {
    number: 7,
    title: 'Contact Information',
    icon: Mail,
    body: 'Your email address, your website or link-in-bio URL, and your Infoishai profile link (if you have one).',
    examples: [],
    note: 'Do not list your phone number — email is the standard channel. Use a domain-based email if you have one: creator@alexchen.com looks more professional than a personal Gmail address.',
  },
]

const leaveOut = [
  { title: 'Your life story', description: 'Nobody reads a three-paragraph bio on a media kit. One tagline is enough.' },
  { title: 'Irrelevant metrics', description: 'Do not list total lifetime views, total subscribers across all platforms combined, or "potential reach." Brands care about average performance per piece of content.' },
  { title: 'Screenshots of analytics dashboards', description: 'Clean numbers in a formatted layout are easier to read than blurry screenshots. If a brand wants to verify, they ask during negotiation.' },
  { title: 'Personal photos or headshots', description: 'Optional. If you include one, make it professional and small — the data is the focus, not the portrait.' },
  { title: 'Logos of every tool you have ever mentioned', description: 'Media kits with 30 brand logos look cluttered. List 3-5 relevant past partnerships with results. Quality over quantity.' },
]

const tools = [
  { name: 'Canva', description: 'Free templates for media kits. Choose a minimal template, replace the placeholder text with your data, and export as PDF. Takes 30 to 45 minutes.' },
  { name: 'Google Slides', description: 'Create a one-slide or two-slide presentation. Add your data in a clean layout and export as PDF. Free and simple.' },
  { name: 'Notion', description: 'Build a media kit as a Notion page and share the link directly. Notion pages look clean and update in real time when your stats change.' },
]

export default function CreatorMediaKitGuidePage() {
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
            How to Build a Creator Media Kit: Guide for Tech Influencers
          </h1>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            The creator with a clean one-page PDF gets the deal. Here is exactly what goes in a tech creator media kit, what to leave out, and how to build one in under an hour.
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
              <span>13 min read</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">

          {/* Intro */}
          <section className="mb-12">
            <p className="text-gray-700 leading-relaxed mb-6">
              A brand manager is evaluating 10 tech creators for a $3,000 sponsorship. Seven send a one-line reply: &quot;Here are my rates.&quot; Two send nothing useful. One sends a clean, one-page PDF with audience stats, engagement data, content samples, and a rate card.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              That one creator gets the deal.
            </p>
            <p className="text-gray-700 leading-relaxed">
              A media kit is your professional resume as a creator. Brands use media kits to evaluate whether your audience matches their campaign. A strong media kit answers every question a brand manager has before they reply to your email. This guide shows you exactly what goes in a tech creator media kit, what to leave out, and how to build one in under an hour.
            </p>
          </section>

          {/* What it does */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What a Media Kit Does for You</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              A media kit solves three problems.
            </p>
            <div className="space-y-4">
              {problems.map((problem, i) => (
                <div key={problem.title} className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Problem {i + 1}: {problem.title}</h3>
                  <p className="text-gray-700">{problem.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 7 sections */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
              The 7 Sections Every Tech Creator Media Kit Needs
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Keep your media kit to one page. Two pages maximum. Brand managers scan media kits in 30 seconds. Everything above the fold matters. Everything below the fold is a bonus.
            </p>
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.number} className="bg-white rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <section.icon className="w-5 h-5 text-violet-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Section {section.number}: {section.title}</h3>
                  </div>
                  <p className="text-gray-700 mb-4">{section.body}</p>
                  {section.examples.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 font-mono text-sm text-gray-700 whitespace-pre-line">
                      {section.examples.join('\n')}
                    </div>
                  )}
                  <p className="text-gray-500 text-sm">{section.note}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-700 leading-relaxed mt-6">
              For guidance on setting your rates for Section 4, read{' '}
              <Link href="/blog/tech-creator-sponsorship-rates-2026" className="text-blue-600 hover:text-blue-700 font-medium">
                How Much Should Tech Creators Charge for Sponsorships?
              </Link>.
            </p>
          </section>

          {/* What to leave out */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              What to Leave Out
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <ul className="space-y-4">
                {leaveOut.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="text-red-500 font-bold text-xl">❌</span>
                    <span className="text-gray-700"><strong>{item.title}:</strong> {item.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Tools */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Wrench className="w-8 h-8 text-orange-600 flex-shrink-0" />
              Tools to Build Your Media Kit
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              You do not need a graphic designer. These tools work for a clean, professional media kit.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {tools.map((tool) => (
                <div key={tool.name} className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
                  <p className="text-gray-700 text-sm">{tool.description}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-800">
                Or skip the media kit entirely. An Infoishai profile displays all the same information in a searchable, always-up-to-date format. Brands search for creators by niche, platform, and audience size. Your profile acts as a living media kit that brands find without you sending anything.{' '}
                <Link href="/signup/creator" className="text-blue-600 hover:text-blue-700 font-medium">
                  Create your free profile and let brands find you
                </Link>.
              </p>
            </div>
          </section>

          {/* Keep updated */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <RefreshCw className="w-8 h-8 text-teal-600 flex-shrink-0" />
              Keep Your Media Kit Updated
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              An outdated media kit is worse than no media kit. A brand seeing &quot;15K subscribers&quot; on your PDF when your channel now has 35K subscribers undervalues your work. A brand seeing inflated numbers from a growth spike that corrected loses trust.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Set a monthly reminder. On the first of every month, update your subscriber counts, average views, and engagement rates.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Save the updated PDF and replace the old file in your email templates and link-in-bio.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">If you use an Infoishai profile, update your metrics when they change — brands see current data every time they view your profile.</span>
                </li>
              </ul>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Your media kit is your storefront. Keep the storefront clean, current, and easy to read. The brands will come.
            </p>
          </section>

          {/* Getting Started */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Get Discovered by Tech Brands</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Set your rates with confidence — read{' '}
              <Link href="/blog/tech-creator-sponsorship-rates-2026" className="text-blue-600 hover:text-blue-700 font-medium">
                How Much Should Tech Creators Charge for Sponsorships?
              </Link>
            </p>
            <p className="text-gray-700 leading-relaxed">
              Learn how to land brand deals step by step in{' '}
              <Link href="/blog/tech-creators-guide-how-to-get-brand-deals-2026" className="text-blue-600 hover:text-blue-700 font-medium">
                Tech Creator&apos;s Guide: How to Get Brand Deals in 2026
              </Link>, or{' '}
              <Link href="/signup/creator" className="text-blue-600 hover:text-blue-700 font-medium">create your free profile</Link>{' '}
              on Infoishai.
            </p>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What is a creator media kit?</h3>
                <p className="text-gray-700">
                  A creator media kit is a one-page or two-page PDF document summarising your audience, content, engagement metrics, past brand partnerships, and sponsorship rates. Brands use media kits to evaluate whether a creator fits their campaign. A professional media kit speeds up the partnership process and signals professionalism.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Do tech creators need a media kit?</h3>
                <p className="text-gray-700">
                  Yes. A media kit separates professional creators from hobbyists in the eyes of brand managers. When a brand evaluates 10 creators, the ones with clear media kits get prioritised. Alternatively, a complete Infoishai profile replaces the need for a standalone media kit by displaying all the same information in a searchable format.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 text-center mt-12">
          <h3 className="text-2xl font-bold text-blue-900 mb-4">Skip the PDF — Let Your Profile Do the Work</h3>
          <p className="text-blue-800 mb-6">
            Create your free Infoishai profile with audience stats, content samples, and rates in one searchable place — no design tools required.
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
            <Link href="/blog/tech-creators-guide-how-to-get-brand-deals-2026" className="group bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all">
              <span className="text-sm text-blue-600 font-medium">Strategy</span>
              <h4 className="font-bold text-gray-900 mt-2 text-lg group-hover:text-blue-600 transition-colors">Tech Creator&apos;s Guide: How to Get Brand Deals in 2026</h4>
              <p className="text-gray-600 text-sm mt-2">Build your profile, pitch brands, and land paid sponsorships.</p>
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}
