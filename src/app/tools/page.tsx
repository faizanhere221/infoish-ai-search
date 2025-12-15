'use client'

import React from 'react'
import Link from 'next/link'
import { Instagram, Search, TrendingUp, Sparkles, ArrowRight, CheckCircle, Zap, Target, Hash, Wand2 } from 'lucide-react'

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
        'Follower Tier Classification'
      ],
      badge: 'Popular',
      badgeColor: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'instagram-hashtag-generator',
      name: 'Instagram Hashtag Generator',
      description: 'AI-powered hashtag generator that creates perfect hashtags for Instagram Posts, Reels & Stories. Get 5-15 relevant hashtags instantly.',
      icon: Hash,
      href: '/tools/instagram-hashtag-generator',
      color: 'from-pink-500 to-purple-500',
      bgColor: 'from-pink-50 to-purple-50',
      stats: ['AI-Powered', 'Free Forever', '5-15 Hashtags'],
      features: [
        'Smart Content Detection',
        'Popular & Niche Hashtags',
        'Difficulty Scoring',
        'Copy & Download Options'
      ],
      badge: 'New',
      badgeColor: 'bg-green-100 text-green-700'
    },
    {
      id: 'ai-humanizer',
      name: 'AI Humanizer',
      description: 'Transform AI-generated text to bypass detection. Convert AI written into Humanize and pass AI detection tools.',
      icon: Wand2,
      href: '/tools/ai-humanizer',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      stats: ['AI-Powered', '3 Free/Day', '500-2,500 Words'],
      features: [
        'Bypass AI Detectors',
        '15-25% AI Detection',
        'Instant Results',
        'Copy & Download'
      ],
      badge: 'New',
      badgeColor: 'bg-blue-100 text-blue-700'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Compact Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Free Marketing Tools
            </h1>
            <p className="text-lg text-gray-600">
              Professional-grade tools to analyze, optimize, and grow your social media
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Compact Stats Banner */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{tools.length}</div>
              <div className="text-xs text-gray-600">Available Tools</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-1">100%</div>
              <div className="text-xs text-gray-600">Free to Use</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">∞</div>
              <div className="text-xs text-gray-600">No Sign-up</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">10+</div>
              <div className="text-xs text-gray-600">Metrics</div>
            </div>
          </div>
        </div>

        {/* Compact Tools Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <div
                key={tool.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* Left Section */}
                    <div className="lg:w-1/3">
                      <div className={`w-16 h-16 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold text-gray-900">{tool.name}</h2>
                        {tool.badge && (
                          <span className={`px-2 py-0.5 ${tool.badgeColor} rounded-full text-xs font-semibold`}>
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{tool.description}</p>
                      
                      {/* Stats */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tool.stats.map((stat, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 bg-gradient-to-r ${tool.bgColor} text-purple-700 rounded-full text-xs font-medium`}
                          >
                            {stat}
                          </span>
                        ))}
                      </div>
                      
                      <Link
                        href={tool.href}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${tool.color} text-white font-semibold rounded-lg hover:shadow-lg transition-all text-sm`}
                      >
                        Try it Free
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>

                    {/* Right Section - Features */}
                    <div className="lg:w-2/3">
                      <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Key Features
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {tool.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{feature}</span>
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

        {/* Compact Why Use Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Use Our Tools?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600 text-sm">
                Get comprehensive analytics in seconds with optimized algorithms.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Actionable Insights</h3>
              <p className="text-gray-600 text-sm">
                Get personalized recommendations to improve your strategy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Always Free</h3>
              <p className="text-gray-600 text-sm">
                No credit card. No hidden fees. No sign-up needed.
              </p>
            </div>

          </div>
        </div>

        {/* Compact How It Works */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Choose Tool</h3>
              <p className="text-purple-100 text-sm">
                Select from our free marketing tools
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Enter Data</h3>
              <p className="text-purple-100 text-sm">
                Input username, URL, or text
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Get Results</h3>
              <p className="text-purple-100 text-sm">
                View analytics & recommendations
              </p>
            </div>

          </div>
        </div>

        {/* Compact Coming Soon */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">More Tools Coming Soon</h2>
            <p className="text-gray-600 mb-4 text-sm">
              We are building more free tools to help you grow. Stay tuned!
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium text-sm">
                ✍️ Bio Generator
              </div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium text-sm">
                📈 YouTube Analytics
              </div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium text-sm">
                💼 LinkedIn Stats
              </div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium text-sm">
                🎯 TikTok Insights
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}