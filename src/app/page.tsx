'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Head from 'next/head'
import Link from 'next/link'
import { trackCTAClick, trackViewPricing } from '@/lib/analytics'

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
  Database,
  XCircle,
  MessageCircle,
  DollarSign,
  Instagram,
  Youtube,
  Hash,
  Wand2,
  UserCheck,
  ChevronRight,
  BadgeCheck,
  Timer,
  Crown,
  Heart,
  ThumbsUp,
  AlertTriangle,
  TrendingDown,
  ArrowUpRight,
  Play,
  Check,
  X,
  MousePointer,
  Layers,
  Gift
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

// ============================================================================
// ANIMATED COUNTER COMPONENT
// ============================================================================
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const countRef = useRef<HTMLSpanElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (countRef.current) {
      observer.observe(countRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return <span ref={countRef}>{count.toLocaleString()}{suffix}</span>
}

// ============================================================================
// LOADING FALLBACK
// ============================================================================
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-gray-500 font-medium">Loading Infoishai...</p>
      </div>
    </div>
  )
}

// ============================================================================
// HERO SECTION - STUNNING & CONVERSION OPTIMIZED
// ============================================================================
function LandingHeroSection() {
  const router = useRouter()
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  const testimonials = [
    { text: "Found 20 perfect influencers in 10 minutes!", author: "Marketing Manager" },
    { text: "Finally, real Pakistani creators with actual engagement.", author: "Brand Owner" },
    { text: "Saved us hours of manual searching.", author: "Agency Director" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleCTAClick = (ctaName: string, destination: string) => {
    trackCTAClick(ctaName, 'hero_section', destination)
    router.push(destination)
  }

  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Mesh */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-violet-400/20 to-fuchsia-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-32 left-[10%] animate-float">
          <div className="w-14 h-14 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl flex items-center justify-center border border-white/50">
            <Instagram className="w-7 h-7 text-pink-500" />
          </div>
        </div>
        <div className="absolute top-48 right-[15%] animate-float-delayed">
          <div className="w-14 h-14 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl flex items-center justify-center border border-white/50">
            <Youtube className="w-7 h-7 text-red-500" />
          </div>
        </div>
        <div className="absolute bottom-32 left-[20%] animate-float-slow">
          <div className="w-12 h-12 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg flex items-center justify-center border border-white/50">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
        </div>
        <div className="absolute bottom-48 right-[10%] animate-float-delayed-2">
          <div className="w-12 h-12 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg flex items-center justify-center border border-white/50">
            <Heart className="w-6 h-6 text-rose-500" />
          </div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Live Badge */}
            <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl px-5 py-2.5 rounded-full border border-gray-200/50 shadow-lg shadow-gray-200/50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold text-gray-700">
                <span className="text-emerald-600">1,847</span> verified creators ready to collaborate
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Find Pakistani Influencers
                <br />
                <span className="relative">
                  <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                    That Actually Convert
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 10C50 4 100 4 150 7C200 10 250 6 298 2" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                        <stop offset="0%" stopColor="#2563eb"/>
                        <stop offset="50%" stopColor="#7c3aed"/>
                        <stop offset="100%" stopColor="#c026d3"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                Stop wasting hours on fake followers and ghost DMs. 
                <span className="font-semibold text-gray-800"> Our AI finds verified creators</span> who actually drive results for your brand.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleCTAClick('Try Free Hero', '/login')}
                className="group relative bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative text-lg">Start Free — No Card Needed</span>
                <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="group bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-8 rounded-2xl border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

          
          </div>

          {/* Right Column - Visual */}
          <div className="relative lg:pl-8">
            {/* Main Card */}
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              {/* Browser Header */}
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-200">
                  infoishai.com/search
                </div>
              </div>

              {/* Search UI Mock */}
              <div className="p-6 space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <Search className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 font-medium">fashion influencers lahore</span>
                  <div className="ml-auto bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                    Search
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                    Instagram
                  </span>
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200">
                    10K-100K followers
                  </span>
                  <span className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium border border-violet-200">
                    5%+ engagement
                  </span>
                </div>

                {/* Results Preview */}
                <div className="space-y-3 pt-2">
                  {[
                    { name: "Ayesha K.", handle: "@ayesha.style", followers: "89K", engagement: "6.2%", verified: true },
                    { name: "Fatima Z.", handle: "@fatimazfashion", followers: "45K", engagement: "8.1%", verified: true },
                    { name: "Sara A.", handle: "@sara.aesthetic", followers: "67K", engagement: "5.8%", verified: true }
                  ].map((influencer, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-blue-50/50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold">
                        {influencer.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{influencer.name}</span>
                          {influencer.verified && (
                            <BadgeCheck className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{influencer.handle}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{influencer.followers}</div>
                        <div className="text-sm text-emerald-600 font-medium">{influencer.engagement}</div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  ))}
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-700">247 verified</span> influencers
                  </span>
                  <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                    View all <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Stats Cards */}
            <div className="absolute -left-8 top-1/4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-float-slow hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">&lt;3s</div>
                  <div className="text-xs text-gray-500">Search time</div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 animate-float-delayed hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-xs text-gray-500">Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Logos */}
        <div className="mt-16 pt-12 border-t border-gray-200/50">
          <p className="text-center text-sm text-gray-500 mb-6">Search across all major platforms</p>
          <div className="flex justify-center items-center gap-8 sm:gap-12">
            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-700 hidden sm:block">Instagram</span>
            </div>
            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-700 hidden sm:block">YouTube</span>
            </div>
            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-700 hidden sm:block">TikTok</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-3deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 6s ease-in-out infinite; animation-delay: 1s; }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-delayed-2 { animation: float-delayed-2 5.5s ease-in-out infinite; animation-delay: 0.5s; }
      `}</style>
    </div>
  )
}

// ============================================================================
// PROBLEM/PAIN POINTS SECTION
// ============================================================================
function ProblemSection() {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Fake Followers Epidemic",
      description: "80% of influencers inflate their numbers with bots. You're paying for reach that doesn't exist.",
      stat: "80%",
      statLabel: "have fake followers",
      color: "red"
    },
    {
      icon: Clock,
      title: "Hours of Manual Work",
      description: "Scrolling Instagram, checking profiles one by one, creating spreadsheets... Sound familiar?",
      stat: "10+",
      statLabel: "hours wasted weekly",
      color: "orange"
    },
    {
      icon: MessageCircle,
      title: "Ghost DMs & No Replies",
      description: "You find the perfect influencer, send a DM, and... crickets. No verified contact info anywhere.",
      stat: "70%",
      statLabel: "DMs go unanswered",
      color: "yellow"
    },
    {
      icon: DollarSign,
      title: "Agencies Overcharge",
      description: "Marketing agencies take 30-50% commission. That's money that could go to actual creators.",
      stat: "50%",
      statLabel: "agency fees",
      color: "purple"
    }
  ]

  const colorClasses = {
    red: { bg: 'bg-red-50', border: 'border-red-100', icon: 'bg-red-100 text-red-600', stat: 'text-red-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'bg-orange-100 text-orange-600', stat: 'text-orange-600' },
    yellow: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'bg-amber-100 text-amber-600', stat: 'text-amber-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'bg-purple-100 text-purple-600', stat: 'text-purple-600' }
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }}></div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-2 rounded-full mb-6">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">The Problem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Influencer Marketing is <span className="text-red-500">Broken</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pakistani brands waste thousands on influencers who don't deliver. Here's why:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((problem, index) => {
            const colors = colorClasses[problem.color as keyof typeof colorClasses]
            return (
              <div 
                key={index}
                className={`${colors.bg} ${colors.border} border-2 rounded-3xl p-6 sm:p-8 hover:shadow-xl transition-all duration-300 group`}
              >
                <div className="flex items-start gap-5">
                  <div className={`${colors.icon} w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <problem.icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{problem.title}</h3>
                    <p className="text-gray-600 mb-4">{problem.description}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-3xl font-black ${colors.stat}`}>{problem.stat}</span>
                      <span className="text-sm text-gray-500">{problem.statLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Solution Teaser */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 px-8 py-6 rounded-3xl">
            <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-gray-900">There's a better way.</h3>
              <p className="text-emerald-700">Infoishai solves all of this with AI-powered verification.</p>
            </div>
            <ArrowRight className="w-6 h-6 text-emerald-500 animate-bounce-x hidden sm:block" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-bounce-x { animation: bounce-x 1s ease-in-out infinite; }
      `}</style>
    </section>
  )
}

// ============================================================================
// HOW IT WORKS SECTION - WITH VIDEO
// ============================================================================
function HowItWorksSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  
  const steps = [
    {
      number: "01",
      title: "Search Your Niche",
      description: "Type what you're looking for. Our AI understands context — 'fashion micro-influencers in Karachi' just works.",
      icon: Search,
      color: "from-blue-500 to-cyan-500"
    },
    {
      number: "02",
      title: "Filter & Refine",
      description: "Narrow down by platform, follower count, engagement rate, location, and verified status.",
      icon: Filter,
      color: "from-violet-500 to-purple-500"
    },
    {
      number: "03",
      title: "Get Verified Results",
      description: "Instantly see profiles with real engagement data, verified contact info, and audience insights.",
      icon: BadgeCheck,
      color: "from-emerald-500 to-teal-500"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="demo-section" className="py-24 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-50 to-transparent"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-6">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Find Influencers in <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">3 Simple Steps</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No complicated setup. No learning curve. Just results in under 30 seconds.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`relative p-8 rounded-3xl transition-all duration-500 cursor-pointer ${
                activeStep === index 
                  ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl scale-105' 
                  : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg'
              }`}
              onClick={() => setActiveStep(index)}
            >
              {/* Step Number */}
              <div className={`absolute -top-4 left-8 px-4 py-1 rounded-full text-sm font-bold ${
                activeStep === index
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                Step {step.number}
              </div>

              <div className="pt-4">
                <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mb-6 ${
                  activeStep === index ? 'shadow-lg' : ''
                }`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className={`text-xl font-bold mb-3 ${activeStep === index ? 'text-white' : 'text-gray-900'}`}>
                  {step.title}
                </h3>
                <p className={activeStep === index ? 'text-gray-300' : 'text-gray-600'}>
                  {step.description}
                </p>
              </div>

              {/* Progress Indicator */}
              {activeStep === index && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 rounded-b-3xl overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 animate-progress"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Video Demo */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-3 sm:p-4 shadow-2xl">
            {/* Browser Chrome */}
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <div className="flex-1 bg-gray-700/50 rounded-lg px-4 py-1.5 text-gray-400 text-sm">
                infoishai.com/search
              </div>
            </div>
            
            {/* Video Container */}
            <div className="relative bg-gradient-to-br from-blue-600/10 to-violet-600/10 rounded-2xl aspect-video overflow-hidden">
              {!isPlaying ? (
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                  onClick={() => setIsPlaying(true)}
                >
                  {/* Thumbnail Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-violet-900/80"></div>
                  
                  {/* Play Button */}
                  <div className="relative z-10 text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-10 h-10 text-blue-600 ml-1" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">See Infoishai in Action</h3>
                    <p className="text-blue-200">2 minute demo • Real search results</p>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-8 left-8 w-20 h-20 border border-white/20 rounded-2xl"></div>
                  <div className="absolute bottom-8 right-8 w-32 h-32 border border-white/10 rounded-full"></div>
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
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 3s linear;
        }
      `}</style>
    </section>
  )
}

// ============================================================================
// FREE TOOLS SECTION
// ============================================================================
function FreeToolsSection() {
  const router = useRouter()
  
  const tools = [
    {
      icon: User,
      title: "Instagram Profile Analyzer",
      description: "Analyze any profile's engagement rate, authenticity score, and audience quality instantly.",
      href: "/tools/instagram-profile-analyzer",
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50",
      borderColor: "border-pink-200",
      stats: "10K+ analyses"
    },
    {
      icon: Hash,
      title: "Hashtag Generator",
      description: "Generate trending, niche-specific hashtags to maximize your content reach.",
      href: "/tools/hashtag-generator",
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-50 to-purple-50",
      borderColor: "border-violet-200",
      stats: "Free forever"
    },
    {
      icon: Wand2,
      title: "AI Text Humanizer",
      description: "Transform AI-generated content into natural, human-like text that bypasses detectors.",
      href: "/tools/ai-humanizer",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      stats: "99% accuracy"
    }
  ]

  const handleToolClick = (toolName: string, href: string) => {
    trackCTAClick(`Free Tool - ${toolName}`, 'free_tools_section', href)
    router.push(href)
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full mb-6">
            <Gift className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Free Tools</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Boost Your Marketing — <span className="text-emerald-600">Free</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Powerful tools to level up your influencer marketing. No signup required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <div
              key={index}
              onClick={() => handleToolClick(tool.title, tool.href)}
              className={`group bg-gradient-to-br ${tool.bgGradient} rounded-3xl p-6 border-2 ${tool.borderColor} hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1`}
            >
              <div className={`w-14 h-14 bg-gradient-to-r ${tool.gradient} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                <tool.icon className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {tool.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm">{tool.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 bg-white/80 px-3 py-1 rounded-full">
                  {tool.stats}
                </span>
                <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                  <span>Try free</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FEATURES SECTION
// ============================================================================
function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: "AI-Powered Search",
      description: "Natural language search that understands context. Find exactly what you need.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "100% Verified",
      description: "Every profile manually verified. Real followers, real engagement, real contact info.",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: Filter,
      title: "Smart Filters",
      description: "7+ filters including platform, followers, engagement, niche, and location.",
      gradient: "from-violet-500 to-purple-500"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get comprehensive results in under 3 seconds. No waiting around.",
      gradient: "from-amber-500 to-orange-500"
    },
    {
      icon: BarChart3,
      title: "Real Analytics",
      description: "Engagement rates, growth trends, and audience demographics at a glance.",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: Target,
      title: "Campaign Tools",
      description: "Save influencers, create lists, and manage campaigns. Free forever.",
      gradient: "from-indigo-500 to-blue-500"
    }
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Win</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built specifically for Pakistani brands. Features that actually matter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300"
            >
              <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// STATS/SOCIAL PROOF SECTION
// ============================================================================
function SocialProofSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 border border-white/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Pakistan's First AI-Powered Influencer Platform
          </h2>
          <p className="text-blue-100 text-lg">
            Built by Pakistanis, for Pakistani brands 🇵🇰
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { number: 1800, suffix: '+', label: 'Verified Influencers' },
            { number: 3, suffix: '', label: 'Platforms Covered' },
            { number: 3, suffix: 's', label: 'Average Search Time', prefix: '<' },
            { number: 100, suffix: '%', label: 'Pakistani Creators' }
          ].map((stat, index) => (
            <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-colors">
              <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                {stat.prefix}<AnimatedCounter end={stat.number} suffix={stat.suffix} />
              </div>
              <div className="text-blue-100 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// PRICING PREVIEW SECTION
// ============================================================================
function PricingPreviewSection() {
  const router = useRouter()

  const handleViewPricing = () => {
    trackViewPricing('homepage_preview')
    router.push('/pricing')
  }

  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
      features: ['5 searches/month', 'Basic filters', 'Free tools access'],
      highlighted: false
    },
    {
      name: 'Starter',
      price: '2,999',
      period: '/month',
      features: ['50 searches/month', 'All filters', 'Export to CSV', 'Email support'],
      highlighted: true
    },
    {
      name: 'Pro',
      price: '6,999',
      period: '/month',
      features: ['Unlimited searches', 'Priority support', 'API access', 'Custom reports'],
      highlighted: false
    }
  ]

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Simple, Honest Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Start free. Upgrade when you need more. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative rounded-3xl p-6 transition-all duration-300 ${
                plan.highlighted 
                  ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-2xl scale-105' 
                  : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-lg font-bold mb-2">{plan.name}</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm">PKR</span>
                <span className="text-4xl font-black">{plan.price}</span>
                <span className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-emerald-500'}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleViewPricing}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all shadow-lg hover:shadow-xl"
          >
            <span>View Full Pricing Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// INFLUENCER REGISTRATION SECTION
// ============================================================================
function InfluencerSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-200/50 to-fuchsia-200/50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-200/50 to-pink-200/50 rounded-full blur-3xl"></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl mb-6 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Are You an Influencer?
          </span>
        </h2>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          Join 1,800+ Pakistani creators. Get discovered by top brands. 
          <span className="font-semibold text-gray-800"> It's completely free.</span>
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[
            { icon: Eye, title: 'Get Discovered', desc: 'Brands actively searching for creators like you' },
            { icon: TrendingUp, title: 'Grow Faster', desc: 'More visibility means more collaborations' },
            { icon: DollarSign, title: 'Earn More', desc: 'Direct brand deals without agency fees' }
          ].map((item, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/register-influencer"
            className="group bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
          >
            Join as Influencer
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href="/influencer/login"
            className="bg-white hover:bg-gray-50 text-violet-600 font-semibold py-4 px-8 rounded-2xl border-2 border-violet-200 hover:border-violet-300 transition-all flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            Already Registered?
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FINAL CTA SECTION
// ============================================================================
function FinalCTASection() {
  const router = useRouter()

  const handleCTAClick = (ctaName: string, destination: string) => {
    trackCTAClick(ctaName, 'final_cta_section', destination)
    router.push(destination)
  }
  
  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2 rounded-full border border-white/20 mb-8">
          <Rocket className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Ready to Get Started?</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Your Perfect Influencer is
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            30 Seconds Away
          </span>
        </h2>

        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Join 100+ Pakistani brands already finding verified influencers with Infoishai.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={() => handleCTAClick('Start Free Final', '/login')}
            className="group bg-white hover:bg-gray-100 text-gray-900 font-bold py-5 px-10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center gap-3"
          >
            <span className="text-lg">Start Your Free Search</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => handleCTAClick('View Pricing Final', '/pricing')}
            className="group border-2 border-white/30 hover:bg-white/10 text-white font-semibold py-5 px-10 rounded-2xl transition-all flex items-center justify-center gap-3"
          >
            <Eye className="w-5 h-5" />
            <span>View Pricing</span>
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-gray-400">
          {[
            { icon: CheckCircle, text: 'Free forever plan' },
            { icon: Shield, text: 'No credit card required' },
            { icon: Clock, text: 'Setup in 30 seconds' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <item.icon className="w-5 h-5 text-emerald-400" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// USER DASHBOARD SECTION (Authenticated Users)
// ============================================================================
function UserDashboardSection({ user }: { user: User }) {
  const router = useRouter()

  const getSearchesRemaining = () => {
    if (!user) return 0
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'developer') return 'unlimited'
    return Math.max(0, user.search_limit - user.monthly_searches)
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.full_name || 'User'}
                  className="w-16 h-16 rounded-2xl border-2 border-blue-100 object-cover shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.full_name?.split(' ')[0] || user.email.split('@')[0]}! 👋
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                    user.subscription_tier === 'pro' || user.subscription_tier === 'developer' 
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700' 
                      : user.subscription_tier === 'starter'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.subscription_tier === 'pro' ? '👑 Pro' : 
                     user.subscription_tier === 'starter' ? '⚡ Starter' : 
                     user.subscription_tier === 'developer' ? '🔧 Developer' : '🆓 Free'}
                  </span>
                  <span className="text-gray-500">
                    {getSearchesRemaining() === 'unlimited' 
                      ? '∞ searches remaining' 
                      : `${getSearchesRemaining()} searches left this month`}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/search')}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
              <Search className="w-5 h-5" />
              <span>Search Influencers</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Searches Used', value: user.monthly_searches, icon: Search, color: 'blue' },
            { label: 'Remaining', value: getSearchesRemaining() === 'unlimited' ? '∞' : getSearchesRemaining(), icon: Zap, color: 'emerald' },
            { label: 'Influencers', value: '1,800+', icon: Users, color: 'violet' },
            { label: 'Platforms', value: '3', icon: Layers, color: 'amber' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className={`w-10 h-10 bg-${stat.color}-100 rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Upgrade CTA */}
        {user.subscription_tier === 'free' && (
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Crown className="w-7 h-7 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Upgrade for Unlimited Power</h3>
                  <p className="text-blue-100">Get unlimited searches, CSV export, and priority support.</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full sm:w-auto bg-white text-blue-600 font-bold py-4 px-8 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                View Plans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
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
    return () => window.removeEventListener('searchCompleted', handleSearchUpdate as EventListener)
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

  if (isLoading) return <LoadingFallback />

  return (
    <>
      <Head>
        <title>Find Verified Pakistani Influencers That Convert | Infoishai</title>
        <meta name="description" content="AI-powered influencer search for brands, agencies & startups in Pakistan. 1,800+ verified creators on Instagram, YouTube, TikTok. Stop wasting time on fake followers. Try free." />
        <meta name="keywords" content="Pakistani influencers, find influencers Pakistan, Instagram influencers Pakistan, YouTube creators Pakistan, TikTok influencers, influencer marketing Pakistan, verified influencers" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://infoishai.com" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Find Verified Pakistani Influencers That Convert | Infoishai" />
        <meta property="og:description" content="AI-powered influencer search. 1,800+ verified Pakistani creators. Stop wasting time on fake followers." />
        <meta property="og:url" content="https://infoishai.com" />
        <meta property="og:image" content="https://infoishai.com/og-image.jpg" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Find Verified Pakistani Influencers That Convert" />
        <meta name="twitter:description" content="AI-powered influencer search. 1,800+ verified Pakistani creators." />
      </Head>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Infoishai",
            "description": "AI-powered influencer discovery platform for Pakistan",
            "url": "https://infoishai.com",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": "0",
              "highPrice": "6999",
              "priceCurrency": "PKR"
            }
          })
        }}
      />

      <Header />

      {user ? (
        <>
          <UserDashboardSection user={user} />
          <FeaturesSection />
          <FreeToolsSection />
        </>
      ) : (
        <>
          <LandingHeroSection />
          <ProblemSection />
          <HowItWorksSection />
          <FreeToolsSection />
          <FeaturesSection />
          <SocialProofSection />
          <PricingPreviewSection />
          <InfluencerSection />
          <FinalCTASection />
        </>
      )}
    </>
  )
}