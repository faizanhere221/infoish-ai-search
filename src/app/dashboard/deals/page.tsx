'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Briefcase,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  MessageSquare,
  Settings,
  ChevronDown,
  Search,
  Filter,
  ArrowUpRight,
  XCircle,
  RefreshCw,
  Plus,
  Calendar
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

interface Deal {
  id: string
  title: string
  description: string | null
  status: string
  amount: number
  platform_fee: number | null
  creator_payout: number | null
  platform: string
  content_type: string
  deadline: string | null
  delivery_days: number | null
  created_at: string
  updated_at: string
  delivered_at: string | null
  completed_at: string | null
  creator_id: string
  brand_id: string
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
  }
}

type DealFilter = 'all' | 'pending' | 'active' | 'delivered' | 'completed' | 'cancelled'
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest'

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  accepted: { label: 'Accepted', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  paid: { label: 'Paid', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  delivered: { label: 'Delivered', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  revision: { label: 'Revision', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  completed: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelled: { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  disputed: { label: 'Disputed', color: 'text-red-700', bgColor: 'bg-red-100' },
}

const PLATFORM_NAMES: Record<string, string> = {
  twitter: 'Twitter/X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  newsletter: 'Newsletter',
  podcast: 'Podcast',
  tiktok: 'TikTok',
  instagram: 'Instagram',
}

export default function DealsPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // Filters
  const [filter, setFilter] = useState<DealFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')

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

      // Fetch deals
      const params = new URLSearchParams()
      if (user.user_type === 'brand' && profileStr) {
        const brandProfile = JSON.parse(profileStr)
        params.set('brand_id', brandProfile.id)
      } else if (user.user_type === 'creator' && profileStr) {
        const creatorProfile = JSON.parse(profileStr)
        params.set('creator_id', creatorProfile.id)
      }

      const res = await fetch(`/api/deals?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDeals(data.deals || [])
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading deals:', err)
      setError('Failed to load deals')
      setLoading(false)
    }
  }

  // Filter deals
  const filteredDeals = deals.filter(deal => {
    // Status filter
    if (filter === 'active') {
      if (!['accepted', 'paid', 'in_progress'].includes(deal.status)) return false
    } else if (filter === 'delivered') {
      if (deal.status !== 'delivered') return false
    } else if (filter === 'completed') {
      if (deal.status !== 'completed') return false
    } else if (filter === 'cancelled') {
      if (deal.status !== 'cancelled') return false
    } else if (filter === 'pending') {
      if (deal.status !== 'pending') return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        deal.title?.toLowerCase().includes(query) ||
        deal.creator?.display_name?.toLowerCase().includes(query) ||
        deal.brand?.company_name?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    return true
  })

  // Sort deals
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'highest':
        return b.amount - a.amount
      case 'lowest':
        return a.amount - b.amount
      default: // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // Calculate stats
  const activeDeals = deals.filter(d => ['accepted', 'paid', 'in_progress'].includes(d.status))
  const completedDeals = deals.filter(d => d.status === 'completed')
  const deliveredDeals = deals.filter(d => d.status === 'delivered')
  const totalSpent = completedDeals.reduce((sum, d) => sum + d.amount, 0)
  const inProgress = activeDeals.reduce((sum, d) => sum + d.amount, 0)

  // Count by status
  const statusCounts = {
    all: deals.length,
    pending: deals.filter(d => d.status === 'pending').length,
    active: activeDeals.length,
    delivered: deliveredDeals.length,
    completed: completedDeals.length,
    cancelled: deals.filter(d => d.status === 'cancelled').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading your deals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader userType={userType || 'brand'} profile={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Deals</h1>
            <p className="text-gray-500 mt-1">Manage and track all your campaigns</p>
          </div>
          {userType === 'brand' && (
            <Link
              href="/creators"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              New Deal
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Briefcase}
            label="Active Deals"
            value={activeDeals.length.toString()}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={completedDeals.length.toString()}
            color="emerald"
          />
          <StatCard
            icon={DollarSign}
            label={userType === 'brand' ? 'Total Spent' : 'Total Earned'}
            value={`$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            color="violet"
          />
          <StatCard
            icon={Clock}
            label="In Progress"
            value={`$${inProgress.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            color="amber"
          />
        </div>

        {/* Needs Attention Alert */}
        {deliveredDeals.length > 0 && userType === 'brand' && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-900">
                    {deliveredDeals.length} deal{deliveredDeals.length > 1 ? 's' : ''} need{deliveredDeals.length === 1 ? 's' : ''} your attention
                  </p>
                  <p className="text-sm text-purple-700">Review delivered work and release payments</p>
                </div>
              </div>
              <button
                onClick={() => setFilter('delivered')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
              >
                View Now
              </button>
            </div>
          </div>
        )}

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals..."
              className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'all', label: 'All Deals' },
            { id: 'pending', label: 'Pending' },
            { id: 'active', label: 'Active' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as DealFilter)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === tab.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                filter === tab.id ? 'bg-violet-500' : 'bg-gray-100'
              }`}>
                {statusCounts[tab.id as keyof typeof statusCounts]}
              </span>
            </button>
          ))}
        </div>

        {/* Deals List */}
        {sortedDeals.length > 0 ? (
          <div className="space-y-4">
            {sortedDeals.map((deal) => (
              <DealCard 
                key={deal.id} 
                deal={deal} 
                userType={userType}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">No deals found</h3>
            <p className="text-gray-500 mt-1">
              {deals.length === 0
                ? userType === 'brand'
                  ? "You haven't started any deals yet"
                  : "No deals yet. Brands will reach out when they find your profile!"
                : "No deals match your current filters"
              }
            </p>
            {deals.length === 0 && userType === 'brand' && (
              <Link
                href="/creators"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Find Creators
              </Link>
            )}
            {filter !== 'all' && deals.length > 0 && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 px-4 py-2 text-violet-600 hover:bg-violet-50 rounded-lg font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any
  label: string
  value: string
  color: 'blue' | 'emerald' | 'violet' | 'amber'
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

// Deal Card Component
function DealCard({ deal, userType }: { deal: Deal; userType: 'brand' | 'creator' | null }) {
  const status = STATUS_CONFIG[deal.status] || STATUS_CONFIG.pending
  const otherParty = userType === 'brand' ? deal.creator : deal.brand

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No deadline'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isActionNeeded = deal.status === 'delivered' && userType === 'brand'

  return (
    <Link
      href={`/dashboard/deals/${deal.id}`}
      className={`block bg-white rounded-xl border p-6 hover:shadow-lg transition-all ${
        isActionNeeded ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {userType === 'brand'
              ? deal.creator?.display_name?.charAt(0) || 'C'
              : deal.brand?.company_name?.charAt(0) || 'B'
            }
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{deal.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                {status.label}
              </span>
              {isActionNeeded && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Action needed
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {userType === 'brand' 
                ? `${deal.creator?.display_name || 'Creator'}` 
                : `${deal.brand?.company_name || 'Brand'}`
              }
              {' • '}
              Deal #{deal.id.slice(0, 8)}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Due {formatDate(deal.deadline)}
              </span>
              {deal.platform && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {PLATFORM_NAMES[deal.platform] || deal.platform}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">
            ${deal.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          {userType === 'creator' && deal.creator_payout && (
            <p className="text-sm text-gray-500">
              You receive: ${deal.creator_payout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}