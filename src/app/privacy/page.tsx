// src/app/privacy/page.tsx

import { Metadata } from 'next'
import Header from '@/components/header'

export const metadata: Metadata = {
  title: { absolute: 'Privacy Policy | Infoishai' },
  description: 'How Infoishai collects, uses, and protects your personal data as a free B2B tech influencer marketplace.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://infoishai.com/privacy',
  },
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: October 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Infoishai ("we," "our," or "us") operates a free marketplace that connects B2B tech
              brands with verified tech content creators across 9 countries. This Privacy Policy
              explains what information we collect, why we collect it, and how it&apos;s handled.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Account information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Name, email address, and a hashed password (we never store your password in plain text)</li>
              <li>Account type (creator or brand) and company or creator profile details</li>
              <li>For creators: social media handles, follower counts, niches, rates, and portfolio links you add</li>
              <li>For brands: company name, website, industry, and contact details</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">Deal and payment information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Deal and campaign details you create or apply to (titles, descriptions, amounts, deliverables)</li>
              <li>Messages exchanged between brands and creators through the platform</li>
              <li>Where a manual bank transfer is used to fund a deal, the payment reference and any proof-of-payment file you upload</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">Technical information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>IP address (used to apply rate limits on login, signup, and contact forms, and prevent abuse)</li>
              <li>Browser/device information and usage analytics (see "Analytics and cookies" below)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Operate the marketplace: creator discovery, messaging, deals, campaigns, and applications</li>
              <li>Authenticate you and keep your account secure</li>
              <li>Verify creator profiles and process deal/payment confirmations</li>
              <li>Send account-related notifications (new messages, deal updates, campaign activity)</li>
              <li>Respond to support requests submitted through our contact form</li>
              <li>Understand aggregate usage of the site to improve it (see Analytics below)</li>
              <li>Comply with legal obligations and protect the platform against fraud or abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Where Your Data Is Stored</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Infoishai is built on the following infrastructure providers, each of whom processes
              data on our behalf under their own security and privacy commitments:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Supabase</strong> — our database and file storage provider. Account, profile, deal, and message data is stored in a Supabase-hosted Postgres database.</li>
              <li><strong>Vercel</strong> — hosts the Infoishai website and application.</li>
              <li><strong>Google Analytics 4</strong> — provides aggregate, anonymized usage analytics (see below).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Analytics and Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use two categories of cookies:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Necessary:</strong> an <code>auth_token</code> cookie that keeps you signed in. This is required for the site to function and cannot be disabled.</li>
              <li><strong>Analytics:</strong> Google Analytics 4 cookies (<code>_ga</code>, <code>_ga_*</code>, <code>_gid</code>) that help us understand how the site is used. These only load if you accept analytics cookies in the cookie banner — you can decline them, and you can change your choice at any time.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We share information only:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Between the brand and creator involved in a specific deal or campaign application (e.g. contact and deal details needed to collaborate)</li>
              <li>With the infrastructure providers listed above, strictly to operate the platform</li>
              <li>When required by law, legal process, or to protect the rights, safety, or property of Infoishai or our users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We keep account and deal data for as long as your account is active, and for a
              reasonable period afterward to meet legal, accounting, and dispute-resolution needs.
              You can request deletion of your account and associated personal data at any time
              (see "Your Rights" below).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              Passwords are hashed (never stored in plain text). Access to the platform is
              authenticated and authorization-checked on every request. We apply reasonable
              technical and organizational measures to protect your information, but no method of
              transmission or storage over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on where you&apos;re located — including under UK/EU data protection law,
              which applies to users in the UK, Germany, and the Netherlands — you have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to or restrict certain processing (e.g. analytics cookies)</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Lodge a complaint with your local data protection authority</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise any of these rights, contact us using the details below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Infoishai is a B2B platform intended for business and professional use and is not
              directed at children. We do not knowingly collect personal information from anyone
              under 18.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be
              reflected by updating the "Last updated" date at the top of this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or want to exercise your data
              rights, contact us at:
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
