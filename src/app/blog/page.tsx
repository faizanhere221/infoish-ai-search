// src/app/blog/page.tsx
'use client'

import Header from '@/components/header'
import Link from 'next/link'
import { Calendar, User, ArrowRight, TrendingUp, Star, Sparkles, Hash, PenTool, Users } from 'lucide-react'
import { useState } from 'react'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  readTime: string
  slug: string
  featured?: boolean
  views?: string
  isNew?: boolean
}

const blogPosts: BlogPost[] = [
  {
    id: '0',
    title: 'Micro-Influencers in Pakistan: Why They Outperform Celebrities (+ How to Find Them)',
    excerpt: 'Micro-influencers deliver 3x higher engagement than celebrities at a fraction of the cost. Real pricing data (PKR 5,000-25,000/post), engagement benchmarks, and how to find verified micro-creators.',
    date: '2025-12-27',
    author: 'Infoishai Team',
    category: 'Strategy',
    readTime: '10 min read',
    slug: 'micro-influencers-pakistan-guide',
    featured: true,
    views: '1.2K',
    isNew: true
  },
  {
    id: '1',
    title: 'Best Free AI Humanizer Tool 2025 — Bypass AI Detection Instantly',
    excerpt: 'Transform ChatGPT, Claude & Gemini text into undetectable human writing. Our free AI humanizer bypasses Turnitin, GPTZero & more. No signup, instant results.',
    date: '2024-12-23',
    author: 'Infoishai Team',
    category: 'Tools',
    readTime: '7 min read',
    slug: 'ai-humanizer-tool-make-ai-text-human-2025',
    featured: true,
    views: '3.2K',
    isNew: true
  },
  {
    id: '2',
    title: 'Free Instagram Hashtag Generator — Get Viral Hashtags in Seconds',
    excerpt: 'Generate AI-powered Instagram hashtags for Posts, Reels & Stories. Free forever, no signup required. Get 5-15 targeted hashtags instantly to boost reach and engagement.',
    date: '2024-12-23',
    author: 'Infoishai Team',
    category: 'Tools',
    readTime: '8 min read',
    slug: 'free-instagram-hashtag-generator-2025',
    featured: true,
    views: '2.8K',
    isNew: true
  },
  {
    id: '3',
    title: 'Free Instagram Profile Analyzer — Spot Fake Influencers Instantly',
    excerpt: 'Analyze any Instagram profile for free. Check engagement rates, detect fake followers, and verify influencers before you pay. Complete guide for Pakistani brands.',
    date: '2024-12-23',
    author: 'Infoishai Team',
    category: 'Tools',
    readTime: '12 min read',
    slug: 'free-instagram-profile-analyzer-complete-guide',
    featured: true,
    views: '2.1K',
    isNew: true
  },
  {
    id: '4',
    title: 'Influencer Marketing in Pakistan: The Only Guide You\'ll Need (2025)',
    excerpt: 'From finding the right creators to measuring ROI — everything Pakistani brands need to know about influencer marketing in 2025. Includes real budgets and proven strategies.',
    date: '2024-12-16',
    author: 'Laiba Razzaq',
    category: 'Marketing',
    readTime: '12 min read',
    slug: 'complete-guide-influencer-marketing-pakistan-2025',
    featured: true,
    views: '4.5K'
  },
  {
    id: '5',
    title: 'How to Find Pakistani Influencers (Without Wasting Hours on Instagram)',
    excerpt: 'Stop scrolling through thousands of profiles. Here\'s the exact 5-step process Pakistani brands use to find verified influencers in under 10 minutes.',
    date: '2024-12-18',
    author: 'Laiba Razzaq',
    category: 'Strategy',
    readTime: '8 min read',
    slug: 'find-right-pakistani-influencers-brand',
    featured: false,
    views: '3.2K'
  },
  {
    id: '6',
    title: '5 AI Tools That Help Pakistani Brands Find Influencers 10x Faster',
    excerpt: 'Still manually scrolling Instagram to find influencers? Pakistani brands are switching to AI-powered tools that discover verified creators in seconds — not hours.',
    date: '2024-12-20',
    author: 'Laiba Razzaq',
    category: 'Technology',
    readTime: '9 min read',
    slug: 'ai-powered-influencer-marketing-tools-pakistan',
    featured: false,
    views: '2.9K'
  }
]

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  const categories = ['All', 'Tools', 'Marketing', 'Strategy', 'Technology']
  
  const filteredPosts = selectedCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory)

  const featuredPosts = filteredPosts.filter(post => post.featured)
  const regularPosts = filteredPosts.filter(post => !post.featured)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-white/50 shadow-lg mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Latest Insights & Free Tools</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Influencer Marketing Blog & Tools
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expert insights, free AI tools, and proven strategies from Pakistan's leading influencer marketing platform
          </p>
          <div className="flex flex-wrap justify-center gap-8 mt-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Updated Weekly</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Expert Written</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Free Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>Data-Driven</span>
            </div>
          </div>
        </div>

        {/* New Tools Announcement Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-12 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">🎉 New Free Tools Released!</h3>
                <p className="text-purple-100 text-sm">AI Humanizer, Hashtag Generator & Profile Analyzer - All 100% Free</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/tools/ai-humanizer"
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                AI Humanizer
              </Link>
              <Link 
                href="/tools/hashtag-generator"
                className="bg-white/20 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-white/30 transition-colors"
              >
                Hashtag Generator
              </Link>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md'
              }`}
            >
              {category}
              {category === 'Tools' && (
                <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">3</span>
              )}
              {category === 'Strategy' && (
                <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">2</span>
              )}
            </button>
          ))}
        </div>

        {/* Featured Articles */}
        {featuredPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Featured Articles & Tools
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/50 group">
                  <div className="relative">
                    {/* Badges */}
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                      {post.isNew && (
                        <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                          NEW
                        </span>
                      )}
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                        FEATURED
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        {post.views} views
                      </span>
                    </div>
                    
                    {/* Category-based header design */}
                    <div className={`h-48 bg-gradient-to-br ${
                      post.category === 'Tools' ? 'from-purple-500/20 to-pink-500/20' :
                      post.category === 'Marketing' ? 'from-blue-500/20 to-cyan-500/20' :
                      post.category === 'Strategy' ? 'from-green-500/20 to-emerald-500/20' :
                      'from-orange-500/20 to-red-500/20'
                    } flex items-center justify-center`}>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          {post.slug.includes('humanizer') ? (
                            <PenTool className="w-8 h-8 text-blue-600" />
                          ) : post.slug.includes('hashtag') ? (
                            <Hash className="w-8 h-8 text-purple-600" />
                          ) : post.slug.includes('analyzer') ? (
                            <TrendingUp className="w-8 h-8 text-pink-600" />
                          ) : post.slug.includes('micro-influencers') ? (
                            <Users className="w-8 h-8 text-green-600" />
                          ) : (
                            <span className={`text-2xl font-bold ${
                              post.category === 'Tools' ? 'text-purple-600' :
                              post.category === 'Marketing' ? 'text-blue-600' :
                              post.category === 'Strategy' ? 'text-green-600' :
                              'text-orange-600'
                            }`}>{post.category.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {post.category === 'Tools' ? 'Free Tool Guide' : 
                           post.category === 'Strategy' ? 'Strategy Guide' :
                           `${post.category} Guide`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        post.category === 'Tools' ? 'bg-purple-100 text-purple-700' :
                        post.category === 'Marketing' ? 'bg-blue-100 text-blue-700' :
                        post.category === 'Strategy' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {post.category}
                      </span>
                      <span className="text-gray-500 text-sm">{post.readTime}</span>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/blog/${post.slug}`}
                      className={`inline-flex items-center gap-2 font-medium px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg ${
                        post.category === 'Tools' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                          : post.category === 'Strategy'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      }`}
                    >
                      {post.category === 'Tools' ? 'Read Guide & Try Tool' : 'Read Full Guide'}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Regular Articles */}
        {regularPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">More Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        post.category === 'Tools' ? 'bg-purple-100 text-purple-700' :
                        post.category === 'Marketing' ? 'bg-blue-100 text-blue-700' :
                        post.category === 'Strategy' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {post.category}
                      </span>
                      <span className="text-gray-400 text-xs">{post.views} views</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>{post.author}</span>
                      <span>{post.readTime}</span>
                    </div>
                    
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                    >
                      Read Article
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Free Tools Quick Access */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Free Tools - Try Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              href="/tools/ai-humanizer"
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Humanizer</h3>
              <p className="text-blue-100 text-sm mb-4">Convert AI text to human-like writing. Bypass detectors instantly.</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                Try Free <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            
            <Link 
              href="/tools/hashtag-generator"
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Hash className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Hashtag Generator</h3>
              <p className="text-purple-100 text-sm mb-4">Generate perfect Instagram hashtags for Reels, Posts & Stories.</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                Try Free <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            
            <Link 
              href="/tools/instagram-profile-analyzer"
              className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Profile Analyzer</h3>
              <p className="text-pink-100 text-sm mb-4">Check engagement rates, detect fake followers, vet influencers.</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                Try Free <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">More Articles Coming Soon</h2>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">We're Working on More Content!</h3>
              <p className="text-gray-600 mb-6">
                Our team is creating in-depth guides on topics like influencer pricing benchmarks, platform comparisons, ROI optimization, Instagram Bio Generator, and niche-specific influencer lists. Subscribe to stay updated!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Request a Topic
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-12 border border-white/50">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Find Your Perfect Influencer?
            </h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Stop reading about influencer marketing and start doing it. Use our AI-powered search to discover Pakistani influencers who match your brand perfectly.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Search 1,800+ Creators</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Filter by Engagement & Location</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Connect & Launch Campaigns</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/search"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Start Searching Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all"
              >
                View Pricing Plans
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Free account • No credit card required • Get results in 30 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}