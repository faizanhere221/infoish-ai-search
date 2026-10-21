// src/app/terms/page.tsx

import { Metadata } from 'next'
import Header from '@/components/header'

export const metadata: Metadata = {
  title: { absolute: 'Terms of Service | Infoishai' },
  description: 'The rules and conditions for using Infoishai — account eligibility, creator and brand obligations, platform fees, and usage policies.',
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
          <p className="text-gray-600 mb-8">Last updated: October 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using Infoishai (the "Service"), you agree to be bound by these
              Terms of Service ("Terms"). If you disagree with any part of these Terms, you may
              not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              Infoishai is a free B2B marketplace that connects tech brands with verified tech
              content creators across 9 countries (US, UK, Canada, India, Pakistan, Australia,
              Germany, Netherlands, Singapore). Brands can search creator profiles, message
              creators directly, send deal proposals, and post campaigns that creators apply to.
              Creators can build a profile, set their own rates, and get discovered by brands.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Eligibility</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You must be at least 18 years old and able to form a binding contract to create an account</li>
              <li>You must provide accurate information when registering as a creator or a brand</li>
              <li>You are responsible for keeping your login credentials confidential and for all activity under your account</li>
              <li>One account per person or business entity, unless we agree otherwise in writing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Free to Use</h2>
            <p className="text-gray-700 leading-relaxed">
              Creating an account, searching the creator directory, messaging, and posting
              campaigns are free for both brands and creators. There are no subscription fees to
              use the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Deals and Platform Fee</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>When a brand and creator agree on a sponsorship and the brand sends a deal, Infoishai applies a 10% platform fee on the agreed deal amount</li>
              <li>The creator&apos;s payout is the deal amount minus the platform fee</li>
              <li>Both parties can see the breakdown (deal amount, platform fee, and creator payout) before the deal is confirmed</li>
              <li>Deal terms, deliverables, deadlines, and revision limits are agreed between the brand and creator directly on the platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Terms</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Payment for deals is handled outside of automated card processing; brands and creators arrange payment directly (for example, bank transfer), and a brand may be asked to provide proof of payment</li>
              <li>Infoishai is not a party to the payment itself and does not hold or transmit funds between brands and creators</li>
              <li>Disputes over payment or deliverables should first be raised directly between the two parties through platform messaging; contact us if you need help resolving a dispute</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">By using the Service, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate information in your profile, deals, and campaigns</li>
              <li>Use the Service for lawful purposes only</li>
              <li>Respect the intellectual property rights of others</li>
              <li>Not misrepresent your identity, follower counts, or engagement metrics</li>
              <li>Not share your account credentials with others</li>
              <li>Not scrape, bulk-extract, or resell data from the platform</li>
              <li>Honor the terms of deals and campaigns you agree to</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content and Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              You retain ownership of the content you upload (profile information, portfolio
              items, messages). By posting content, you grant Infoishai a license to display it
              on the platform for the purpose of operating the Service. The Infoishai name, logo,
              and platform itself are owned by Infoishai and protected by applicable intellectual
              property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Accuracy</h2>
            <p className="text-gray-700 leading-relaxed">
              While we encourage creators to keep their profiles accurate and up to date, we
              cannot guarantee the completeness or accuracy of all profile data. Brands should use
              reasonable diligence (e.g. our free profile-analysis tools) before entering into a
              deal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, Infoishai is not liable for indirect,
              incidental, special, or consequential damages arising from your use of the Service,
              including disputes, losses, or damages arising from deals or campaigns arranged
              between brands and creators.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may suspend or terminate your account for breach of these Terms, fraudulent
              activity, or misuse of the platform. You may stop using the Service and request
              account deletion at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to These Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time. Material changes will be reflected by
              updating the "Last updated" date at the top of this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of Pakistan, without regard to conflict-of-law
              principles, except where local consumer-protection law in your country requires
              otherwise.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these Terms of Service, contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">Email: support@infoishai.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
