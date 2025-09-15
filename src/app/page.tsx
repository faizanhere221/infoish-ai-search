'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
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
  Eye
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
            Loading Pakistani Influencer Search
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

// Hero Section for Landing Page
function LandingHeroSection() {
  const router = useRouter()
  const [currentStat, setCurrentStat] = useState(0)

  const stats = [
    { number: "1,800+", label: "Pakistani Creators", icon: "👥" },
    { number: "15+", label: "Categories", icon: "📂" },
    { number: "3", label: "Major Platforms", icon: "📱" },
    { number: "Real-time", label: "Data Updates", icon: "⚡" }
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
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float">
        <Search className="w-8 h-8 text-blue-600" />
      </div>
      <div className="absolute top-40 right-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
        <BarChart3 className="w-8 h-8 text-purple-600" />
      </div>
      <div className="absolute bottom-40 left-20 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-float" style={{ animationDelay: '2s' }}>
        <Users className="w-8 h-8 text-green-600" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-12">
          {/* Main Headline */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-white/50 shadow-lg">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Where AI meets influence
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 text-balance leading-tight">
              Find the {' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Influencers
              </span>
              <br />
              Who Grow Your Brand
              <br />
              With {' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                 AI Search
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto text-balance leading-relaxed">
              Connect with 1,800+ verified Pakistani content creators across Instagram, YouTube, and TikTok. 
              <span className="font-semibold text-gray-800"> Advanced AI search, real-time analytics, instant results.</span>
            </p>
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/login')}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-5 px-10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <span className="text-lg">Start Free Search</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="group bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 font-bold py-5 px-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-3"
              >
                <PlayCircle className="w-6 h-6 text-blue-600" />
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
                <span className="text-sm font-medium text-gray-600">Free account • No credit card required</span>
              </div>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-sm text-gray-600 ml-2">AI-Powered Search</span>
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

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: "AI-Powered Search",
      description: "Advanced semantic search finds creators by content style, audience demographics, and engagement patterns - not just keywords.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      stats: "99.2% accuracy"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Follower counts, engagement rates, audience insights, and performance trends are updated.",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      stats: "Updated Data"
    },
    {
      icon: Shield,
      title: "Verified Creators",
      description: "Every profile verified with authentic contact information, active social presence, and engagement validation.",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      stats: "100% verified"
    },
    {
      icon: Target,
      title: "Precise Targeting",
      description: "Filter by platforms, niche, followers, verified status, audience size and content type.",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      stats: "50+ filters"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get comprehensive influencer matches in under 3 seconds with our optimized search infrastructure.",
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      stats: "<3s response"
    },
    {
      icon: Globe,
      title: "Pakistan Focus",
      description: "Specialized database covering all major Pakistani influencers with deep local market understanding and cultural context.",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      stats: "15+ cities"
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
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-3 rounded-full mb-6">
            <Award className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Industry-Leading Platform</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Why Choose Our Platform?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built specifically for the Businesses to do influencer marketing with advanced AI Powered Search and deep local insights
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
            Watch how easy it is to find and connect with Pakistani influencers of any niche
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
                infoish.com
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

// Pricing Preview Section
function PricingPreviewSection() {
  const router = useRouter()
  
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/50 relative">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">PKR 0</div>
              <p className="text-gray-600 mb-6">Perfect for trying out</p>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">10 searches per month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">5 results per search</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Basic influencer data</span>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Start Free
              </button>
            </div>
          </div>

          {/* Starter Plan */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border-2 border-blue-500 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                Most Popular
              </span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="text-4xl font-bold text-gray-900 mb-1">PKR 2,999</div>
              <div className="text-gray-600 mb-6">/month</div>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">30 searches per month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Unlimited results</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Export to CSV/Excel</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Advanced filters</span>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/pricing')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/50 relative">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <div className="text-4xl font-bold text-gray-900 mb-1">PKR 6,999</div>
              <div className="text-gray-600 mb-6">/month</div>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Unlimited Searches</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Unlimited Results</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Export to CSV/Excel</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Direct Consultation</span>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/pricing')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/pricing')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            View detailed pricing
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

// Final CTA Section
function FinalCTASection() {
  const router = useRouter()
  
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-white rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white rounded-full mix-blend-overlay filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold text-white">Grow with AI-Search</span>
          </div>
          
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Find Your Perfect Influencers?
          </h2>
          
          <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Start discovering Pakistani creators who align with your brand values and audience. 
            <span className="font-semibold text-white"> Get your first results in under 30 seconds.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button
              onClick={() => router.push('/login')}
              className="group bg-white hover:bg-gray-50 text-blue-600 font-bold py-5 px-10 rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <span className="text-lg">Start Free Search Now</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => router.push('/pricing')}
              className="group border-2 border-white hover:bg-white hover:text-blue-600 text-white font-bold py-5 px-10 rounded-2xl transition-all flex items-center justify-center gap-3"
            >
              <Eye className="w-6 h-6" />
              <span className="text-lg">View Pricing Plans</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">Free</div>
              <div className="text-blue-100 text-sm">No credit card required</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">30s</div>
              <div className="text-blue-100 text-sm">Average search time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-100 text-sm">Real-time data updates</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// User Dashboard Section (for authenticated users)
function UserDashboardSection({ user }: { user: User }) {
  const router = useRouter()

  const getSearchesRemaining = () => {
    if (!user) return 0
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'developer') return 'unlimited'
    return Math.max(0, user.search_limit - user.monthly_searches)
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16 sm:py-24">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-12">
          {/* User-specific greeting */}
          <div className="relative bg-white/90 backdrop-blur-md rounded-3xl p-8 max-w-4xl mx-auto border border-white/50 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name || 'User'}
                    className="w-20 h-20 rounded-2xl border-4 border-gradient-to-r from-green-300 to-emerald-300 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Welcome back, {user.full_name?.split(' ')[0] || user.email.split('@')[0]}!
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    user.subscription_tier === 'developer' ? 'bg-green-100 text-green-800' :
                    user.subscription_tier === 'pro' ? 'bg-purple-100 text-purple-800' :
                    user.subscription_tier === 'starter' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.subscription_tier === 'developer' ? 'Developer Account' :
                     user.subscription_tier === 'pro' ? 'Pro Account' :
                     user.subscription_tier === 'starter' ? 'Starter Account' :
                     'Free Account'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/search')}
                disabled={getSearchesRemaining() === 0 && user.subscription_tier === 'free'}
                className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  getSearchesRemaining() === 0 && user.subscription_tier === 'free'
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {getSearchesRemaining() === 0 && user.subscription_tier === 'free' ? 'Limit Reached' : 'Start Searching'}
              </button>
            </div>

            {/* Usage Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200/50">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {user.subscription_tier === 'pro' || user.subscription_tier === 'developer' ? 
                    user.monthly_searches : 
                    `${user.monthly_searches}/${user.search_limit}`
                  }
                </div>
                <div className="text-sm text-blue-700 font-medium">Searches This Month</div>
              </div>

              {(user.subscription_tier === 'free' || user.subscription_tier === 'starter') && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 text-center border border-green-200/50">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {getSearchesRemaining()}
                  </div>
                  <div className="text-sm text-green-700 font-medium">Searches Remaining</div>
                </div>
              )}

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center border border-purple-200/50">
                <div className="text-3xl mb-2">
                  {user.subscription_tier === 'developer' ? '🔧' :
                   user.subscription_tier === 'pro' ? '👑' :
                   user.subscription_tier === 'starter' ? '⚡' : '🆓'}
                </div>
                <div className="text-sm text-purple-700 font-medium">
                  {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)} Plan
                </div>
              </div>
            </div>
          </div>

          {/* Main headline for authenticated users */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 text-balance">
              
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Influencer Marketing 
              </span>
              <br />
              Powered by AI
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto text-balance">
              Search through 1,800+ verified Pakistani content creators with your personalized dashboard.
            </p>
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
    return <LoadingFallback />
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
            "name": user ? "Pakistani Influencer Search - Dashboard" : "Pakistani Influencer Search - Find Creators",
            "description": "Find and connect with 1800+ verified Pakistani influencers and content creators",
            "url": "https://infoish-ai-search.vercel.app",
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "Pakistani Influencer Search Platform",
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
          <FeaturesSection />
          <DemoSection />
          <PricingPreviewSection />
          <FinalCTASection />
        </>
      )}
    </>
  )
}