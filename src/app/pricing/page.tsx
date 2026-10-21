import { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { Navigation, Footer } from '@/components/landing'

export const metadata: Metadata = {
  title: 'Pricing — Influencer Marketing Services',
  description: 'Done-for-you tech influencer marketing services starting at $50. Creator matching, campaign setup, full management, and monthly retainers for tech brands.',
  openGraph: {
    title: 'Pricing — Influencer Marketing Services | Infoishai',
    description: 'Done-for-you tech influencer marketing services starting at $50. Creator matching, campaign setup, full management, and monthly retainers for tech brands.',
    url: 'https://infoishai.com/pricing',
    siteName: 'Infoishai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Influencer Marketing Services | Infoishai',
    description: 'Done-for-you tech influencer marketing services starting at $50. Creator matching, campaign setup, full management, and monthly retainers for tech brands.',
  },
  alternates: {
    canonical: 'https://infoishai.com/pricing',
  },
}

interface Tier {
  name: string
  price: string
  unit: string
  description: string
  features: string[]
  popular?: boolean
  ctaLabel?: string
}

const TIERS: Tier[] = [
  {
    name: 'Creator Matching',
    price: '$50–$75',
    unit: 'per project',
    description: 'Get 3–5 matched tech creators with audience data, engagement rates, and pricing. Delivered within 48 hours.',
    features: [
      'Creators matched to your niche, budget, and target audience',
      'Full profile breakdown: audience demographics, engagement rate',
      'Creator rate cards included',
      'Delivered as a ready-to-use shortlist',
    ],
  },
  {
    name: 'Campaign Setup',
    price: '$100–$150',
    unit: 'per campaign',
    description: 'We find the right creators, handle outreach, negotiate rates, and deliver a ready-to-go campaign brief.',
    features: [
      'Everything in Creator Matching',
      'Direct outreach to creators on your behalf',
      'Rate negotiation',
      'Campaign brief delivered to the creator',
    ],
  },
  {
    name: 'Full Campaign Management',
    price: '$150–$250',
    unit: 'per campaign',
    description: 'End-to-end campaign management. We handle matching, outreach, negotiation, content review, and reporting.',
    features: [
      'Everything in Campaign Setup',
      'Content draft review and feedback coordination',
      'Deliverable tracking and deadline management',
      'Post-campaign performance report',
    ],
    popular: true,
  },
  {
    name: 'Dedicated Marketing Partner',
    price: 'Let’s Talk',
    unit: '',
    description: 'We become your influencer marketing team. You focus on your product. We handle creator strategy, outreach, campaigns, content, and reporting across all your launches.',
    features: [
      'Dedicated account manager for your brand',
      'Unlimited creator matching and outreach',
      'Full campaign management across all your product launches',
      'Content strategy, review, and approval coordination',
      'Creator relationship management (re-bookings, long-term deals)',
      'Weekly performance reports and ROI tracking',
      'Priority support with under 6 hour response time',
    ],
    ctaLabel: 'Contact Us',
  },
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do payments work?',
    a: 'You pay for the service upfront. Creator fees are separate and paid directly to the creator. We do not take commission on creator payments.',
  },
  {
    q: 'What if I am not happy with the creator matches?',
    a: 'We will redo the matching at no extra charge. If we still don’t find a fit, you get a full refund.',
  },
  {
    q: 'How fast do you deliver?',
    a: 'Creator Matching: 48 hours. Campaign Setup: 3–5 business days. Full Campaign Management: timeline depends on campaign scope, typically 2–4 weeks.',
  },
  {
    q: 'Do I need an Infoishai account?',
    a: 'Yes, a free account is required so you get access to creator profiles, messaging, and campaign tracking.',
  },
  {
    q: 'What tech niches do you cover?',
    a: 'AI, SaaS, developer tools, cloud infrastructure, cybersecurity, hardware, fintech, and more. If it is in tech, we cover it.',
  },
]

function PricingCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl bg-white p-6 ${
        tier.popular
          ? 'border-2 border-brand-pink shadow-xl'
          : 'border border-gray-200 shadow-sm'
      }`}
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-brand-pink to-brand-purple px-3 py-1 text-xs font-semibold text-white shadow-md">
          Most Popular
        </span>
      )}

      <h2 className="text-lg font-bold text-gray-900">{tier.name}</h2>
      <div className="mt-2 mb-3">
        <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
        {tier.unit && <span className="ml-1.5 text-sm text-gray-500">{tier.unit}</span>}
      </div>
      <p className="text-sm text-gray-600 mb-5">{tier.description}</p>

      <ul className="flex-1 space-y-2.5 mb-6">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-purple" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/contact"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-pink to-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-brand-pink/25"
      >
        {tier.ctaLabel ?? 'Get Started'}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-pink/10 via-white to-brand-purple/10 pt-32 pb-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Influencer Marketing Services for Tech Brands
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            The marketplace is free. When you need hands-on help finding creators, running campaigns, or managing deliverables, pick a service below.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => (
              <PricingCard key={tier.name} tier={tier} />
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace is always free */}
      <section className="pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="mx-auto mb-5 max-w-2xl text-gray-700">
              Looking for a self-service option? Browse verified tech creators and run campaigns yourself. No account fees, no commissions, no catches.
            </p>
            <Link
              href="/creators"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-brand-purple px-5 py-2.5 font-semibold text-brand-purple-dark transition-all hover:bg-brand-pink/10"
            >
              Browse Creators for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20">
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

      <Footer />
    </div>
  )
}
