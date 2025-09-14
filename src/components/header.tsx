'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Search, Star, Menu, X, Crown, Zap, Key, Mail, Settings } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: 'free' | 'starter' | 'pro' | 'developer'
  monthly_searches: number
  search_limit: number
}






export default function Header() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
    
    // Add scroll listener
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  useEffect(() => {
  // Listen for search completion events to refresh header data
  const handleSearchUpdate = () => {
    // Refresh user data when search completes
    const refreshHeaderData = async () => {
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
        console.error('Failed to refresh header data:', error)
      }
    }

    refreshHeaderData()
  }

  window.addEventListener('searchCompleted', handleSearchUpdate)
  
  return () => {
    window.removeEventListener('searchCompleted', handleSearchUpdate)
  }
}, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token') // Fixed: use 'auth_token' not 'jwt_token'
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
      } else {
        localStorage.removeItem('auth_token')
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
    setShowDropdown(false)
    router.push('/login')
  }

  const getUserDisplayName = () => {
    if (user?.full_name) {
      return user.full_name.split(' ')[0]
    }
    return user?.email?.split('@')[0] || 'User'
  }

  const getSearchesRemaining = () => {
    if (!user) return 0
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'developer') return 'unlimited'
    return Math.max(0, user.search_limit - user.monthly_searches)
  }

  const getSearchLimitText = () => {
    if (!user) return ''
    
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'developer') {
      return 'Unlimited searches'
    }
    
    return `${user.monthly_searches}/${user.search_limit} searches used`
  }

  const getTierBadgeColor = () => {
    switch (user?.subscription_tier) {
      case 'free':
        return 'bg-gray-100 text-gray-800'
      case 'starter':
        return 'bg-blue-100 text-blue-800'
      case 'pro':
        return 'bg-purple-100 text-purple-800'
      case 'developer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierIcon = () => {
    switch (user?.subscription_tier) {
      case 'pro':
        return <Crown className="w-3 h-3" />
      case 'developer':
        return <Key className="w-3 h-3" />
      case 'starter':
        return <Zap className="w-3 h-3" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
          : 'bg-white/90 backdrop-blur-sm border-b border-gray-200/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🇵🇰</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  AI Influencer Search Tool
                </h1>
              </div>
            </div>
            <div className="animate-pulse bg-gray-200 rounded-full w-10 h-10"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
        : 'bg-white/90 backdrop-blur-sm border-b border-gray-200/30'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-white font-bold text-lg">🇵🇰</span>
              </div>
              {user?.subscription_tier === 'pro' && (
                <Crown className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
              )}
              {user?.subscription_tier === 'developer' && (
                <Key className="w-4 h-4 text-green-500 absolute -top-1 -right-1" />
              )}
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                AI Influencer Search Tool
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Find Perfect Creators in Pakistan
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1">
              Dashboard
            </Link>

            {user?.subscription_tier === 'pro' && (
              <Link href="/api-keys" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1 flex items-center gap-1">
                <Key className="w-4 h-4" />
                API Keys
              </Link>
            )}
            
            <Link href="/blog" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1">
              Blog
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1">
              About
            </Link>
          </nav>

          {/* User Actions Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Contact Us Button - Beautiful Design */}
                <Link
                  href="/contact"
                  className="hidden md:flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden lg:inline">Contact</span>
                </Link>

                {/* Upgrade Button - Only show for non-unlimited users */}
                {user.subscription_tier === 'free' && (
                  <Link
                    href="/pricing"
                    className="hidden md:flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <Crown className="w-4 h-4" />
                    <span className="hidden lg:inline">Upgrade</span>
                  </Link>
                )}

                {/* Search Usage Indicator */}
                {user.subscription_tier !== 'pro' && user.subscription_tier !== 'developer' && (
                  <div className="hidden xl:block text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded-full">
                    {getSearchesRemaining()}/{user.search_limit} left
                  </div>
                )}

                {/* User Profile Section */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-3 pl-2 border-l border-gray-200 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                  >
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={getUserDisplayName()}
                        className="w-9 h-9 rounded-full border-2 border-green-200 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    <div className="hidden xl:block text-left">
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        {getUserDisplayName()}
                      </p>
                      <div className="flex items-center gap-1">
                        {getTierIcon()}
                        <p className="text-xs text-gray-500">
                          {user.subscription_tier === 'developer' ? 'Developer' : user.subscription_tier}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Dropdown Menu - Enhanced */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                          {user.profile_picture ? (
                            <img
                              src={user.profile_picture}
                              alt={getUserDisplayName()}
                              className="w-12 h-12 rounded-full border-2 border-green-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="w-6 h-6 text-green-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{getUserDisplayName()}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getTierBadgeColor()}`}>
                            {getTierIcon()}
                            {user.subscription_tier.toUpperCase()} PLAN
                          </span>
                          {user.subscription_tier === 'free' && (
                            <Link
                              href="/pricing"
                              className="text-xs text-green-600 hover:text-green-700 font-medium"
                              onClick={() => setShowDropdown(false)}
                            >
                              Upgrade →
                            </Link>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-2">
                        {/* Search Usage */}
                        <div className="px-3 py-2 mb-2">
                          <div className="text-xs text-gray-500 mb-1">This Month</div>
                          <div className="text-sm font-medium text-gray-800">
                            {getSearchLimitText()}
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <Link
                          href="/dashboard"
                          className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Dashboard
                        </Link>
                        
                        <Link
                          href="/contact"
                          className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Mail className="w-4 h-4" />
                          Contact Support
                        </Link>
                        
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button 
                            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                            onClick={handleLogout}
                          >
                            <X className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Non-authenticated user - should not show since homepage redirects to login
              <div className="flex items-center gap-3">
                <Link
                  href="/contact"
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors px-3 py-2"
                >
                  Contact
                </Link>
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  <span className="hidden sm:inline">Continue with Google</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors ml-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 bg-white/95 backdrop-blur-sm">
            <div className="flex flex-col gap-1">
              <Link 
                href="/dashboard" 
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium py-3 px-4 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>

              {user?.subscription_tier === 'pro' && (
                <Link 
                  href="/api-keys" 
                  className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium py-3 px-4 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Key className="w-4 h-4" />
                  API Keys
                </Link>
              )}

              <Link 
                href="/blog" 
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium py-3 px-4 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                href="/pricing" 
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium py-3 px-4 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium py-3 px-4 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              
              {user && (
                <>
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    {/* Mobile Contact Button */}
                    <Link
                      href="/contact"
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all mb-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Mail className="w-4 h-4" />
                      Contact Support
                    </Link>

                    {/* Mobile Upgrade Button */}
                    {user.subscription_tier === 'free' && (
                      <Link
                        href="/pricing"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg font-medium text-sm hover:shadow-lg transition-all"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Crown className="w-4 h-4" />
                        Upgrade to Premium
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  )
}