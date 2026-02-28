'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  MessageSquare,
  Search,
  Settings,
  Loader2,
  ChevronRight,
  Circle,
  Plus
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface Conversation {
  id: string
  creator_id: string
  brand_id: string
  last_message_at: string | null
  last_message_preview: string | null
  creator_unread: number
  brand_unread: number
  created_at: string
  creator?: {
    id: string
    username: string
    display_name: string
    profile_photo_url: string | null
  }
  brand?: {
    id: string
    company_name: string
    logo_url: string | null
    contact_name: string | null
  }
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

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

      // Fetch conversations
      const params = new URLSearchParams()
      if (user.user_type === 'brand' && profileStr) {
        const brandProfile = JSON.parse(profileStr)
        params.set('brand_id', brandProfile.id)
      } else if (user.user_type === 'creator' && profileStr) {
        const creatorProfile = JSON.parse(profileStr)
        params.set('creator_id', creatorProfile.id)
      }

      const res = await fetch(`/api/conversations?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading conversations:', err)
      setLoading(false)
    }
  }

  // Get unread count for current user
  const getUnreadCount = (conv: Conversation) => {
    return userType === 'brand' ? conv.brand_unread : conv.creator_unread
  }

  // Get total unread
  const totalUnread = conversations.reduce((sum, conv) => sum + getUnreadCount(conv), 0)

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    // Unread filter
    if (filter === 'unread' && getUnreadCount(conv) === 0) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const otherParty = userType === 'brand' ? conv.creator : conv.brand
      const name = userType === 'brand' 
        ? conv.creator?.display_name 
        : conv.brand?.company_name
      return name?.toLowerCase().includes(query)
    }

    return true
  })

  // Format time
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader userType={userType || 'brand'} profile={profile} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            {totalUnread > 0 && (
              <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full">
                {totalUnread} unread
              </span>
            )}
          </div>
          {userType === 'brand' && (
            <Link
              href="/creators"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              New Message
            </Link>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  filter === 'all'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  filter === 'unread'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread
                {totalUnread > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                    filter === 'unread' ? 'bg-violet-500' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {totalUnread}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        {filteredConversations.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filteredConversations.map((conv, index) => {
              const otherParty = userType === 'brand' ? conv.creator : conv.brand
              const name = userType === 'brand' 
                ? conv.creator?.display_name 
                : conv.brand?.company_name
              const subtitle = userType === 'brand'
                ? `@${conv.creator?.username}`
                : conv.brand?.contact_name
              const unread = getUnreadCount(conv)

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                    index !== filteredConversations.length - 1 ? 'border-b border-gray-100' : ''
                  } ${unread > 0 ? 'bg-red-50/30' : ''}`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold">
                      {name?.charAt(0) || '?'}
                    </div>
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-white">
                        {unread}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-semibold truncate ${unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {name || 'Unknown'}
                      </h3>
                      <span className="text-sm text-gray-500 flex-shrink-0">
                        {formatTime(conv.last_message_at || conv.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{subtitle}</p>
                    {conv.last_message_preview && (
                      <p className={`text-sm truncate mt-1 ${unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {conv.last_message_preview}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">No conversations yet</h3>
            <p className="text-gray-500 mt-1">
              {conversations.length === 0
                ? userType === 'brand'
                  ? "Start a conversation by contacting a creator"
                  : "You'll see messages here when brands reach out to you"
                : "No conversations match your search"
              }
            </p>
            {conversations.length === 0 && userType === 'brand' && (
              <Link
                href="/creators"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Find Creators
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}