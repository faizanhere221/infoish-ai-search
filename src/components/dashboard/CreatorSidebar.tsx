'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  User,
  Globe,
  DollarSign,
  Megaphone,
  Briefcase,
  MessageSquare,
  Settings,
  Gift,
  type LucideIcon,
} from 'lucide-react'
import { usePartner } from '@/hooks/usePartner'
import type { ProfileCompletionItem } from '@/lib/profile-completion'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Matches a ProfileCompletionItem.id — shows a completion dot next to the link when present. */
  completionId?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard/creator', label: 'Overview', icon: LayoutDashboard },
  { href: '/settings', label: 'My Profile', icon: User, completionId: 'bio' },
  { href: '/settings?tab=platforms', label: 'Platforms', icon: Globe, completionId: 'platforms' },
  { href: '/settings?tab=services', label: 'Services & Rates', icon: DollarSign, completionId: 'rates' },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/dashboard/applications', label: 'My Applications', icon: Briefcase },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface CreatorSidebarProps {
  completionItems: ProfileCompletionItem[]
}

export default function CreatorSidebar({ completionItems }: CreatorSidebarProps) {
  const pathname = usePathname()
  const { isPartner } = usePartner()

  const completionById = new Map(completionItems.map((i) => [i.id, i.isComplete]))

  const isActive = (href: string) => {
    const [path] = href.split('?')
    return pathname === path
  }

  return (
    <aside className="hidden lg:block w-60 flex-shrink-0">
      <nav className="bg-white rounded-xl border border-gray-200 p-2 sticky top-24 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const complete = item.completionId ? completionById.get(item.completionId) : undefined
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {complete === true && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" title="Complete" />}
              {complete === false && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Incomplete" />}
            </Link>
          )
        })}

        {isPartner && (
          <>
            <div className="my-2 border-t border-gray-100" />
            <Link
              href="/dashboard/partner"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/dashboard/partner')
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Gift className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">Partner Dashboard</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}
