// src/app/about/page.tsx

import Header from '@/components/header'
import { Users, Search, BarChart3, Shield, Target, Zap, Globe, TrendingUp } from 'lucide-react'
import TeamSection from '@/components/TeamSection'

export const metadata = {
  title: 'About Infoishai - Global Influencer Discovery Platform | Our Story',
  description: 'Learn about Infoishai, the AI-powered global influencer discovery platform. Starting with 1,800+ Pakistani creators, expanding to India, UAE, and worldwide. Our mission to democratize influencer marketing.',
  keywords: 'about infoishai, influencer platform story, global creator discovery, influencer marketing platform, ai search tool',
  openGraph: {
    title: 'About Infoishai - Global Influencer Discovery Platform',
    description: 'AI-powered platform connecting brands with verified creators worldwide. Starting with Pakistan, expanding globally.',
    url: 'https://infoishai.com/about',
  }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header isSearchPage={false} />
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section - Global Positioning */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-green-100 px-6 py-3 rounded-full mb-6">
            <Globe className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Global Influencer Discovery Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
            About{' '}
            <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
              Infoishai
            </span>
          </h1>
          
          <p className="text-xl text-black/70 max-w-4xl mx-auto leading-relaxed mb-8">
            We're revolutionizing how businesses worldwide connect with content creators. 
            Our AI-powered platform makes influencer marketing accessible, data-driven, and results-focused.
          </p>
          
          {/* Global Expansion Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-white/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl px-8 py-4 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇵🇰</span>
              <div className="text-left">
                <div className="text-sm font-bold text-black">Currently Available</div>
                <div className="text-xs text-black/60">Pakistan - 1,800+ Creators</div>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-300 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔜</span>
              <div className="text-left">
                <div className="text-sm font-bold text-black">Expanding Soon</div>
                <div className="text-xs text-black/60">India • UAE • Bangladesh</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Section - Global Focus */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-black mb-6">Our Global Mission</h2>
            <p className="text-lg text-black/80 mb-6 leading-relaxed">
              To empower businesses worldwide to harness the power of influencer marketing. 
              We believe every brand—from Karachi to Dubai, Mumbai to Dhaka—deserves access to the right creators 
              who can authentically represent their values and reach their target audience.
            </p>
            <p className="text-lg text-black/80 mb-6 leading-relaxed">
              Starting with Pakistan's most comprehensive creator database, we're expanding across South Asia, 
              the Middle East, and beyond. Our vision: become the world's most trusted global influencer 
              discovery platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
                <div className="text-sm font-semibold text-blue-600">Multi-Country</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                <div className="text-sm font-semibold text-green-600">AI-Powered</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
                <div className="text-sm font-semibold text-blue-600">Data-Driven</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/10 to-green-500/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-green-500 mb-2">1,800+</div>
                <div className="text-black/70 text-sm">Verified Creators</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500 mb-2">4</div>
                <div className="text-black/70 text-sm">Countries (Growing)</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500 mb-2">50M+</div>
                <div className="text-black/70 text-sm">Total Reach</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500 mb-2">15+</div>
                <div className="text-black/70 text-sm">Content Categories</div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Roadmap Section - NEW */}
        <div className="mb-20 bg-gradient-to-br from-blue-500/5 to-green-500/5 backdrop-blur-xl rounded-3xl p-12 border border-blue-500/20">
          <h2 className="text-3xl font-bold text-center text-black mb-12">Global Expansion Roadmap</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Phase 1: Pakistan</h3>
              <div className="text-sm text-green-600 font-semibold mb-3">LIVE NOW</div>
              <p className="text-black/70">1,800+ verified creators across Instagram, YouTube, TikTok</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500/20 border-4 border-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Phase 2: South Asia</h3>
              <div className="text-sm text-blue-600 font-semibold mb-3">Q2 2025</div>
              <p className="text-black/70">Expanding to India, Bangladesh with 10,000+ creators</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-black/10 border-4 border-black/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-10 h-10 text-black/40" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Phase 3: Middle East & Global</h3>
              <div className="text-sm text-black/60 font-semibold mb-3">Q4 2025</div>
              <p className="text-black/70">UAE, Saudi Arabia, and 20+ countries worldwide</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-black mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl text-center border border-black/10 hover:border-blue-500/30 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Transparency</h3>
              <p className="text-black/70 leading-relaxed">
                We provide accurate, up-to-date data about every influencer worldwide. No hidden metrics, 
                no inflated numbers—just honest insights to help you make informed decisions.
              </p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl text-center border border-black/10 hover:border-green-500/30 transition-all duration-300">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Precision</h3>
              <p className="text-black/70 leading-relaxed">
                Our advanced AI algorithms help you find the perfect match for your brand across any country, 
                considering audience demographics, engagement rates, and content quality.
              </p>
            </div>
            
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl text-center border border-black/10 hover:border-blue-500/30 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Innovation</h3>
              <p className="text-black/70 leading-relaxed">
                We continuously evolve our platform with cutting-edge features like cross-country analytics, 
                multilingual search, and AI-powered campaign predictions.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section - Updated */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-20 border border-black/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-black mb-8">Our Story</h2>
            <div className="prose prose-lg mx-auto text-black/80">
              <p className="text-lg leading-relaxed mb-6">
                Infoishai was born from a global vision with local roots. As entrepreneurs in Pakistan's 
                rapidly growing digital economy, we experienced firsthand the challenges of finding the right 
                influencers. Businesses were spending weeks manually researching creators, often missing perfect 
                matches or working with inflated metrics.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                We realized this wasn't just a Pakistani problem—it was a global challenge. From startups in 
                Karachi to enterprises in Dubai, from D2C brands in Mumbai to agencies in Dhaka, everyone 
                struggled with the same issue: <strong>discovering authentic creators at scale</strong>.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                That's when we decided to build something bigger than a local tool. We built Infoishai as a 
                <strong> global influencer discovery platform</strong>, starting with Pakistan's most comprehensive 
                database and expanding worldwide.
              </p>
              <p className="text-lg leading-relaxed">
                Today, we've created the foundation for what will become the world's largest verified creator 
                marketplace. We're just getting started on our mission to democratize influencer marketing 
                across continents.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section - Global Enhanced */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-black mb-12">Why Global Brands Choose Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20 hover:shadow-xl transition-all duration-300">
              <Search className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">AI-Powered Global Search</h3>
              <p className="text-black/70">
                Our advanced algorithms analyze content, engagement patterns, and audience data across 
                multiple countries to find your perfect influencer matches in seconds.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 backdrop-blur-xl rounded-3xl p-8 border border-green-500/20 hover:shadow-xl transition-all duration-300">
              <BarChart3 className="w-12 h-12 text-green-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">Cross-Country Analytics</h3>
              <p className="text-black/70">
                Compare creators across different markets. Get insights on engagement rates, audience 
                demographics, and regional performance metrics.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/5 to-green-500/5 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20 hover:shadow-xl transition-all duration-300">
              <Users className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">Verified Global Database</h3>
              <p className="text-black/70">
                Every influencer is manually verified. We ensure accurate follower counts, authentic 
                engagement, and verified contact information worldwide.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-blue-500/5 backdrop-blur-xl rounded-3xl p-8 border border-green-500/20 hover:shadow-xl transition-all duration-300">
              <Target className="w-12 h-12 text-green-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">Multi-Platform Coverage</h3>
              <p className="text-black/70">
                Find influencers across Instagram, YouTube, TikTok, and emerging platforms. 
                Compare cross-platform performance in one unified dashboard.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/5 to-green-500/5 backdrop-blur-xl rounded-3xl p-8 border border-blue-500/20 hover:shadow-xl transition-all duration-300">
              <Globe className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">International Reach</h3>
              <p className="text-black/70">
                Access creators across Pakistan, India, UAE, Bangladesh, and expanding to 20+ countries. 
                One platform for all your global campaigns.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-blue-500/5 backdrop-blur-xl rounded-3xl p-8 border border-green-500/20 hover:shadow-xl transition-all duration-300">
              <Zap className="w-12 h-12 text-green-500 mb-6" />
              <h3 className="text-xl font-bold text-black mb-4">Real-Time Updates</h3>
              <p className="text-black/70">
                Our database is updated daily with new creators and fresh metrics from multiple countries. 
                You always get the most current global information.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <TeamSection />

        {/* CTA Section - Global */}
        <div className="text-center bg-gradient-to-r from-blue-500/5 to-green-500/5 backdrop-blur-xl rounded-3xl p-12 border border-blue-500/20">
          <h2 className="text-3xl font-bold text-black mb-4">
            Ready to Go Global with Your Marketing?
          </h2>
          <p className="text-xl text-black/70 mb-8 max-w-2xl mx-auto">
            Join businesses worldwide using Infoishai to discover verified creators across Pakistan, 
            India, UAE, and beyond
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/login" 
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-4 px-8 rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Start Free Search
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