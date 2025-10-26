'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Search, Star, Menu, X, Crown, Zap, Key, Mail, Settings,ChevronDown, Building } from 'lucide-react'


interface UserProfile {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: 'free' | 'starter' | 'pro' | 'developer'
  monthly_searches: number
  search_limit: number
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
  const [userType, setUserType] = useState<'brand' | 'influencer' | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  // ADD THESE NEW STATES (don't remove existing ones)
  const [showLoginDropdown, setShowLoginDropdown] = useState(false)



const handleGoogleLogin = () => {
  // Redirect to your login page or trigger Google OAuth
  router.push('/login')
  
  // OR if you have Google OAuth setup directly in header:
  // Trigger your Google login flow here
}

useEffect(() => {
  // Check if user is logged in
  const authToken = localStorage.getItem('auth_token')
  setIsLoggedIn(!!authToken)
  
  // Check user type
  const storedUserType = localStorage.getItem('user_type')
  if (storedUserType === 'influencer' || storedUserType === 'brand') {
    setUserType(storedUserType)
  }
}, [])
useEffect(() => {
  // Check user type from localStorage
  const storedUserType = localStorage.getItem('user_type')
  if (storedUserType === 'influencer' || storedUserType === 'brand') {
    setUserType(storedUserType)
  }
}, [])

  useEffect(() => {
    checkAuthStatus()
    
    // Add scroll listener for glass effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Listen for search completion events
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

  

// Enhanced logout function for your header.ts file
const handleLogout = async () => {
  try {
    const token = localStorage.getItem('auth_token')
    
    // Notify backend of logout (if token exists)
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
        console.log('Backend logout successful')
      } catch (error) {
        console.log('Backend logout failed (non-critical):', error)
      }
    }
    
    // Clear all local auth data FIRST
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
    setShowDropdown(false)
    
    // Enhanced Google auth cleanup
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect()
      window.google.accounts.id.cancel()
    }
    
    if (navigator.credentials && navigator.credentials.preventSilentAccess) {
      navigator.credentials.preventSilentAccess()
    }
    
    // Clear Google cookies aggressively
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




    
    // Clear session storage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('google') || key.includes('gsi') || key.includes('oauth')) {
        sessionStorage.removeItem(key)
      }
    })
    
    console.log('Complete logout with enhanced cleanup')
    window.location.href = '/'
    
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear local data even if logout fails
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
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
        return 'bg-white/20 text-black border border-black/10'
      case 'starter':
        return 'bg-blue-500/20 text-blue-600 border border-blue-500/20'
      case 'pro':
        return 'bg-green-500/20 text-green-600 border border-green-500/20'
      case 'developer':
        return 'bg-black/20 text-black border border-black/20'
      default:
        return 'bg-white/20 text-black border border-black/10'
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
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-2xl border-b border-black/5' 
          : 'bg-white/60 backdrop-blur-lg border-b border-black/5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Infoish
                </h1>
              </div>
            </div>
            <div className="animate-pulse bg-black/10 rounded-full w-12 h-12"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      {/* Glass Morphism Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/85 backdrop-blur-2xl shadow-2xl border-b border-black/10' 
          : 'bg-white/70 backdrop-blur-xl border-b border-black/5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo Section - Modern & Clean */}
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className={`w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isScrolled ? 'shadow-xl scale-95' : 'group-hover:shadow-2xl group-hover:scale-105'
                }`}>
                  <span className="text-white font-bold text-xl">I</span>
                </div>
                {user?.subscription_tier === 'pro' && (
                  <Crown className="w-5 h-5 text-green-500 absolute -top-2 -right-2 drop-shadow-lg" />
                )}
                {user?.subscription_tier === 'developer' && (
                  <Key className="w-5 h-5 text-blue-500 absolute -top-2 -right-2 drop-shadow-lg" />
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold text-black tracking-tight">
                  Infoish
                </h1>
                <p className="text-sm text-black/60 -mt-1">
                  AI Influencer Search
                </p>
              </div>
            </Link>

     {/* Desktop Navigation - ENHANCED */}
<nav className="hidden lg:flex items-center gap-2">
  <Link 
    href="/about" 
    className="px-4 py-2 text-black/70 hover:text-blue-600 font-medium rounded-xl transition-all duration-200 hover:bg-blue-50/50"
  >
    About
  </Link>
  <Link 
    href="/pricing" 
    className="px-4 py-2 text-black/70 hover:text-green-600 font-medium rounded-xl transition-all duration-200 hover:bg-green-50/50"
  >
    Pricing
  </Link>
  <Link 
    href="/blog" 
    className="px-4 py-2 text-black/70 hover:text-purple-600 font-medium rounded-xl transition-all duration-200 hover:bg-purple-50/50"
  >
    Blog
  </Link>

  {!user && (
    <>
      {/* NEW: Login Dropdown */}
      <div className="relative ml-2">
        <button
          onClick={() => setShowLoginDropdown(!showLoginDropdown)}
          className="px-4 py-2 text-black/70 hover:bg-white/50 backdrop-blur-lg rounded-xl flex items-center gap-2 font-medium transition-all border border-white/20"
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
            <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/30 py-2 z-50">
              <Link
                href="/influencer/login"
                className="flex items-center gap-3 px-4 py-3 text-black hover:bg-purple-50 transition-colors"
                onClick={() => setShowLoginDropdown(false)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Influencer</p>
                  <p className="text-xs text-black/60">Manage profile</p>
                </div>
              </Link>
              
              <div className="my-1 h-px bg-black/10" />
              
              <button
                onClick={() => {
                  setShowLoginDropdown(false)
                  handleGoogleLogin()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-black hover:bg-blue-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Brand</p>
                  <p className="text-xs text-black/60">Search influencers</p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* NEW: Register as Influencer */}
      <Link 
        href="/register-influencer"
        className="ml-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm backdrop-blur-lg"
      >
        Register as Influencer
      </Link>
    </>
  )}
</nav>

            {/* User Actions - Glass Morphism Buttons */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {/* Contact Button - Glass Design */}
                  <Link
                    href="/contact"
                    className="hidden md:flex items-center gap-2 bg-white/40 hover:bg-white/60 backdrop-blur-lg border border-white/20 text-black px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="hidden lg:inline">Contact</span>
                  </Link>

                  {/* Upgrade Button - Premium Glass */}
                  {user.subscription_tier === 'free' && (
                    <Link
                      href="/pricing"
                      className="hidden md:flex items-center gap-2 bg-gradient-to-r from-green-500/90 to-blue-500/90 hover:from-green-600 hover:to-blue-600 backdrop-blur-lg text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Crown className="w-4 h-4" />
                      <span className="hidden lg:inline">Upgrade</span>
                    </Link>
                  )}

                  {/* Search Counter - Glass Badge */}
                  {user.subscription_tier !== 'pro' && user.subscription_tier !== 'developer' && (
                    <div className="hidden xl:flex items-center text-xs text-black/60 px-3 py-2 bg-white/30 backdrop-blur-lg rounded-full border border-white/20 shadow-sm">
                      {getSearchesRemaining()}/{user.search_limit}
                    </div>
                  )}

                  {/* User Profile - Glass Morphism */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-3 bg-white/30 hover:bg-white/50 backdrop-blur-lg border border-white/20 rounded-2xl px-4 py-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={getUserDisplayName()}
                          className="w-10 h-10 rounded-xl border-2 border-white/30 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="hidden xl:block text-left">
                        <p className="text-sm font-semibold text-black leading-tight">
                          {getUserDisplayName()}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTierIcon()}
                          <p className="text-xs text-black/60 capitalize">
                            {user.subscription_tier}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Glass Dropdown */}
                    {showDropdown && (
                      <div className="absolute right-0 mt-4 w-80 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 z-50">
                        <div className="p-6 border-b border-black/10">
                          <div className="flex items-center gap-4 mb-4">
                            {user.profile_picture ? (
                              <img
                                src={user.profile_picture}
                                alt={getUserDisplayName()}
                                className="w-16 h-16 rounded-2xl border-2 border-white/30"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-bold text-black text-lg">{getUserDisplayName()}</p>
                              <p className="text-sm text-black/60">{user.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${getTierBadgeColor()}`}>
                              {getTierIcon()}
                              {user.subscription_tier.toUpperCase()}
                            </span>
                            {user.subscription_tier === 'free' && (
                              <Link
                                href="/pricing"
                                className="text-sm text-green-500 hover:text-green-600 font-bold transition-colors"
                                onClick={() => setShowDropdown(false)}
                              >
                                Upgrade →
                              </Link>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-4">
                          {/* Search Usage */}
                          <div className="bg-white/40 rounded-2xl px-4 py-3 mb-4">
                            <div className="text-xs text-black/60 mb-1 font-medium">Usage This Month</div>
                            <div className="text-sm font-bold text-black">
                              {getSearchLimitText()}
                            </div>
                          </div>
                          
                          {/* Menu Items */}
                          <Link
                            href={userType === 'influencer' ? '/influencer/dashboard' : '/dashboard'}
                            className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-medium text-black hover:bg-white/40 rounded-2xl transition-all duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <Settings className="w-5 h-5" />
                            Dashboard
                          </Link>
                          
                          <Link
                            href="/contact"
                            className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-medium text-black hover:bg-white/40 rounded-2xl transition-all duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <Mail className="w-5 h-5" />
                            Contact Support
                          </Link>
                          
                          <div className="border-t border-black/10 mt-4 pt-4">
                            <button 
                              className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-medium hover:bg-white/40 rounded-2xl text-black/70 hover:text-black transition-all duration-200"
                              onClick={handleLogout}
                            >
                              <X className="w-5 h-5" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    href="/contact"
                    className="text-black/70 hover:text-green-500 font-medium transition-colors px-3 py-2"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/login"
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="hidden sm:inline">Sign up as Brand</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-3 rounded-xl bg-white/30 hover:bg-white/50 backdrop-blur-lg border border-white/20 transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-black" />
                ) : (
                  <Menu className="w-5 h-5 text-black" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu - Glass Design */}
{isMobileMenuOpen && (
  <div className="lg:hidden border-t border-black/10 py-6 bg-white/20 backdrop-blur-xl">
    <div className="flex flex-col gap-2">


      {/* NEW: Add these login options if user is not logged in */}
      {!user && (
        <>
          <Link 
            href="/influencer/login"
            className="flex items-center gap-3 text-purple-600 hover:text-purple-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:bg-purple-50 border-2 border-purple-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <User className="w-5 h-5" />
            Influencer Login
          </Link>
          
          <Link 
            href="/register-influencer"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:shadow-lg"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Register as Influencer
          </Link>
          
          <div className="h-px bg-black/10 my-2" />
        </>
      )}


      {/* Show these links based on login status */}
      {isLoggedIn ? (
        <>
          <Link 
            href={userType === 'influencer' ? '/influencer/dashboard' : '/dashboard'}
            className="text-black hover:text-green-500 font-medium py-4 px-6 rounded-2xl transition-all duration-200 hover:bg-white/30"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
        </>
      ) : (
        <>
          {/* For Influencers Link - Show only when logged out */}
          <Link 
            href="/register-influencer"
            className="text-purple-600 hover:text-purple-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:bg-purple-50 border-2 border-purple-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Register as Influencer
          </Link>
        </>
      )}
      
      {/* Common links for everyone */}
      <Link 
        href="/blog" 
        className="text-black hover:text-blue-500 font-medium py-4 px-6 rounded-2xl transition-all duration-200 hover:bg-white/30"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Blog
      </Link>
      <Link 
        href="/pricing" 
        className="text-black hover:text-green-500 font-medium py-4 px-6 rounded-2xl transition-all duration-200 hover:bg-white/30"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Pricing
      </Link>
      <Link 
        href="/about" 
        className="text-black hover:text-blue-500 font-medium py-4 px-6 rounded-2xl transition-all duration-200 hover:bg-white/30"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        About
      </Link>
      
      {/* User-specific actions */}
      {isLoggedIn ? (
        <div className="border-t border-black/10 mt-4 pt-4 space-y-2">
          <Link
            href="/contact"
            className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-200 bg-white/20 text-black hover:bg-white/40"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Mail className="w-5 h-5" />
            Contact Support
          </Link>

          {user?.subscription_tier === 'free' && (
            <Link
              href="/pricing"
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:shadow-xl transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Crown className="w-5 h-5" />
              Upgrade to Premium
            </Link>
          )}
          
          {/* Logout Button */}
          <button
            onClick={() => {
              handleLogout()
              setIsMobileMenuOpen(false)
            }}
            className="w-full flex items-center justify-center gap-3 bg-red-500 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-red-600 transition-all duration-300"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="border-t border-black/10 mt-4 pt-4">
          {/* Sign In Button for logged out users */}
          <button
            onClick={() => {
              handleGoogleLogin()
              setIsMobileMenuOpen(false)
            }}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:shadow-xl transition-all duration-300"
          >
            Sign In with Google
          </button>
        </div>
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

      {/* Spacer to prevent content overlap */}
      <div className="h-20"></div>
    </>

  )
}