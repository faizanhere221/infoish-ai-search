'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  DollarSign, 
  Briefcase, 
  Star, 
  Eye,
  MessageSquare,
  Clock,
  ArrowUpRight,
  Settings,
  User,
  Plus,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface CreatorProfile {
  id: string
  user_id: string
  username: string
  display_name: string
  bio: string | null
  country: string | null
  city: string | null
  niches: string[]
  languages: string[]
  verification_status: string
  total_followers: number
  completed_deals: number
  total_reviews: number
  avg_rating: number | null
  is_available: boolean
  created_at: string
}

interface Deal {
  id: string
  title: string
  status: string
  amount: number
  created_at: string
  brand?: {
    company_name: string
  }
}

export default function CreatorDashboard() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Get user from localStorage (set during login/signup)
      const userStr = localStorage.getItem('auth_user')
      const profileStr = localStorage.getItem('auth_profile')
      
      if (!userStr) {
        setError('Please log in to view your dashboard')
        setLoading(false)
        return
      }

      const user = JSON.parse(userStr)
      
      if (profileStr) {
        const savedProfile = JSON.parse(profileStr)
        setProfile(savedProfile)
      } else {
        // Fetch profile from API
        const res = await fetch(`/api/creators/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setProfile(data.creator)
          localStorage.setItem('auth_profile', JSON.stringify(data.creator))
        }
      }

      // Fetch deals
      const dealsRes = await fetch('/api/deals')
      if (dealsRes.ok) {
        const dealsData = await dealsRes.json()
        setDeals(dealsData.deals || [])
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">{error}</h2>
          <Link 
            href="/login" 
            className="mt-4 inline-block px-6 py-2 bg-violet-600 text-white rounded-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Profile not found</h2>
          <p className="text-gray-500 mt-2">Please complete your creator profile</p>
          <Link 
            href="/signup/creator" 
            className="mt-4 inline-block px-6 py-2 bg-violet-600 text-white rounded-lg"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    )
  }

  // Calculate stats
  const pendingDeals = deals.filter(d => d.status === 'pending')
  const activeDeals = deals.filter(d => ['accepted', 'in_progress'].includes(d.status))
  const completedDeals = deals.filter(d => d.status === 'completed')
  const totalEarnings = completedDeals.reduce((sum, d) => sum + (d.amount * 0.9), 0) // 90% after platform fee

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader userType="creator" profile={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile.display_name}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your creator account.</p>
          
          {/* Status badges */}
          <div className="flex items-center gap-3 mt-3">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            label="Total Earnings"
            value={`$${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtext="Lifetime"
            color="emerald"
          />
          <StatCard
            icon={Briefcase}
            label="Completed Deals"
            value={profile.completed_deals.toString()}
            subtext={`${activeDeals.length} active`}
            color="blue"
          />
          <StatCard
            icon={Star}
            label="Avg. Rating"
            value={profile.avg_rating ? profile.avg_rating.toFixed(1) : 'N/A'}
            subtext={`${profile.total_reviews} reviews`}
            color="amber"
          />
          <StatCard
            icon={Eye}
            label="Total Followers"
            value={formatNumber(profile.total_followers)}
            subtext="Across platforms"
            color="violet"
          />
        </div>

        {/* Profile Completion */}
        {(!profile.bio || profile.niches.length === 0) && (
          <div className="mb-8 p-6 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl border border-violet-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Complete your profile</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add more details to your profile to attract more brands and get better deals.
                </p>
                <Link 
                  href="/settings"
                  className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-violet-600 hover:text-violet-700"
                >
                  Edit Profile
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Deals */}
            {pendingDeals.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Pending Deals
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      {pendingDeals.length} new
                    </span>
                  </h2>
                </div>
                <div className="space-y-4">
                  {pendingDeals.map(deal => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              </div>
            )}

            {/* Active Deals */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Active Deals</h2>
                <Link href="/dashboard/deals" className="text-sm text-violet-600 hover:text-violet-700">
                  View all
                </Link>
              </div>
              {activeDeals.length > 0 ? (
                <div className="space-y-4">
                  {activeDeals.map(deal => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No active deals yet</p>
                  <p className="text-sm text-gray-400">Brands will reach out when they find your profile!</p>
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto">
                  {profile.display_name?.charAt(0) || 'U'}
                </div>
                <h4 className="mt-3 font-semibold text-gray-900">{profile.display_name}</h4>
                <p className="text-sm text-gray-500">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
                )}
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {profile.niches.slice(0, 3).map(niche => (
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
              <div className="space-y-3">
                <Link 
                  href="/settings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className="font-medium text-gray-900">Edit Profile</span>
                </Link>
                <Link 
                  href="/settings?tab=payments"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-gray-900">Payment Settings</span>
                </Link>
                <Link 
                  href={`/creators/${profile.username}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">View Public Profile</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  color 
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

// Deal Card Component
function DealCard({ deal }: { deal: Deal }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-blue-100 text-blue-700',
    delivered: 'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-gray-100 text-gray-700',
  }

  return (
    <Link 
      href={`/dashboard/deals/${deal.id}`}
      className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{deal.title}</p>
          <p className="text-sm text-gray-500">{deal.brand?.company_name || 'Brand'}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[deal.status] || 'bg-gray-100 text-gray-700'}`}>
          {deal.status.replace('_', ' ')}
        </span>
      </div>
      <p className="mt-2 text-lg font-semibold text-gray-900">
        ${deal.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
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