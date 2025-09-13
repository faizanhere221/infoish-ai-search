// src/app/page.tsx - Updated with authentication
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Your existing components
const EnhancedInfluencerSearch = dynamic(
  () => import('@/app/search/page'),
  {
    loading: () => <LoadingFallback />,
    ssr: false, // Changed to false for client-side auth check
  }
)

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        {/* Animated logo/spinner */}
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

        {/* Loading text */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Loading Pakistani Influencer Search
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Preparing your personalized dashboard...
          </p>
          
          {/* Loading progress indicators */}
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

// Updated Hero Section with authentication
function HeroSection() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16 sm:py-24">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Main headline - Updated for Pakistani focus */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 text-balance">
              Find Pakistani{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Influencers
              </span>
              <br />
              Made Simple
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto text-balance">
              Discover and connect with 1800+ verified Pakistani content creators across Instagram, YouTube, and TikTok.
            </p>
          </div>

          {/* Updated statistics for Pakistani focus */}
          <div className="flex flex-wrap justify-center gap-8 pt-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600">1800+</div>
              <div className="text-gray-600 font-medium">Pakistani Creators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600">10+</div>
              <div className="text-gray-600 font-medium">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-green-600">Real-time</div>
              <div className="text-gray-600 font-medium">Updated Data</div>
            </div>
          </div>

          {/* CTA section with auth-aware button */}
          <div className="pt-8">
            <div className="space-y-4">
              {!isLoading && (
                <button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Sign In with Google'}
                </button>
              )}
              
              <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-1 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Live Database</span>
                </div>
                <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Free searches included
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component
export default function HomePage() {
  const [showLanding, setShowLanding] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('auth_token')
    if (token) {
      // User is logged in, they can see the landing page but should be able to go to dashboard
      setShowLanding(true)
    } else {
      // User not logged in, show landing page
      setShowLanding(true)
    }
  }, [])

  return (
    <>
      {/* JSON-LD Structured Data - Updated for Pakistani focus */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Pakistani Influencer Search - Home",
            "description": "Find and connect with 300+ verified Pakistani influencers and content creators",
            "url": "https://your-domain.com",
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

      {/* Updated Hero Section */}
      <HeroSection />

      {/* Your existing search component - but with auth awareness */}
      <Suspense fallback={<LoadingFallback />}>
        <div className="relative">
          <EnhancedInfluencerSearch />
        </div>
      </Suspense>

      {/* Updated Features Section for Pakistani focus */}
      <section className="py-16 sm:py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The most comprehensive database of Pakistani influencers with advanced search and filtering capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 - Updated for your hybrid search */}
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Hybrid Search Technology</h3>
              <p className="text-gray-600">
                Advanced keyword matching combined with semantic search to find exactly the right Pakistani creators for your needs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Analytics</h3>
              <p className="text-gray-600">
                Complete follower counts, engagement rates, and performance metrics across Instagram, YouTube, and TikTok.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pakistani Focus</h3>
              <p className="text-gray-600">
                Specialized database covering all major Pakistani cities - from Karachi and Lahore to Islamabad and beyond.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Updated CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Find Your Perfect Pakistani Influencer?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join marketers and brands who trust our platform to discover authentic Pakistani content creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/login')}
              className="bg-white text-blue-600 font-semibold py-4 px-8 rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="border-2 border-white text-white font-semibold py-4 px-8 rounded-xl hover:bg-white hover:text-blue-600 transition-all"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </section>
    </>
  )
}