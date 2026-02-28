'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Shield, Zap, Star, Users, BadgeCheck, ArrowUpRight, Search, Youtube, Twitter, Code, Cpu } from 'lucide-react'

function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }: { 
  end: number; duration?: number; suffix?: string; prefix?: string 
}) {
  const [count, setCount] = useState(0)
  const countRef = useRef<HTMLSpanElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true)
    }, { threshold: 0.1 })
    if (countRef.current) observer.observe(countRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return <span ref={countRef}>{prefix}{count.toLocaleString()}{suffix}</span>
}

export function HeroSection() {
  const featuredCreators = [
    { name: 'Alex Chen', niche: 'AI/ML', followers: '125K' },
    { name: 'Sarah Dev', niche: 'SaaS', followers: '89K' },
    { name: 'Mike Cloud', niche: 'DevOps', followers: '210K' },
  ]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-violet-50/30 to-blue-50/30">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-r from-violet-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Floating Icons */}
        <div className="absolute top-32 left-[10%] animate-bounce hidden lg:block">
          <div className="w-14 h-14 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl flex items-center justify-center border border-gray-100">
            <Youtube className="w-7 h-7 text-red-500" />
          </div>
        </div>
        <div className="absolute top-48 right-[15%] animate-bounce hidden lg:block" style={{ animationDelay: '0.5s' }}>
          <div className="w-14 h-14 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl flex items-center justify-center border border-gray-100">
            <Twitter className="w-7 h-7 text-blue-500" />
          </div>
        </div>
        <div className="absolute bottom-32 left-[15%] animate-bounce hidden lg:block" style={{ animationDelay: '1s' }}>
          <div className="w-12 h-12 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg flex items-center justify-center border border-gray-100">
            <Code className="w-6 h-6 text-violet-500" />
          </div>
        </div>
        <div className="absolute bottom-48 right-[10%] animate-bounce hidden lg:block" style={{ animationDelay: '1.5s' }}>
          <div className="w-12 h-12 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg flex items-center justify-center border border-gray-100">
            <Cpu className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-32 pb-16 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl px-5 py-2.5 rounded-full border border-gray-200/50 shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-gray-700">
                <span className="text-emerald-600">2,000+</span> verified tech creators ready to collaborate
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Connect with Tech Creators
                <br />
                <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Who Drive Real Results
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
                The marketplace where <span className="font-semibold text-gray-800">AI, SaaS, and developer tool brands</span> find 
                verified tech content creators for authentic sponsorships that convert.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup?type=brand"
                className="group relative bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl shadow-violet-500/25 hover:shadow-2xl transition-all flex items-center justify-center gap-3 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative text-lg">I'm a Brand</span>
                <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/signup?type=creator"
                className="group bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-8 rounded-2xl border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Users className="w-5 h-5 text-violet-600" />
                <span>I'm a Creator</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-5 h-5 text-blue-500" />
                <span>Escrow protection</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>10% platform fee only</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative lg:pl-8">
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-200">
                  infoishai.com/creators
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <Search className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 font-medium">AI content creators with 50K+ followers</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium border border-violet-200">YouTube</span>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">AI/ML Niche</span>
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200">4.8+ Rating</span>
                </div>

                <div className="space-y-3 pt-2">
                  {featuredCreators.map((creator, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-violet-50/50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                        {creator.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{creator.name}</span>
                          <BadgeCheck className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-sm text-gray-500">{creator.niche} Creator</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{creator.followers}</div>
                        <div className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> 4.9
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 pt-12 border-t border-gray-200/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 2000, suffix: '+', label: 'Verified Creators' },
              { value: 300, suffix: '+', label: 'Tech Brands' },
              { value: 500, prefix: '$', suffix: 'K+', label: 'Deals Completed' },
              { value: 4.9, suffix: '/5', label: 'Avg Rating' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}