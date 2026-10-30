'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, ChevronDown, Globe, BookOpen, Shield } from 'lucide-react'
import Logo from '@/components/Logo'
import ProfileDropdown, { type ProfileDropdownProfile } from '@/components/ProfileDropdown'
import { COUNTRY_LANDING_PAGES } from '@/utils/constants'
import { cn } from '@/lib/utils'

type Viewer =
  | { kind: 'guest' }
  | { kind: 'member'; userType: 'brand' | 'creator'; profile: ProfileDropdownProfile | null; isAdmin: boolean }
  | { kind: 'admin' }

function readViewer(): Viewer {
  try {
    const userStr = localStorage.getItem('auth_user')
    if (!userStr || !localStorage.getItem('auth_token')) {return { kind: 'guest' }}
    const user = JSON.parse(userStr)
    const isAdmin = user.role === 'admin' || user.role === 'super_admin'
    if (user.user_type === 'brand' || user.user_type === 'creator') {
      const profileStr = localStorage.getItem('auth_profile')
      return { kind: 'member', userType: user.user_type, profile: profileStr ? JSON.parse(profileStr) : null, isAdmin }
    }
    return isAdmin || user.user_type === 'admin' ? { kind: 'admin' } : { kind: 'guest' }
  } catch {
    // malformed localStorage: treat as logged out
    return { kind: 'guest' }
  }
}

interface HeaderProps {
  /**
   * Homepage-style: transparent until scrolled, and no spacer (the page's
   * hero already pads for the fixed header). Every other public page uses
   * the default solid header plus spacer.
   */
  overlay?: boolean
}

/**
 * The one public-site header. Every public page renders this (the landing
 * `Navigation` export is a thin wrapper around it), so logo, nav items and
 * auth state look the same everywhere.
 *
 * Auth is only known client-side, so the server render and first paint use
 * a `null` viewer: nav links render, and the right-hand CTAs reserve their
 * space invisibly until the real state is read. Header height never
 * changes, so nothing below it moves.
 */
export default function Header({ overlay = false }: HeaderProps) {
  const router = useRouter()
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [countriesOpen, setCountriesOpen] = useState(false)
  const [mobileCountriesOpen, setMobileCountriesOpen] = useState(false)

  useEffect(() => {
    setViewer(readViewer())
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isGuest = viewer?.kind === 'guest'
  const dashboardHref =
    viewer?.kind === 'member'
      ? viewer.userType === 'brand' ? '/dashboard/brand' : '/dashboard/creator'
      : '/admin'
  const showAdminLink = viewer?.kind === 'admin' || (viewer?.kind === 'member' && viewer.isAdmin)
  // The managed service (/pricing) is for brands and prospects, so creators don't see it.
  // Shown while auth is unknown so logged-out visitors (and crawlers) get it.
  const showPricing = !(viewer?.kind === 'member' && viewer.userType === 'creator')

  const adminLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_profile')
    router.push('/login')
  }

  const navLink = 'whitespace-nowrap text-gray-600 hover:text-gray-900 font-medium'

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-colors duration-300',
          overlay && !isScrolled && !mobileMenuOpen
            ? 'bg-transparent'
            : 'bg-white/95 backdrop-blur-md shadow-sm'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main">
          <div className="flex items-center justify-between h-16">
            <Link href="/" aria-label="Infoishai home" className="flex items-center">
              <Logo priority />
            </Link>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center gap-7">
              <Link href="/creators" className={navLink}>Find Creators</Link>
              <Link href="/campaigns" className={navLink}>Campaigns</Link>
              {showPricing && <Link href="/pricing" className={navLink}>Managed Service</Link>}
              <Link href="/blog" className={cn(navLink, 'flex items-center gap-1')}>
                <BookOpen className="w-4 h-4" />
                Blog
              </Link>

              <div className="relative">
                <button
                  onClick={() => setCountriesOpen(!countriesOpen)}
                  aria-expanded={countriesOpen}
                  className={cn(navLink, 'flex items-center gap-1')}
                >
                  <Globe className="w-4 h-4" />
                  Countries
                  <ChevronDown className={`w-4 h-4 transition-transform ${countriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {countriesOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCountriesOpen(false)} />
                    <div className="absolute left-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Find Influencers by Country</p>
                      </div>
                      <div className="grid grid-cols-2 gap-1 p-2">
                        {COUNTRY_LANDING_PAGES.map((country) => (
                          <Link
                            key={country.href}
                            href={country.href}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-brand-pink/10 hover:text-brand-purple-dark rounded-lg transition-colors"
                            onClick={() => setCountriesOpen(false)}
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

              <Link href="/about" className={navLink}>About</Link>
              {isGuest && <Link href="/contact" className={navLink}>Contact</Link>}
            </div>

            {/* Desktop auth actions */}
            <div className="hidden lg:flex items-center gap-4">
              {viewer === null || viewer.kind === 'guest' ? (
                // Invisible (not absent) until auth is read, so the slot keeps its size.
                <div className={cn('flex items-center gap-4', viewer === null && 'invisible')}>
                  <Link href="/login" className={navLink}>Log in</Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-full font-medium hover:shadow-lg hover:shadow-brand-pink/25 transition-all"
                  >
                    Get Started Free
                  </Link>
                </div>
              ) : (
                <>
                  {showAdminLink && (
                    <Link href="/admin" className={cn(navLink, 'flex items-center gap-1')}>
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  {viewer.kind === 'member' ? (
                    <>
                      <Link href={dashboardHref} className={navLink}>Dashboard</Link>
                      <ProfileDropdown userType={viewer.userType} profile={viewer.profile} />
                    </>
                  ) : (
                    <button onClick={adminLogout} className={navLink}>Log out</button>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="flex flex-col gap-1">
                <Link href="/creators" className={cn(navLink, 'py-3')}>Find Creators</Link>
                <Link href="/campaigns" className={cn(navLink, 'py-3')}>Campaigns</Link>
                {showPricing && <Link href="/pricing" className={cn(navLink, 'py-3')}>Managed Service</Link>}
                <Link href="/blog" className={cn(navLink, 'py-3')}>Blog</Link>

                <button
                  onClick={() => setMobileCountriesOpen(!mobileCountriesOpen)}
                  aria-expanded={mobileCountriesOpen}
                  className={cn(navLink, 'w-full flex items-center justify-between py-3 min-h-[48px]')}
                >
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    Countries
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileCountriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {mobileCountriesOpen && (
                  <div className="grid grid-cols-2 gap-1 pb-2">
                    {COUNTRY_LANDING_PAGES.map((country) => (
                      <Link
                        key={country.href}
                        href={country.href}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium py-2.5 px-2 rounded-lg hover:bg-brand-pink/10 min-h-[44px]"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          setMobileCountriesOpen(false)
                        }}
                      >
                        <span aria-hidden="true">{country.flag}</span>
                        {country.name}
                      </Link>
                    ))}
                  </div>
                )}

                <Link href="/about" className={cn(navLink, 'py-3')}>About</Link>
                {isGuest && <Link href="/contact" className={cn(navLink, 'py-3')}>Contact</Link>}

                <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-gray-100">
                  {viewer === null || viewer.kind === 'guest' ? (
                    <>
                      <Link href="/login" className="text-center py-2 text-gray-600 font-medium">Log in</Link>
                      <Link
                        href="/signup"
                        className="text-center py-3 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-full font-medium"
                      >
                        Get Started Free
                      </Link>
                    </>
                  ) : (
                    <>
                      {showAdminLink && (
                        <Link href="/admin" className="text-center py-2 text-gray-600 font-medium">Admin</Link>
                      )}
                      {viewer.kind === 'member' ? (
                        <>
                          <Link href={dashboardHref} className="text-center py-2 text-gray-600 font-medium">Dashboard</Link>
                          <div className="flex justify-center">
                            <ProfileDropdown userType={viewer.userType} profile={viewer.profile} />
                          </div>
                        </>
                      ) : (
                        <button onClick={adminLogout} className="text-center py-2 text-gray-600 font-medium">Log out</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-pink to-brand-purple" />
      </header>
      {!overlay && <div className="h-16" aria-hidden="true" />}
    </>
  )
}
