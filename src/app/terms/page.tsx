// src/app/terms/page.tsx

import Header from '@/components/header'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Pakistani Influencer Search ("Service"), you agree to be bound 
              by these Terms of Service ("Terms"). If you disagree with any part of these terms, 
              you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              Pakistani Influencer Search is an AI-powered platform that helps businesses and 
              brands discover and connect with Pakistani influencers and content creators. 
              Our database includes 1,800+ verified creator profiles across various social media platforms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Plans</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">Free Plan</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>15 searches per month</li>
              <li>Basic influencer information</li>
              <li>Standard support</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Premium Plan (PKR 2,999/month)</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Unlimited searches</li>
              <li>Advanced filters and analytics</li>
              <li>Priority support</li>
              <li>Export functionality</li>
              <li>API access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">By using our Service, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Use the Service for lawful purposes only</li>
              <li>Respect intellectual property rights</li>
              <li>Not attempt to circumvent usage limits</li>
              <li>Not share account credentials with others</li>
              <li>Not use automated tools to scrape our data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Terms</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Premium subscriptions are billed monthly in advance</li>
              <li>All fees are non-refundable unless required by law</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
              <li>Failed payments may result in service suspension</li>
              <li>You may cancel your subscription at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service and its original content, features, and functionality are owned by 
              Pakistani Influencer Search and are protected by international copyright, 
              trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Accuracy</h2>
            <p className="text-gray-700 leading-relaxed">
              While we strive to provide accurate and up-to-date influencer information, 
              we cannot guarantee the completeness or accuracy of all data. Users should 
              verify information independently before making business decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              In no event shall Pakistani Influencer Search be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including without 
              limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account and access to the Service immediately, 
              without prior notice or liability, for any reason, including breach of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of 
              Pakistan, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">Email: legal@pakistaniinfluencersearch.com</p>
              <p className="text-gray-700">Address: Karachi, Pakistan</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}