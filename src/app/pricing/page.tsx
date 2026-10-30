import { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight, CalendarDays } from 'lucide-react'
import { Navigation, Footer } from '@/components/landing'
import { COUNTRY_LANDING_PAGES, PLATFORMS } from '@/utils/constants'

// The URL stays /pricing (it's indexed); the nav calls it "Managed Service".

const TITLE = 'Managed Influencer Marketing Service'
const DESCRIPTION =
  'Let Infoishai run your tech influencer marketing, start to finish. A dedicated account manager handles creator strategy, outreach, campaigns, content, and weekly reports.'
const PAGE_URL = 'https://infoishai.com/pricing'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: `${TITLE} | Infoishai`,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} | Infoishai`,
    description: DESCRIPTION,
  },
  alternates: {
    canonical: PAGE_URL,
  },
}

// Brand booking link (Calendly). Set in the environment; the "Book a call"
// button only shows when it's a valid https URL.
const BOOKING_URL = (() => {
  const raw = process.env.NEXT_PUBLIC_BRAND_BOOKING_URL?.trim()
  return raw && /^https:\/\//.test(raw) ? raw : null
})()

const FEATURES = [
  'Dedicated account manager for your brand',
  'Unlimited creator matching and outreach',
  'Full campaign management across all your product launches',
  'Content strategy, review, and approval coordination',
  'Creator relationship management (re-bookings, long-term deals)',
  'Weekly performance reports and ROI tracking',
  'Priority support with replies within 1 business day',
]

const STEPS = [
  {
    title: 'Intro call',
    description: 'Tell us about your product, your audience, and your upcoming launches.',
  },
  {
    title: 'Strategy and creator shortlist',
    description: 'We plan the campaign and send you a shortlist of matched tech creators to approve.',
  },
  {
    title: 'We run the campaign',
    description: 'We handle offers, contracts, content approvals, and posting with every creator.',
  },
  {
    title: 'Weekly reports and next launch',
    description: 'You get results every week, and we plan the next launch with the creators who performed.',
  },
]

function listNames(names: string[]): string {
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How does pricing work?',
    a: 'Every brand gets a custom quote based on the number of creators and launches you want covered. One invoice covers creator fees and our management fee.',
  },
  {
    q: 'Which platforms do you cover?',
    a: `${listNames(PLATFORMS.map((p) => p.name))}.`,
  },
  {
    q: 'Which countries do you cover?',
    a: `Creators in our ${COUNTRY_LANDING_PAGES.length} markets: ${listNames(COUNTRY_LANDING_PAGES.map((c) => c.name))}.`,
  },
  {
    q: 'How fast do campaigns start?',
    a: 'You get a creator shortlist within 48 hours of the strategy call. Most campaigns go live in 2 to 4 weeks, depending on creator schedules and content review.',
  },
  {
    q: 'Do I see progress while a campaign runs?',
    a: 'Yes. You get a live progress link for every campaign and a weekly report with results.',
  },
]

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      name: 'Dedicated Marketing Partner',
      serviceType: 'Managed influencer marketing',
      description: DESCRIPTION,
      url: PAGE_URL,
      provider: { '@type': 'Organization', name: 'Infoishai', url: 'https://infoishai.com' },
      areaServed: COUNTRY_LANDING_PAGES.map((c) => c.name),
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ],
}

export default function ManagedServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <Navigation />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-pink/10 via-white to-brand-purple/10 pb-16 pt-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Let us run your influencer marketing, start to finish
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            We become your influencer marketing team. You focus on your product. We handle creator
            strategy, outreach, campaigns, content, and reporting across all your launches.
          </p>
        </div>
      </section>

      {/* Offer */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border-2 border-brand-pink bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900">Dedicated Marketing Partner</h2>
            <p className="mb-6 mt-2 text-3xl font-bold text-gray-900">Let&apos;s Talk</p>

            <ul className="mb-8 space-y-3">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-gray-700">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-purple" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row">
              {BOOKING_URL && (
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-pink to-brand-purple px-5 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-brand-pink/25"
                >
                  <CalendarDays className="h-4 w-4" />
                  Book a call
                </a>
              )}
              <Link
                href="/contact"
                className={
                  BOOKING_URL
                    ? 'inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-brand-purple px-5 py-3 font-semibold text-brand-purple-dark transition-all hover:bg-brand-pink/10'
                    : 'inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-pink to-brand-purple px-5 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-brand-pink/25'
                }
              >
                Contact Us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 md:text-3xl">How it works</h2>
          <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-gray-200 bg-white p-6">
                <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-brand-pink to-brand-purple text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mb-2 font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 md:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQS.map((item) => (
              <div key={item.q} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                <h3 className="mb-2 font-semibold text-gray-900">{item.q}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Self-serve option */}
      <section className="pb-20">
        <p className="px-4 text-center text-sm text-gray-600">
          Prefer to run campaigns yourself?{' '}
          <Link href="/signup/brand" className="font-medium text-brand-purple-dark hover:underline">
            Infoishai is free for brands.
          </Link>
        </p>
      </section>

      <Footer />
    </div>
  )
}
