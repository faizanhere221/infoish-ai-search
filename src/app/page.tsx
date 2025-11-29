'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Head from 'next/head'
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
  User,
  Rocket,
  Clock,
  Filter,
  Database
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

// Hero Section for Landing Page - ENHANCED GLOBAL VERSION
function LandingHeroSection() {
  const router = useRouter()
  const [currentStat, setCurrentStat] = useState(0)

  const stats = [
    { number: "1,800+", label: "Verified Creators", icon: "👥", color: "from-blue-500 to-cyan-500" },
    { number: "5+", label: "Countries Soon", icon: "🌍", color: "from-green-500 to-emerald-500" },
    { number: "3", label: "Social Platforms", icon: "📱", color: "from-purple-500 to-pink-500" },
    { number: "<3s", label: "Search Speed", icon: "⚡", color: "from-orange-500 to-red-500" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/50 pt-20 pb-32">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Icon Elements */}
      <div className="absolute top-24 left-12 hidden lg:block">
        <div className="w-20 h-20 bg-white/30 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl animate-float border border-white/40">
          <Search className="w-10 h-10 text-blue-600" />
        </div>
      </div>
      <div className="absolute top-48 right-16 hidden lg:block">
        <div className="w-20 h-20 bg-white/30 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl animate-float-delayed border border-white/40">
          <Globe className="w-10 h-10 text-green-600" />
        </div>
      </div>
      <div className="absolute bottom-48 left-24 hidden lg:block">
        <div className="w-20 h-20 bg-white/30 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl animate-float-delayed-2 border border-white/40">
          <Rocket className="w-10 h-10 text-purple-600" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-12">
          
          {/* Global Platform Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-full border-2 border-white/60 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <div className="relative">
                <Globe className="w-6 h-6 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 bg-clip-text text-transparent">
                Global Influencer Discovery Platform
              </span>
            </div>
          </div>

          {/* Main Headline - ENHANCED */}
          <div className="space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-tight tracking-tight">
              <span className="inline-block animate-fade-in-up">
                Discover
              </span>{' '}
              <span className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-fade-in-up animation-delay-200 animate-gradient-x">
                Perfect Influencers
              </span>
              <br />
              <span className="inline-block animate-fade-in-up animation-delay-400">
                With
              </span>{' '}
              <span className="inline-block bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent animate-fade-in-up animation-delay-600 animate-gradient-x">
                AI Advanced Search
              </span>
            </h1>

            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 max-w-5xl mx-auto leading-relaxed font-medium">
              AI-powered search across{' '}
              <span className="font-bold text-blue-600">Instagram</span>,{' '}
              <span className="font-bold text-red-600">YouTube</span>, and{' '}
              <span className="font-bold text-purple-600">TikTok</span>.
              <br className="hidden sm:block" />
              <span className="text-gray-600">
                1,800+ verified creators. Free campaign management system included.
              </span>
            </p>

            {/* Campaign Management Feature Highlight */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/90 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border-2 border-white/50">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-3 rounded-full mb-4">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Free Campaign Management</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                    Everything You Need to Run Successful Campaigns
                  </h3>
                  <p className="text-gray-600">
                    Complete campaign management tools included at no extra cost
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Feature 1 */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 transform hover:scale-105 transition-all duration-300">
                    <div className="text-center">
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Campaign Tracking</h4>
                      <p className="text-xs text-gray-600">Monitor all your influencer campaigns in one dashboard</p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 transform hover:scale-105 transition-all duration-300">
                    <div className="text-center">
                      <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Influencer Management</h4>
                      <p className="text-xs text-gray-600">Save, organize, and communicate with creators</p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 transform hover:scale-105 transition-all duration-300">
                    <div className="text-center">
                      <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Performance Analytics</h4>
                      <p className="text-xs text-gray-600">Track ROI and engagement metrics in real-time</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-900">🎁 Bonus:</span> Campaign templates, saved searches, and export tools - all free forever
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Stats Carousel */}
          <div className="flex justify-center">
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl border-2 border-white/60 max-w-md transform hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className={`text-6xl mb-6 transition-all duration-500 transform ${currentStat % 2 === 0 ? 'scale-110' : 'scale-100'}`}>
                  {stats[currentStat].icon}
                </div>
                <div className={`text-5xl font-black bg-gradient-to-r ${stats[currentStat].color} bg-clip-text text-transparent mb-3 transition-all duration-500`}>
                  {stats[currentStat].number}
                </div>
                <div className="text-gray-700 font-bold text-lg transition-all duration-500">
                  {stats[currentStat].label}
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-8">
                {stats.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentStat ? 'bg-blue-600 w-8' : 'bg-gray-300 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CTA Buttons - ENHANCED */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => router.push('/login')}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black py-7 px-14 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                <span className="text-xl relative z-10">Start Free Search</span>
                <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
              </button>
              
              <button
                onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="group bg-white/95 backdrop-blur-2xl hover:bg-white text-gray-900 font-black py-7 px-14 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-500 flex items-center justify-center gap-4 transform hover:scale-105"
              >
                <PlayCircle className="w-7 h-7 text-blue-600 group-hover:text-purple-600 transition-colors duration-300" />
                <span className="text-xl">Watch Demo</span>
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-12">
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/40 shadow-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-gray-800">1,847 creators online</span>
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/40 shadow-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-bold text-gray-800">Free forever plan</span>
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/40 shadow-lg">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-gray-800">100% verified profiles</span>
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/40 shadow-lg">
                <Rocket className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-bold text-gray-800">Going global in 30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-5deg); }
        }
        @keyframes float-delayed-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-float-delayed-2 {
          animation: float-delayed-2 6s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

// Features Section - ENHANCED GLOBAL FOCUS
function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: "AI-Powered Global Search",
      description: "Advanced semantic search finds creators worldwide by content style, audience demographics, engagement patterns, and niche across 5+ countries.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      stats: "Multi-country",
      badge: "Most Popular"
    },
    {
      icon: Database,
      title: "Cross-Platform Discovery",
      description: "Search across Instagram, YouTube, and TikTok simultaneously. One platform to discover creators on all major social networks globally.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      stats: "3 platforms",
      badge: "Comprehensive"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Live data updated daily with engagement rates, follower growth, audience demographics, and performance metrics across all markets.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      stats: "Daily updates",
      badge: "Data-Driven"
    },
    {
      icon: Shield,
      title: "Verified Profiles Only",
      description: "Every profile manually verified with authentic contact information, active social presence, and genuine engagement validation globally.",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      stats: "100% verified",
      badge: "Trusted"
    },
    {
      icon: Filter,
      title: "Advanced Multi-Filter",
      description: "Precision targeting with 7+ filters including country, platform, niche, followers, engagement rate, verified status, and content type.",
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50",
      stats: "7+ filters",
      badge: "Precise"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Lightning-fast search powered by optimized infrastructure. Get comprehensive global influencer matches in under 3 seconds.",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50",
      stats: "<3s response",
      badge: "Fastest"
    }
  ]

  return (
    <section className="py-32 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #000 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 px-8 py-4 rounded-full mb-8 shadow-lg">
            <Award className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Platform Features</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-gray-900 mb-6">
            Why Brands Choose Infoishai
          </h2>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto font-medium">
            Built for worldwide reach with cutting-edge AI and deep local insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 border-2 border-gray-100 hover:border-gray-200 overflow-hidden"
            >
              {/* Gradient Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 blur-2xl transition-opacity duration-500`}></div>
              
              {/* Badge */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                {feature.badge}
              </div>
              
              <div className="relative z-10">
                <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 mb-4">{feature.title}</h3>
                
                <p className="text-gray-600 leading-relaxed mb-6 text-base">{feature.description}</p>
                
                <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${feature.color} bg-opacity-10 px-4 py-2 rounded-full`}>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {feature.stats}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Demo Section - ENHANCED
function DemoSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section id="demo-section" className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-100 to-pink-100 px-8 py-4 rounded-full mb-8 shadow-lg">
            <PlayCircle className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-black text-gray-900 uppercase tracking-wide">See It In Action</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-gray-900 mb-6">
            Watch How It Works
          </h2>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto">
            See how easy it is to find and connect with global influencers in seconds
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 sm:p-10 shadow-3xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg"></div>
                <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-lg"></div>
                <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
              </div>
              <div className="flex-1 bg-gray-700 rounded-xl px-6 py-3 text-gray-300 text-sm font-medium shadow-inner">
                https://infoishai.com
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-2xl aspect-video relative overflow-hidden shadow-2xl">
              {!isPlaying ? (
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 flex items-center justify-center cursor-pointer group backdrop-blur-sm"
                  onClick={() => setIsPlaying(true)}
                >
                  <div className="relative text-center">
                    <div className="w-32 h-32 bg-white/95 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-2xl">
                      <PlayCircle className="w-20 h-20 text-blue-600" />
                    </div>
                    <p className="text-white font-black text-2xl mb-2 drop-shadow-lg">Watch Platform Demo</p>
                    <p className="text-white/90 text-lg drop-shadow-lg">2 minutes • Real search results</p>
                  </div>
                </div>
              ) : (
                <video
                  className="w-full h-full rounded-2xl"
                  controls
                  autoPlay
                  poster="/demo-thumbnail.jpg"
                >
                  <source src="/demo-video.mp4" type="video/mp4" />
                  <source src="/demo-video.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center bg-gray-800/50 rounded-xl p-4 backdrop-blur-lg">
                <div className="text-3xl font-black text-white mb-1">Step 1</div>
                <div className="text-sm text-gray-300">Enter keywords</div>
              </div>
              <div className="text-center bg-gray-800/50 rounded-xl p-4 backdrop-blur-lg">
                <div className="text-3xl font-black text-white mb-1">Step 2</div>
                <div className="text-sm text-gray-300">Apply filters</div>
              </div>
              <div className="text-center bg-gray-800/50 rounded-xl p-4 backdrop-blur-lg">
                <div className="text-3xl font-black text-white mb-1">Step 3</div>
                <div className="text-sm text-gray-300">Get results</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Pricing Preview Section - UNCHANGED (keeping as requested)
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

// Influencer Registration Section - UNCHANGED (keeping as requested)
function InfluencerSection() {
  return (
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
  )
}

// Final CTA Section - ENHANCED
function FinalCTASection() {
  const router = useRouter()
  
  return (
    <section className="py-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div className="space-y-10">
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-2xl px-8 py-4 rounded-full border-2 border-white/30 shadow-2xl">
            <Rocket className="w-6 h-6 text-white" />
            <span className="text-sm font-black text-white uppercase tracking-wide">Launch Your Global Campaign</span>
          </div>
          
          <h2 className="text-5xl sm:text-7xl font-black text-white leading-tight">
            Ready to Find Your
            <br />
            Perfect Influencers?
          </h2>
          
          <p className="text-2xl sm:text-3xl text-white/95 max-w-4xl mx-auto leading-relaxed font-medium">
            Start discovering authentic creators who align with your brand.
            <br />
            <span className="text-white font-black">Get your first results in under 30 seconds.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <button
              onClick={() => router.push('/login')}
              className="group bg-white hover:bg-gray-50 text-gray-900 font-black py-7 px-14 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center gap-4"
            >
              <span className="text-xl">Start Free Search</span>
              <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
            
            <button
              onClick={() => router.push('/pricing')}
              className="group border-3 border-white hover:bg-white hover:text-purple-600 text-white font-black py-7 px-14 rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 hover:scale-105 transform backdrop-blur-2xl"
            >
              <Eye className="w-7 h-7" />
              <span className="text-xl">View Plans</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 max-w-3xl mx-auto">
            <div className="text-center bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border-2 border-white/20 shadow-xl">
              <div className="text-4xl font-black text-white mb-3">Free</div>
              <div className="text-white/90 font-medium">No credit card</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border-2 border-white/20 shadow-xl">
              <div className="text-4xl font-black text-white mb-3">&lt;3s</div>
              <div className="text-white/90 font-medium">Search time</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border-2 border-white/20 shadow-xl">
              <div className="text-4xl font-black text-white mb-3">24/7</div>
              <div className="text-white/90 font-medium">Live data</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// User Dashboard Section (for authenticated users) - UNCHANGED
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

// Main page component
export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
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
    return <LoadingFallback />
  }

  return (
    <>
      <Head>
        <title>Infoishai - Global Influencer Discovery Platform | AI-Powered Search</title>
        <meta name="description" content="Discover verified influencers worldwide using AI-powered search. 1,800+ Pakistani creators on Instagram, YouTube, TikTok. Free campaign management system included." />
        <meta name="keywords" content="influencer marketing, influencer discovery, find influencers, instagram influencers, youtube creators, tiktok creators, global influencer platform, AI influencer search, Pakistani influencers, USA influencers, UK influencers, Australian influencers, Canadian influencers, UAE influencers" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://infoishai.com" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Infoishai - Global Influencer Discovery Platform" />
        <meta property="og:description" content="Discover verified influencers worldwide using AI-powered search. 1,800+ Pakistani creators on Instagram, YouTube, TikTok. Free campaign management system included." />
        <meta property="og:site_name" content="Infoishai" />
        <meta property="og:image" content="https://infoishai.com/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Infoishai - Global Influencer Discovery Platform" />
       <meta name="twitter:description" content="AI-powered influencer search across Instagram, YouTube, TikTok. Find authentic creators worldwide. Free campaign management included." />
        <meta name="twitter:image" content="https://infoishai.com/twitter-image.jpg" />
        
        {/* Additional SEO */}
        <meta name="geo.region" content="PK" />
        <meta name="geo.placename" content="Pakistan" />
        <meta name="language" content="English" />
        <meta name="author" content="Infoishai" />
      </Head>

      {/* JSON-LD Structured Data - ENHANCED */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Infoishai",
            "description": "Global influencer discovery platform with AI-powered search across Instagram, YouTube, and TikTok. Find verified creators worldwide.",
            "url": "https://infoishai.com",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "0",
              "highPrice": "6999",
              "priceCurrency": "PKR",
              "offerCount": "3"
            },
            "featureList": [
              "AI-powered influencer search",
              "Multi-platform discovery (Instagram, YouTube, TikTok)",
              "Real-time analytics",
              "Verified profiles only",
              "Advanced filtering (50+ filters)",
              "Global database expansion"
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "256",
              "bestRating": "5",
              "worstRating": "1"
            },
            "availableCountry": ["PK", "US", "GB", "AU", "CA", "AE"],
            "inLanguage": "en"
          })
        }}
      />

      <Header />

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
          <FeaturesSection />
          <DemoSection />
          <InfluencerSection />
          <PricingPreviewSection />
          <FinalCTASection />
        </>
      )}
    </>
  )
}