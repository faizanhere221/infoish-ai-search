'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sparkles,
  MessageSquare,
  Bell,
  Menu,
  X
} from 'lucide-react'
import ProfileDropdown from './ProfileDropdown'

interface DashboardHeaderProps {
  userType: 'brand' | 'creator'
  profile: any
}

export default function DashboardHeader({ userType, profile }: DashboardHeaderProps) {
  const pathname = usePathname()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchUnreadCounts()
    // Poll for updates every 5 seconds for real-time feel
    const interval = setInterval(fetchUnreadCounts, 5000)
    return () => clearInterval(interval)
  }, [profile])

  const fetchUnreadCounts = async () => {
    if (!profile?.id) return

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
        const unread = conversations.reduce((sum: number, conv: any) => {
          const count = userType === 'brand' ? (conv.brand_unread || 0) : (conv.creator_unread || 0)
          return sum + count
        }, 0)
        setUnreadMessages(unread)
      }

      // TODO: Fetch unread notifications when implemented
      setUnreadNotifications(0)
    } catch (err) {
      console.error('Error fetching unread counts:', err)
    }
  }

  const navItems = userType === 'brand' ? [
    { href: '/dashboard/brand', label: 'Dashboard' },
    { href: '/creators', label: 'Find Creators' },
    { href: '/messages', label: 'Messages', badge: unreadMessages },
    { href: '/dashboard/deals', label: 'My Deals' },
  ] : [
    { href: '/dashboard/creator', label: 'Dashboard' },
    { href: '/messages', label: 'Messages', badge: unreadMessages },
    { href: '/dashboard/deals', label: 'My Deals' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard/brand' || href === '/dashboard/creator') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
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
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <Link
              href="/notifications"
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>

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
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}