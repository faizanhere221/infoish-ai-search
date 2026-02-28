'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search,
  DollarSign, 
  Briefcase, 
  Users, 
  Heart,
  MessageSquare,
  Settings,
  Building2,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Plus
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface BrandProfile {
  id: string
  user_id: string
  company_name: string
  company_website: string | null
  logo_url: string | null
  description: string | null
  industry: string | null
  company_size: string | null
  country: string | null
  contact_name: string
  contact_role: string | null
  verification_status: string
  total_deals: number
  total_spent: number
  created_at: string
}

interface Deal {
  id: string
  title: string
  status: string
  amount: number
  created_at: string
  creator?: {
    id: string
    username: string
    display_name: string
  }
}

export default function BrandDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const userStr = localStorage.getItem('auth_user')
      const profileStr = localStorage.getItem('auth_profile')
      
      if (!userStr) {
        router.push('/login')
        return
      }

      if (profileStr) {
        const savedProfile = JSON.parse(profileStr)
        setProfile(savedProfile)
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
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
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
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg"
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
          <Building2 className="w-12 h-12 text-gray-400 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Profile not found</h2>
          <Link 
            href="/signup/brand" 
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    )
  }

  // Calculate stats
  const activeDeals = deals.filter(d => ['accepted', 'in_progress'].includes(d.status))
  const completedDeals = deals.filter(d => d.status === 'completed')
  const pendingReview = deals.filter(d => d.status === 'delivered')
  const totalSpent = completedDeals.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader userType="brand" profile={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile.contact_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your campaigns.</p>
        </div>

        {/* CTA - Find Creators */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Find the perfect creator for your brand</h2>
              <p className="text-blue-100 mt-1">Browse verified tech creators and start a collaboration</p>
            </div>
            <Link 
              href="/creators"
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Find Creators
            </Link>
          </div>
        </div>

        {/* Pending Review Alert */}
        {pendingReview.length > 0 && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">{pendingReview.length} delivery waiting for your review</p>
                  <p className="text-sm text-amber-700">Creators have submitted their work. Review and approve to release payment.</p>
                </div>
              </div>
              <Link 
                href="/dashboard/deals"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
              >
                Review Now
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={DollarSign}
            label="Total Spent"
            value={`$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtext="All time"
            color="emerald"
          />
          <StatCard
            icon={Briefcase}
            label="Active Campaigns"
            value={activeDeals.length.toString()}
            subtext={`${completedDeals.length} completed`}
            color="blue"
          />
          <StatCard
            icon={Users}
            label="Creators Worked With"
            value={profile.total_deals?.toString() || '0'}
            subtext="Total collaborations"
            color="violet"
          />
          <StatCard
            icon={Heart}
            label="Saved Creators"
            value="0"
            subtext="In your list"
            color="rose"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Campaigns */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Active Campaigns</h2>
                <Link href="/dashboard/deals" className="text-sm text-blue-600 hover:text-blue-700">
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
                  <p className="mt-2 text-gray-500">No active campaigns</p>
                  <Link 
                    href="/creators"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Start a Campaign
                  </Link>
                </div>
              )}
            </div>

            {/* Recently Completed */}
            {completedDeals.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recently Completed</h2>
                <div className="space-y-4">
                  {completedDeals.slice(0, 3).map(deal => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Profile Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Company</h3>
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mx-auto">
                  {profile.company_name?.charAt(0) || 'B'}
                </div>
                <h4 className="mt-3 font-semibold text-gray-900">{profile.company_name}</h4>
                {profile.industry && (
                  <p className="text-sm text-gray-500">{profile.industry}</p>
                )}
                {profile.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{profile.description}</p>
                )}
                <div className="mt-3 flex items-center justify-center gap-2">
                  {profile.verification_status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      Pending Verification
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link 
                  href="/settings/brand"
                  className="block w-full py-2 text-center text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Edit Company Profile
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  href="/creators"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">Find Creators</span>
                </Link>
                <Link 
                  href="/settings/brand"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className="font-medium text-gray-900">Edit Company Profile</span>
                </Link>
                <Link 
                  href="/dashboard/deals"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-gray-900">View All Deals</span>
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
  color: 'emerald' | 'blue' | 'violet' | 'rose'
}) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
    rose: 'bg-rose-100 text-rose-600',
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
      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {deal.creator?.display_name?.charAt(0) || 'C'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{deal.creator?.display_name || 'Creator'}</p>
            <p className="text-sm text-gray-500">@{deal.creator?.username || 'creator'}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[deal.status] || 'bg-gray-100 text-gray-700'}`}>
          {deal.status.replace('_', ' ')}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-sm text-gray-600">{deal.title}</p>
        <p className="mt-1 font-semibold text-gray-900">
          ${deal.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </Link>
  )
}