'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  Bell,
  Menu,
  X
} from 'lucide-react'
import ProfileDropdown, { type ProfileDropdownProfile } from './ProfileDropdown'

interface DashboardHeaderProps {
  userType: 'brand' | 'creator'
  profile: ProfileDropdownProfile | null
  hideNotifications?: boolean
}

export default function DashboardHeader({ userType, profile, hideNotifications = false }: DashboardHeaderProps) {
  const pathname = usePathname()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [campaignBadgeCount, setCampaignBadgeCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchUnreadCounts = useCallback(async () => {
    if (!profile?.id) {return}

    try {
      // Fetch unread messages
      const params = new URLSearchParams()
      if (userType === 'brand') {
        params.set('brand_id', profile.id)
      } else {
        params.set('creator_id', profile.id)
      }

      const convRes = await fetch(`/api/conversations?${params.toString()}`)
      if (convRes.ok) {
        const data = await convRes.json()
        const conversations = data.conversations || []
        const unread = conversations.reduce((sum: number, conv: { brand_unread?: number; creator_unread?: number }) => {
          const count = userType === 'brand' ? (conv.brand_unread || 0) : (conv.creator_unread || 0)
          return sum + count
        }, 0)
        setUnreadMessages(unread)
      }

      // Fetch unread notification count
      const authToken = localStorage.getItem('auth_token')
      if (authToken) {
        const notifRes = await fetch('/api/notifications?unread=true&limit=1', {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (notifRes.ok) {
          const notifData = await notifRes.json()
          setUnreadNotifications(notifData.unread_count ?? 0)
        }
      }

      // Fetch campaign-related count badge: active campaigns for brands,
      // total applications for creators
      if (authToken) {
        if (userType === 'brand') {
          const campaignsRes = await fetch('/api/campaigns?status=published&limit=50', {
            headers: { Authorization: `Bearer ${authToken}` },
          })
          if (campaignsRes.ok) {
            const campaignsData = await campaignsRes.json()
            setCampaignBadgeCount(campaignsData.total ?? (campaignsData.campaigns || []).length)
          }
        } else {
          const applicationsRes = await fetch('/api/applications', {
            headers: { Authorization: `Bearer ${authToken}` },
          })
          if (applicationsRes.ok) {
            const applicationsData = await applicationsRes.json()
            setCampaignBadgeCount((applicationsData.applications || []).length)
          }
        }
      }
    } catch (err) {
      console.error('Error fetching unread counts:', err)
    }
  }, [profile, userType])

  useEffect(() => {
    fetchUnreadCounts()
    // Poll for updates every 5 seconds for real-time feel
    const interval = setInterval(fetchUnreadCounts, 5000)
    return () => clearInterval(interval)
  }, [fetchUnreadCounts])

  const navItems = userType === 'brand' ? [
    { href: '/dashboard/brand', label: 'Dashboard' },
    { href: '/creators', label: 'Find Creators' },
    { href: '/dashboard/campaigns', label: 'My Campaigns', countBadge: campaignBadgeCount },
    { href: '/messages', label: 'Messages', badge: unreadMessages },
    { href: '/dashboard/deals', label: 'My Deals' },
    { href: '/settings/brand', label: 'Settings' },
  ] : [
    { href: '/dashboard/creator', label: 'Dashboard' },
    { href: '/creators', label: 'Find Creators' },
    { href: '/campaigns', label: 'Campaigns' },
    { href: '/dashboard/applications', label: 'My Applications', countBadge: campaignBadgeCount },
    { href: '/messages', label: 'Messages', badge: unreadMessages },
    { href: '/settings', label: 'Settings' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard/brand' || href === '/dashboard/creator') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <header className="relative bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Infoishai" width={32} height={32} className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold text-gray-900">Infoishai</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive(item.href)
                      ? 'bg-brand-pink/10 text-brand-purple-dark'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center font-bold">
                      {item.badge}
                    </span>
                  )}
                  {item.countBadge !== undefined && item.countBadge > 0 && (
                    <span className="px-1.5 py-0.5 bg-brand-pink/20 text-brand-purple-dark text-xs rounded-full min-w-[20px] text-center font-semibold">
                      {item.countBadge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            {!hideNotifications && userType === 'brand' && (
              <Link
                href="/notifications"
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full font-bold border-2 border-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* Messages (Quick access) */}
            <Link
              href="/messages"
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full font-bold border-2 border-white">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <ProfileDropdown
              userType={userType}
              profile={profile}
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
            />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                    isActive(item.href)
                      ? 'bg-brand-pink/10 text-brand-purple-dark'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                  {item.countBadge !== undefined && item.countBadge > 0 && (
                    <span className="px-1.5 py-0.5 bg-brand-pink/20 text-brand-purple-dark text-xs rounded-full font-semibold">
                      {item.countBadge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-pink to-brand-purple" />
    </header>
  )
}