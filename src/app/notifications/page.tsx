'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  MessageSquare,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Check
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface Notification {
  id: string
  type: string
  title: string
  content: string | null
  related_type: string | null
  related_id: string | null
  is_read: boolean
  created_at: string
}

const NOTIFICATION_ICONS: Record<string, any> = {
  new_message: MessageSquare,
  deal_update: DollarSign,
  deal_completed: CheckCircle,
  deal_accepted: CheckCircle,
  default: Bell,
}

const NOTIFICATION_COLORS: Record<string, string> = {
  new_message: 'bg-blue-100 text-blue-600',
  deal_update: 'bg-violet-100 text-violet-600',
  deal_completed: 'bg-emerald-100 text-emerald-600',
  deal_accepted: 'bg-emerald-100 text-emerald-600',
  default: 'bg-gray-100 text-gray-600',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const userStr = localStorage.getItem('auth_user')
      const profileStr = localStorage.getItem('auth_profile')

      if (!userStr) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userStr)
      setUserType(user.user_type)

      if (profileStr) {
        setProfile(JSON.parse(profileStr))
      }

      // TODO: Fetch notifications from API
      // For now, show empty state
      setNotifications([])
      setLoading(false)
    } catch (err) {
      console.error('Error loading notifications:', err)
      setLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const markAllAsRead = async () => {
    // TODO: Implement mark all as read
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType={userType || 'brand'} profile={profile} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          {notifications.length > 0 && unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {notifications.map((notification, index) => {
              const Icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default
              const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.default

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${
                    index !== notifications.length - 1 ? 'border-b border-gray-100' : ''
                  } ${!notification.is_read ? 'bg-violet-50/30' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                    {notification.content && (
                      <p className="text-sm text-gray-500 mt-1">{notification.content}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-violet-600 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Bell className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">No notifications yet</h3>
            <p className="text-gray-500 mt-1">
              You'll receive notifications about messages, deals, and updates here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}