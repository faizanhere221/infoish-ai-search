'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  MessageSquare,
  Bell,
  Menu,
  X
} from 'lucide-react'
import ProfileDropdown, { type ProfileDropdownProfile } from './ProfileDropdown'
import { useConversationsList } from '@/hooks/useConversationsList'
import { usePolling } from '@/hooks/usePolling'
import { captureError } from '@/lib/error-tracking'
import { getEventTab, campaignCreatorGoUrl } from '@/lib/campaign-creator-cta'

interface HeaderNotification {
  id: string
  title: string
  content: string
  related_type: string | null
  related_id: string | null
  is_read: boolean
}

function notificationHref(n: HeaderNotification): string | null {
  const tab = getEventTab(n.related_type)
  if (tab && n.related_id) {return campaignCreatorGoUrl(n.related_id, tab)}
  if (n.related_type === 'conversation' && n.related_id) {return `/messages/${n.related_id}`}
  return null
}

interface DashboardHeaderProps {
  userType: 'brand' | 'creator'
  profile: ProfileDropdownProfile | null
  hideNotifications?: boolean
}

export default function DashboardHeader({ userType, profile, hideNotifications = false }: DashboardHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [latestNotifications, setLatestNotifications] = useState<HeaderNotification[]>([])
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [campaignBadgeCount, setCampaignBadgeCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAuthToken(localStorage.getItem('auth_token'))
  }, [])

  // Messages unread badge: polled every 10s (paused while hidden, refetched
  // on refocus) by the same hook the inbox itself uses.
  const { unreadTotal: unreadMessages } = useConversationsList(userType, profile?.id ?? null, authToken)

  // Latest 10 + unread count for the bell dropdown, polled every 20s while
  // the tab is visible (usePolling pauses in the background automatically).
  const fetchNotifications = useCallback(async () => {
    if (!profile?.id || !authToken) {return}
    try {
      const res = await fetch('/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadNotifications(data.unread_count ?? 0)
        setLatestNotifications(data.notifications ?? [])
      }
    } catch (err) {
      captureError(err, { context: 'DashboardHeader: fetchNotifications' })
    }
  }, [profile, authToken])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])
  usePolling(fetchNotifications, 20000, { enabled: Boolean(profile?.id && authToken) })

  const fetchCampaignBadgeCount = useCallback(async () => {
    if (!profile?.id || !authToken) {return}
    try {
      // Active campaigns for brands, total applications for creators
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
    } catch (err) {
      captureError(err, { context: 'DashboardHeader: fetchCampaignBadgeCount' })
    }
  }, [profile, userType, authToken])

  useEffect(() => {
    fetchCampaignBadgeCount()
  }, [fetchCampaignBadgeCount])
  usePolling(fetchCampaignBadgeCount, 5000, { enabled: Boolean(profile?.id && authToken) })

  // Close the notification dropdown on an outside click.
  useEffect(() => {
    if (!notifDropdownOpen) {return}
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {setNotifDropdownOpen(false)}
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [notifDropdownOpen])

  const openNotification = async (n: HeaderNotification) => {
    setNotifDropdownOpen(false)
    if (!n.is_read && authToken) {
      setLatestNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
      setUnreadNotifications((c) => Math.max(0, c - 1))
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      }).catch((err) => captureError(err, { context: 'DashboardHeader: markRead' }))
    }
    const href = notificationHref(n)
    router.push(href ?? '/notifications')
  }

  const navItems = userType === 'brand' ? [
    { href: '/dashboard/brand', label: 'Dashboard' },
    { href: '/creators', label: 'Find Creators' },
    { href: '/dashboard/campaigns', label: 'My Campaigns', countBadge: campaignBadgeCount },
    { href: '/dashboard/roster', label: 'Roster' },
    { href: '/dashboard/payments', label: 'Payments' },
    { href: '/dashboard/analytics', label: 'Analytics' },
    { href: '/dashboard/calendar', label: 'Calendar' },
    { href: '/messages', label: 'Messages', badge: unreadMessages },
    { href: '/dashboard/deals', label: 'My Deals' },
    { href: '/settings/brand', label: 'Settings' },
  ] : [
    { href: '/dashboard/creator', label: 'Dashboard' },
    { href: '/creators', label: 'Find Creators' },
    { href: '/campaigns', label: 'Campaigns' },
    { href: '/dashboard/applications', label: 'My Applications', countBadge: campaignBadgeCount },
    { href: '/dashboard/my-campaigns', label: 'My Campaigns' },
    { href: '/dashboard/earnings', label: 'Earnings' },
    { href: '/dashboard/calendar', label: 'Calendar' },
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
            {!hideNotifications && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifDropdownOpen((o) => !o)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full font-bold border-2 border-white">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">
                      Notifications
                    </div>
                    {latestNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {latestNotifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => openNotification(n)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-brand-pink/5' : ''}`}
                          >
                            <p className={`text-sm font-medium truncate ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{n.content}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    <Link
                      href="/notifications"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="block px-4 py-3 text-center text-sm font-medium text-brand-purple-dark hover:bg-brand-pink/5 border-t border-gray-100"
                    >
                      View all
                    </Link>
                  </div>
                )}
              </div>
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