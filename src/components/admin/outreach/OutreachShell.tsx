'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { OutreachProvider, useOutreach } from '@/components/admin/outreach/OutreachContext'

const TABS = [
  { href: '/admin/outreach', label: 'Today' },
  { href: '/admin/outreach/creators', label: 'Creators' },
  { href: '/admin/outreach/brands', label: 'Brands' },
  { href: '/admin/outreach/database/creators', label: 'Creator DB' },
  { href: '/admin/outreach/database/brands', label: 'Client DB' },
  { href: '/admin/outreach/import', label: 'Import' },
  { href: '/admin/outreach/dashboard', label: 'Dashboard' },
  { href: '/admin/outreach/mailboxes', label: 'Mailboxes' },
  { href: '/admin/outreach/dnc', label: 'Do not contact' },
  { href: '/admin/outreach/team', label: 'Team', adminOnly: true },
]

function Tabs() {
  const pathname = usePathname()
  const { me } = useOutreach()
  return (
    <nav className="-mx-1 mb-5 flex flex-wrap gap-1 border-b border-slate-800 pb-px">
      {TABS.filter((t) => !t.adminOnly || me?.is_admin).map((t) => {
        const active = t.href === '/admin/outreach' ? pathname === t.href : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active ? 'border-violet-500 text-white' : 'border-transparent text-slate-400 hover:text-white',
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function OutreachShell({ children }: { children: React.ReactNode }) {
  return (
    <OutreachProvider>
      <Tabs />
      {children}
    </OutreachProvider>
  )
}
