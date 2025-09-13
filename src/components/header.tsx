'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { User, Search, Star, Menu, X, Crown, Zap, Key } from 'lucide-react'

interface HeaderProps {
  user?: {
    id: string
    email: string
    full_name?: string
    profile_picture?: string
    search_limit: number
    monthly_searches: number
    subscription_tier: 'free' | 'starter' | 'pro'
  }
  showSaved?: boolean
  setShowSaved?: (show: boolean) => void
  savedInfluencers?: any[]
  onLogout?: () => void
  isSearchPage?: boolean
}

export default function Header({ 
  user, 
  showSaved, 
  setShowSaved, 
  savedInfluencers = [], 
  onLogout,
  isSearchPage = false 
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
    router.push('/')
  }

  const getUserDisplayName = () => {
    if (user?.full_name) {
      return user.full_name.split(' ')[0]
    }
    return user?.email?.split('@')[0] || 'User'
  }

  const getSearchesRemaining = () => {
    if (!user) return 0
    return Math.max(0, (user.search_limit || 15) - (user.monthly_searches || 0))
  }

  const isNearLimit = () => {
    const remaining = getSearchesRemaining()
    const limit = user?.search_limit || 15
    return remaining <= Math.ceil(limit * 0.2)
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
        : 'bg-white/90 backdrop-blur-sm border-b border-gray-200/30'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-30">
          {/* Logo Section - Better spacing and alignment */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-white font-bold text-lg">🇵🇰</span>
              </div>
              {user?.subscription_tier === 'pro' && (
                <Crown className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
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

          {/* Desktop Navigation - Improved spacing */}
          <nav className="hidden lg:flex items-center gap-6">

            <Link href="/dashboard" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1">
              Dashboard
            </Link>

            {/* ADD THIS NEW LINK HERE */}
            {user?.subscription_tier === 'pro' && (
    <Link href="/api-keys" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1 flex items-center gap-1">
      <Key className="w-4 h-4" />
      API Keys
    </Link>
  )}
  
            
            <Link href="/blog" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1">
              Blogs
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600 font-medium transition-colors py-2 px-1">
              Contact
            </Link>
          </nav>

          {/* User Actions Section - Better organization */}
          <div className="flex items-center gap-3">
            {user ? (
              // Authenticated User Interface
              <>
                {/* Search Page Specific - Saved Button */}
                {isSearchPage && setShowSaved && (
                  <button
                    onClick={() => setShowSaved(!showSaved)}
                    className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      showSaved
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    <span className="hidden lg:inline">Saved</span>
                    <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                      {savedInfluencers.length}
                    </span>
                  </button>
                )}

               

                {/* Upgrade Button - Enhanced visibility */}
                {user.subscription_tier === 'free' && (
                  <Link
                    href="/pricing"
                    className="hidden md:flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="hidden lg:inline">Upgrade</span>
                  </Link>
                )}

                {/* User Profile Section - Better spacing */}
                <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
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
                  <div className="hidden xl:block">
                    <p className="text-sm font-medium text-gray-900 leading-tight">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Logout Button - Improved style */}
                <button
                  onClick={handleLogout}
                  className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200 hover:border-red-300"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Exit</span>
                </button>
              </>
            ) : (
              // Public User Interface - Cleaner layout
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  <span className="hidden sm:inline">Start Free Trial</span>
                  <span className="sm:hidden">Sign Up</span>
                </Link>
              </>
            )}

            {/* Mobile Menu Button - Better positioning */}
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

        {/* Mobile Menu - Enhanced layout */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 bg-white/95 backdrop-blur-sm">
            <div className="flex flex-col gap-1">
              {/* Navigation Links */}
              <Link 
                href="/dashboard" 
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium py-3 px-4 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>

              {/* ADD THIS NEW MOBILE LINK HERE */}
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
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium py-3 px-4 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              
              {user && (
                <>
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    {/* Mobile User Info */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-3">
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={getUserDisplayName()}
                          className="w-10 h-10 rounded-full border-2 border-green-200 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{getUserDisplayName()}</p>
                        <p className="text-sm text-gray-500">
                          {getSearchesRemaining()} searches left • {user.subscription_tier}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Saved Button */}
                    {isSearchPage && setShowSaved && (
                      <button
                        onClick={() => {
                          setShowSaved(!showSaved)
                          setIsMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all mb-2 ${
                          showSaved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-50'
                        }`}
                      >
                        <Star className="w-4 h-4" />
                        Saved Influencers ({savedInfluencers.length})
                      </button>
                    )}

                    {/* Mobile Upgrade Button */}
                    {user.subscription_tier === 'free' && (
                      <Link
                        href="/pricing"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg font-medium text-sm hover:shadow-lg transition-all"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Zap className="w-4 h-4" />
                        Upgrade to Premium
                      </Link>
                    )}
                  </div>
                </>
              )}

              {!user && (
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <Link
                    href="/login"
                    className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center px-4 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Start Free Trial
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}