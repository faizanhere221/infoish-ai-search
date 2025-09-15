'use client'

import Header from '@/components/header'
import { Search, MessageCircle, Book, Users } from 'lucide-react'



export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600">Get help with using Pakistani Influencer Search</p>
        </div>

       

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">How accurate is the influencer data?</h3>
              <p className="text-gray-600">We update our database regularly with the latest metrics from social media platforms.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Can I contact influencers directly through the platform?</h3>
              <p className="text-gray-600">We provide contact information when available. You'll need to reach out to influencers directly.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Is there a limit on searches?</h3>
              <p className="text-gray-600">Free users get 3 searches. Upgrade to our paid plan for unlimited searches.</p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center bg-blue-50 rounded-xl p-8">
          <h3 className="text-xl font-semibold mb-4">Still Need Help?</h3>
          <p className="text-gray-600 mb-6">Contact our support team for personalized assistance</p>
          <a 
            href="/contact"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}