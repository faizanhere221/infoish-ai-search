'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'

import Link from 'next/link'

import { 
  Search, 
  Users, 
  BarChart3, 
  Shield, 
  Zap, 
  Star, 
  ArrowRight, 
  CheckCircle,
  PlayCircle,
  TrendingUp,
  Globe,
  Target,
  Award,
  Sparkles,
  Eye,
  User
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: 'free' | 'starter' | 'pro' | 'developer'
  monthly_searches: number
  search_limit: number
}


import React from 'react';



function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin mx-auto">
            <div className="w-4 h-4 bg-blue-600 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Loading Infoishai
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Preparing your personalized dashboard...
          </p>
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hero Section for Landing Page - GLOBALLY OPTIMIZED
function LandingHeroSection() {
  const router = useRouter()
  const [currentStat, setCurrentStat] = useState(0)

  const stats = [
    { number: "1,800+", label: "Verified Creators", icon: "👥" },
    { number: "4", label: "Countries (Growing)", icon: "🌍" },
    { number: "3", label: "Major Platforms", icon: "📱" },
    { number: "Real-time", label: "Global Data", icon: "⚡" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-16 pb-24">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float">
        <Search className="w-8 h-8 text-blue-600" />
      </div>
      <div className="absolute top-40 right-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
        <Globe className="w-8 h-8 text-green-600" />
      </div>
      <div className="absolute bottom-40 left-20 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float" style={{ animationDelay: '2s' }}>
        <Users className="w-8 h-8 text-purple-600" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-12">
          {/* Main Headline - GLOBAL POSITIONING */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-white/50 shadow-lg">
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Global Influencer Discovery Platform
              </span>
            </div>
            
    
<h1 className="text-4xl sm:text-6xl font-bold text-black text-balance leading-tight hero-text">
  {/* First line */}
  <span className="hero-word animate-fade-in-up delay-0">
    Find
  </span>
   <span>
    {' '}
  </span>
  <span className="hero-word animate-fade-in-up delay-200">
    <span className="gradient-text-primary animate-gradient-shift">
      Influencers
    </span>
  </span>
  <span>
    {' '}
  </span>
  <span className="hero-word animate-fade-in-up delay-300">
    Worldwide
  </span>
  
  <br />
  
  {/* Second line */}
  <span className="hero-word animate-fade-in-up delay-600">
    With
  </span>
  <span>
    {' '}
  </span>
  <span className="hero-word animate-fade-in-up delay-800">
    <span className="gradient-text-secondary animate-gradient-shift animate-pulse-glow">
      AI-Powered Search
    </span>
  </span>
</h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto text-balance leading-relaxed">
              Connect with verified creators across Instagram, YouTube, and TikTok. 
              <span className="font-semibold text-gray-800"> 1,800+ Pakistani creators available now. Expanding globally to India, UAE & beyond.</span>
            </p>

            {/* Global Availability Badge - NEW */}
            <div className="inline-flex flex-wrap items-center gap-4 bg-white/90 backdrop-blur-md rounded-2xl px-8 py-4 shadow-xl border border-white/50">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇵🇰</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-green-600">LIVE NOW</div>
                  <div className="text-sm text-gray-700">Pakistan</div>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔜</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-blue-600">COMING SOON</div>
                  <div className="text-sm text-gray-700">India • UAE • Bangladesh</div>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Statistics */}
          <div className="flex justify-center">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/50 max-w-md">
              <div className="text-center transition-all duration-500">
                <div className="text-5xl mb-4 transition-all duration-500">
                  {stats[currentStat].icon}
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 transition-all duration-500">
                  {stats[currentStat].number}
                </div>
                <div className="text-gray-600 font-medium transition-all duration-500">
                  {stats[currentStat].label}
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {stats.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentStat ? 'bg-blue-600 scale-125' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
  {/* Primary CTA Button - Blue to Green Gradient */}
  <button
    onClick={() => router.push('/login')}
    className="group bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-6 px-12 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 backdrop-blur-lg"
  >
    <span className="text-lg">Start Free Search</span>
    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" />
  </button>
  
  {/* Secondary CTA Button - Glass Morphism */}
  <button
    onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
    className="group bg-white/80 backdrop-blur-xl hover:bg-white/90 text-black font-bold py-6 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-black/10 hover:border-blue-500/30 flex items-center justify-center gap-3 hover:scale-105 transform"
  >
    <PlayCircle className="w-6 h-6 text-blue-500 group-hover:text-green-500 transition-colors duration-200" />
    <span className="text-lg">Watch Demo</span>
  </button>
</div>
            
            <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700">1,847 creators online now</span>
              </div>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Free account • No credit card</span>
              </div>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Expanding Globally</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      
    </div>
  )
}






// Features Section - GLOBAL FOCUS
function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: "AI-Powered Global Search",
      description: "Advanced semantic search finds creators worldwide by content style, audience demographics, and engagement patterns across multiple countries.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      stats: "Multi-country"
    },
    {
      icon: BarChart3,
      title: "Cross-Country Analytics",
      description: "Real-time data updated daily. Compare creator performance across Pakistan, India, UAE and more with unified metrics.",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      stats: "Daily updates"
    },
    {
      icon: Shield,
      title: "Globally Verified",
      description: "Every profile verified with authentic contact information, active social presence, and engagement validation across all markets.",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      stats: "100% verified"
    },
    {
      icon: Target,
      title: "Multi-Market Targeting",
      description: "Filter by country, region, platforms, niche, followers, verified status, and content type for precise global campaigns.",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      stats: "50+ filters"
    },
    {
      icon: Zap,
      title: "Instant Global Results",
      description: "Get comprehensive influencer matches from multiple countries in under 3 seconds with our optimized infrastructure.",
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      stats: "<3s response"
    },
    {
      icon: Globe,
      title: "International Database",
      description: "Currently covering Pakistan with 1,800+ creators. Expanding to India, UAE, Bangladesh. One platform for global reach.",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      stats: "4 countries"
    }
  ]

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-green-100 px-6 py-3 rounded-full mb-6">
            <Award className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Global Platform Features</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Why Global Brands Choose Infoishai
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built for worldwide reach with advanced AI and deep local insights across multiple markets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 hover:border-gray-200"
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
              
              <div className="relative">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                  <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {feature.stats}
                  </span>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>
                
                
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Social Proof Section


// Demo Section
function DemoSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section id="demo-section" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            See It In Action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how easy it is to find and connect with influencers across any country
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-gray-300 text-sm">
                infoishai.com
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-2xl aspect-video relative overflow-hidden">
              {!isPlaying ? (
                // Video Thumbnail with Play Button
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center cursor-pointer group"
                  onClick={() => setIsPlaying(true)}
                >
                  <div className="relative text-center">
                    <div className="w-24 h-24 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-2xl">
                      <PlayCircle className="w-16 h-16 text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-medium">Watch Platform Demo</p>
                    <p className="text-gray-500 text-sm">2 minutes • See real search results</p>
                  </div>
                </div>
              ) : (
                // Actual Video
                <video
                  className="w-full h-full rounded-2xl"
                  controls
                  autoPlay
                  poster="/demo-thumbnail.jpg" // Add your thumbnail image
                >
                  <source src="/demo-video.mp4" type="video/mp4" />
                  <source src="/demo-video.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Pricing Preview Section - 4 Color Design
function PricingPreviewSection() {
  const router = useRouter()
  
  return (
    <section className="py-24 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-black mb-6">
            Simple, Global Pricing
          </h2>
          <p className="text-xl text-black/70 max-w-3xl mx-auto">
            One platform. Multiple countries. Transparent pricing for brands worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-black/10 relative hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-black mb-2">Free</h3>
              <div className="text-4xl font-bold text-black mb-4">PKR 0</div>
              <p className="text-black/60 mb-6">Perfect for trying out</p>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">10 searches per month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">5 results per search</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">Basic influencer data</span>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-white/60 hover:bg-white backdrop-blur-lg border border-black/20 hover:border-blue-500/50 text-black font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                Start Free
              </button>
            </div>
          </div>

          {/* Starter Plan */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-blue-500 relative transform scale-105 hover:scale-110 transition-all duration-300">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                Most Popular
              </span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-black mb-2">Starter</h3>
              <div className="text-4xl font-bold text-black mb-1">PKR 2,999</div>
              <div className="text-black/60 mb-6">/month</div>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">30 searches per month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">Unlimited results</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">Export to CSV/Excel</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">Advanced filters</span>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/pricing')}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-black/10 relative hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-black mb-2">Pro</h3>
              <div className="text-4xl font-bold text-black mb-1">PKR 6,999</div>
              <div className="text-black/60 mb-6">/month</div>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">Unlimited Searches</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">Unlimited Results</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">Multi-country access</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-black/80">Direct Consultation</span>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/pricing')}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/pricing')}
            className="inline-flex items-center gap-2 text-blue-500 hover:text-green-500 font-medium transition-colors duration-200"
          >
            View detailed pricing
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
// Final CTA Section - 4 Color Design
function FinalCTASection() {
  const router = useRouter()
  
  return (
    <section className="py-24 bg-gradient-to-r from-blue-500 to-green-500 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-white rounded-full mix-blend-overlay filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white rounded-full mix-blend-overlay filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-lg px-6 py-3 rounded-full border border-white/30 shadow-lg">
            <Globe className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold text-white">Go Global with Infoishai</span>
          </div>
          
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Find Your Perfect Influencers Worldwide?
          </h2>
          
          <p className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Start discovering creators who align with your brand across Pakistan, India, UAE, and beyond. 
            <span className="font-semibold text-white"> Get your first results in under 30 seconds.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <button
              onClick={() => router.push('/login')}
              className="group bg-white hover:bg-white/90 text-blue-500 hover:text-green-500 font-bold py-6 px-12 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 backdrop-blur-lg"
            >
              <span className="text-lg">Start Free Search Now</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            
            <button
              onClick={() => router.push('/pricing')}
              className="group border-2 border-white hover:bg-white hover:text-blue-500 text-white font-bold py-6 px-12 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-105 transform backdrop-blur-lg"
            >
              <Eye className="w-6 h-6" />
              <span className="text-lg">View Pricing Plans</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-2xl mx-auto">
            <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">Free</div>
              <div className="text-white/80 text-sm">No credit card required</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">30s</div>
              <div className="text-white/80 text-sm">Average search time</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/80 text-sm">Real-time data updates</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}





// User Dashboard Section (for authenticated users) - Updated Design
function UserDashboardSection({ user }: { user: User }) {
  const router = useRouter()

  const getSearchesRemaining = () => {
    if (!user) return 0
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'developer') return 'unlimited'
    return Math.max(0, user.search_limit - user.monthly_searches)
  }

  return (
    <div className="relative overflow-hidden bg-white py-8 sm:py-16">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
          
          {/* User Dashboard Card - Compact */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 max-w-4xl mx-auto border border-black/10 shadow-xl">
            
            {/* Header Section - Fixed Layout */}
            <div className="flex flex-col gap-4 mb-6">
              {/* User Info Row */}
              <div className="flex items-center gap-3">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name || 'User'}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-blue-500/30 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-black mb-1">
                    Welcome back, {user.full_name?.split(' ')[0] || user.email.split('@')[0]}!
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${
                    user.subscription_tier === 'developer' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                    user.subscription_tier === 'pro' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                    user.subscription_tier === 'starter' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                    'bg-black/10 text-black border-black/20'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      user.subscription_tier === 'developer' ? 'bg-green-500' :
                      user.subscription_tier === 'pro' ? 'bg-blue-500' :
                      user.subscription_tier === 'starter' ? 'bg-blue-500' :
                      'bg-black'
                    }`}></div>
                    {user.subscription_tier === 'developer' ? 'Developer' :
                     user.subscription_tier === 'pro' ? 'Pro' :
                     user.subscription_tier === 'starter' ? 'Starter' :
                     'Free'} Account
                  </span>
                </div>
              </div>
              
              {/* CTA Button Row - Full Width on Mobile */}
              <button
                onClick={() => router.push('/search')}
                disabled={getSearchesRemaining() === 0 && user.subscription_tier === 'free'}
                className={`w-full px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  getSearchesRemaining() === 0 && user.subscription_tier === 'free'
                    ? 'bg-black/20 text-black/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white'
                }`}
              >
                {getSearchesRemaining() === 0 && user.subscription_tier === 'free' ? 'Limit Reached - Upgrade to Continue' : 'Start Searching Global Influencers'}
              </button>
            </div>

            {/* Usage Statistics - Compact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              
              {/* Searches This Month */}
              <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-4 text-center border border-blue-500/20 backdrop-blur-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                  {user.subscription_tier === 'pro' || user.subscription_tier === 'developer' ? 
                    user.monthly_searches : 
                    `${user.monthly_searches}/${user.search_limit}`
                  }
                </div>
                <div className="text-xs text-blue-600 font-medium">Searches This Month</div>
              </div>

              {/* Searches Remaining - Only show for limited plans */}
              {(user.subscription_tier === 'free' || user.subscription_tier === 'starter') && (
                <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl p-4 text-center border border-green-500/20 backdrop-blur-lg">
                  <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                    {getSearchesRemaining()}
                  </div>
                  <div className="text-xs text-green-600 font-medium">Searches Remaining</div>
                </div>
              )}

              {/* Account Type */}
              <div className={`bg-gradient-to-br rounded-xl p-4 text-center border backdrop-blur-lg ${
                user.subscription_tier === 'pro' || user.subscription_tier === 'developer' 
                  ? 'from-green-500/5 to-green-500/10 border-green-500/20' 
                  : 'from-black/5 to-black/10 border-black/20'
              } ${(user.subscription_tier === 'free' || user.subscription_tier === 'starter') ? '' : 'lg:col-span-1 sm:col-span-2'}`}>
                <div className="text-xl sm:text-2xl mb-1">
                  {user.subscription_tier === 'developer' ? '🔧' :
                   user.subscription_tier === 'pro' ? '👑' :
                   user.subscription_tier === 'starter' ? '⚡' : '🆓'}
                </div>
                <div className={`text-xs font-medium ${
                  user.subscription_tier === 'pro' || user.subscription_tier === 'developer' 
                    ? 'text-green-600' 
                    : 'text-black/80'
                }`}>
                  {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)} Plan
                </div>
              </div>
            </div>

            {/* Upgrade CTA for Free Users - Compact */}
            {user.subscription_tier === 'free' && (
              <div className="mt-5 bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-black mb-1 text-sm">Ready for unlimited global searches?</h3>
                    <p className="text-black/70 text-xs">Upgrade to unlock all features and remove search limits.</p>
                  </div>
                  <button
                    onClick={() => router.push('/pricing')}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-5 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main headline for authenticated users - Mobile Optimized */}
          <div className="text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-black leading-tight">
              Find{' '}
              <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                Global Influencers
              </span>
              <br />
              With AI-Powered Search
            </h1>
            <p className="text-lg sm:text-xl text-black/70 max-w-3xl mx-auto leading-relaxed">
              Search through verified creators worldwide with your personalized dashboard.
            </p>
            
            {/* Quick Action Buttons - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={() => router.push('/search')}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start Searching Now
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="bg-white/80 backdrop-blur-lg hover:bg-white text-black px-8 py-4 rounded-2xl font-semibold transition-all duration-300 border border-black/10 hover:border-blue-500/30"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component - Updated
export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    // Listen for search events
    const handleSearchUpdate = (event: CustomEvent) => {
      if (user && event.detail) {
        setUser(prev => prev ? {
          ...prev,
          monthly_searches: event.detail.monthly_searches,
          search_limit: event.detail.search_limit
        } : null)
      }
    }

    window.addEventListener('searchCompleted', handleSearchUpdate as EventListener)
    
    return () => {
      window.removeEventListener('searchCompleted', handleSearchUpdate as EventListener)
    }
  }, [user])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        setIsLoading(false)
        return
      }

      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://infoish-ai-search-production.up.railway.app' 
        : 'http://127.0.0.1:8000'

      const response = await fetch(`${backendUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          profile_picture: userData.profile_picture,
          subscription_tier: userData.subscription_tier,
          monthly_searches: userData.monthly_searches,
          search_limit: userData.search_limit
        })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black/70">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": user ? "Infoishai - Dashboard" : "Infoishai - Global Influencer Discovery Platform",
            "description": "Find and connect with verified influencers worldwide. AI-powered search across Instagram, YouTube, TikTok. Starting with Pakistan, expanding globally.",
            "url": "https://infoishai.com",
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "Infoishai",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "category": "SaaS"
              }
            }
          })
        }}
      />

      {/* Conditional Content */}
      {user ? (
        // Authenticated user sees dashboard
        <>
          <UserDashboardSection user={user} />
          <FeaturesSection />
        </>
      ) : (
        // Visitors see landing page
        <>
          <LandingHeroSection />
          {/* Influencer Registration Section - GLOBAL UPDATE */}
      <section className="py-20 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Are You an Influencer?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join Infoishai and get discovered by brands worldwide. 
              Create your profile, showcase your work, and grow your influence globally.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Get Discovered Globally</h3>
                <p className="text-sm text-gray-600">Be found by brands searching for creators worldwide</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Manage Your Profile</h3>
                <p className="text-sm text-gray-600">Update your stats, portfolio, and contact info anytime</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Globe className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Connect Internationally</h3>
                <p className="text-sm text-gray-600">Receive collaboration opportunities from global brands</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/register-influencer"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                Register as Influencer
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                href="/influencer/login"
                className="px-8 py-4 bg-white text-purple-600 border-2 border-purple-600 rounded-full font-semibold text-lg hover:bg-purple-50 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                Already Registered? Login
              </Link>
            </div>
          </div>
        </div>
      </section>
          <FeaturesSection />
          <DemoSection />
          <PricingPreviewSection />
          <FinalCTASection />
        </>
      )}
    </>
  )
}