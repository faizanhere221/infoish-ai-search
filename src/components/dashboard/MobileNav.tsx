'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  User,
  MoreHorizontal,
  X,
  Globe,
  DollarSign,
  Briefcase,
  Settings,
  Gift,
  type LucideIcon,
} from 'lucide-react'
import { usePartner } from '@/hooks/usePartner'

const PRIMARY_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard/creator', label: 'Home', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/settings', label: 'Profile', icon: User },
]

const MORE_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/settings?tab=platforms', label: 'Platforms', icon: Globe },
  { href: '/settings?tab=services', label: 'Services & Rates', icon: DollarSign },
  { href: '/dashboard/applications', label: 'My Applications', icon: Briefcase },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { isPartner } = usePartner()
  const [showMore, setShowMore] = useState(false)

  const isActive = (href: string) => pathname === href.split('?')[0]

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-stretch">
        {PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium ${
                isActive(item.href) ? 'text-violet-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={() => setShowMore(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-gray-500"
        >
          <MoreHorizontal className="w-5 h-5" />
          More
        </button>
      </nav>

      {/* Spacer so page content isn't hidden behind the fixed nav */}
      <div className="lg:hidden h-16" />

      {showMore && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="flex-1 bg-black/40" onClick={() => setShowMore(false)} />
          <div className="w-full bg-white rounded-t-2xl shadow-xl p-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">More</h3>
              <button onClick={() => setShowMore(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-1">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Icon className="w-5 h-5 text-gray-400" />
                    {item.label}
                  </Link>
                )
              })}
              {isPartner && (
                <Link
                  href="/dashboard/partner"
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Gift className="w-5 h-5 text-gray-400" />
                  Partner Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
