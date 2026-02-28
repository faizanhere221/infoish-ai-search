'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  Settings,
  LogOut,
  Briefcase,
  MessageSquare,
  Bell,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  CreditCard,
  Users,
  Building2
} from 'lucide-react'

interface ProfileDropdownProps {
  userType: 'brand' | 'creator'
  profile: any
  unreadMessages?: number
  unreadNotifications?: number
}

export default function ProfileDropdown({ 
  userType, 
  profile, 
  unreadMessages = 0,
  unreadNotifications = 0 
}: ProfileDropdownProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_profile')
    router.push('/login')
  }

  const displayName = userType === 'brand' 
    ? profile?.company_name 
    : profile?.display_name
  
  const subtitle = userType === 'brand'
    ? profile?.contact_name || 'Brand Account'
    : `@${profile?.username}`

  const avatarLetter = displayName?.charAt(0) || (userType === 'brand' ? 'B' : 'C')

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="relative">
          {profile?.profile_photo_url || profile?.logo_url ? (
            <img 
              src={profile?.profile_photo_url || profile?.logo_url}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {avatarLetter}
            </div>
          )}
          {/* Notification dot */}
          {(unreadMessages > 0 || unreadNotifications > 0) && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {profile?.profile_photo_url || profile?.logo_url ? (
                <img 
                  src={profile?.profile_photo_url || profile?.logo_url}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {avatarLetter}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-sm text-gray-500 truncate">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats for Creators */}
          {userType === 'creator' && (
            <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{profile?.total_followers || 0}</p>
                <p className="text-xs text-gray-500">Followers</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{profile?.completed_deals || 0}</p>
                <p className="text-xs text-gray-500">Deals</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{profile?.avg_rating?.toFixed(1) || 'N/A'}</p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="py-2">
            {/* View Profile (Creator only) */}
            {userType === 'creator' && (
              <Link
                href={`/creators/${profile?.username}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <User className="w-5 h-5 text-gray-400" />
                <span>View Public Profile</span>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            )}

            {/* Dashboard */}
            <Link
              href={userType === 'brand' ? '/dashboard/brand' : '/dashboard/creator'}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              {userType === 'brand' ? (
                <Building2 className="w-5 h-5 text-gray-400" />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
              <span>Dashboard</span>
            </Link>

            {/* Messages */}
            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <span>Messages</span>
              {unreadMessages > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                  {unreadMessages}
                </span>
              )}
            </Link>

            {/* My Deals */}
            <Link
              href="/dashboard/deals"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Briefcase className="w-5 h-5 text-gray-400" />
              <span>My Deals</span>
            </Link>

            {/* Find Creators (Brand only) */}
            {userType === 'brand' && (
              <Link
                href="/creators"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <Users className="w-5 h-5 text-gray-400" />
                <span>Find Creators</span>
              </Link>
            )}

            {/* Notifications */}
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Bell className="w-5 h-5 text-gray-400" />
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-2" />

          {/* Settings Section */}
          <div className="py-2">
            {/* Settings */}
            <Link
              href={userType === 'brand' ? '/settings/brand' : '/settings'}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Settings className="w-5 h-5 text-gray-400" />
              <span>Settings</span>
            </Link>

            {/* Billing (if applicable) */}
            <Link
              href={userType === 'brand' ? '/settings/brand' : '/settings'}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span>{userType === 'brand' ? 'Billing & Payments' : 'Earnings & Payouts'}</span>
            </Link>

            {/* Help */}
            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <HelpCircle className="w-5 h-5 text-gray-400" />
              <span>Help & Support</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-2" />

          {/* Logout */}
          <div className="py-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}