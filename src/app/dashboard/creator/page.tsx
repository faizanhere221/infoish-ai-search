'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Eye,
  MessageSquare,
  ArrowUpRight,
  User,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  DollarSign,
  Share2,
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { PLATFORMS } from '@/utils/constants'

interface Platform {
  id?: string
  platform: string
  platform_username: string | null
  platform_url: string | null
  followers: number
}

interface Service {
  id?: string
  title: string
  price: number
  is_active: boolean
}

interface CreatorProfile {
  id: string
  user_id: string
  username: string
  display_name: string
  bio: string | null
  profile_photo_url: string | null
  country: string | null
  city: string | null
  niches: string[]
  languages: string[]
  verification_status: string
  total_followers: number
  is_available: boolean
  created_at: string
  creator_platforms: Platform[]
  creator_services: Service[]
}

interface Conversation {
  id: string
  last_message_at: string | null
  last_message_preview: string | null
  creator_unread: number
  brand?: {
    company_name: string
    logo_url: string | null
  }
}

const PLATFORM_NAMES = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.name]))

export default function CreatorDashboard() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const userStr = localStorage.getItem('auth_user')

      if (!userStr) {
        setError('Please log in to view your dashboard')
        setLoading(false)
        return
      }

      const user = JSON.parse(userStr)

      // Platforms/services aren't in the cached localStorage profile, so always
      // fetch the full record from the API.
      const res = await fetch(`/api/creators/${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data.creator)
        localStorage.setItem('auth_profile', JSON.stringify(data.creator))

        const convRes = await fetch(`/api/conversations?creator_id=${data.creator.id}`)
        if (convRes.ok) {
          const convData = await convRes.json()
          setConversations((convData.conversations || []).slice(0, 5))
        }
      } else {
        setError('Profile not found')
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-200" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-24 bg-gray-200 rounded-xl w-full max-w-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">{error || 'Profile not found'}</h2>
          <Link
            href={error === 'Please log in to view your dashboard' ? '/login' : '/signup/creator'}
            className="mt-4 inline-block px-6 py-2 bg-violet-600 text-white rounded-lg"
          >
            {error === 'Please log in to view your dashboard' ? 'Go to Login' : 'Complete Profile'}
          </Link>
        </div>
      </div>
    )
  }

  const platforms = profile.creator_platforms || []
  const services = profile.creator_services || []
  const activeServices = services.filter((s) => s.is_active)
  const totalFollowers = platforms.reduce((sum, p) => sum + (p.followers || 0), 0)

  // Profile completion checklist
  const checklist = [
    { label: 'Basic info (name & bio)', done: Boolean(profile.display_name && profile.bio) },
    { label: 'Profile picture', done: Boolean(profile.profile_photo_url) },
    { label: 'Platforms added', done: platforms.length > 0 },
    { label: 'Services & rates added', done: activeServices.length > 0 },
  ]
  const completedCount = checklist.filter((c) => c.done).length
  const completionPct = Math.round((completedCount / checklist.length) * 100)
  const isProfileComplete = completedCount === checklist.length

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="creator" profile={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {profile.display_name}! 👋
              </h1>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {profile.verification_status === 'verified' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Verified Creator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Verification Pending
                  </span>
                )}
                {profile.is_available && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Available for work
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <User className="w-4 h-4" />
                Edit Profile
              </Link>
              <Link
                href="/settings?tab=services"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <DollarSign className="w-4 h-4" />
                Add Services
              </Link>
              <Link
                href={`/creators/${profile.username}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-violet-700 hover:to-blue-700"
              >
                <Share2 className="w-4 h-4" />
                View Public Profile
              </Link>
            </div>
          </div>

          {/* Profile completion bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">Profile completion</span>
              <span className="text-sm font-medium text-gray-900">{completionPct}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Profile Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Followers"
            value={formatNumber(totalFollowers)}
            subtext={`Across ${platforms.length} platform${platforms.length === 1 ? '' : 's'}`}
            color="violet"
          />
          <StatCard
            icon={DollarSign}
            label="Services Listed"
            value={activeServices.length.toString()}
            subtext={activeServices.length > 0 ? 'Live on your profile' : 'None yet'}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Profile Status"
            value={isProfileComplete ? 'Complete' : 'Incomplete'}
            subtext={isProfileComplete ? 'Looking great!' : `${completedCount}/${checklist.length} steps done`}
            color={isProfileComplete ? 'emerald' : 'amber'}
          />
          <StatCard
            icon={MessageSquare}
            label="Conversations"
            value={conversations.length.toString()}
            subtext="With brands"
            color="emerald"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Total Followers Widget */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(totalFollowers)}</p>
                  <p className="text-sm text-gray-500">Total followers across all platforms</p>
                </div>
              </div>

              {platforms.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                  {platforms.map((p) => (
                    <div key={p.platform} className="text-sm">
                      <p className="text-gray-500">{PLATFORM_NAMES[p.platform] || p.platform}</p>
                      <p className="font-semibold text-gray-900">{formatNumber(p.followers || 0)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-t border-gray-100 mt-2">
                  <p className="text-sm text-gray-500 mb-3">No platforms added yet</p>
                  <Link
                    href="/settings?tab=platforms"
                    className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
                  >
                    Add your first platform
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Messages Preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
                <Link href="/messages" className="text-sm text-violet-600 hover:text-violet-700">
                  View all
                </Link>
              </div>
              {conversations.length > 0 ? (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <Link
                      key={conv.id}
                      href={`/messages/${conv.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {conv.brand?.company_name?.charAt(0) || 'B'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {conv.brand?.company_name || 'Brand'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {conv.last_message_preview || 'No messages yet'}
                        </p>
                      </div>
                      {conv.creator_unread > 0 && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full flex-shrink-0">
                          {conv.creator_unread}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400">Brands will reach out once they find your profile!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Profile</h3>
              <div className="text-center">
                {profile.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.display_name}
                    className="w-20 h-20 rounded-full object-cover mx-auto"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto">
                    {profile.display_name?.charAt(0) || 'U'}
                  </div>
                )}
                <h4 className="mt-3 font-semibold text-gray-900">{profile.display_name}</h4>
                <p className="text-sm text-gray-500">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
                )}
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {(profile.niches || []).slice(0, 3).map((niche) => (
                    <span key={niche} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {niche}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/creators/${profile.username}`}
                  className="block w-full py-2 text-center text-sm font-medium text-violet-600 hover:text-violet-700"
                >
                  View Public Profile
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-1">
                <QuickAction href="/settings" icon={User} iconBg="bg-violet-100" iconColor="text-violet-600" label="Edit Profile" />
                <QuickAction href="/settings?tab=services" icon={DollarSign} iconBg="bg-blue-100" iconColor="text-blue-600" label="Manage Services" />
                <QuickAction href="/messages" icon={MessageSquare} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Messages" />
                <QuickAction href={`/creators/${profile.username}`} icon={Eye} iconBg="bg-amber-100" iconColor="text-amber-600" label="View Public Profile" />
              </div>
            </div>

            {/* Profile Completion Checklist */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Complete Your Profile</h3>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              {!isProfileComplete && (
                <Link
                  href="/settings"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
                >
                  Finish setting up
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================
function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: any
  label: string
  value: string
  subtext: string
  color: 'emerald' | 'blue' | 'amber' | 'violet'
}) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    violet: 'bg-violet-100 text-violet-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{subtext}</p>
    </div>
  )
}

function QuickAction({
  href,
  icon: Icon,
  iconBg,
  iconColor,
  label,
}: {
  href: string
  icon: any
  iconBg: string
  iconColor: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <span className="font-medium text-gray-900">{label}</span>
    </Link>
  )
}

// Helper function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
