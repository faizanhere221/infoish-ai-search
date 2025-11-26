'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import { 
  Search, 
  Users, 
  Star, 
  TrendingUp, 
  Calendar, 
  Download, 
  Eye, 
  Crown,
  Zap,
  BarChart3,
  Clock,
  Heart,
  Filter,
  RefreshCw,
  Plus,
  PlayCircle,
  CheckCircle,
  DollarSign,
  Target,
  ArrowRight,
  Folder,
  TrendingDown,
  Activity,
  Mail,
  Settings,
  Sparkles
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: "free" | "starter" | "pro" | "developer"
  monthly_searches: number
  search_limit: number
  created_at?: string
}

interface Campaign {
  id: string
  name: string
  status: 'draft' | 'active' | 'completed' | 'paused'
  budget?: number
  created_at: string
  influencer_count?: number
}

interface DashboardStats {
  totalSearches: number
  savedInfluencers: number
  totalCampaigns: number
  activeCampaigns: number
  recentSearches: string[]
  topCategories: string[]
  recentCampaigns: Campaign[]
}

export default function BrandDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalSearches: 0,
    savedInfluencers: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    recentSearches: [],
    topCategories: [],
    recentCampaigns: []
  })
  const router = useRouter()

  const BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://infoish-ai-search-production.up.railway.app' 
    : 'http://127.0.0.1:8000'

  useEffect(() => {
    checkAuthentication()
    loadDashboardData()
  }, [])

  const checkAuthentication = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem('auth_token')
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Mock user for development
      setUser({
        id: '1',
        email: 'user@example.com',
        full_name: 'John Doe',
        subscription_tier: 'free',
        monthly_searches: 8,
        search_limit: 15,
        created_at: '2024-01-15'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadDashboardData = () => {
    try {
      // Load recent searches
      const recentSearches = JSON.parse(localStorage.getItem('recent_searches') || '[]')
      
      // Load saved influencers
      const savedInfluencers = JSON.parse(localStorage.getItem('saved_influencers') || '[]')
      
      // Load campaigns
      const campaigns = JSON.parse(localStorage.getItem('user_campaigns') || '[]')
      const activeCampaigns = campaigns.filter((c: Campaign) => c.status === 'active')
      const recentCampaigns = campaigns.slice(0, 3)

      // Update stats
      setStats({
        totalSearches: recentSearches.length,
        savedInfluencers: savedInfluencers.length,
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
        recentSearches: recentSearches.slice(0, 5),
        topCategories: ['Beauty', 'Tech', 'Gaming', 'Food'],
        recentCampaigns
      })

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const getSearchesRemaining = () => {
    if (!user) return 0
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'developer') return 'unlimited'
    return Math.max(0, user.search_limit - user.monthly_searches)
  }

  const getUsagePercentage = () => {
    if (!user) return 0
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'developer') return 0
    return Math.round((user.monthly_searches / user.search_limit) * 100)
  }

  const handleDashboardExport = async () => {
    try {
      const savedInfluencersData = JSON.parse(localStorage.getItem('saved_influencers') || '[]')
      
      if (savedInfluencersData.length === 0) {
        alert('No saved influencers to export. Save some influencers first!')
        return
      }

      const csvContent = createCSVContent(savedInfluencersData)
      downloadCSV(csvContent, `infoishai-export-${new Date().toISOString().split('T')[0]}.csv`)
      
      alert(`✅ Successfully exported ${savedInfluencersData.length} influencers`)
      
    } catch (error) {
      console.error('Dashboard export failed:', error)
      alert('❌ Export failed. Please try again.')
    }
  }

  const handleRepeatSearch = (searchQuery: string) => {
    try {
      const encodedQuery = encodeURIComponent(searchQuery)
      router.push(`/search?q=${encodedQuery}&auto=true`)
    } catch (error) {
      console.error('Repeat search failed:', error)
      alert('Failed to repeat search. Please try again.')
    }
  }

  const createCSVContent = (data: any[]) => {
    if (data.length === 0) return ''
    
    const headers = [
      'Username',
      'Full Name', 
      'Category',
      'Total Followers',
      'Instagram Followers',
      'YouTube Subscribers',
      'TikTok Followers',
      'Engagement Rate',
      'Verified',
      'Email',
      'Instagram Handle',
      'YouTube Channel',
      'TikTok Handle'
    ]
    
    const rows = data.map(inf => [
      `"${inf.username || ''}"`,
      `"${inf.full_name || ''}"`,
      `"${inf.category || ''}"`,
      inf.total_followers || 0,
      inf.instagram_followers || 0,
      inf.youtube_subscribers || 0,
      inf.tiktok_followers || 0,
      inf.engagement_rate || 0,
      inf.verified ? 'Yes' : 'No',
      `"${inf.email || ''}"`,
      `"${inf.instagram_handle || ''}"`,
      `"${inf.youtube_channel || ''}"`,
      `"${inf.tiktok_handle || ''}"`
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  const isNearLimit = () => {
    if (user?.subscription_tier === 'pro' || user?.subscription_tier === 'developer') return false
    return getSearchesRemaining() !== 'unlimited' && (getSearchesRemaining() as number) <= Math.ceil((user?.search_limit || 15) * 0.2)
  }

  const refreshDashboard = () => {
    loadDashboardData()
  }

  const getCampaignStatusBadge = (status: Campaign['status']) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700'
    }
    return badges[status] || badges.draft
  }

  const getTierBadge = () => {
    const badges = {
      free: { color: 'bg-gray-100 text-gray-700', icon: '🆓', label: 'Free' },
      starter: { color: 'bg-blue-100 text-blue-700', icon: '⚡', label: 'Starter' },
      pro: { color: 'bg-green-100 text-green-700', icon: '👑', label: 'Pro' },
      developer: { color: 'bg-purple-100 text-purple-700', icon: '🔧', label: 'Developer' }
    }
    return badges[user?.subscription_tier || 'free']
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin mx-auto">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const tier = getTierBadge()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section - Enhanced */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                Welcome back, {user.full_name?.split(' ')[0] || user.email.split('@')[0]}! 
                <span className="text-3xl">👋</span>
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your influencer campaigns and grow your brand
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshDashboard}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-xl transition-all shadow-sm"
                title="Refresh dashboard"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Refresh</span>
              </button>
              <Link
                href="/campaigns/new"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-2 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Campaign</span>
              </Link>
            </div>
          </div>

          {/* Account Tier Badge */}
          <div className="inline-flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-md border border-gray-100">
            <span className="text-xl">{tier.icon}</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${tier.color}`}>
              {tier.label} Plan
            </span>
            {user.subscription_tier === 'free' && (
              <>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <Link href="/pricing" className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1">
                  Upgrade <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Main Stats Grid - 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Campaigns */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlayCircle className="w-7 h-7 text-green-600" />
              </div>
              {stats.activeCampaigns > 0 && (
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold animate-pulse">
                  LIVE
                </div>
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {stats.activeCampaigns}
            </h3>
            <p className="text-gray-600 text-sm mb-3">Active campaigns</p>
            <Link 
              href="/campaigns" 
              className="text-green-600 text-sm font-semibold hover:text-green-700 flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              Manage campaigns <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Saved Influencers */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7 text-pink-600" />
              </div>
              {stats.savedInfluencers > 0 && (
                <div className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold">
                  {stats.savedInfluencers}
                </div>
              )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {stats.savedInfluencers}
            </h3>
            <p className="text-gray-600 text-sm mb-3">Saved influencers</p>
            <Link 
              href="/saved" 
              className="text-pink-600 text-sm font-semibold hover:text-pink-700 flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              View saved <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Search Usage */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Search className="w-7 h-7 text-blue-600" />
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                isNearLimit() ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {getSearchesRemaining() === 'unlimited' ? '∞' : getUsagePercentage() + '%'}
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {user.monthly_searches}
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              {getSearchesRemaining() === 'unlimited' 
                ? 'Unlimited searches'
                : `of ${user.search_limit} searches used`
              }
            </p>
            {getSearchesRemaining() !== 'unlimited' && (
              <div className="bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    isNearLimit() ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${getUsagePercentage()}%` }}
                ></div>
              </div>
            )}
            <Link 
              href="/search" 
              className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              Start searching <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Total Campaigns */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Folder className="w-7 h-7 text-purple-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalCampaigns}
            </h3>
            <p className="text-gray-600 text-sm mb-3">Total campaigns</p>
            <Link 
              href="/campaigns" 
              className="text-purple-600 text-sm font-semibold hover:text-purple-700 flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions & Recent Campaigns */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <Link 
                  href="/search" 
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl transition-all group border border-blue-100"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Find Influencers
                    </div>
                    <div className="text-xs text-gray-600">
                      Search 1,800+ creators
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link 
                  href="/campaigns/new" 
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl transition-all group border border-green-100"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      New Campaign
                    </div>
                    <div className="text-xs text-gray-600">
                      Start planning outreach
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                </Link>

                <button 
                  onClick={handleDashboardExport}
                  disabled={stats.savedInfluencers === 0}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 rounded-xl transition-all group w-full text-left border border-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      Export Data
                    </div>
                    <div className="text-xs text-gray-600">
                      {stats.savedInfluencers === 0 
                        ? 'No saved influencers' 
                        : `${stats.savedInfluencers} influencers ready`
                      }
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-all" />
                </button>
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">Recent Campaigns</h2>
                </div>
                <Link href="/campaigns" className="text-sm text-purple-600 hover:text-purple-700 font-semibold">
                  View all
                </Link>
              </div>
              
              {stats.recentCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentCampaigns.map((campaign) => (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                          {campaign.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCampaignStatusBadge(campaign.status)}`}>
                            {campaign.status}
                          </span>
                          {campaign.influencer_count && (
                            <span className="text-xs text-gray-500">
                              {campaign.influencer_count} influencers
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-3">No campaigns yet</p>
                  <Link 
                    href="/campaigns/new"
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Create your first campaign
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Activity & Insights */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Searches */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Recent Searches</h2>
                </div>
                <Link href="/search" className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                  New search <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              
              {stats.recentSearches.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentSearches.map((search, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all group">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Search className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 capitalize">{search}</div>
                        <div className="text-xs text-gray-500">
                          {index === 0 ? 'Just now' : `${index} ${index === 1 ? 'search' : 'searches'} ago`}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRepeatSearch(search)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold px-3 py-1 rounded-lg hover:bg-blue-100 transition-all"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Repeat
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2 font-medium">No searches yet</p>
                  <p className="text-gray-500 text-sm mb-4">Start discovering influencers for your campaigns</p>
                  <Link 
                    href="/search"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    <Search className="w-5 h-5" />
                    Start Searching
                  </Link>
                </div>
              )}
            </div>

            {/* Popular Categories */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-gray-900">Popular Categories</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.topCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleRepeatSearch(category.toLowerCase())}
                    className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-2xl hover:shadow-lg transition-all group text-left border border-blue-100"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-2xl">
                          {category === 'Beauty' && '💄'}
                          {category === 'Tech' && '📱'}
                          {category === 'Gaming' && '🎮'}
                          {category === 'Food' && '🍔'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {category}
                        </div>
                        <div className="text-xs text-gray-600">
                          {Math.floor(Math.random() * 300) + 100}+ creators
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600 text-sm font-semibold">
                      Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upgrade CTA for Free Users */}
            {user.subscription_tier === 'free' && (
              <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border-2 border-orange-200 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400 to-pink-400 opacity-10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      {isNearLimit() 
                        ? `⚠️ Only ${getSearchesRemaining()} searches left!`
                        : 'Unlock unlimited potential'
                      }
                    </h3>
                    <p className="text-gray-700 mb-4">
                      {isNearLimit()
                        ? 'Upgrade now to get unlimited searches, advanced campaign tools, and priority support.'
                        : 'Get unlimited searches, campaign management tools, and advanced analytics with Pro.'
                      }
                    </p>
                    <Link 
                      href="/pricing"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Crown className="w-5 h-5" />
                      Upgrade to Pro
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}