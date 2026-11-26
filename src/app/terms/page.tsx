// src/app/terms/page.tsx

import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/header'
import { LEGAL_COMPANY_NAME, LEGAL_LAST_UPDATED, LEGAL_OPERATOR, YOUTUBE_TERMS_URL } from '@/config/legal'

export const metadata: Metadata = {
  title: { absolute: 'Terms of Service | Infoishai' },
  description:
    'The rules for using Infoishai: account eligibility, creator and brand obligations, fees on managed deals, YouTube API Services, and usage policies.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://infoishai.com/terms',
  },
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {LEGAL_LAST_UPDATED}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By using Infoishai (the &quot;Service&quot;), you agree to these Terms of Service
              (&quot;Terms&quot;). If you do not agree with any part of these Terms, do not use the
              Service. Infoishai is operated by {LEGAL_OPERATOR}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              Infoishai is a free B2B marketplace connecting tech brands with verified tech content
              creators in 9 countries (US, UK, Canada, India, Pakistan, Australia, Germany,
              Netherlands, Singapore). Brands search creator profiles, message creators directly,
              send deal proposals, and post campaigns for creators to apply to. Creators build a
              profile, set their own rates, and get found by brands. Infoishai also runs a managed
              service, where we bring or manage paid deals for brands (see &quot;Managed Deals&quot;
              below).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Eligibility</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You must be at least 18 years old and able to form a binding contract to create an account</li>
              <li>You must give accurate information when registering as a creator or a brand</li>
              <li>You are responsible for keeping your login details confidential and for all activity under your account</li>
              <li>One account per person or business, unless we agree otherwise in writing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Free to Use</h2>
            <p className="text-gray-700 leading-relaxed">
              Creating an account, searching the creator directory, messaging, sending deal
              proposals, and posting campaigns are free. The self-serve platform is free for brands
              and creators. There are no platform fees on self-serve deals. Infoishai charges fees
              only on managed deals (see &quot;Managed Deals&quot; below).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Self-Serve Deals</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>On self-serve deals, Infoishai charges no fee. The creator receives the full agreed deal amount.</li>
              <li>The brand and creator agree deal terms, deliverables, deadlines, and revision limits directly on the platform.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment on Self-Serve Deals</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Payments are made directly between brand and creator. Infoishai keeps the record.</li>
              <li>Brands and creators arrange payment themselves, for example by bank transfer. If a brand uploads proof of payment, it stays with the deal record.</li>
              <li>Infoishai is not a party to the payment and never holds or moves funds on self-serve deals.</li>
              <li>Raise any dispute over payment or deliverables with the other party first, through platform messaging. Contact us if you need help resolving a dispute.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managed Deals</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Any paid deal Infoishai brings to a creator or brand runs as a managed deal. These
              rules apply only to managed deals:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Infoishai charges fees only on managed deals.</li>
              <li>The brand pays the creator fee plus a 10% Infoishai fee.</li>
              <li>Infoishai also keeps 10% of the creator fee at payout.</li>
              <li>Example: for a creator fee of $1,000, the brand pays $1,100 and the creator receives $900.</li>
              <li>The brand pays {LEGAL_COMPANY_NAME}, and {LEGAL_COMPANY_NAME} pays the creator within 3 business days of each brand payment, by bank transfer, Wise, or Payoneer.</li>
              <li>Fees and amounts are confirmed in writing before work starts.</li>
              <li>No cryptocurrency. We do not accept or send payments in cryptocurrency.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">YouTube API Services</h2>
            <p className="text-gray-700 leading-relaxed">
              Infoishai uses YouTube API Services. By using Infoishai, you agree to be bound by the{' '}
              <a
                href={YOUTUBE_TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-pink hover:underline"
              >
                YouTube Terms of Service
              </a>
              . Our{' '}
              <Link href="/privacy" className="text-brand-pink hover:underline">
                Privacy Policy
              </Link>{' '}
              explains how we handle YouTube data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">By using the Service, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Give accurate information in your profile, deals, and campaigns</li>
              <li>Use the Service for lawful purposes only</li>
              <li>Respect the intellectual property rights of others</li>
              <li>Not misrepresent your identity, follower counts, or engagement metrics</li>
              <li>Not share your account login details with others</li>
              <li>Not scrape, bulk-extract, or resell data from the platform</li>
              <li>Honor the terms of deals and campaigns you agree to</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content and Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              You keep ownership of the content you upload (profile information, portfolio items,
              messages). By posting content, you give Infoishai a license to display it on the
              platform to run the Service. The Infoishai name, logo, and platform belong to
              Infoishai and are protected by intellectual property law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Accuracy</h2>
            <p className="text-gray-700 leading-relaxed">
              We ask creators to keep their profiles accurate and up to date, but we do not
              guarantee the completeness or accuracy of all profile data. Brands should check
              profiles with reasonable care before agreeing to a deal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent the law allows, Infoishai is not liable for indirect,
              incidental, special, or consequential damages from your use of the Service. This
              includes disputes, losses, or damages from deals or campaigns arranged between brands
              and creators.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We have the right to suspend or close your account for a breach of these Terms,
              fraud, or misuse of the platform. You are free to stop using the Service and request
              account deletion at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to These Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We update these Terms from time to time. When we make a material change, we update the
              &quot;Last updated&quot; date at the top of this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of England and Wales, without regard to
              conflict-of-law principles. The courts of England and Wales have jurisdiction over any
              dispute about these Terms or the Service. Both rules apply except where local
              consumer-protection law in your country requires otherwise.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these Terms of Service, contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">Infoishai is operated by {LEGAL_OPERATOR}</p>
              <p className="text-gray-700">Email: support@infoishai.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
