// src/app/about/page.tsx

import Header from '@/components/header'
import { Users, Search, BarChart3, Shield, Target, Zap } from 'lucide-react'
import TeamSection from '@/components/TeamSection'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header isSearchPage={false} />
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
            About{' '}
            <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
              Infoish
            </span>
          </h1>
          <p className="text-xl text-black/70 max-w-4xl mx-auto leading-relaxed">
            We're revolutionizing how Pakistani businesses connect with content creators. 
            Our AI-powered platform makes influencer marketing accessible, data-driven, and results-focused.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-black mb-6">Our Mission</h2>
            <p className="text-lg text-black/80 mb-6 leading-relaxed">
              To empower Pakistani businesses of all sizes to harness the power of influencer marketing. 
              We believe every brand deserves access to the right creators who can authentically represent 
              their values and reach their target audience.
            </p>
            <p className="text-lg text-black/80 leading-relaxed">
              By providing comprehensive data, advanced search capabilities, and direct access to 1,800+ 
              verified Pakistani influencers, we're democratizing influencer marketing in Pakistan.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-green-500/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-green-500 mb-2">1,800+</div>
                <div className="text-black/70">Verified Influencers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500 mb-2">100+</div>
                <div className="text-black/70">Happy Businesses</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500 mb-2">50M+</div>
                <div className="text-black/70">Total Reach</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500 mb-2">15+</div>
                <div className="text-black/70">Categories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-black mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl text-center border border-black/10">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Transparency</h3>
              <p className="text-black/70 leading-relaxed">
                We provide accurate, up-to-date data about every influencer. No hidden metrics, 
                no inflated numbers - just honest insights to help you make informed decisions.
              </p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl text-center border border-black/10">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Precision</h3>
              <p className="text-black/70 leading-relaxed">
                Our advanced AI algorithms help you find the perfect match for your brand, 
                considering audience demographics, engagement rates, and content quality.
              </p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl text-center border border-black/10">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Innovation</h3>
              <p className="text-black/70 leading-relaxed">
                We continuously improve our platform with cutting-edge features like YouTube analytics, 
                engagement predictions, and automated campaign suggestions.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-20 border border-black/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-black mb-8">Our Story</h2>
            <div className="prose prose-lg mx-auto text-black/80">
              <p className="text-lg leading-relaxed mb-6">
                Infoish was born from a simple frustration: finding the right influencers 
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
          <h2 className="text-3xl font-bold text-center text-black mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20">
              <Search className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">AI-Powered Search</h3>
              <p className="text-black/70">
                Our advanced algorithms analyze content, engagement patterns, and audience data to find 
                your perfect influencer matches in seconds.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 backdrop-blur-xl rounded-3xl p-8 border border-green-500/20">
              <BarChart3 className="w-12 h-12 text-green-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">Comprehensive Analytics</h3>
              <p className="text-black/70">
                Get detailed insights including YouTube analytics, engagement rates, audience demographics, 
                and historical performance data.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/5 to-green-500/5 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20">
              <Users className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">Verified Database</h3>
              <p className="text-black/70">
                Every influencer in our database is manually verified. We ensure accurate follower counts, 
                contact information, and profile authenticity.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-blue-500/5 backdrop-blur-xl rounded-3xl p-8 border border-green-500/20">
              <Target className="w-12 h-12 text-green-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">Multi-Platform Coverage</h3>
              <p className="text-black/70">
                Find influencers across Instagram, YouTube, TikTok, and other platforms. 
                Compare cross-platform performance in one dashboard.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/5 to-green-500/5 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20">
              <Shield className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">Direct Contact</h3>
              <p className="text-black/70">
                Skip the middlemen. Get direct email contacts and social media handles to connect 
                with influencers instantly.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-blue-500/5 backdrop-blur-xl rounded-3xl p-8 border border-green-500/20">
              <Zap className="w-12 h-12 text-green-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">Regular Updates</h3>
              <p className="text-black/70">
                Our database is updated weekly with new creators and fresh metrics. 
                You always get the most current information.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <TeamSection />

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-500/5 to-green-500/5 backdrop-blur-xl rounded-3xl p-12 border border-blue-500/20">
          <h2 className="text-3xl font-bold text-black mb-4">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-black/70 mb-8 max-w-2xl mx-auto">
            Join hundreds of Pakistani businesses already using our platform to find perfect influencer matches
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/login" 
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-4 px-8 rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Start Free Trial
            </a>
            <a 
              href="/contact" 
              className="border-2 border-blue-500 text-blue-500 hover:bg-blue-500/10 py-4 px-8 rounded-2xl font-semibold transition-all duration-300"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}