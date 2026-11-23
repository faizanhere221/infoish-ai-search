// src/app/privacy/page.tsx

import { Metadata } from 'next'
import Header from '@/components/header'
import { GOOGLE_PRIVACY_URL, LEGAL_OPERATOR, YOUTUBE_TERMS_URL } from '@/config/legal'

export const metadata: Metadata = {
  title: { absolute: 'Privacy Policy | Infoishai' },
  description:
    'How Infoishai collects, uses, and protects personal data, including YouTube API data and business outreach contacts.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://infoishai.com/privacy',
  },
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-pink hover:underline">
      {children}
    </a>
  )
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: November 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Infoishai (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) runs a free marketplace connecting B2B
              tech brands with verified tech content creators in 9 countries. We also run a managed
              service, where we plan and run creator campaigns for brands. This Privacy Policy
              explains what information we collect, why we collect it, and how we handle it. It
              covers people with an Infoishai account and people we contact for business outreach.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">Infoishai is operated by {LEGAL_OPERATOR}.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Account information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Name, email address, and a hashed password. We never store your password in plain text.</li>
              <li>Account type (creator or brand) and company or creator profile details</li>
              <li>For creators: social media handles, follower counts, niches, rates, and portfolio links you add</li>
              <li>For brands: company name, website, industry, and contact details</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">Deal and payment information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Deal and campaign details you create or apply to (titles, descriptions, amounts, deliverables)</li>
              <li>Messages between brands and creators on the platform</li>
              <li>
                Self-serve deals are paid directly between brand and creator. If a brand uploads
                proof of payment, we keep the file with the deal record.
              </li>
              <li>
                For deals Infoishai manages, we keep payment records (amounts, dates, and Wise or
                Payoneer references) for accounting.
              </li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">Technical information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>IP address, used for rate limits on login, signup, and contact forms, and to prevent abuse</li>
              <li>Browser and device information and usage analytics (see &quot;Analytics and Cookies&quot; below)</li>
              <li>Error reports when something on the site breaks (see Sentry under &quot;Where Your Data Is Stored&quot;)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">Public data about creators and brands</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Public YouTube channel data, collected through YouTube API Services (see &quot;YouTube API Services&quot; below)</li>
              <li>Business contact details creators and companies publish themselves, for outreach (see &quot;Outreach Contacts&quot; below)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Run the marketplace: creator discovery, messaging, deals, campaigns, and applications</li>
              <li>Sign you in and keep your account secure</li>
              <li>Verify creator profiles and record deal and payment confirmations</li>
              <li>Send account notifications (new messages, deal updates, campaign activity)</li>
              <li>Answer support requests sent through our contact form</li>
              <li>Run managed deals: invoice brands, pay creators, and keep accounting records</li>
              <li>Find creators and brands for business outreach</li>
              <li>Understand overall site usage to improve it (see &quot;Analytics and Cookies&quot; below)</li>
              <li>Find and fix errors on the site</li>
              <li>Meet legal obligations and protect the platform against fraud or abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Where Your Data Is Stored</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Infoishai runs on the following providers. Each one processes data for us under its
              own security and privacy commitments:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Supabase:</strong> our database and file storage. Account, profile, deal, message, and outreach data is stored in a Supabase-hosted Postgres database.</li>
              <li><strong>Vercel:</strong> hosts the Infoishai website and application.</li>
              <li><strong>Google Analytics 4:</strong> aggregate, anonymized usage analytics (see below).</li>
              <li><strong>Sentry:</strong> error tracking. When an error happens, Sentry receives technical details such as the page, the browser, and the request involved. For signed-in users, Sentry sometimes records a short replay of the page around the error, with all text, form inputs, and images hidden.</li>
              <li><strong>Wise and Payoneer:</strong> payouts to creators on deals Infoishai manages. They receive the payout amount and the creator&apos;s payout details.</li>
              <li><strong>YouTube API Services:</strong> the source of public YouTube channel data (see &quot;YouTube API Services&quot; below).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Analytics and Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use two kinds of cookies:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Necessary:</strong> an <code>auth_token</code> cookie keeps you signed in. The site needs it to work, so it is always on.</li>
              <li><strong>Analytics:</strong> Google Analytics 4 cookies (<code>_ga</code>, <code>_ga_*</code>, <code>_gid</code>) show us how people use the site. They load only if you accept analytics cookies in the cookie banner. You are free to decline them and to change your choice at any time.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">YouTube API Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Infoishai uses YouTube API Services to find tech creators for our marketplace and our
              managed service. YouTube&apos;s terms and Google&apos;s privacy policy also apply to this data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><ExternalLink href={YOUTUBE_TERMS_URL}>YouTube Terms of Service</ExternalLink></li>
              <li><ExternalLink href={GOOGLE_PRIVACY_URL}>Google Privacy Policy</ExternalLink></li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">What we get from the API</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We get public channel data only:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Channel ID, name, handle, and description</li>
              <li>Country</li>
              <li>Subscriber, view, and video counts</li>
              <li>Recent video titles, publish dates, and view, like, and comment counts</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">What we do not collect</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>We do not use the API to collect email addresses or other contact details.</li>
              <li>We do not use YouTube sign-in (OAuth), and we never see private account data.</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">How long we keep it</h3>
            <p className="text-gray-700 leading-relaxed">
              We refresh YouTube API data or delete it within 30 days of fetching it. When a channel
              is deleted, made private, or terminated, we delete its data at the next refresh, within
              30 days.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">Deletion requests</h3>
            <p className="text-gray-700 leading-relaxed">
              To have your YouTube channel data deleted, email{' '}
              <a href="mailto:support@infoishai.com" className="text-brand-pink hover:underline">support@infoishai.com</a>.
              We handle deletion requests within 7 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Outreach Contacts</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Infoishai contacts creators and brands to invite them to the marketplace or to work on
              a campaign. This section applies to you if we contacted you and you have no Infoishai
              account.
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Source:</strong> contact details creators and companies publish themselves, such as on their website, link pages, and business profiles, and B2B contact databases such as Apollo. We collect these separately from YouTube API Services. Before November 2026, some contact details came from public YouTube channel descriptions. We keep these only for people we have already contacted.</li>
              <li><strong>What we keep:</strong> your name, business email, role, company, public profile links, and notes on our conversation with you.</li>
              <li><strong>Purpose:</strong> B2B outreach about creator partnerships and the Infoishai marketplace. Under UK and EU data protection law, our legal basis is our legitimate interest in business outreach.</li>
              <li><strong>Sharing:</strong> we never sell your details or share them with other companies for their own marketing.</li>
              <li><strong>Opt out:</strong> reply to our email and ask us to stop. We stop contacting you.</li>
              <li><strong>Deletion:</strong> email support@infoishai.com and we delete your details.</li>
              <li><strong>How long we keep it:</strong> up to 12 months after our last contact with you, then we delete it. Any YouTube data in these records follows the 30-day rule in &quot;YouTube API Services&quot; above. If you opt out, you stay on our do-not-contact list so we never email you again. For this list we keep your email address, and the profile link or company domain we used to contact you.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We share it only:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Between the brand and creator in a specific deal or campaign application (for example, the contact and deal details needed to work together)</li>
              <li>With the providers listed above, only to run Infoishai</li>
              <li>When the law requires it, or to protect the rights, safety, or property of Infoishai or our users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Account and deal data:</strong> as long as your account is active, plus a reasonable period afterward for legal, accounting, and dispute needs. You are free to request deletion of your account and personal data at any time (see &quot;Your Rights&quot; below).</li>
              <li><strong>Payment records on managed deals:</strong> as long as accounting and tax law requires.</li>
              <li><strong>YouTube API data:</strong> refreshed or deleted within 30 days (see &quot;YouTube API Services&quot;).</li>
              <li><strong>Outreach contacts:</strong> up to 12 months after our last contact (see &quot;Outreach Contacts&quot;).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              Passwords are hashed and never stored in plain text. Creator payout details are
              encrypted at rest. Every request to the platform is authenticated and checked for
              permission. We use reasonable technical and organizational measures to protect your
              information. No method of sending or storing data over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on where you live, you have the rights below. UK and EU data protection law
              covers people in the UK, Germany, and the Netherlands. These rights also apply to
              outreach contacts. You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to or restrict certain processing (for example, analytics cookies or outreach)</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Lodge a complaint with your local data protection authority</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To use any of these rights, contact us using the details below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Infoishai is a B2B platform for business and professional use. It is not for
              children. We do not knowingly collect personal information from anyone under 18.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We update this Privacy Policy from time to time. When we make a material change, we
              update the &quot;Last updated&quot; date at the top of this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or want to use your data rights,
              contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">Infoishai is operated by {LEGAL_OPERATOR}.</p>
              <p className="text-gray-700">Email: support@infoishai.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
