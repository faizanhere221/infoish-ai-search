'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { User, Search, Menu, X, Crown, Zap, Key, Mail, Settings, ChevronDown, Building, BarChart3, Heart, LogOut } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: 'free' | 'starter' | 'pro' | 'developer'
  monthly_searches: number
  search_limit: number
  user_type?: 'brand' | 'influencer' // Added from backend
}

interface HeaderProps {
  isSearchPage?: boolean
}

export default function Header({ isSearchPage = false }: HeaderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [userType, setUserType] = useState<'brand' | 'influencer' | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginDropdown, setShowLoginDropdown] = useState(false)

  const handleGoogleLogin = () => {
    router.push('/login')
  }

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token')
    setIsLoggedIn(!!authToken)
    
    const storedUserType = localStorage.getItem('user_type')
    if (storedUserType === 'influencer' || storedUserType === 'brand') {
      setUserType(storedUserType)
    }
  }, [])

  useEffect(() => {
    checkAuthStatus()
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleSearchUpdate = () => {
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
              search_limit: userData.search_limit,
              user_type: userData.user_type
            })
            
            // FIXED: Update userType from backend or detect from URL
            detectAndSetUserType(userData.user_type)
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
  }, [pathname])

  // FIXED: Smart user type detection
  const detectAndSetUserType = (backendUserType?: string) => {
    // Priority 1: Backend returns user_type
    if (backendUserType) {
      const type = backendUserType === 'influencer' ? 'influencer' : 'brand'
      setUserType(type)
      localStorage.setItem('user_type', type)
      return
    }

    // Priority 2: Check current URL path
    if (pathname?.includes('/influencer')) {
      setUserType('influencer')
      localStorage.setItem('user_type', 'influencer')
      return
    }

    // Priority 3: Check localStorage
    const storedType = localStorage.getItem('user_type')
    if (storedType === 'influencer' || storedType === 'brand') {
      setUserType(storedType)
      return
    }

    // Priority 4: Default to brand (for Google OAuth users)
    setUserType('brand')
    localStorage.setItem('user_type', 'brand')
  }

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
          search_limit: userData.search_limit,
          user_type: userData.user_type
        })
        
        // FIXED: Detect user type properly
        detectAndSetUserType(userData.user_type)
      } else {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_type')
        setUser(null)
        setUserType(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      setUserType(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://infoish-ai-search-production.up.railway.app'
          await fetch(`${backendUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        } catch (error) {
          console.log('Backend logout failed (non-critical):', error)
        }
      }
      
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('user_type')
      setUser(null)
      setUserType(null)
      setShowDropdown(false)
      
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect()
        window.google.accounts.id.cancel()
      }
      
      if (navigator.credentials && navigator.credentials.preventSilentAccess) {
        navigator.credentials.preventSilentAccess()
      }
      
      const googleCookies = [
        'g_state', 'g_csrf_token', 'gsi_state', 'gsi_replay', 
        'g_authuser', 'g_enabled_idps', '__Host-1PLSID', '__Host-3PLSID',
        'NID', 'HSID', 'SSID', 'APISID', 'SAPISID'
      ]
      
      googleCookies.forEach(cookieName => {
        const domains = ['', `.${window.location.hostname}`, '.google.com', '.accounts.google.com']
        const paths = ['/', '/auth', '/oauth']
        
        domains.forEach(domain => {
          paths.forEach(path => {
            const domainPart = domain ? `; domain=${domain}` : ''
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}`
          })
        })
      })
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('google') || key.includes('gsi') || key.includes('oauth')) {
          sessionStorage.removeItem(key)
        }
      })
      
      window.location.href = '/'
      
    } catch (error) {
      console.error('Logout error:', error)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('user_type')
      setUser(null)
      setUserType(null)
      setShowDropdown(false)
      window.location.href = '/'
    }
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
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'starter':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'pro':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'developer':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
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

  // FIXED: Get correct dashboard URL based on user type
  const getDashboardUrl = () => {
    if (userType === 'influencer') {
      return '/influencer/dashboard'
    }
    return '/dashboard' // Brand dashboard is at /dashboard
  }

  if (isLoading) {
    return (
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200' 
          : 'bg-white/80 backdrop-blur-lg border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Infoishai</span>
            </div>
            <div className="animate-pulse bg-gray-200 rounded-full w-10 h-10"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200' 
          : 'bg-white/80 backdrop-blur-lg border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 ${
                  isScrolled ? 'shadow-lg' : 'group-hover:shadow-xl group-hover:scale-105'
                }`}>
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                {user?.subscription_tier === 'pro' && (
                  <Crown className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Infoishai</h1>
                <p className="text-xs text-gray-500 -mt-0.5">AI Influencer Search</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link 
                href="/about" 
                className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-all"
              >
                About
              </Link>
              <Link 
                href="/pricing" 
                className="px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium rounded-lg transition-all"
              >
                Pricing
              </Link>
              <Link 
                href="/blog" 
                className="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 font-medium rounded-lg transition-all"
              >
                Blog
              </Link>

              {!user && (
                <>
                  <div className="relative ml-2">
                    <button
                      onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 font-medium transition-all border border-gray-200"
                    >
                      Login
                      <ChevronDown className={`w-4 h-4 transition-transform ${showLoginDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showLoginDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowLoginDropdown(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                          <Link
                            href="/influencer/login"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 transition-colors"
                            onClick={() => setShowLoginDropdown(false)}
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">Influencer</p>
                              <p className="text-xs text-gray-500">Manage profile</p>
                            </div>
                          </Link>
                          
                          <div className="my-1 h-px bg-gray-200" />
                          
                          <button
                            onClick={() => {
                              setShowLoginDropdown(false)
                              handleGoogleLogin()
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 transition-colors"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                              <Building className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-sm">Brand</p>
                              <p className="text-xs text-gray-500">Search influencers</p>
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Link 
                    href="/register-influencer"
                    className="ml-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm"
                  >
                    Register as Influencer
                  </Link>
                </>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Quick Actions for Brands */}
                  {userType === 'brand' && (
                    <div className="hidden md:flex items-center gap-2">
                      <Link
                        href="/search"
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Search Influencers"
                      >
                        <Search className="w-5 h-5" />
                      </Link>
                      <Link
                        href="/saved"
                        className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
                        title="Saved Influencers"
                      >
                        <Heart className="w-5 h-5" />
                      </Link>
                      <Link
                        href="/campaigns"
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="My Campaigns"
                      >
                        <BarChart3 className="w-5 h-5" />
                      </Link>
                    </div>
                  )}

                  {/* Upgrade Button */}
                  {user.subscription_tier === 'free' && (
                    <Link
                      href="/pricing"
                      className="hidden md:flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all"
                    >
                      <Crown className="w-4 h-4" />
                      <span className="hidden lg:inline">Upgrade</span>
                    </Link>
                  )}

                  {/* Search Counter */}
                  {user.subscription_tier !== 'pro' && user.subscription_tier !== 'developer' && (
                    <div className="hidden xl:flex items-center text-xs text-gray-600 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                      {getSearchesRemaining()}/{user.search_limit}
                    </div>
                  )}

                  {/* User Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 transition-all shadow-sm hover:shadow-md"
                    >
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={getUserDisplayName()}
                          className="w-8 h-8 rounded-lg border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="hidden xl:block text-left">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {user.subscription_tier}
                        </p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowDropdown(false)}
                        />
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                          {/* Header */}
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-green-50 border-b border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                              {user.profile_picture ? (
                                <img
                                  src={user.profile_picture}
                                  alt={getUserDisplayName()}
                                  className="w-14 h-14 rounded-xl border-2 border-white shadow-md"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center shadow-md">
                                  <User className="w-7 h-7 text-white" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-bold text-gray-900">{getUserDisplayName()}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getTierBadgeColor()}`}>
                                {getTierIcon()}
                                {user.subscription_tier.toUpperCase()}
                              </span>
                              {user.subscription_tier === 'free' && (
                                <Link
                                  href="/pricing"
                                  className="text-sm text-green-600 hover:text-green-700 font-bold transition-colors"
                                  onClick={() => setShowDropdown(false)}
                                >
                                  Upgrade →
                                </Link>
                              )}
                            </div>
                          </div>
                          
                          {/* Usage Stats */}
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1 font-medium">Usage This Month</div>
                            <div className="text-sm font-bold text-gray-900">
                              {getSearchLimitText()}
                            </div>
                          </div>
                          
                          {/* Menu Items */}
                          <div className="p-2">
                            {/* FIXED: Dashboard link based on userType */}
                            <Link
                              href={getDashboardUrl()}
                              className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all"
                              onClick={() => setShowDropdown(false)}
                            >
                              <Settings className="w-5 h-5" />
                              Dashboard
                            </Link>
                            
                            {userType === 'brand' && (
                              <>
                                <Link
                                  href="/search"
                                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all"
                                  onClick={() => setShowDropdown(false)}
                                >
                                  <Search className="w-5 h-5" />
                                  Search Influencers
                                </Link>
                                
                                <Link
                                  href="/saved"
                                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-all"
                                  onClick={() => setShowDropdown(false)}
                                >
                                  <Heart className="w-5 h-5" />
                                  Saved Influencers
                                </Link>
                                
                                <Link
                                  href="/campaigns"
                                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-all"
                                  onClick={() => setShowDropdown(false)}
                                >
                                  <BarChart3 className="w-5 h-5" />
                                  My Campaigns
                                </Link>
                              </>
                            )}
                            
                            <Link
                              href="/contact"
                              className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all"
                              onClick={() => setShowDropdown(false)}
                            >
                              <Mail className="w-5 h-5" />
                              Contact Support
                            </Link>
                            
                            <div className="border-t border-gray-200 my-2"></div>
                            
                            <button 
                              className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              onClick={handleLogout}
                            >
                              <LogOut className="w-5 h-5" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/contact"
                    className="hidden sm:block text-gray-700 hover:text-blue-600 font-medium transition-colors px-3 py-2"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/login"
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <span className="hidden sm:inline">Sign up as Brand</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4 bg-white">
              <div className="flex flex-col gap-1">
                {!user && (
                  <>
                    <Link 
                      href="/influencer/login"
                      className="flex items-center gap-3 text-purple-600 hover:text-purple-700 font-semibold py-3 px-4 rounded-lg transition-all hover:bg-purple-50 border-2 border-purple-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Influencer Login
                    </Link>
                    
                    <Link 
                      href="/register-influencer"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-4 rounded-lg transition-all hover:shadow-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Register as Influencer
                    </Link>
                    
                    <div className="h-px bg-gray-200 my-2" />
                  </>
                )}

                {isLoggedIn && userType === 'brand' && (
                  <>
                    <Link 
                      href="/search"
                      className="flex items-center gap-3 text-gray-700 hover:text-blue-600 font-medium py-3 px-4 rounded-lg transition-all hover:bg-blue-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Search className="w-5 h-5" />
                      Search Influencers
                    </Link>
                    
                    <Link 
                      href="/saved"
                      className="flex items-center gap-3 text-gray-700 hover:text-pink-600 font-medium py-3 px-4 rounded-lg transition-all hover:bg-pink-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Heart className="w-5 h-5" />
                      Saved Influencers
                    </Link>
                    
                    <Link 
                      href="/campaigns"
                      className="flex items-center gap-3 text-gray-700 hover:text-green-600 font-medium py-3 px-4 rounded-lg transition-all hover:bg-green-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BarChart3 className="w-5 h-5" />
                      My Campaigns
                    </Link>
                    
                    <div className="h-px bg-gray-200 my-2" />
                  </>
                )}
                
                <Link 
                  href="/about" 
                  className="text-gray-700 hover:text-blue-600 font-medium py-3 px-4 rounded-lg transition-all hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  href="/pricing" 
                  className="text-gray-700 hover:text-green-600 font-medium py-3 px-4 rounded-lg transition-all hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="/blog" 
                  className="text-gray-700 hover:text-purple-600 font-medium py-3 px-4 rounded-lg transition-all hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Blog
                </Link>
                
                {isLoggedIn && (
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <Link
                      href="/contact"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Mail className="w-5 h-5" />
                      Contact Support
                    </Link>

                    {user?.subscription_tier === 'free' && (
                      <Link
                        href="/pricing"
                        className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-3 rounded-lg font-bold text-sm hover:shadow-lg transition-all mt-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Crown className="w-5 h-5" />
                        Upgrade to Premium
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-red-500 text-white px-4 py-3 rounded-lg font-bold text-sm hover:bg-red-600 transition-all mt-2"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </div>
                )}
                
                {!isLoggedIn && (
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={() => {
                        handleGoogleLogin()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:shadow-lg transition-all"
                    >
                      Sign up as Brand
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16"></div>
    </>
  )
}