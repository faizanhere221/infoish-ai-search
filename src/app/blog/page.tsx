// src/app/blog/page.tsx
'use client'

import Header from '@/components/header'
import Link from 'next/link'
import { Calendar, User, ArrowRight, TrendingUp, Star } from 'lucide-react'
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
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Complete Guide to Influencer Marketing in Pakistan 2025',
    excerpt: 'Master influencer marketing with our comprehensive guide covering strategies, budgets, and ROI optimization specifically for Pakistani brands.',
    date: '2025-10-10',
    author: 'Laiba Razzaq',
    category: 'Marketing',
    readTime: '12 min read',
    slug: 'complete-guide-influencer-marketing-pakistan-2025',
    featured: true,
    views: '2.3K'
  },
  {
    id: '2',
    title: 'How to Find the Right Pakistani Influencers for Your Brand',
    excerpt: 'Step-by-step framework for discovering, evaluating, and partnering with Pakistani influencers who deliver real results for your campaigns.',
    date: '2025-01-15',
    author: 'Content Team',
    category: 'Strategy',
    readTime: '10 min read',
    slug: 'find-right-pakistani-influencers-brand',
    featured: true,
    views: '1.8K'
  },
  {
    id: '3',
    title: 'Top 10 Pakistani Beauty Influencers to Watch in 2025',
    excerpt: 'Discover the most influential beauty creators in Pakistan who are shaping trends and driving brand partnerships across platforms.',
    date: '2025-01-14',
    author: 'Beauty Team',
    category: 'Beauty',
    readTime: '5 min read',
    slug: 'top-10-pakistani-beauty-influencers-2025',
    views: '3.1K'
  },
  {
    id: '4',
    title: 'Tech Reviewers in Pakistan: Complete Guide for Brands',
    excerpt: 'Everything you need to know about Pakistani tech influencers, from top creators to campaign strategies that drive sales.',
    date: '2025-01-13',
    author: 'Tech Team',
    category: 'Tech',
    readTime: '8 min read',
    slug: 'tech-reviewers-pakistan-guide-brands',
    views: '1.5K'
  },
  {
    id: '5',
    title: 'YouTube vs Instagram: Where Pakistani Creators Perform Best',
    excerpt: 'Data-driven analysis of platform performance, engagement rates, and ROI across different social media platforms in Pakistan.',
    date: '2025-01-12',
    author: 'Data Team',
    category: 'Analytics',
    readTime: '6 min read',
    slug: 'youtube-vs-instagram-pakistani-creators',
    views: '2.7K'
  },
  {
    id: '6',
    title: 'Influencer Marketing ROI: Maximizing Returns in Pakistan',
    excerpt: 'Learn how to measure, optimize, and maximize your influencer marketing investment with Pakistani market insights and benchmarks.',
    date: '2025-01-11',
    author: 'Strategy Team',
    category: 'Business',
    readTime: '10 min read',
    slug: 'influencer-marketing-roi-guide-pakistan',
    views: '1.9K'
  },
  {
    id: '7',
    title: 'Top Gaming Influencers in Pakistan: PUBG to Valorant',
    excerpt: 'Comprehensive guide to Pakistani gaming content creators across mobile and PC gaming platforms, with audience insights.',
    date: '2025-01-10',
    author: 'Gaming Team',
    category: 'Gaming',
    readTime: '7 min read',
    slug: 'top-gaming-influencers-pakistan-2025',
    views: '4.2K'
  },
  {
    id: '8',
    title: 'Food Bloggers Revolution: Pakistani Culinary Creators',
    excerpt: 'Explore the vibrant world of Pakistani food content creators and their impact on culinary trends and restaurant marketing.',
    date: '2025-01-09',
    author: 'Food Team',
    category: 'Food',
    readTime: '5 min read',
    slug: 'pakistani-food-bloggers-culinary-creators',
    views: '2.1K'
  },
  {
    id: '9',
    title: 'Micro vs Macro Influencers: What Works in Pakistan?',
    excerpt: 'Data-driven analysis of micro and macro influencer performance in the Pakistani market with budget recommendations.',
    date: '2025-01-08',
    author: 'Research Team',
    category: 'Strategy',
    readTime: '9 min read',
    slug: 'micro-vs-macro-influencers-pakistan',
    views: '1.6K'
  },
  {
    id: '10',
    title: 'Travel Vloggers: Showcasing Pakistan to the World',
    excerpt: 'Meet the Pakistani travel creators who are changing global perceptions and driving tourism through authentic storytelling.',
    date: '2025-01-07',
    author: 'Travel Team',
    category: 'Travel',
    readTime: '6 min read',
    slug: 'pakistani-travel-vloggers-tourism',
    views: '3.5K'
  }
]

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  const categories = ['All', 'Marketing', 'Strategy', 'Beauty', 'Tech', 'Gaming', 'Food', 'Travel', 'Business', 'Analytics']
  
  const filteredPosts = selectedCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory)

  const featuredPosts = blogPosts.filter(post => post.featured)
  const regularPosts = blogPosts.filter(post => !post.featured)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-white/50 shadow-lg mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Latest Insights & Strategies</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Influencer Marketing Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expert insights, proven strategies, and success stories from Pakistan's leading influencer marketing platform
          </p>
          <div className="flex justify-center gap-8 mt-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Updated Weekly</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Expert Written</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>Data-Driven</span>
            </div>
          </div>
        </div>

        {/* Featured Articles */}
        {featuredPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Featured Articles
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/50 group">
                  <div className="relative">
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                        FEATURED
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        {post.views} views
                      </span>
                    </div>
                    <div className="h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <span className="text-2xl font-bold text-blue-600">{post.category.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">{post.category} Guide</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
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
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                      Read Full Guide
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        
        
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