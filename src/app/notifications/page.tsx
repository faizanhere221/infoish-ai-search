'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  MessageSquare,
  Briefcase,
  CheckCircle,
  Package,
  Star,
  Loader2,
  Check,
  RefreshCw,
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  deal_created:   { icon: Briefcase,     color: 'bg-violet-100 text-violet-600' },
  deal_accepted:  { icon: CheckCircle,   color: 'bg-emerald-100 text-emerald-600' },
  deal_declined:  { icon: Briefcase,     color: 'bg-red-100 text-red-600' },
  deal_delivered: { icon: Package,       color: 'bg-blue-100 text-blue-600' },
  deal_approved:  { icon: Star,          color: 'bg-yellow-100 text-yellow-600' },
  deal_completed: { icon: CheckCircle,   color: 'bg-emerald-100 text-emerald-600' },
  new_message:    { icon: MessageSquare, color: 'bg-indigo-100 text-indigo-600' },
  default:        { icon: Bell,          color: 'bg-gray-100 text-gray-600' },
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1)  return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7)  return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [token, setToken] = useState<string | null>(null)

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
    if (profileStr) setProfile(JSON.parse(profileStr))
  }, [router])

  const fetchNotifications = useCallback(async (authToken: string | null) => {
    if (!authToken) return
    try {
      const res = await fetch('/api/notifications?limit=50', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
      }
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token !== null) fetchNotifications(token)
  }, [token, fetchNotifications])

  const markRead = async (id: string) => {
    if (!token) return
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })
  }

  const markAllRead = async () => {
    if (!token || markingAll) return
    setMarkingAll(true)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ all: true }),
    })
    setMarkingAll(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading notifications…</p>
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType={userType || 'brand'} profile={profile} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications(token)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Bell className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">No notifications yet</h3>
            <p className="text-gray-500 mt-1 text-sm">
              You'll be notified about deal updates, messages, and more.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {notifications.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.default
              const Icon = meta.icon

              const inner = (
                <div
                  className={`flex items-start gap-4 p-4 transition-colors hover:bg-gray-50 ${
                    !n.is_read ? 'bg-violet-50/40' : ''
                  }`}
                  onClick={() => { if (!n.is_read) markRead(n.id) }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2.5 h-2.5 bg-violet-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              )

              return n.link ? (
                <Link key={n.id} href={n.link} className="block cursor-pointer">
                  {inner}
                </Link>
              ) : (
                <div key={n.id} className="cursor-default">
                  {inner}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
