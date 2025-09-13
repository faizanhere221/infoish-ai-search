// src/app/blog/page.tsx
'use client'

import Header from '@/components/header'
import Link from 'next/link'
import { Calendar, User, ArrowRight } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  date: string
  author: string
  category: string
  readTime: string
  slug: string
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Top 10 Pakistani Beauty Influencers to Watch in 2025',
    excerpt: 'Discover the most influential beauty creators in Pakistan who are shaping trends and driving brand partnerships.',
    date: '2025-01-15',
    author: 'Content Team',
    category: 'Beauty',
    readTime: '5 min read',
    slug: 'top-10-pakistani-beauty-influencers-2025'
  },
  {
    id: '2',
    title: 'How to Find the Perfect Tech Reviewer for Your Brand',
    excerpt: 'A complete guide to identifying and partnering with Pakistani tech influencers who align with your product.',
    date: '2025-01-14',
    author: 'Marketing Team',
    category: 'Tech',
    readTime: '8 min read',
    slug: 'find-perfect-tech-reviewer-pakistan'
  },
  {
    id: '3',
    title: 'YouTube vs Instagram: Where Pakistani Creators Perform Best',
    excerpt: 'Analysis of platform performance, engagement rates, and ROI across different social media platforms in Pakistan.',
    date: '2025-01-13',
    author: 'Data Team',
    category: 'Analytics',
    readTime: '6 min read',
    slug: 'youtube-vs-instagram-pakistani-creators'
  },
  {
    id: '4',
    title: 'Influencer Marketing ROI: Complete Guide for Pakistani Brands',
    excerpt: 'Learn how to measure, optimize, and maximize your influencer marketing investment in Pakistan.',
    date: '2025-01-12',
    author: 'Strategy Team',
    category: 'Marketing',
    readTime: '10 min read',
    slug: 'influencer-marketing-roi-guide-pakistan'
  },
  {
    id: '5',
    title: 'Top Gaming Influencers in Pakistan: PUBG to Valorant',
    excerpt: 'Comprehensive list of Pakistani gaming content creators across mobile and PC gaming platforms.',
    date: '2025-01-11',
    author: 'Gaming Team',
    category: 'Gaming',
    readTime: '7 min read',
    slug: 'top-gaming-influencers-pakistan-2025'
  },
  {
    id: '6',
    title: 'Food Bloggers and Culinary Creators: Pakistani Food Scene',
    excerpt: 'Explore the vibrant world of Pakistani food content creators and their impact on culinary trends.',
    date: '2025-01-10',
    author: 'Food Team',
    category: 'Food',
    readTime: '5 min read',
    slug: 'pakistani-food-bloggers-culinary-creators'
  },
  {
    id: '7',
    title: 'Micro vs Macro Influencers: What Works in Pakistan?',
    excerpt: 'Data-driven analysis of micro and macro influencer performance in the Pakistani market.',
    date: '2025-01-09',
    author: 'Research Team',
    category: 'Strategy',
    readTime: '9 min read',
    slug: 'micro-vs-macro-influencers-pakistan'
  },
  {
    id: '8',
    title: 'Travel Vloggers: Showcasing Pakistan to the World',
    excerpt: 'Meet the Pakistani travel creators who are changing global perceptions and driving tourism.',
    date: '2025-01-08',
    author: 'Travel Team',
    category: 'Travel',
    readTime: '6 min read',
    slug: 'pakistani-travel-vloggers-tourism'
  },
  {
    id: '9',
    title: 'Building Authentic Brand Partnerships with Pakistani Creators',
    excerpt: 'Best practices for creating meaningful, long-term relationships with Pakistani influencers.',
    date: '2025-01-07',
    author: 'Partnership Team',
    category: 'Business',
    readTime: '8 min read',
    slug: 'authentic-brand-partnerships-pakistani-creators'
  },
  {
    id: '10',
    title: 'The Rise of Pakistani Comedy Content: From TikTok to YouTube',
    excerpt: 'How Pakistani comedians are dominating social media and creating viral content that resonates globally.',
    date: '2025-01-06',
    author: 'Entertainment Team',
    category: 'Comedy',
    readTime: '5 min read',
    slug: 'rise-pakistani-comedy-content-creators'
  }
]

export default function BlogPage() {
  const categories = ['All', 'Marketing', 'Beauty', 'Tech', 'Gaming', 'Food', 'Travel', 'Business']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Influencer Marketing Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, strategies, and success stories from Pakistan's leading influencer marketing platform
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              className="px-6 py-2 bg-white rounded-full text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors font-medium"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Category Badge */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {post.category}
                  </span>
                  <span className="text-gray-500 text-sm">{post.readTime}</span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h2>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
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
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-white rounded-xl shadow-lg p-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Find Your Perfect Influencer?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Use our AI-powered search to discover Pakistani influencers who match your brand perfectly
          </p>
          <Link 
            href="/search"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Start Searching Now
          </Link>
        </div>
      </div>
    </div>
  )
}