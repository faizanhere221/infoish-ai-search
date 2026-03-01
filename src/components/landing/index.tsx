'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Sparkles, 
  Search, 
  Shield, 
  Zap, 
  Users, 
  DollarSign,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  TrendingUp,
  Globe,
  MessageSquare,
  Briefcase,
  Youtube,
  Twitter,
  Linkedin,
  Github,
  Mail,
  Mic,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  FileText,
  Wrench,
  BookOpen
} from 'lucide-react'

// ============================================================================
// NAVIGATION
// ============================================================================
export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Infoishai</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/creators" className="text-gray-600 hover:text-gray-900 font-medium">
              Find Creators
            </Link>
            
            <Link href="/blog" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              Blog
            </Link>
            <Link href="/tools" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
              <Wrench className="w-4 h-4" />
              Tools
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium">
              About
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 bg-white">
            <div className="flex flex-col gap-4">
              <Link href="/creators" className="text-gray-600 hover:text-gray-900 font-medium py-2">
                Find Creators
              </Link>
              
              <Link href="/blog" className="text-gray-600 hover:text-gray-900 font-medium py-2">
                Blog
              </Link>
              <Link href="/tools" className="text-gray-600 hover:text-gray-900 font-medium py-2">
                Tools
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium py-2">
                About
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 font-medium py-2">
                Contact
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                <Link href="/login" className="text-center py-2 text-gray-600 font-medium">
                  Log in
                </Link>
                <Link 
                  href="/signup" 
                  className="text-center py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full font-medium"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

// ============================================================================
// HERO SECTION
// ============================================================================
export function HeroSection() {
  const stats = [
    { value: '2,000+', label: 'Tech Creators' },
    { value: '500+', label: 'Brands Trust Us' },
    { value: '$2M+', label: 'Creator Earnings' },
  ]

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-blue-50" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-violet-100/50 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>#1 Tech Influencer Marketplace</span>
          </div>

          {/* H1 - Main Keyword */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Find Tech Influencers
            <span className="block mt-2 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              Marketplace for B2B Brands
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover verified <strong>AI, SaaS, and tech creators</strong> for authentic sponsorships. 
            Connect with YouTube, Twitter, LinkedIn influencers. Escrow payment protection.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link 
              href="/creators"
              className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Find Tech Creators
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/signup/creator"
              className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold text-lg hover:border-violet-300 hover:bg-violet-50 transition-all"
            >
              Join as Creator
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Icons */}
        <div className="mt-16 flex items-center justify-center gap-8 opacity-60">
          <Youtube className="w-8 h-8 text-gray-400" />
          <Twitter className="w-8 h-8 text-gray-400" />
          <Linkedin className="w-8 h-8 text-gray-400" />
          <Github className="w-8 h-8 text-gray-400" />
          <Mail className="w-8 h-8 text-gray-400" />
          <Mic className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// TRUSTED BY SECTION
// ============================================================================
export function TrustedBySection() {
  const brands = [
    'Microsoft', 'Google', 'AWS', 'Vercel', 'Supabase', 'OpenAI', 'Stripe', 'MongoDB'
  ]

  return (
    <section className="py-12 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500 mb-8">TRUSTED BY LEADING TECH BRANDS</p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {brands.map((brand, index) => (
            <span key={index} className="text-xl font-semibold text-gray-300 hover:text-gray-400 transition-colors">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// PROBLEM SECTION
// ============================================================================
export function ProblemSection() {
  const problems = [
    {
      icon: Search,
      title: 'Hard to Find',
      description: 'Manually searching across platforms for tech creators wastes hours of valuable time.',
    },
    {
      icon: Shield,
      title: 'Fake Followers',
      description: '67% of influencers have fake followers. You need verified, authentic creators.',
    },
    {
      icon: DollarSign,
      title: 'Payment Risk',
      description: '45% of brand deals have payment disputes. Creators ghost or brands dont pay.',
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Finding Tech Influencers is Broken
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Startups, SaaS companies, and technology brands struggle to find creators who understand their products.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div key={index} className="p-8 bg-red-50 rounded-2xl border border-red-100">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <problem.icon className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{problem.title}</h3>
              <p className="text-gray-600">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// SOLUTION SECTION
// ============================================================================
export function SolutionSection() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-violet-600 to-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Infoishai Makes It Simple
          </h2>
          <p className="text-xl text-violet-100 max-w-2xl mx-auto">
            A tech influencers marketplace that helps brands discover verified creators, 
            analyze their audience, and collaborate directly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Search, title: 'Search 2,000+ Creators', desc: 'Filter by niche, platform, engagement' },
            { icon: CheckCircle, title: 'Verified Profiles', desc: 'Real metrics, authentic audiences' },
            { icon: Shield, title: 'Escrow Protection', desc: 'Safe payments for both sides' },
            { icon: MessageSquare, title: 'Direct Messaging', desc: 'Connect instantly with creators' },
          ].map((item, index) => (
            <div key={index} className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <item.icon className="w-10 h-10 text-white mb-4" />
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-violet-100 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// PLATFORM SECTION - Search by Platform
// ============================================================================
export function PlatformSection() {
  const platforms = [
    {
      icon: Youtube,
      name: 'YouTube',
      title: 'YouTube Tech Influencers',
      description: 'Product reviews, software tutorials, deep tech explanations, SaaS walkthroughs.',
      color: 'bg-red-500',
      creators: '800+',
    },
    {
      icon: Twitter,
      name: 'X (Twitter)',
      title: 'Twitter Tech Influencers',
      description: 'Product launches, SaaS growth discussions, AI tool recommendations, startup conversations.',
      color: 'bg-gray-900',
      creators: '600+',
    },
    {
      icon: Linkedin,
      name: 'LinkedIn',
      title: 'LinkedIn Tech Creators',
      description: 'B2B thought leadership, enterprise software, professional tech content.',
      color: 'bg-blue-600',
      creators: '400+',
    },
    {
      icon: Github,
      name: 'GitHub',
      title: 'Developer Influencers',
      description: 'Open source maintainers, dev tool reviews, technical tutorials.',
      color: 'bg-gray-800',
      creators: '200+',
    },
    {
      icon: Mail,
      name: 'Newsletter',
      title: 'Tech Newsletter Writers',
      description: 'Curated tech news, industry insights, developer resources.',
      color: 'bg-emerald-500',
      creators: '150+',
    },
    {
      icon: Mic,
      name: 'Podcast',
      title: 'Tech Podcast Hosts',
      description: 'Interview shows, tech discussions, startup stories.',
      color: 'bg-purple-500',
      creators: '100+',
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Search Tech Influencers by Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Different platforms serve different marketing goals. Find creators across all major channels.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform, index) => (
            <div key={index} className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center`}>
                  <platform.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
                  {platform.creators} creators
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{platform.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{platform.description}</p>
              <Link 
                href={`/creators?platform=${platform.name.toLowerCase()}`}
                className="inline-flex items-center text-violet-600 font-medium text-sm group-hover:gap-2 transition-all"
              >
                Browse {platform.name} Creators
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// CATEGORIES SECTION - Tech Influencer Categories
// ============================================================================
export function CategoriesSection() {
  const categories = [
    {
      title: 'AI Influencers',
      description: 'AI influencers create content about artificial intelligence tools, machine learning innovations, and emerging technologies.',
      icon: '🤖',
      count: '400+',
    },
    {
      title: 'SaaS Influencers',
      description: 'SaaS influencers focus on productivity tools, software platforms, and startup growth strategies.',
      icon: '☁️',
      count: '350+',
    },
    {
      title: 'Developer Influencers',
      description: 'Developer influencers create technical content for programmers and software engineers.',
      icon: '👨‍💻',
      count: '500+',
    },
    {
      title: 'Startup Influencers',
      description: 'Startup influencers share insights about entrepreneurship, business growth, and building companies.',
      icon: '🚀',
      count: '300+',
    },
    {
      title: 'DevOps Experts',
      description: 'DevOps creators cover cloud infrastructure, CI/CD, Kubernetes, and deployment strategies.',
      icon: '⚙️',
      count: '200+',
    },
    {
      title: 'Cybersecurity Creators',
      description: 'Security experts sharing ethical hacking, security tools, and best practices.',
      icon: '🔐',
      count: '150+',
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Top Tech Influencer Categories
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Technology influencers specialize in different niches. Discover creators across multiple tech categories.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link 
              key={index}
              href={`/creators?niche=${category.title.toLowerCase().replace(' ', '-')}`}
              className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{category.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                  <span className="text-sm text-violet-600">{category.count} creators</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{category.description}</p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/creators"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            Explore All Categories
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// HOW IT WORKS SECTION
// ============================================================================
export function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Define Your Niche',
      description: 'Determine whether you need AI creators, SaaS influencers, gadget reviewers, or startup experts.',
    },
    {
      step: '02',
      title: 'Filter by Audience',
      description: 'Look for influencers whose audience matches your target customers using our advanced filters.',
    },
    {
      step: '03',
      title: 'Analyze Engagement',
      description: 'Engagement rate often matters more than follower count. Review verified metrics.',
    },
    {
      step: '04',
      title: 'Review Content Quality',
      description: 'Evaluate the creators content style, storytelling ability, and credibility.',
    },
    {
      step: '05',
      title: 'Start Collaboration',
      description: 'Reach out directly through our platform and begin your partnership with escrow protection.',
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            How to Find Tech Influencers
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Finding the right tech influencer requires more than just checking follower counts. 
            Successful collaborations depend on audience relevance and engagement.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {steps.map((item, index) => (
            <div key={index} className="relative">
              <div className="text-6xl font-bold text-violet-500/20 mb-4">{item.step}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.description}</p>
              {index < steps.length - 1 && (
                <ChevronRight className="hidden md:block absolute top-8 -right-3 w-6 h-6 text-violet-500" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-violet-400 mb-4">Infoishai simplifies this entire process with AI-powered influencer discovery.</p>
          <Link 
            href="/creators"
            className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 text-white rounded-full font-semibold hover:bg-violet-700 transition-colors"
          >
            Start Finding Creators
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// WHY MARKETPLACE SECTION
// ============================================================================
export function WhyMarketplaceSection() {
  const benefits = [
    {
      icon: Zap,
      title: 'Instant Discovery',
      description: 'Instead of searching multiple platforms, discover relevant tech creators in seconds.',
    },
    {
      icon: Search,
      title: 'Advanced Filtering',
      description: 'Filter by niche, followers, engagement rate, audience demographics, and more.',
    },
    {
      icon: TrendingUp,
      title: 'Audience Insights',
      description: 'Analyze influencer audience demographics to ensure campaigns reach the right users.',
    },
    {
      icon: MessageSquare,
      title: 'Direct Collaboration',
      description: 'Connect quickly with creators without complex negotiation processes.',
    },
    {
      icon: Shield,
      title: 'Escrow Protection',
      description: 'Safe payments held until work is delivered and approved by both parties.',
    },
    {
      icon: Globe,
      title: 'Campaign Efficiency',
      description: 'Streamline campaign management and scale influencer marketing efficiently.',
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why Use a Tech Influencer Marketplace
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A dedicated influencer marketplace provides several advantages compared to manual influencer outreach.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <benefit.icon className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// COMPARISON SECTION
// ============================================================================
export function ComparisonSection() {
  return (
    <section className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Tech Influencers vs Traditional Advertising
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Influencer marketing has become one of the most effective digital marketing strategies for technology brands.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-2xl">
              <h3 className="text-xl font-bold mb-6 text-center">Influencer Marketing</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Authentic audience trust</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Niche communities</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>High engagement rates</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Creator storytelling</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Long-term relationships</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-gray-200 text-gray-600 rounded-2xl">
              <h3 className="text-xl font-bold mb-6 text-center text-gray-900">Traditional Ads</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Often ignored by users</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Broad targeting</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Expensive CPC</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Generic ad messaging</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>One-time impressions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// USE CASES SECTION
// ============================================================================
export function UseCasesSection() {
  const useCases = [
    {
      title: 'Product Launch Campaigns',
      description: 'Creators introduce new products to their engaged audience with authentic reviews.',
      icon: '🚀',
    },
    {
      title: 'Software Tutorials',
      description: 'Influencers demonstrate how to use tools and platforms with step-by-step guides.',
      icon: '📚',
    },
    {
      title: 'Product Reviews',
      description: 'Tech reviewers test and evaluate new devices, software, or SaaS products.',
      icon: '⭐',
    },
    {
      title: 'Startup Growth Marketing',
      description: 'Startups collaborate with influencers to build early awareness and credibility.',
      icon: '📈',
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How Brands Use Tech Influencers
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Technology companies use influencers in several ways to reach their target audience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <div key={index} className="p-6 bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-100">
              <span className="text-4xl mb-4 block">{useCase.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{useCase.title}</h3>
              <p className="text-gray-600 text-sm">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FAQ SECTION
// ============================================================================
export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'What is a tech influencer marketplace?',
      answer: 'A tech influencer marketplace is a platform that helps brands discover, analyze, and collaborate with influencers who create content related to technology, AI, SaaS, and developer tools.',
    },
    {
      question: 'How do brands find tech influencers?',
      answer: 'Brands can find tech influencers through influencer discovery platforms like Infoishai, which provides searchable creator databases with filters for niche, platform, engagement, and audience demographics.',
    },
    {
      question: 'How much do tech influencers charge?',
      answer: 'Pricing varies depending on follower count, engagement rate, and platform. Micro influencers (1K-10K) may charge $50-200, while large creators (100K+) may charge $2,500+ per campaign.',
    },
    {
      question: 'What platforms are best for tech influencers?',
      answer: 'YouTube, Twitter/X, LinkedIn, and newsletters are the most effective platforms for technology creators. YouTube works best for tutorials, Twitter for discussions, and newsletters for in-depth content.',
    },
    {
      question: 'Why should startups work with tech influencers?',
      answer: 'Tech influencers help startups build credibility, reach targeted audiences of developers and tech enthusiasts, and generate product awareness quickly through authentic recommendations.',
    },
    {
      question: 'How does escrow payment protection work?',
      answer: 'When a deal is agreed upon, the brand deposits funds into our secure escrow system. The money is held safely until the creator delivers the work and the brand approves it, protecting both parties.',
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about finding tech influencers.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
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
    <section className="py-20 lg:py-32 bg-gradient-to-br from-violet-600 to-blue-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-5xl font-bold mb-6">
          Ready to Find Your Perfect Tech Creator?
        </h2>
        <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
          Join 500+ brands using Infoishai to connect with verified tech influencers. 
          Free to start, no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-white text-violet-600 rounded-full font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            href="/creators"
            className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-full font-semibold text-lg hover:bg-white/20 transition-all"
          >
            Browse Creators
          </Link>
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
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Infoishai</span>
            </Link>
            <p className="text-sm mb-4 max-w-xs">
              The #1 tech influencer marketplace connecting AI, SaaS, and tech brands with verified content creators.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Youtube className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/creators" className="hover:text-white transition-colors">Find Creators</Link></li>
              <li><Link href="/signup/creator" className="hover:text-white transition-colors">Join as Creator</Link></li>
             
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/tools" className="hover:text-white transition-colors">Free Tools</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-sm text-center">
          <p>© {new Date().getFullYear()} Infoishai. All rights reserved. | Find Tech Influencers Marketplace</p>
        </div>
      </div>
    </footer>
  )
}