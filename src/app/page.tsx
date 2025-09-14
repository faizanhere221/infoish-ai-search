// src/app/page.tsx - UPDATED without search functionality

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'

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






// Updated Hero Section with user-specific content (NO SEARCH)
function HeroSection({ user }: { user: User | null }) {
  const router = useRouter()

  const getSearchesRemaining = () => {
    if (!user) return 0
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'developer') return 'unlimited'
    return Math.max(0, user.search_limit - user.monthly_searches)
  }

  const getUpgradeMessage = () => {
    if (!user) return null
    
    if (user.subscription_tier === 'free') {
      const remaining = getSearchesRemaining()
      if (remaining === 0) {
        return "You've used all your free searches this month. Upgrade to continue searching!"
      }
      return `You have ${remaining} free searches left this month.`
    }
    
    return null
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
          {/* User-specific greeting - Enhanced Design */}
{user && (
  <div className="relative bg-white/90 backdrop-blur-md rounded-3xl p-8 max-w-4xl mx-auto border border-white/50 shadow-xl">
    {/* Decorative elements */}
    <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl"></div>
    <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
    
    <div className="relative">
      {/* User Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {user.profile_picture ? (
            <div className="relative">
              <img
                src={user.profile_picture}
                alt={user.full_name || 'User'}
                className="w-20 h-20 rounded-2xl border-4 border-gradient-to-r from-green-300 to-emerald-300 object-cover shadow-lg"
              />
              {/* Tier badge on profile */}
              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                user.subscription_tier === 'developer' ? 'bg-green-500 text-white' :
                user.subscription_tier === 'pro' ? 'bg-purple-500 text-white' :
                user.subscription_tier === 'starter' ? 'bg-blue-500 text-white' :
                'bg-gray-400 text-white'
              }`}>
                {user.subscription_tier === 'developer' ? '🔧' :
                 user.subscription_tier === 'pro' ? '👑' :
                 user.subscription_tier === 'starter' ? '⚡' : '🆓'}
              </div>
            </div>
          ) : (
            <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {(user.full_name || user.email).charAt(0).toUpperCase()}
              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                user.subscription_tier === 'developer' ? 'bg-green-600' :
                user.subscription_tier === 'pro' ? 'bg-purple-600' :
                user.subscription_tier === 'starter' ? 'bg-blue-600' :
                'bg-gray-500'
              }`}>
                {user.subscription_tier === 'developer' ? '🔧' :
                 user.subscription_tier === 'pro' ? '👑' :
                 user.subscription_tier === 'starter' ? '⚡' : '🆓'}
              </div>
            </div>
          )}
          <div className="text-left">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Welcome back, {user.full_name?.split(' ')[0] || user.email.split('@')[0]}!
            </h2>
            <div className="flex items-center gap-2 mt-1">
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
        </div>
        
        {/* Quick action button */}
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

      {/* Usage Statistics - Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Searches Used */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200/50">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {user.subscription_tier === 'pro' || user.subscription_tier === 'developer' ? 
              user.monthly_searches : 
              `${user.monthly_searches}/${user.search_limit}`
            }
          </div>
          <div className="text-sm text-blue-700 font-medium">Searches This Month</div>
          <div className="text-xs text-blue-600 mt-1">
            {user.subscription_tier === 'pro' || user.subscription_tier === 'developer' ? 
              'Unlimited Plan' : 
              'Free Plan Limit'
            }
          </div>
        </div>

        {/* Searches Remaining */}
        {(user.subscription_tier === 'free' || user.subscription_tier === 'starter') && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 text-center border border-green-200/50">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {getSearchesRemaining()}
            </div>
            <div className="text-sm text-green-700 font-medium">Searches Remaining</div>
            <div className="text-xs text-green-600 mt-1">
              {getSearchesRemaining() === 0 ? 'Upgrade to continue' : 'Use them wisely!'}
            </div>
          </div>
        )}

        {/* Plan Status */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center border border-purple-200/50">
          <div className="text-3xl mb-2">
            {user.subscription_tier === 'developer' ? '🔧' :
             user.subscription_tier === 'pro' ? '👑' :
             user.subscription_tier === 'starter' ? '⚡' : '🆓'}
          </div>
          <div className="text-sm text-purple-700 font-medium">
            {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)} Plan
          </div>
          <div className="text-xs text-purple-600 mt-1">
            {user.subscription_tier === 'free' ? 'Basic Features' :
             user.subscription_tier === 'starter' ? 'Enhanced Features' :
             user.subscription_tier === 'pro' ? 'All Features' :
             'Developer Access'}
          </div>
        </div>
      </div>

      {/* Upgrade Message - Enhanced */}
      {getUpgradeMessage() && (
        <div className={`relative overflow-hidden rounded-2xl p-4 ${
          getSearchesRemaining() === 0 ? 
            'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200' : 
            'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
        }`}>
          <div className="relative z-10">
            <div className={`flex items-center gap-3 ${
              getSearchesRemaining() === 0 ? 'text-red-700' : 'text-yellow-700'
            }`}>
              <div className="text-2xl">
                {getSearchesRemaining() === 0 ? '🚫' : '⚠️'}
              </div>
              <div className="flex-1">
                <p className="font-medium">{getUpgradeMessage()}</p>
                {user.subscription_tier === 'free' && (
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => router.push('/pricing')}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-xl font-medium transition-all transform hover:scale-105"
                    >
                      Upgrade Now
                    </button>
                    <span className="text-sm text-gray-600">
                      Start from PKR 2,999/month
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Decorative background */}
          <div className={`absolute inset-0 opacity-5 ${
            getSearchesRemaining() === 0 ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
        </div>
      )}
    </div>
  </div>
)}

          {/* Main headline - Updated for Pakistani focus */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 text-balance">
              {user ? 'Your Pakistani' : 'Find Pakistani'}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Influencers
              </span>
              <br />
              {user ? 'Dashboard' : 'Made Simple'}
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto text-balance">
              {user ? 
                'Search through 1800+ verified Pakistani content creators with your personalized dashboard.' :
                'Discover and connect with 1800+ verified Pakistani content creators across Instagram, YouTube, and TikTok.'
              }
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

          {/* CTA section - User-aware buttons */}
          <div className="pt-8">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <>
                    <button
                      onClick={() => router.push('/search')}
                      disabled={getSearchesRemaining() === 0 && user.subscription_tier === 'free'}
                      className={`font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
                        getSearchesRemaining() === 0 && user.subscription_tier === 'free'
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      }`}
                    >
                      {getSearchesRemaining() === 0 && user.subscription_tier === 'free' 
                        ? 'Search Limit Reached' 
                        : 'Start Searching'
                      }
                    </button>
                    {user.subscription_tier === 'free' && (
                      <button
                        onClick={() => router.push('/pricing')}
                        className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-200"
                      >
                        Upgrade to Pro
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => router.push('/login')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    Sign In with Google
                  </button>
                )}
              </div>
              
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
                  {user ? 
                    (user.subscription_tier === 'free' ? `${getSearchesRemaining()} searches left` : 'Unlimited searches') :
                    'Free searches included'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component with authentication
export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndRedirect()
  }, [])


  useEffect(() => {
  // Listen for search events from the search page
  const handleSearchUpdate = (event: CustomEvent) => {
    if (user && event.detail) {
      setUser(prev => prev ? {
        ...prev,
        monthly_searches: event.detail.monthly_searches,
        search_limit: event.detail.search_limit
      } : null)
    }
  }

  // Listen for custom search events
  window.addEventListener('searchCompleted', handleSearchUpdate as EventListener)
  
  // Also refresh user data when returning to homepage
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && user) {
      // Refresh user data by calling the auth check function
      const refreshUserData = async () => {
        try {
          const token = localStorage.getItem('auth_token')
          if (!token) return

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
          console.error('Failed to refresh user data:', error)
        }
      }
      
      refreshUserData()
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    window.removeEventListener('searchCompleted', handleSearchUpdate as EventListener)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [user])

  const checkAuthAndRedirect = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        // No token - redirect to login
        setIsLoading(false)
        router.push('/login')
        return
      }

      // Verify token with backend
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
        setIsLoading(false)
      } else {
        // Invalid token - clear and redirect
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      router.push('/login')
    }
  }

  if (isLoading) {
    return <LoadingFallback />
  }

  if (!user) {
    // This should not render due to redirect, but just in case
    return null
  }

  return (
    <>
      {/* Add Header Component */}
      <Header />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Pakistani Influencer Search - Dashboard",
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

  
  

      {/* User-aware Hero Section (NO SEARCH COMPONENT) */}
      <HeroSection user={user} />

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {user?.subscription_tier === 'pro' || user?.subscription_tier === 'developer' ? 
                'Unlimited Access Features' : 
                'Upgrade to Unlock More'
              }
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The most comprehensive database of Pakistani influencers with advanced search and filtering capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Hybrid Search Technology</h3>
              <p className="text-gray-600 mb-4">
                Advanced keyword matching combined with semantic search to find exactly the right Pakistani creators.
              </p>
              {user?.subscription_tier === 'free' && (
                <div className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded-lg">
                  Limited to 5 results per search. <a href="/pricing" className="underline">Upgrade</a> for unlimited results.
                </div>
              )}
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Analytics</h3>
              <p className="text-gray-600 mb-4">
                Complete follower counts, engagement rates, and performance metrics across all platforms.
              </p>
              {user?.subscription_tier === 'free' && (
                <div className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded-lg">
                  {user.monthly_searches}/{user.search_limit} searches used this month
                </div>
              )}
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
              <p className="text-gray-600 mb-4">
                Specialized database covering all major Pakistani cities with verified creator profiles.
              </p>
              {user?.subscription_tier !== 'pro' && user?.subscription_tier !== 'developer' && (
                <button
                  onClick={() => router.push('/pricing')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Upgrade for More
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Updated CTA Section */}
      {user?.subscription_tier === 'free' && (
        <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Unlock Unlimited Access?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Upgrade to Pro for unlimited searches, full results, and advanced features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/pricing')}
                className="bg-white text-blue-600 font-semibold py-4 px-8 rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
              >
                View Pricing Plans
              </button>
              <button 
                onClick={() => router.push('/search')}
                disabled={getSearchesRemaining() === 0}
                className={`border-2 border-white font-semibold py-4 px-8 rounded-xl transition-all ${
                  getSearchesRemaining() === 0 
                    ? 'text-gray-400 border-gray-400 cursor-not-allowed' 
                    : 'text-white hover:bg-white hover:text-blue-600'
                }`}
              >
                Continue with Free Account
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  )
}

function getSearchesRemaining() {
  // This is just for the CTA section, we'll need to pass user data here
  return 5 // placeholder
}