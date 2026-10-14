'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { User, Search, Menu, X, Crown, Zap, Key, Mail, Settings, ChevronDown, Building, BarChart3, LogOut, Globe } from 'lucide-react'
import { COUNTRY_LANDING_PAGES } from '@/utils/constants'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: 'free' | 'starter' | 'pro' | 'developer'
  monthly_searches: number
  search_limit: number
  user_type?: 'brand' | 'influencer'
}

interface HeaderProps {
  isSearchPage?: boolean
}

export default function Header({ isSearchPage: _isSearchPage = false }: HeaderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCountriesDropdown, setShowCountriesDropdown] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileCountriesOpen, setIsMobileCountriesOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const [userType, setUserType] = useState<'brand' | 'influencer' | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginDropdown, setShowLoginDropdown] = useState(false)

  const goToLogin = () => {
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

  // NOTE: this used to call a FastAPI backend (infoish-ai-search-production
  // on Railway) that predates the current Next.js/Supabase app and no longer
  // exists as part of this codebase — every call to it failed silently.
  // `isLoggedIn` below (sourced from the real auth_token) is the actual
  // source of truth for whether to show the signed-in header state.
  // `user` intentionally stays null: the subscription-tier/search-quota UI
  // it used to feed reads fields (subscription_tier, monthly_searches,
  // search_limit) that don't exist on this app's users table, so that UI is
  // effectively retired rather than fed fake data.
  const checkAuthStatus = useCallback(async () => {
    setIsLoading(false)
  }, [])

  useEffect(() => {
    checkAuthStatus()

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [checkAuthStatus])


  const handleLogout = async () => {
    try {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_profile')
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
    if (!user) {return 0}
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'developer') {return 'unlimited'}
    return Math.max(0, user.search_limit - user.monthly_searches)
  }

  const getSearchLimitText = () => {
    if (!user) {return ''}
    
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

  const getDashboardUrl = () => {
    if (userType === 'influencer') {
      return '/dashboard/creator'
    }
    return '/dashboard/brand'
  }

  if (isLoading) {
    return (
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg'
          : 'bg-white/80 backdrop-blur-lg'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Infoishai" width={40} height={40} className="w-10 h-10 rounded-xl" />
              <span className="text-xl font-bold text-gray-900">Infoishai</span>
            </div>
            <div className="animate-pulse bg-gray-200 rounded-full w-10 h-10"></div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-pink to-brand-purple" />
      </header>
    )
  }

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg'
          : 'bg-white/80 backdrop-blur-lg'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Infoishai"
                  width={40}
                  height={40}
                  className={`w-10 h-10 rounded-xl shadow-md transition-all duration-300 ${
                    isScrolled ? 'shadow-lg' : 'group-hover:shadow-xl group-hover:scale-105'
                  }`}
                />
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
                className="px-4 py-2 text-gray-700 hover:text-brand-purple hover:bg-brand-pink/10 font-medium rounded-lg transition-all"
              >
                About
              </Link>
              {/* Contact */}
              <Link
                href="/contact"
                className="px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Contact
              </Link>

              {/* Countries Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCountriesDropdown(!showCountriesDropdown)}
                  className="px-4 py-2 text-gray-700 hover:text-brand-purple hover:bg-brand-pink/10 font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Countries
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCountriesDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showCountriesDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowCountriesDropdown(false)}
                    />
                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Find Influencers by Country</p>
                      </div>

                      <div className="grid grid-cols-2 gap-1 p-2">
                        {COUNTRY_LANDING_PAGES.map((country) => (
                          <Link
                            key={country.href}
                            href={country.href}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-pink/10 hover:text-brand-purple rounded-lg transition-colors"
                            onClick={() => setShowCountriesDropdown(false)}
                          >
                            <span aria-hidden="true">{country.flag}</span>
                            {country.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Link
                href="/blog"
                className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 font-medium rounded-lg transition-all"
              >
                Blog
              </Link>

              {!user && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                    className="px-5 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm flex items-center gap-2"
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
                          href="/login"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-brand-pink/10 transition-colors"
                          onClick={() => setShowLoginDropdown(false)}
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-pink rounded-lg flex items-center justify-center">
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
                            goToLogin()
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-brand-pink/10 transition-colors"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-brand-pink to-brand-purple rounded-lg flex items-center justify-center">
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
                        href="/creators"
                        className="p-2 text-gray-600 hover:text-brand-purple hover:bg-brand-pink/10 rounded-lg transition-all"
                        title="Search Influencers"
                      >
                        <Search className="w-5 h-5" />
                      </Link>
                      <Link
                        href="/campaigns/create"
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="My Campaigns"
                      >
                        <BarChart3 className="w-5 h-5" />
                      </Link>
                    </div>
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
                        <Image
                          src={user.profile_picture}
                          alt={getUserDisplayName()}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-lg border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-pink-light to-brand-purple-light flex items-center justify-center">
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
                          <div className="p-4 bg-gradient-to-br from-brand-pink/10 to-brand-purple/10 border-b border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                              {user.profile_picture ? (
                                <Image
                                  src={user.profile_picture}
                                  alt={getUserDisplayName()}
                                  width={56}
                                  height={56}
                                  className="w-14 h-14 rounded-xl border-2 border-white shadow-md"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-pink-light to-brand-purple-light flex items-center justify-center shadow-md">
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
                            <Link
                              href={getDashboardUrl()}
                              className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-pink/10 hover:text-brand-purple rounded-lg transition-all"
                              onClick={() => setShowDropdown(false)}
                            >
                              <Settings className="w-5 h-5" />
                              Dashboard
                            </Link>
                            
                            {userType === 'brand' && (
                              <>
                                <Link
                                  href="/creators"
                                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-pink/10 hover:text-brand-purple rounded-lg transition-all"
                                  onClick={() => setShowDropdown(false)}
                                >
                                  <Search className="w-5 h-5" />
                                  Search Influencers
                                </Link>
                                
                                <Link
                                  href="/campaigns/create"
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
                              className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-pink/10 hover:text-brand-purple rounded-lg transition-all"
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
                    className="hidden sm:block text-gray-700 hover:text-brand-purple font-medium transition-colors px-3 py-2"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/login"
                    className="bg-gradient-to-r from-brand-pink to-brand-purple hover:from-brand-pink-dark hover:to-brand-purple-dark text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <span className="hidden sm:inline">Get Started Free</span>
                    <span className="sm:hidden">Login</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
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
                      href="/login"
                      className="flex items-center gap-3 text-brand-purple hover:text-brand-purple-dark font-semibold py-3 px-4 rounded-lg transition-all hover:bg-brand-pink/10 border-2 border-brand-purple/30"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Influencer Login
                    </Link>
                    
                    <div className="h-px bg-gray-200 my-2" />
                  </>
                )}

                {isLoggedIn && userType === 'brand' && (
                  <>
                    <Link 
                      href="/creators"
                      className="flex items-center gap-3 text-gray-700 hover:text-brand-purple font-medium py-3 px-4 rounded-lg transition-all hover:bg-brand-pink/10"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Search className="w-5 h-5" />
                      Search Influencers
                    </Link>
                    
                    <Link
                      href="/campaigns/create"
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
                  className="text-gray-700 hover:text-brand-purple font-medium py-3 px-4 rounded-lg transition-all hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-gray-700 hover:text-brand-purple font-medium py-3 px-4 rounded-lg transition-all hover:bg-brand-pink/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Mail className="w-5 h-5" />
                  Contact
                </Link>

                {/* Countries - inline expandable */}
                <button
                  onClick={() => setIsMobileCountriesOpen(!isMobileCountriesOpen)}
                  aria-expanded={isMobileCountriesOpen}
                  className="w-full flex items-center justify-between gap-2 text-gray-700 hover:text-brand-purple font-medium py-3 px-4 rounded-lg transition-all hover:bg-brand-pink/10 min-h-[48px]"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Countries
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMobileCountriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMobileCountriesOpen && (
                  <div className="grid grid-cols-2 gap-1 px-4 pb-2">
                    {COUNTRY_LANDING_PAGES.map((country) => (
                      <Link
                        key={country.href}
                        href={country.href}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-purple font-medium py-2.5 px-3 rounded-lg transition-all hover:bg-brand-pink/10 min-h-[44px]"
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          setIsMobileCountriesOpen(false)
                        }}
                      >
                        <span aria-hidden="true">{country.flag}</span>
                        {country.name}
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  href="/blog"
                  className="text-gray-700 hover:text-orange-600 font-medium py-3 px-4 rounded-lg transition-all hover:bg-gray-50"
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
                        goToLogin()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-brand-pink to-brand-purple text-white px-4 py-3 rounded-lg font-bold text-sm hover:shadow-lg transition-all"
                    >
                      Get Started Free
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-pink to-brand-purple" />
      </header>

      {/* Spacer */}
      <div className="h-16"></div>
    </>
  )
}