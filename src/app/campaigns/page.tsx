'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  PlayCircle,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3
} from 'lucide-react'

interface Campaign {
  id: string
  user_id: string
  name: string
  description?: string
  budget?: number
  status: 'draft' | 'active' | 'completed' | 'paused'
  start_date?: string
  end_date?: string
  goal_reach?: number
  goal_engagement?: number
  created_at: string
  updated_at: string
  influencer_count?: number
  total_spent?: number
}

interface User {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: "free" | "starter" | "pro" | "developer"
  monthly_searches: number
  search_limit: number
}

export default function CampaignsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)
  
  const router = useRouter()

  const BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://infoish-ai-search-production.up.railway.app' 
    : 'http://127.0.0.1:8000'

  useEffect(() => {
    checkAuthentication()
  }, [])

  useEffect(() => {
    if (user) {
      loadCampaigns()
    }
  }, [user])

  useEffect(() => {
    filterCampaigns()
  }, [campaigns, searchQuery, statusFilter])

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
    } finally {
      setIsLoading(false)
    }
  }

  const loadCampaigns = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      // For now, use localStorage until backend is ready
      const savedCampaigns = localStorage.getItem('user_campaigns')
      if (savedCampaigns) {
        const campaignsData = JSON.parse(savedCampaigns)
        setCampaigns(campaignsData)
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    }
  }

  const filterCampaigns = () => {
    let filtered = [...campaigns]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(campaign => 
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter)
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setFilteredCampaigns(filtered)
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignId)
      setCampaigns(updatedCampaigns)
      localStorage.setItem('user_campaigns', JSON.stringify(updatedCampaigns))
      setShowDeleteModal(false)
      setCampaignToDelete(null)
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Failed to delete campaign')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'paused':
        return <Clock className="w-4 h-4" />
      case 'draft':
      default:
        return <Edit className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'PKR 0'
    return `PKR ${amount.toLocaleString()}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Infoishai
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/search" className="text-gray-700 hover:text-blue-600 font-medium">Search</Link>
              <Link href="/saved" className="text-gray-700 hover:text-blue-600 font-medium">Saved</Link>
              <Link href="/campaigns" className="text-blue-600 font-semibold">Campaigns</Link>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Campaigns
              </h1>
              <p className="text-gray-600">
                Manage your influencer marketing campaigns in one place
              </p>
            </div>
            <Link
              href="/campaigns/new"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Campaign
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Total Campaigns</span>
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{campaigns.length}</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Active</span>
                <PlayCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-600">
                {campaigns.filter(c => c.status === 'active').length}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Completed</span>
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {campaigns.filter(c => c.status === 'completed').length}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Total Budget</span>
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(campaigns.reduce((sum, c) => sum + (c.budget || 0), 0))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        {filteredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredCampaigns.map((campaign) => (
              <div 
                key={campaign.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {campaign.name}
                        </h3>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </div>
                      {campaign.description && (
                        <p className="text-gray-600 mb-4">{campaign.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => {
                          setCampaignToDelete(campaign.id)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">Influencers</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {campaign.influencer_count || 0}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Budget</span>
                      </div>
                      <div className="text-xl font-bold text-green-900">
                        {formatCurrency(campaign.budget)}
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-purple-600 font-medium">Start Date</span>
                      </div>
                      <div className="text-sm font-bold text-purple-900">
                        {formatDate(campaign.start_date)}
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-600 font-medium">Goal Reach</span>
                      </div>
                      <div className="text-xl font-bold text-orange-900">
                        {campaign.goal_reach ? `${(campaign.goal_reach / 1000).toFixed(0)}K` : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar (if active) */}
                  {campaign.status === 'active' && campaign.start_date && campaign.end_date && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Campaign Progress</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, Math.max(0, 
                              ((new Date().getTime() - new Date(campaign.start_date).getTime()) / 
                              (new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime())) * 100
                            ))}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Created {new Date(campaign.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      View Details
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' 
                ? 'No campaigns found' 
                : 'No campaigns yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first influencer marketing campaign to get started'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Your First Campaign
              </Link>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Campaign?</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this campaign? All associated data including influencers, notes, and progress will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setCampaignToDelete(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => campaignToDelete && handleDeleteCampaign(campaignToDelete)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}