'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, UserSquare, Building2, Handshake,
  FileText, Mail, LogOut, Menu, X, Shield,
  Activity, BarChart2, Search, ChevronDown, Settings, UserCog,
} from 'lucide-react'

// ─── Nav structure ────────────────────────────────────────────────────────────
const NAV = [
  { label: 'Dashboard',   href: '/admin/dashboard',   icon: LayoutDashboard },
  {
    label: 'Users', icon: Users, children: [
      { label: 'All Users', href: '/admin/users',    icon: Users },
      { label: 'Creators',  href: '/admin/creators', icon: UserSquare },
      { label: 'Brands',    href: '/admin/brands',   icon: Building2 },
    ],
  },
  { label: 'Deals',       href: '/admin/deals',       icon: Handshake },
  { label: 'Analytics',   href: '/admin/analytics',   icon: BarChart2 },
  { label: 'Activity',    href: '/admin/activity',    icon: Activity },
  { label: 'Search',      href: '/admin/search',      icon: Search },
  { label: 'Contacts',    href: '/admin/contacts',    icon: FileText },
  { label: 'Newsletter',  href: '/admin/newsletter',  icon: Mail },
  {
    label: 'Settings', icon: Settings, children: [
      { label: 'Platform', href: '/admin/settings', icon: Settings },
      { label: 'Admins',   href: '/admin/admins',   icon: UserCog },
    ],
  },
]

// ─── Global search ────────────────────────────────────────────────────────────
interface SearchResult {
  users?: { id: string; email: string; user_type: string }[]
  creators?: { id: string; username: string; display_name: string }[]
  brands?: { id: string; company_name: string; industry: string }[]
  deals?: { id: string; title: string; status: string }[]
}

function GlobalSearch() {
  const [q, setQ]             = useState('')
  const [open, setOpen]       = useState(false)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(async (query: string) => {
    if (query.length < 2) { setResults(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}&limit=4`)
      const data = await res.json()
      setResults(data.results ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(q), 300)
    return () => clearTimeout(timerRef.current)
  }, [q, search])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const hasResults = results && Object.values(results).some(arr => arr && arr.length > 0)

  return (
    <div ref={ref} className="relative w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search users, creators, deals…"
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
      />
      {open && q.length >= 2 && (
        <div className="absolute top-10 left-0 right-0 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-slate-500 text-sm">Searching…</div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-slate-500 text-sm">No results</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {results?.users && results.users.length > 0 && (
                <ResultGroup label="Users" onViewAll={() => { router.push(`/admin/users?search=${q}`); setOpen(false) }}>
                  {results.users.map(u => (
                    <ResultItem key={u.id} label={u.email} sub={u.user_type} href={`/admin/users`} onNav={() => setOpen(false)} />
                  ))}
                </ResultGroup>
              )}
              {results?.creators && results.creators.length > 0 && (
                <ResultGroup label="Creators" onViewAll={() => { router.push(`/admin/creators?search=${q}`); setOpen(false) }}>
                  {results.creators.map(c => (
                    <ResultItem key={c.id} label={c.display_name || c.username} sub={`@${c.username}`} href={`/admin/creators`} onNav={() => setOpen(false)} />
                  ))}
                </ResultGroup>
              )}
              {results?.brands && results.brands.length > 0 && (
                <ResultGroup label="Brands" onViewAll={() => { router.push(`/admin/brands?search=${q}`); setOpen(false) }}>
                  {results.brands.map(b => (
                    <ResultItem key={b.id} label={b.company_name} sub={b.industry} href={`/admin/brands`} onNav={() => setOpen(false)} />
                  ))}
                </ResultGroup>
              )}
              {results?.deals && results.deals.length > 0 && (
                <ResultGroup label="Deals" onViewAll={() => { router.push(`/admin/deals?search=${q}`); setOpen(false) }}>
                  {results.deals.map(d => (
                    <ResultItem key={d.id} label={d.title} sub={d.status} href={`/admin/deals`} onNav={() => setOpen(false)} />
                  ))}
                </ResultGroup>
              )}
              <div className="border-t border-slate-700 p-2">
                <button
                  onClick={() => { router.push(`/admin/search?q=${q}`); setOpen(false) }}
                  className="w-full text-xs text-violet-400 hover:text-violet-300 py-1.5 text-center"
                >
                  Advanced search for &quot;{q}&quot; →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultGroup({ label, children, onViewAll }: { label: string; children: React.ReactNode; onViewAll: () => void }) {
  return (
    <div className="border-b border-slate-800 last:border-0">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <button onClick={onViewAll} className="text-xs text-violet-400 hover:text-violet-300">See all</button>
      </div>
      {children}
    </div>
  )
}

function ResultItem({ label, sub, href, onNav }: { label: string; sub: string; href: string; onNav: () => void }) {
  return (
    <Link href={href} onClick={onNav} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors">
      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-medium flex-shrink-0">
        {label[0]?.toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-white truncate">{label}</div>
        <div className="text-xs text-slate-500 truncate">{sub}</div>
      </div>
    </Link>
  )
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────
const ROUTE_NAMES: Record<string, string> = {
  admin: 'Admin', dashboard: 'Dashboard', users: 'Users', creators: 'Creators',
  brands: 'Brands', deals: 'Deals', analytics: 'Analytics', activity: 'Activity',
  search: 'Search', settings: 'Settings', admins: 'Admins', payments: 'Payments',
  contacts: 'Contacts', newsletter: 'Newsletter', subscriptions: 'Subscriptions',
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  return (
    <nav className="flex items-center gap-1 text-sm">
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/')
        const isLast = i === segments.length - 1
        const name = ROUTE_NAMES[seg] ?? seg
        return (
          <span key={href} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-600">/</span>}
            {isLast ? (
              <span className="text-white font-medium">{name}</span>
            ) : (
              <Link href={href} className="text-slate-400 hover:text-white transition-colors">{name}</Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

// ─── Nav item ────────────────────────────────────────────────────────────────
type NavItem =
  | { label: string; href: string; icon: React.ComponentType<{ className?: string }>; children?: never }
  | { label: string; icon: React.ComponentType<{ className?: string }>; href?: never; children: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] }

function NavEntry({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem
  pathname: string
  collapsed: boolean
}) {
  const hasChildren = !!item.children
  const childActive = hasChildren && item.children.some(c => pathname.startsWith(c.href))
  const [expanded, setExpanded] = useState(childActive)
  const Icon = item.icon

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => !collapsed && setExpanded(!expanded)}
          title={collapsed ? item.label : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${childActive ? 'text-white bg-slate-700/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="font-medium flex-1 text-left">{item.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
        {!collapsed && expanded && (
          <div className="mt-0.5 ml-3 pl-3 border-l border-slate-700/50 space-y-0.5">
            {item.children.map(child => {
              const active = pathname === child.href || pathname.startsWith(child.href + '/')
              const CIcon = child.icon
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${active ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                  <CIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{child.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href + '/'))
  return (
    <Link
      href={item.href!}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="font-medium">{item.label}</span>}
    </Link>
  )
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [collapsed, setCollapsed]     = useState(false)
  const [adminEmail, setAdminEmail]   = useState('')
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => { setAdminEmail(localStorage.getItem('admin_email') ?? 'Admin') }, [])

  if (pathname === '/admin/login') return <>{children}</>

  const handleLogout = async () => {
    try { await fetch('/api/admin/auth/logout', { method: 'POST' }) } finally {
      localStorage.removeItem('admin_email')
      router.push('/admin/login')
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200`}>
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-800">
          <div className="flex-shrink-0 w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-semibold text-sm text-white tracking-wide truncate">Admin Panel</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {(NAV as NavItem[]).map((item) => (
            <NavEntry key={item.label} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          {!collapsed && (
            <div className="px-2 mb-1">
              <p className="text-xs text-slate-500 truncate">{adminEmail}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Topbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex-shrink-0"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>

          {/* Breadcrumbs */}
          <div className="hidden md:block">
            <Breadcrumbs />
          </div>

          <div className="flex-1" />

          {/* Global Search */}
          <div className="hidden lg:block">
            <GlobalSearch />
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                {adminEmail[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:block max-w-[120px] truncate">{adminEmail}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showProfile && (
              <div className="absolute right-0 top-10 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-1 min-w-[160px]">
                <div className="px-3 py-2 border-b border-slate-700 mb-1">
                  <div className="text-xs text-slate-400 truncate">{adminEmail}</div>
                </div>
                <Link href="/admin/settings" onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
