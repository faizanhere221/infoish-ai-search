// src/app/about/page.tsx

import Header from '@/components/header'
import { Users, Search, BarChart3, Shield, Target, Zap } from 'lucide-react'
import TeamSection from '@/components/TeamSection'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header isSearchPage={false} />
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            About Pakistani Influencer Search
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            We're revolutionizing how Pakistani businesses connect with content creators. 
            Our AI-powered platform makes influencer marketing accessible, data-driven, and results-focused.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              To empower Pakistani businesses of all sizes to harness the power of influencer marketing. 
              We believe every brand deserves access to the right creators who can authentically represent 
              their values and reach their target audience.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              By providing comprehensive data, advanced search capabilities, and direct access to 1,800+ 
              verified Pakistani influencers, we're democratizing influencer marketing in Pakistan.
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-12">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">1,800+</div>
                <div className="text-gray-700">Verified Influencers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
                <div className="text-gray-700">Happy Businesses</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">50M+</div>
                <div className="text-gray-700">Total Reach</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">15+</div>
                <div className="text-gray-700">Categories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Transparency</h3>
              <p className="text-gray-600 leading-relaxed">
                We provide accurate, up-to-date data about every influencer. No hidden metrics, 
                no inflated numbers - just honest insights to help you make informed decisions.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Precision</h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI algorithms help you find the perfect match for your brand, 
                considering audience demographics, engagement rates, and content quality.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                We continuously improve our platform with cutting-edge features like YouTube analytics, 
                engagement predictions, and automated campaign suggestions.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-2xl shadow-xl p-12 mb-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-8">Our Story</h2>
            <div className="prose prose-lg mx-auto text-gray-700">
              <p className="text-lg leading-relaxed mb-6">
                Pakistani Influencer Search was born from a simple frustration: finding the right influencers 
                for Pakistani brands was incredibly difficult and time-consuming. Businesses were spending weeks 
                manually researching creators, often missing perfect matches or working with inflated metrics.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                As a startup founder in Pakistan, I experienced this pain firsthand. After launching several 
                successful campaigns, I realized the need for a centralized, data-driven platform that could 
                democratize influencer marketing for Pakistani businesses.
              </p>
              <p className="text-lg leading-relaxed">
                Today, we've built Pakistan's most comprehensive influencer database, powered by AI and 
                trusted by 100+ businesses. We're just getting started on our mission to transform how 
                brands and creators connect in Pakistan.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
              <Search className="w-12 h-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Search</h3>
              <p className="text-gray-600">
                Our advanced algorithms analyze content, engagement patterns, and audience data to find 
                your perfect influencer matches in seconds.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8">
              <BarChart3 className="w-12 h-12 text-green-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Comprehensive Analytics</h3>
              <p className="text-gray-600">
                Get detailed insights including YouTube analytics, engagement rates, audience demographics, 
                and historical performance data.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
              <Users className="w-12 h-12 text-purple-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Verified Database</h3>
              <p className="text-gray-600">
                Every influencer in our database is manually verified. We ensure accurate follower counts, 
                contact information, and profile authenticity.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8">
              <Target className="w-12 h-12 text-orange-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Multi-Platform Coverage</h3>
              <p className="text-gray-600">
                Find influencers across Instagram, YouTube, TikTok, and other platforms. 
                Compare cross-platform performance in one dashboard.
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8">
              <Shield className="w-12 h-12 text-teal-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Direct Contact</h3>
              <p className="text-gray-600">
                Skip the middlemen. Get direct email contacts and social media handles to connect 
                with influencers instantly.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-8">
              <Zap className="w-12 h-12 text-yellow-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Regular Updates</h3>
              <p className="text-gray-600">
                Our database is updated weekly with new creators and fresh metrics. 
                You always get the most current information.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <TeamSection />

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of Pakistani businesses already using our platform to find perfect influencer matches
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/login" 
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-8 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Start Free Trial
            </a>
            <a 
              href="/contact" 
              className="border-2 border-green-600 text-green-600 py-3 px-8 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}