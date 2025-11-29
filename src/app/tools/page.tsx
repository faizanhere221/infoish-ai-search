'use client'

import React from 'react'
import Link from 'next/link'
import { Instagram, Search, TrendingUp, Sparkles, ArrowRight, CheckCircle, Zap, Target, BarChart3, Users, Heart, MessageCircle } from 'lucide-react'

export default function ToolsPage() {
  const tools = [
    {
      id: 'instagram-analyzer',
      name: 'Instagram Profile Analyzer',
      description: 'Advanced analytics for any public Instagram profile with engagement metrics, consistency scoring, and personalized insights.',
      icon: Instagram,
      href: '/tools/instagram-profile-analyzer',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      stats: ['10+ Metrics', 'Free Forever', '10 Profiles/min'],
      features: [
        'Engagement Rate Analysis',
        'Consistency Score',
        'Best Post Identification',
        'Follower Tier Classification',
        'Content Mix Analysis',
        'Personalized Recommendations'
      ],
      badge: 'Popular',
      badgeColor: 'bg-purple-100 text-purple-700'
    },
    // Add more tools here in the future
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Free Marketing Tools
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade tools to analyze, optimize, and grow your social media presence
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Stats Banner */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">{tools.length}</div>
              <div className="text-sm text-gray-600">Available Tools</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">Free to Use</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">∞</div>
              <div className="text-sm text-gray-600">No Sign-up Required</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">10+</div>
              <div className="text-sm text-gray-600">Advanced Metrics</div>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 gap-8 mb-12">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <div
                key={tool.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all group"
              >
                <div className="p-8">
                  <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Left Section - Icon & Title */}
                    <div className="lg:w-1/3">
                      <div className={`w-20 h-20 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-2xl font-bold text-gray-900">{tool.name}</h2>
                        {tool.badge && (
                          <span className={`px-3 py-1 ${tool.badgeColor} rounded-full text-xs font-semibold`}>
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-4">{tool.description}</p>
                      
                      {/* Stats */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tool.stats.map((stat, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 bg-gradient-to-r ${tool.bgColor} text-purple-700 rounded-full text-sm font-medium`}
                          >
                            {stat}
                          </span>
                        ))}
                      </div>
                      
                      <Link
                        href={tool.href}
                        className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${tool.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all`}
                      >
                        Try it Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>

                    {/* Right Section - Features */}
                    <div className="lg:w-2/3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Key Features
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tool.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Why Use Our Tools Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Use Our Tools?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600">
                Get comprehensive analytics in seconds with our optimized algorithms and caching system.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Actionable Insights</h3>
              <p className="text-gray-600">
                Not just numbers - get personalized recommendations to improve your social media strategy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Always Free</h3>
              <p className="text-gray-600">
                No credit card required. No hidden fees. No sign-up needed. Just pure value.
              </p>
            </div>

          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <div className="text-6xl font-bold mb-2 text-white/40">1</div>
              <h3 className="text-xl font-bold mb-3">Choose Your Tool</h3>
              <p className="text-purple-100">
                Select from our collection of free marketing tools
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-6xl font-bold mb-2 text-white/40">2</div>
              <h3 className="text-xl font-bold mb-3">Enter Your Data</h3>
              <p className="text-purple-100">
                Input username, URL, or profile link
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="text-6xl font-bold mb-2 text-white/40">3</div>
              <h3 className="text-xl font-bold mb-3">Get Insights</h3>
              <p className="text-purple-100">
                View detailed analytics and recommendations
              </p>
            </div>

          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">More Tools Coming Soon</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              We're constantly building new tools to help you grow your social media presence. 
              Stay tuned for more free analytics tools!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
                📊 TikTok Analyzer
              </div>
              <div className="px-6 py-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
                📈 YouTube Analytics
              </div>
              <div className="px-6 py-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
                🐦 Twitter Insights
              </div>
              <div className="px-6 py-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
                💼 LinkedIn Stats
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}