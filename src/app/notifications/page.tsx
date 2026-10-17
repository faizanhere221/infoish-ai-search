'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  MessageSquare,
  Gift,
  FileText,
  ClipboardList,
  DollarSign,
  User,
  Loader2,
  Check,
  Archive,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { getEventTab, campaignCreatorGoUrl } from '@/lib/campaign-creator-cta'

interface Notification {
  id: string
  user_id: string
  type: string
  category: string | null
  priority: 'action' | 'info' | null
  title: string
  content: string
  related_type: string | null
  related_id: string | null
  is_read: boolean
  archived_at: string | null
  created_at: string
}

type FilterTab = 'all' | 'action' | 'messages' | 'offers' | 'contracts' | 'work' | 'payments' | 'account'

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'action', label: 'Action needed' },
  { id: 'messages', label: 'Messages' },
  { id: 'offers', label: 'Offers' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'work', label: 'Work' },
  { id: 'payments', label: 'Payments' },
  { id: 'account', label: 'Account' },
]

// Resolves a notification's related_type/related_id into a destination
// link. campaign_creator-driven notifications (offers/contracts/
// deliverables/payments) pass their eventType as related_type, resolved
// via the same lookup table that drives the chat card buttons —
// src/lib/campaign-creator-cta.ts — so both land on the same tab
// regardless of which one the user clicked.
function notificationLink(n: Notification): string | null {
  const tab = getEventTab(n.related_type)
  if (tab && n.related_id) {return campaignCreatorGoUrl(n.related_id, tab)}

  switch (n.related_type) {
    case 'conversation':
      return n.related_id ? `/messages/${n.related_id}` : null
    case 'deal':
      return n.related_id ? `/dashboard/deals/${n.related_id}` : null
    case 'campaign':
      return n.related_id ? `/dashboard/campaigns/${n.related_id}/applications` : null
    case 'campaign_application':
      return n.related_id ? `/dashboard/applications/${n.related_id}` : null
    case 'partner':
      return '/dashboard/partner'
    default:
      return null
  }
}

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string }> = {
  messages: { icon: MessageSquare, color: 'bg-indigo-100 text-indigo-600' },
  offers: { icon: Gift, color: 'bg-brand-pink/20 text-brand-purple-dark' },
  contracts: { icon: FileText, color: 'bg-blue-100 text-blue-600' },
  work: { icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600' },
  payments: { icon: DollarSign, color: 'bg-amber-100 text-amber-700' },
  account: { icon: User, color: 'bg-gray-100 text-gray-600' },
}
const DEFAULT_META = { icon: Bell, color: 'bg-gray-100 text-gray-600' }

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)

  if (diffMins < 1) {return 'Just now'}
  if (diffMins < 60) {return `${diffMins}m ago`}
  if (diffHours < 24) {return `${diffHours}h ago`}
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function dayBucket(dateStr: string): 'Today' | 'Yesterday' | 'Earlier' {
  const date = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000)
  if (date >= startOfToday) {return 'Today'}
  if (date >= startOfYesterday) {return 'Yesterday'}
  return 'Earlier'
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const storedToken = localStorage.getItem('auth_token')

    if (!userStr) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    setUserType(user.user_type)
    setToken(storedToken)
    if (profileStr) {setProfile(JSON.parse(profileStr))}
  }, [router])

  const queryForFilter = useCallback((f: FilterTab) => {
    const params = new URLSearchParams({ limit: '20' })
    if (f === 'action') {params.set('priority', 'action')}
    else if (f !== 'all') {params.set('category', f)}
    return params
  }, [])

  const loadFirstPage = useCallback(async (authToken: string | null, f: FilterTab) => {
    if (!authToken) {return}
    setLoading(true)
    setLoadError(false)
    try {
      const params = queryForFilter(f)
      const res = await fetch(`/api/notifications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) {throw new Error('Failed to load')}
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unread_count ?? 0)
      setHasMore(!!data.has_more)
      setCursor(data.next_cursor ?? null)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [queryForFilter])

  useEffect(() => {
    if (token !== null) {loadFirstPage(token, filter)}
  }, [token, filter, loadFirstPage])

  const loadMore = useCallback(async () => {
    if (!token || !hasMore || !cursor || loadingMore) {return}
    setLoadingMore(true)
    try {
      const params = queryForFilter(filter)
      params.set('before', cursor)
      const res = await fetch(`/api/notifications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications((prev) => [...prev, ...(data.notifications ?? [])])
        setHasMore(!!data.has_more)
        setCursor(data.next_cursor ?? null)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [token, hasMore, cursor, loadingMore, filter, queryForFilter])

  // Infinite scroll — load the next page once the sentinel at the bottom
  // of the list enters the viewport.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) {return}
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {loadMore()}
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const markRead = async (id: string) => {
    if (!token) {return}
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  const archive = async (id: string) => {
    if (!token) {return}
    const wasUnread = notifications.find((n) => n.id === id)?.is_read === false
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (wasUnread) {setUnreadCount((c) => Math.max(0, c - 1))}
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived: true }),
    })
  }

  const markAllRead = async () => {
    if (!token || markingAll) {return}
    setMarkingAll(true)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setMarkingAll(false)
  }

  const handleClick = (n: Notification) => {
    if (!n.is_read) {markRead(n.id)}
  }

  // Group the already-sorted (newest first) list into Today/Yesterday/Earlier
  // buckets, preserving order within each.
  const groups: { label: string; items: Notification[] }[] = []
  for (const n of notifications) {
    const bucket = dayBucket(n.created_at)
    const group = groups.find((g) => g.label === bucket)
    if (group) {group.items.push(n)} else {groups.push({ label: bucket, items: [n] })}
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType={userType || 'brand'} profile={profile} hideNotifications />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 bg-brand-pink/15 text-brand-purple-dark text-sm font-medium rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-purple-dark hover:bg-brand-pink/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-brand-purple-dark text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
          </div>
        ) : loadError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">Couldn&apos;t load notifications</h3>
            <button
              onClick={() => loadFirstPage(token, filter)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Bell className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">No notifications</h3>
            <p className="text-gray-500 mt-1 text-sm">
              {filter === 'all' ? "You're all caught up." : 'Nothing here right now.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                  {group.label}
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                  {group.items.map((n) => {
                    const meta = CATEGORY_META[n.category ?? ''] ?? DEFAULT_META
                    const Icon = meta.icon
                    const href = notificationLink(n)

                    const inner = (
                      <div
                        className={`flex items-start gap-3 p-4 transition-colors hover:bg-gray-50 ${
                          !n.is_read ? 'bg-brand-pink/5' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {n.title}
                            </p>
                            {n.priority === 'action' && !n.is_read && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold">
                                Action needed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!n.is_read && <div className="w-2.5 h-2.5 bg-brand-pink rounded-full mt-1.5" />}
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); archive(n.id) }}
                            className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            aria-label="Archive"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )

                    return href ? (
                      <Link key={n.id} href={href} className="block cursor-pointer" onClick={() => handleClick(n)}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={n.id} className="cursor-default" onClick={() => handleClick(n)}>
                        {inner}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <div ref={sentinelRef} className="h-px" />
            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
