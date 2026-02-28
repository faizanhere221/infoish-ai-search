'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  Sparkles, 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  User, 
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  Search,
  CreditCard
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  userType: 'creator' | 'brand'
  user: {
    name: string
    email: string
    avatar?: string
    username?: string // for creators
    companyName?: string // for brands
  }
  unreadMessages?: number
}

export default function DashboardLayout({ 
  children, 
  userType, 
  user,
  unreadMessages = 0 
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const creatorNavItems = [
    { href: '/dashboard/creator', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
    { href: '/dashboard/deals', label: 'My Deals', icon: FileText },
    { href: '/dashboard/creator/profile', label: 'Edit Profile', icon: User },
    { href: '/dashboard/creator/payments', label: 'Payments', icon: CreditCard },
    { href: '/dashboard/creator/settings', label: 'Settings', icon: Settings },
  ]

  const brandNavItems = [
    { href: '/dashboard/brand', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/creators', label: 'Find Creators', icon: Search },
    { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
    { href: '/dashboard/deals', label: 'My Deals', icon: FileText },
    { href: '/dashboard/brand/profile', label: 'Company Profile', icon: Building2 },
    { href: '/dashboard/brand/settings', label: 'Settings', icon: Settings },
  ]

  const navItems = userType === 'creator' ? creatorNavItems : brandNavItems

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Infoishai</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.name[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {userType === 'creator' ? `@${user.username}` : user.companyName}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          {/* Mobile menu button */}
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Page title - can be customized per page */}
          <div className="hidden lg:block" />

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown menu */}
              {profileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    {userType === 'creator' && (
                      <Link 
                        href={`/creators/${user.username}`}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        View Public Profile
                      </Link>
                    )}
                    
                    <Link 
                      href={userType === 'creator' ? '/dashboard/creator/settings' : '/dashboard/brand/settings'}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    
                    <hr className="my-2" />
                    
                    <button 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      onClick={() => {
                        // TODO: Implement logout
                        setProfileDropdownOpen(false)
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}