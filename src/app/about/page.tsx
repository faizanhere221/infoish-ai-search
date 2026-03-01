import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Users, 
  Search, 
  BarChart3, 
  Shield, 
  Target, 
  Zap, 
  Globe, 
  TrendingUp,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Youtube,
  Twitter,
  Linkedin,
  Github,
  Mail,
  Mic,
  BookOpen,
  Wrench,
  Menu,
  X
} from 'lucide-react'
import { Navigation, Footer } from '@/components/landing'

// ============================================================================
// SEO METADATA
// ============================================================================
export const metadata: Metadata = {
  title: 'About Infoishai - Tech Influencer Marketplace | Find AI & SaaS Creators',
  description: 'Learn about Infoishai, the #1 tech influencer marketplace. We connect B2B brands with verified AI, SaaS, and developer content creators across YouTube, Twitter, LinkedIn, and more.',
  keywords: [
    'about infoishai',
    'tech influencer platform',
    'b2b creator marketplace',
    'ai influencer marketing',
    'saas content creators',
    'developer influencers',
    'tech creator discovery',
  ],
  openGraph: {
    title: 'About Infoishai - Tech Influencer Marketplace',
    description: 'The #1 marketplace connecting B2B brands with verified tech creators. 2,000+ creators across AI, SaaS, DevOps, and more.',
    url: 'https://infoishai.com/about',
  },
}

// ============================================================================
// TEAM DATA - UPDATE THESE WITH YOUR REAL SOCIAL LINKS
// ============================================================================
const team = [
  {
    name: 'Faizan Islam',
    role: 'Founder & CEO',
    bio: 'CS student at BZU, President of Zakariyan Tech Society. Building the future of creator economy.',
    image: '/images/team/founder.jpg',
    linkedin: 'https://www.linkedin.com/in/faizan-islam-here/', // UPDATE THIS
    twitter: 'https://twitter.com/faizanhere221', // UPDATE THIS
  },
  {
    name: 'Farhan',
    role: 'Co-Founder & CTO',
    bio: 'Full-stack developer with expertise in Next.js, Python, and AI. Building scalable tech solutions.',
    image: '/images/team/cto.jpg',
    linkedin: 'https://www.linkedin.com/in/farhan-cto/', // UPDATE THIS
    twitter: 'https://twitter.com/farhan', // UPDATE THIS
  },
  {
    name: 'Israr',
    role: 'Digital Marketing Expert',
    bio: 'Growth specialist helping creators and brands maximize their reach and engagement.',
    image: '/images/team/marketing.jpg',
    linkedin: 'https://www.linkedin.com/in/israr-marketing/', // UPDATE THIS
    twitter: 'https://twitter.com/israr', // UPDATE THIS
  },
]

// ============================================================================
// STATS DATA
// ============================================================================
const stats = [
  { value: '2,000+', label: 'Verified Creators', icon: Users },
  { value: '6', label: 'Platforms Covered', icon: Globe },
  { value: '50M+', label: 'Total Audience Reach', icon: TrendingUp },
  { value: '15+', label: 'Tech Niches', icon: Target },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-violet-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>#1 Tech Creator Marketplace</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              About{' '}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                Infoishai
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
              We're revolutionizing how <strong>B2B tech brands</strong> connect with content creators. 
              Our AI-powered marketplace makes finding <strong>AI, SaaS, and developer influencers</strong> 
              fast, transparent, and results-driven.
            </p>

            {/* Platform Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                { icon: Youtube, name: 'YouTube', color: 'bg-red-500' },
                { icon: Twitter, name: 'Twitter/X', color: 'bg-gray-900' },
                { icon: Linkedin, name: 'LinkedIn', color: 'bg-blue-600' },
                { icon: Github, name: 'GitHub', color: 'bg-gray-800' },
                { icon: Mail, name: 'Newsletter', color: 'bg-emerald-500' },
                { icon: Mic, name: 'Podcast', color: 'bg-purple-500' },
              ].map((platform, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
                  <div className={`w-6 h-6 ${platform.color} rounded-full flex items-center justify-center`}>
                    <platform.icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{platform.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-7 h-7 text-violet-600" />
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To become the <strong>world's leading marketplace for tech influencers</strong>. 
                We believe every B2B brand—from early-stage startups to enterprise companies—deserves 
                access to authentic creators who can communicate complex products simply.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Traditional influencer marketing focuses on lifestyle and consumer brands. 
                We focus exclusively on <strong>technology: AI, SaaS, DevOps, cybersecurity, 
                developer tools, and startups</strong>. This specialization means better matches, 
                higher engagement, and real business results.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                  Tech-Focused
                </span>
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  B2B Specialized
                </span>
                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  Verified Creators
                </span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-violet-100 to-blue-100 rounded-3xl p-8 lg:p-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">What Makes Us Different</h3>
              <div className="space-y-6">
                {[
                  'Only tech & B2B creators (no lifestyle influencers)',
                  'Multi-platform: YouTube, Twitter, LinkedIn, GitHub, Newsletters, Podcasts',
                  'Verified metrics and authentic engagement',
                  'Escrow payment protection for safe deals',
                  'Direct messaging with creators',
                  'Free to join for both brands and creators',
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-12">
            Our Story
          </h2>
          
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-gray-100">
            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="text-lg leading-relaxed mb-6">
                Infoishai was born from frustration. As tech creators ourselves, we experienced 
                firsthand how broken the influencer marketing space was for technology products. 
                Brands were using platforms designed for beauty and fashion influencers to find 
                developers and AI experts. It didn't work.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                We realized that <strong>tech influencer marketing is fundamentally different</strong>. 
                A SaaS company doesn't need millions of followers—they need 10,000 developers who 
                trust a specific creator's recommendations. A startup launching an AI tool doesn't 
                need viral TikToks—they need thoughtful YouTube reviews from ML practitioners.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                So we built Infoishai: a marketplace specifically designed for tech creators and 
                B2B brands. We started by analyzing thousands of tech influencers across platforms, 
                verifying their metrics, and understanding their audiences.
              </p>
              <p className="text-lg leading-relaxed">
                Today, we have <strong>2,000+ verified tech creators</strong> across AI, SaaS, DevOps, 
                cybersecurity, and more. We're just getting started on our mission to become the 
                world's most trusted platform for tech influencer marketing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-12">
            Our Core Values
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Transparency',
                description: 'We provide accurate, verified data about every creator. No fake followers, no inflated metrics—just honest insights to help you make informed decisions.',
                color: 'bg-violet-100 text-violet-600',
              },
              {
                icon: Target,
                title: 'Precision',
                description: 'Our AI algorithms help you find the perfect creator match based on niche expertise, audience demographics, engagement quality, and content style.',
                color: 'bg-blue-100 text-blue-600',
              },
              {
                icon: Zap,
                title: 'Innovation',
                description: 'We continuously evolve our platform with cutting-edge features like AI-powered matching, cross-platform analytics, and predictive campaign insights.',
                color: 'bg-emerald-100 text-emerald-600',
              },
            ].map((value, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all text-center">
                <div className={`w-16 h-16 ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  <value.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Meet the Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're a small team of builders, creators, and marketers passionate about 
              connecting tech brands with authentic voices.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-gray-200 text-center hover:shadow-lg transition-all">
                {/* Team Image with gradient background fallback */}
                <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden border-4 border-violet-100 bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <Image 
                    src={member.image} 
                    alt={member.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-violet-600 font-medium mb-4">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{member.bio}</p>
                <div className="flex items-center justify-center gap-4">
                  <a 
                    href={member.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-violet-100 hover:text-violet-600 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a 
                    href={member.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-violet-100 hover:text-violet-600 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Brands Choose Infoishai
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: 'AI-Powered Discovery',
                description: 'Find the perfect tech creator in seconds with our advanced search and filtering.',
              },
              {
                icon: BarChart3,
                title: 'Verified Metrics',
                description: 'Every creator is manually verified. Real followers, real engagement, real results.',
              },
              {
                icon: Users,
                title: 'Tech-Only Focus',
                description: 'We specialize in AI, SaaS, DevOps, and developer content creators exclusively.',
              },
              {
                icon: Shield,
                title: 'Escrow Protection',
                description: 'Safe payments held until work is delivered and approved by both parties.',
              },
              {
                icon: Globe,
                title: 'Multi-Platform',
                description: 'YouTube, Twitter, LinkedIn, GitHub, Newsletters, Podcasts—all in one place.',
              },
              {
                icon: Zap,
                title: 'Direct Communication',
                description: 'Message creators directly. No middlemen, no delays, no complicated processes.',
              },
            ].map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-violet-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Find Your Perfect Tech Creator?
          </h2>
          <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of brands using Infoishai to connect with verified tech influencers. 
            Free to start, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/creators"
              className="w-full sm:w-auto px-8 py-4 bg-white text-violet-600 rounded-full font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              Browse Creators
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-full font-semibold text-lg hover:bg-white/20 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}