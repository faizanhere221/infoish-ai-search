'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Search, ArrowRight, CheckCircle, Shield, Zap, Star, Users, DollarSign, MessageSquare,
  ChevronRight, Sparkles, Target, Clock, BadgeCheck, Eye, Rocket, Layers, AlertTriangle, 
  TrendingDown, Lock, FileCheck, Handshake, BarChart3, Youtube, Twitter, Linkedin, Mail, Mic, Github
} from 'lucide-react'

// ============================================================================
// PROBLEM SECTION
// ============================================================================
export function ProblemSection() {
  const problems = [
    { icon: AlertTriangle, title: "Finding Quality Creators is Hard", description: "Endless scrolling through social media. No way to verify engagement or audience quality.", stat: "10+", statLabel: "hours wasted weekly", color: "red" },
    { icon: Shield, title: "Payment Risks & Scams", description: "Pay upfront and hope for delivery? No protection when things go wrong.", stat: "30%", statLabel: "deals have issues", color: "orange" },
    { icon: MessageSquare, title: "Communication Chaos", description: "DMs across 5 platforms, emails, WhatsApp... Conversations get lost.", stat: "70%", statLabel: "messages missed", color: "amber" },
    { icon: DollarSign, title: "Agency Middlemen", description: "Agencies charge 30-50% commission. That's money that should go to creators.", stat: "50%", statLabel: "wasted on fees", color: "purple" }
  ]

  const colorClasses: Record<string, { bg: string; border: string; icon: string; stat: string }> = {
    red: { bg: 'bg-red-50', border: 'border-red-100', icon: 'bg-red-100 text-red-600', stat: 'text-red-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'bg-orange-100 text-orange-600', stat: 'text-orange-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'bg-amber-100 text-amber-600', stat: 'text-amber-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'bg-purple-100 text-purple-600', stat: 'text-purple-600' }
  }

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-2 rounded-full mb-6">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">The Problem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Creator Sponsorships Are <span className="text-red-500">Broken</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Brands and creators waste time, money, and opportunities with the current broken system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((problem, index) => {
            const colors = colorClasses[problem.color]
            return (
              <div key={index} className={`${colors.bg} ${colors.border} border-2 rounded-3xl p-6 sm:p-8 hover:shadow-xl transition-all duration-300 group`}>
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

        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 px-8 py-6 rounded-3xl">
            <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-gray-900">There's a better way.</h3>
              <p className="text-emerald-700">Infoishai solves all of this with a secure marketplace.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// HOW IT WORKS SECTION
// ============================================================================
export function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<'brand' | 'creator'>('brand')
  const [activeStep, setActiveStep] = useState(0)

  const brandSteps = [
    { number: "01", title: "Search & Discover", description: "Find verified tech creators by niche, platform, audience size, and engagement rate.", icon: Search, color: "from-violet-500 to-purple-500" },
    { number: "02", title: "Send Proposal", description: "Review profiles, check ratings, and send detailed collaboration proposals.", icon: MessageSquare, color: "from-blue-500 to-cyan-500" },
    { number: "03", title: "Secure Payment", description: "Pay through our escrow system. Funds are held safely until work is approved.", icon: Shield, color: "from-emerald-500 to-teal-500" },
    { number: "04", title: "Get Results", description: "Review deliverables, request revisions if needed, and release payment when satisfied.", icon: CheckCircle, color: "from-amber-500 to-orange-500" }
  ]

  const creatorSteps = [
    { number: "01", title: "Create Profile", description: "Showcase your content, platforms, audience stats, and services with pricing.", icon: Users, color: "from-violet-500 to-purple-500" },
    { number: "02", title: "Get Discovered", description: "Brands find you based on your niche, engagement, and past work.", icon: Eye, color: "from-blue-500 to-cyan-500" },
    { number: "03", title: "Accept Deals", description: "Review proposals, negotiate terms, and accept projects that fit your brand.", icon: Handshake, color: "from-emerald-500 to-teal-500" },
    { number: "04", title: "Get Paid", description: "Deliver content, get approval, and receive secure payment. No chasing invoices.", icon: DollarSign, color: "from-amber-500 to-orange-500" }
  ]

  const steps = activeTab === 'brand' ? brandSteps : creatorSteps

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((prev) => (prev + 1) % steps.length), 4000)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-6">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simple, Secure, <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">Effective</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Whether you're a brand or creator, getting started takes minutes.
          </p>

          <div className="inline-flex bg-gray-100 rounded-2xl p-1.5">
            <button onClick={() => { setActiveTab('brand'); setActiveStep(0) }} className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'brand' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-600 hover:text-gray-900'}`}>For Brands</button>
            <button onClick={() => { setActiveTab('creator'); setActiveStep(0) }} className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === 'creator' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-600 hover:text-gray-900'}`}>For Creators</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`relative p-6 rounded-3xl transition-all duration-500 cursor-pointer ${activeStep === index ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl scale-105' : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-lg'}`}
              onClick={() => setActiveStep(index)}
            >
              <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold ${activeStep === index ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
                Step {step.number}
              </div>
              <div className="pt-4">
                <div className={`w-14 h-14 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mb-5`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${activeStep === index ? 'text-white' : 'text-gray-900'}`}>{step.title}</h3>
                <p className={`text-sm ${activeStep === index ? 'text-gray-300' : 'text-gray-600'}`}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/signup" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FEATURES SECTION
// ============================================================================
export function FeaturesSection() {
  const features = [
    { icon: BadgeCheck, title: "Verified Creators Only", description: "Every creator is vetted for authentic engagement, real audience, and quality content.", gradient: "from-emerald-500 to-teal-500" },
    { icon: Shield, title: "Escrow Payment Protection", description: "Funds held securely until work is delivered and approved. Protection for both parties.", gradient: "from-blue-500 to-cyan-500" },
    { icon: Target, title: "Tech-Focused Marketplace", description: "Built specifically for AI, SaaS, DevTools, and tech brands. No lifestyle influencers here.", gradient: "from-violet-500 to-purple-500" },
    { icon: MessageSquare, title: "Built-in Messaging", description: "All communication in one place. No more scattered DMs across platforms.", gradient: "from-pink-500 to-rose-500" },
    { icon: FileCheck, title: "Contract & Deliverables", description: "Clear scope, deadlines, and deliverables. Track progress and manage revisions.", gradient: "from-amber-500 to-orange-500" },
    { icon: BarChart3, title: "Performance Analytics", description: "Track campaign performance, creator ratings, and ROI all in one dashboard.", gradient: "from-indigo-500 to-blue-500" }
  ]

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-700">Platform Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">Succeed</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group bg-white p-8 rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// PRICING SECTION
// ============================================================================
export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full mb-6">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Simple Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">No Subscriptions. No Hidden Fees.</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Free to join for both brands and creators. We only make money when deals happen.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-3xl p-8 border-2 border-violet-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">For Brands</h3>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900">Free</span>
                <span className="text-gray-500">to browse & message</span>
              </div>
              <p className="text-violet-600 font-semibold mt-2">10% fee on completed deals</p>
            </div>
            <ul className="space-y-4 mb-8">
              {['Unlimited creator search', 'Direct messaging', 'Escrow payment protection', 'Contract management', 'Revision requests', 'Performance tracking'].map((f, i) => (
                <li key={i} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /><span className="text-gray-700">{f}</span></li>
              ))}
            </ul>
            <Link href="/signup?type=brand" className="block w-full text-center bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold py-4 rounded-2xl hover:shadow-lg transition-all">Start Finding Creators</Link>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border-2 border-emerald-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">For Creators</h3>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900">Free</span>
                <span className="text-gray-500">forever</span>
              </div>
              <p className="text-emerald-600 font-semibold mt-2">Keep 100% of your earnings</p>
            </div>
            <ul className="space-y-4 mb-8">
              {['Professional profile page', 'Service & pricing showcase', 'Portfolio display', 'Verified badge eligibility', 'Secure payment receipt', 'Review & rating system'].map((f, i) => (
                <li key={i} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" /><span className="text-gray-700">{f}</span></li>
              ))}
            </ul>
            <Link href="/signup?type=creator" className="block w-full text-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-4 rounded-2xl hover:shadow-lg transition-all">Create Your Profile</Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> Secure payments powered by Stripe. Your money is always protected.
          </p>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// CREATOR CTA SECTION
// ============================================================================
export function CreatorCTASection() {
  return (
    <section id="for-creators" className="py-24 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-200/50 to-fuchsia-200/50 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-200/50 to-pink-200/50 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-violet-200 mb-6">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-700">For Tech Creators</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Monetize Your <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Tech Content</span>
            </h2>

            <p className="text-lg text-gray-600 mb-8">
              Join 2,000+ tech creators already earning from brand sponsorships. No more chasing payments or dealing with flaky brands.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Eye, title: 'Get Discovered', desc: 'Brands actively searching for you' },
                { icon: Shield, title: 'Secure Payments', desc: 'Escrow protection on every deal' },
                { icon: DollarSign, title: 'Keep 100%', desc: 'No platform fees for creators' },
                { icon: Star, title: 'Build Reputation', desc: 'Reviews boost your profile' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <item.icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup?type=creator" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all">
                Join as Creator <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Creator Success Stories</h3>
            <div className="space-y-6">
              {[
                { name: 'Alex Chen', niche: 'AI/ML', earnings: '$12,500', deals: 15 },
                { name: 'Sarah Dev', niche: 'SaaS Reviews', earnings: '$8,200', deals: 11 },
                { name: 'Mike Cloud', niche: 'DevOps', earnings: '$15,800', deals: 19 },
              ].map((creator, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-bold">
                    {creator.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{creator.name}</span>
                      <BadgeCheck className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-sm text-gray-500">{creator.niche}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{creator.earnings}</div>
                    <div className="text-xs text-gray-500">{creator.deals} deals</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// TESTIMONIALS SECTION
// ============================================================================
export function TestimonialsSection() {
  const testimonials = [
    { quote: "Finally found a platform that understands tech sponsorships. The creators here actually know our product space.", author: "Michael Torres", role: "Head of Marketing", company: "DevStack AI" },
    { quote: "The escrow system gave me confidence to accept bigger deals. No more chasing invoices or worrying about payment.", author: "Jessica Lin", role: "Tech YouTuber", company: "450K subscribers" },
    { quote: "We've done 15+ deals through Infoishai. The quality of creators and the ROI has been consistently excellent.", author: "Ryan Cooper", role: "CEO", company: "CloudAPI" }
  ]

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-full mb-6">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span className="text-sm font-semibold text-amber-700">Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Loved by Brands & Creators</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <div key={index} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />)}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t.author}</div>
                  <div className="text-sm text-gray-500">{t.role}, {t.company}</div>
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
// FINAL CTA SECTION
// ============================================================================
export function FinalCTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2 rounded-full border border-white/20 mb-8">
          <Rocket className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Ready to Get Started?</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Start Building <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Partnerships Today</span>
        </h2>

        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Join the marketplace trusted by 300+ tech brands and 2,000+ creators. Free to start. No credit card required.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/signup?type=brand" className="group bg-white hover:bg-gray-100 text-gray-900 font-bold py-5 px-10 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3">
            <span className="text-lg">I'm a Brand</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/signup?type=creator" className="group border-2 border-white/30 hover:bg-white/10 text-white font-semibold py-5 px-10 rounded-2xl transition-all flex items-center justify-center gap-3">
            <Users className="w-5 h-5" />
            <span>I'm a Creator</span>
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-gray-400">
          {[
            { icon: CheckCircle, text: 'Free to join' },
            { icon: Shield, text: 'Escrow protection' },
            { icon: Clock, text: 'Setup in 5 minutes' }
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
// FOOTER
// ============================================================================
export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Infoishai</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">The marketplace connecting tech brands with authentic content creators for sponsorships that convert.</p>
            <div className="flex gap-3">
              <a href="https://twitter.com/infoishai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="https://linkedin.com/company/infoishai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="https://youtube.com/@infoishai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/creators" className="hover:text-white transition-colors">Find Creators</Link></li>
              <li><Link href="/signup?type=creator" className="hover:text-white transition-colors">Become a Creator</Link></li>
              <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="/trust" className="hover:text-white transition-colors">Trust & Safety</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Infoishai. All rights reserved.</p>
          <p className="text-gray-500 text-sm">Made with ❤️ for the tech community</p>
        </div>
      </div>
    </footer>
  )
}