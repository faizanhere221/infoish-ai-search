'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  Edit,
  Save,
  Plus,
  Mail,
  Phone,
  ExternalLink,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  MessageSquare,
  FileText,
  PlayCircle
} from 'lucide-react'

interface InfluencerResult {
  id: string
  username: string
  full_name?: string
  bio?: string
  category?: string
  total_followers: number
  engagement_rate: number
  verified: boolean
  
  instagram_followers: number
  youtube_subscribers: number
  tiktok_followers: number
  instagram_handle?: string
  youtube_channel?: string
  tiktok_handle?: string
  
  profile_image_url?: string
  email?: string
}

interface CampaignInfluencer {
  id: string
  campaign_id: string
  influencer_id: string
  influencer_username: string
  influencer_data: InfluencerResult
  status: 'shortlisted' | 'contacted' | 'negotiating' | 'agreed' | 'content_posted' | 'completed' | 'declined'
  offered_price?: number
  agreed_price?: number
  notes?: string
  contact_date?: string
  agreement_date?: string
  post_date?: string
  post_url?: string
  actual_reach?: number
  actual_engagement?: number
  payment_status: 'pending' | 'paid' | 'failed'
  created_at: string
  updated_at: string
}

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
}

interface User {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: "free" | "starter" | "pro" | "developer"
}

export default function CampaignDetailPage() {
  const params = useParams()
  const campaignId = params?.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [campaignInfluencers, setCampaignInfluencers] = useState<CampaignInfluencer[]>([])
  const [selectedInfluencer, setSelectedInfluencer] = useState<CampaignInfluencer | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [isEditingCampaign, setIsEditingCampaign] = useState(false)
  
  const router = useRouter()

  const BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://infoish-ai-search-production.up.railway.app' 
    : 'http://127.0.0.1:8000'

  useEffect(() => {
    checkAuthentication()
  }, [])

  useEffect(() => {
    if (user && campaignId) {
      loadCampaign()
      loadCampaignInfluencers()
    }
  }, [user, campaignId])

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

  const loadCampaign = () => {
    try {
      const campaigns = JSON.parse(localStorage.getItem('user_campaigns') || '[]')
      const found = campaigns.find((c: Campaign) => c.id === campaignId)
      if (found) {
        setCampaign(found)
      } else {
        router.push('/campaigns')
      }
    } catch (error) {
      console.error('Error loading campaign:', error)
    }
  }

  const loadCampaignInfluencers = () => {
    try {
      const allCampaignInfluencers = JSON.parse(localStorage.getItem('campaign_influencers') || '[]')
      const filtered = allCampaignInfluencers.filter((ci: CampaignInfluencer) => ci.campaign_id === campaignId)
      setCampaignInfluencers(filtered)
    } catch (error) {
      console.error('Error loading campaign influencers:', error)
    }
  }

  const updateInfluencerStatus = (influencerId: string, newStatus: CampaignInfluencer['status']) => {
    const updated = campaignInfluencers.map(ci => 
      ci.id === influencerId ? { ...ci, status: newStatus, updated_at: new Date().toISOString() } : ci
    )
    setCampaignInfluencers(updated)
    
    // Save to localStorage
    const allCampaignInfluencers = JSON.parse(localStorage.getItem('campaign_influencers') || '[]')
    const otherCampaigns = allCampaignInfluencers.filter((ci: CampaignInfluencer) => ci.campaign_id !== campaignId)
    localStorage.setItem('campaign_influencers', JSON.stringify([...otherCampaigns, ...updated]))
  }

  const updateInfluencerPrice = (influencerId: string, field: 'offered_price' | 'agreed_price', value: number) => {
    const updated = campaignInfluencers.map(ci => 
      ci.id === influencerId ? { ...ci, [field]: value, updated_at: new Date().toISOString() } : ci
    )
    setCampaignInfluencers(updated)
    
    const allCampaignInfluencers = JSON.parse(localStorage.getItem('campaign_influencers') || '[]')
    const otherCampaigns = allCampaignInfluencers.filter((ci: CampaignInfluencer) => ci.campaign_id !== campaignId)
    localStorage.setItem('campaign_influencers', JSON.stringify([...otherCampaigns, ...updated]))
  }

  const updateInfluencerNotes = (influencerId: string, notes: string) => {
    const updated = campaignInfluencers.map(ci => 
      ci.id === influencerId ? { ...ci, notes, updated_at: new Date().toISOString() } : ci
    )
    setCampaignInfluencers(updated)
    
    const allCampaignInfluencers = JSON.parse(localStorage.getItem('campaign_influencers') || '[]')
    const otherCampaigns = allCampaignInfluencers.filter((ci: CampaignInfluencer) => ci.campaign_id !== campaignId)
    localStorage.setItem('campaign_influencers', JSON.stringify([...otherCampaigns, ...updated]))
  }

  const updateCampaignStatus = (newStatus: Campaign['status']) => {
    if (!campaign) return
    
    const updatedCampaign = { 
      ...campaign, 
      status: newStatus, 
      updated_at: new Date().toISOString() 
    }
    setCampaign(updatedCampaign)
    
    // Update in localStorage
    const allCampaigns = JSON.parse(localStorage.getItem('user_campaigns') || '[]')
    const updated = allCampaigns.map((c: Campaign) => 
      c.id === campaignId ? updatedCampaign : c
    )
    localStorage.setItem('user_campaigns', JSON.stringify(updated))
  }

  const removeInfluencer = (influencerId: string) => {
    const updated = campaignInfluencers.filter(ci => ci.id !== influencerId)
    setCampaignInfluencers(updated)
    
    const allCampaignInfluencers = JSON.parse(localStorage.getItem('campaign_influencers') || '[]')
    const otherCampaigns = allCampaignInfluencers.filter((ci: CampaignInfluencer) => ci.campaign_id !== campaignId)
    localStorage.setItem('campaign_influencers', JSON.stringify([...otherCampaigns, ...updated]))
  }

  const getStatusColor = (status: CampaignInfluencer['status']) => {
    switch (status) {
      case 'shortlisted': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'contacted': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'negotiating': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'agreed': return 'bg-green-100 text-green-700 border-green-200'
      case 'content_posted': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'completed': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'declined': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCampaignStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft': return 'border-gray-300 text-gray-700 hover:border-gray-400'
      case 'active': return 'border-green-400 text-green-700 hover:border-green-500 bg-green-50'
      case 'paused': return 'border-yellow-400 text-yellow-700 hover:border-yellow-500 bg-yellow-50'
      case 'completed': return 'border-blue-400 text-blue-700 hover:border-blue-500 bg-blue-50'
      default: return 'border-gray-300 text-gray-700 hover:border-gray-400'
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'PKR 0'
    return `PKR ${amount.toLocaleString()}`
  }

  const formatFollowers = (count: number) => {
    if (!count || count === 0) return '0'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const calculateTotalSpent = () => {
    return campaignInfluencers.reduce((sum, ci) => sum + (ci.agreed_price || 0), 0)
  }

  const calculateTotalReach = () => {
    return campaignInfluencers.reduce((sum, ci) => sum + ci.influencer_data.total_followers, 0)
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
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!user || !campaign) {
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
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/campaigns"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Campaigns
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {campaign.name}
              </h1>
              <p className="text-gray-600">{campaign.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/saved')}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300"
              >
                <Plus className="w-4 h-4" />
                Add from Saved
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Influencers</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{campaignInfluencers.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {campaignInfluencers.filter(ci => ci.status === 'agreed').length} agreed
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Reach</span>
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{formatFollowers(calculateTotalReach())}</div>
            <p className="text-xs text-gray-500 mt-1">
              Combined followers
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Spent</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(calculateTotalSpent())}</div>
            <p className="text-xs text-gray-500 mt-1">
              of {formatCurrency(campaign.budget)} budget
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Campaign Status</span>
              <PlayCircle className="w-5 h-5 text-orange-500" />
            </div>
            <select
              value={campaign.status}
              onChange={(e) => updateCampaignStatus(e.target.value as Campaign['status'])}
              className={`text-xl font-bold capitalize bg-transparent border-2 rounded-lg px-3 py-2 cursor-pointer focus:ring-2 focus:ring-blue-200 transition-all w-full ${getCampaignStatusColor(campaign.status)}`}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {campaign.start_date ? `Starts ${new Date(campaign.start_date).toLocaleDateString()}` : 'No start date'}
            </p>
          </div>
        </div>

        {/* Influencers List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Campaign Influencers</h2>
            <span className="text-sm text-gray-600">{campaignInfluencers.length} total</span>
          </div>

          {campaignInfluencers.length > 0 ? (
            <div className="space-y-4">
              {campaignInfluencers.map((ci) => (
                <div 
                  key={ci.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Profile Image */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {(ci.influencer_data.full_name || ci.influencer_data.username).charAt(0).toUpperCase()}
                    </div>

                    {/* Influencer Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {ci.influencer_data.full_name || ci.influencer_data.username}
                          </h3>
                          <p className="text-sm text-blue-600">@{ci.influencer_data.username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={ci.status}
                            onChange={(e) => updateInfluencerStatus(ci.id, e.target.value as any)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ci.status)}`}
                          >
                            <option value="shortlisted">Shortlisted</option>
                            <option value="contacted">Contacted</option>
                            <option value="negotiating">Negotiating</option>
                            <option value="agreed">Agreed</option>
                            <option value="content_posted">Content Posted</option>
                            <option value="completed">Completed</option>
                            <option value="declined">Declined</option>
                          </select>
                          <button
                            onClick={() => removeInfluencer(ci.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600">Followers</div>
                          <div className="font-bold text-gray-900">{formatFollowers(ci.influencer_data.total_followers)}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600">Engagement</div>
                          <div className="font-bold text-gray-900">{ci.influencer_data.engagement_rate}%</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600">Offered</div>
                          <input
                            type="number"
                            value={ci.offered_price || ''}
                            onChange={(e) => updateInfluencerPrice(ci.id, 'offered_price', parseFloat(e.target.value))}
                            placeholder="0"
                            className="font-bold text-gray-900 w-full bg-transparent text-sm"
                          />
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600">Agreed</div>
                          <input
                            type="number"
                            value={ci.agreed_price || ''}
                            onChange={(e) => updateInfluencerPrice(ci.id, 'agreed_price', parseFloat(e.target.value))}
                            placeholder="0"
                            className="font-bold text-gray-900 w-full bg-transparent text-sm"
                          />
                        </div>
                      </div>

                      {/* Notes Section */}
                      <div className="mb-3">
                        <textarea
                          value={ci.notes || ''}
                          onChange={(e) => updateInfluencerNotes(ci.id, e.target.value)}
                          placeholder="Add notes about this influencer..."
                          className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                          rows={2}
                        />
                      </div>

                      {/* Contact Info */}
                      {ci.influencer_data.email && (
                        <div className="flex items-center gap-4 text-sm">
                          <a 
                            href={`mailto:${ci.influencer_data.email}`}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          >
                            <Mail className="w-4 h-4" />
                            {ci.influencer_data.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No influencers added yet</h3>
              <p className="text-gray-600 mb-6">
                Start building your campaign by adding influencers from your saved list
              </p>
              <button
                onClick={() => router.push('/saved')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Browse Saved Influencers
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}