'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import { 
  Heart, 
  Search, 
  Download, 
  ExternalLink, 
  X, 
  Filter,
  Grid,
  List,
  Star,
  Mail,
  Users,
  BarChart3,
  Calendar,
  Trash2
} from 'lucide-react'

interface InfluencerResult {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  category?: string;
  total_followers: number;
  engagement_rate: number;
  verified: boolean;
  
  instagram_followers: number;
  youtube_subscribers: number;
  tiktok_followers: number;
  instagram_handle?: string;
  youtube_channel?: string;
  tiktok_handle?: string;
  
  video_count?: number;
  total_views?: number;
  youtube_url?: string;
  profile_image_url?: string;
  email?: string;
  
  is_favorited?: boolean;
  is_saved?: boolean;
  saved_date?: string;
}

interface User {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: "free" | "premium"
  monthly_searches: number
  search_limit: number
}

export default function SavedInfluencersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [savedInfluencers, setSavedInfluencers] = useState<InfluencerResult[]>([])
  const [filteredInfluencers, setFilteredInfluencers] = useState<InfluencerResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerResult | null>(null)
  const [sortBy, setSortBy] = useState<'saved_date' | 'followers' | 'engagement'>('saved_date')
  
  const router = useRouter()

  const BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://infoish-ai-search-production.up.railway.app' 
    : 'http://127.0.0.1:8000'

  useEffect(() => {
    checkAuthentication()
    loadSavedInfluencers()
  }, [])

  useEffect(() => {
    filterInfluencers()
  }, [savedInfluencers, searchQuery, selectedCategory, sortBy])

  // CORRECTED checkAuthentication - REMOVE search-related code
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
      // Mock user for localhost development
      setUser({
        id: '1',
        email: 'user@example.com',
        full_name: 'John Doe',
        subscription_tier: 'free',
        monthly_searches: 8,
        search_limit: 15
      })
    } finally {
      setIsLoading(false)
    }
  }



  const loadSavedInfluencers = () => {
    const saved = localStorage.getItem('saved_influencers')
    if (saved) {
      try {
        const savedData = JSON.parse(saved)
        // Add saved_date if not present
        const enrichedData = savedData.map((influencer: InfluencerResult) => ({
          ...influencer,
          saved_date: influencer.saved_date || new Date().toISOString()
        }))
        setSavedInfluencers(enrichedData)
      } catch (error) {
        console.error('Error loading saved influencers:', error)
      }
    }
  }

  const filterInfluencers = () => {
    let filtered = [...savedInfluencers]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(influencer => 
        influencer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        influencer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        influencer.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(influencer => 
        influencer.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'followers':
          return b.total_followers - a.total_followers
        case 'engagement':
          return b.engagement_rate - a.engagement_rate
        case 'saved_date':
        default:
          return new Date(b.saved_date || '').getTime() - new Date(a.saved_date || '').getTime()
      }
    })

    setFilteredInfluencers(filtered)
  }

  const handleRemoveInfluencer = (influencerId: string) => {
    const updatedSaved = savedInfluencers.filter(inf => inf.id !== influencerId)
    setSavedInfluencers(updatedSaved)
    localStorage.setItem('saved_influencers', JSON.stringify(updatedSaved))
  }

  const handleExportSaved = () => {
    if (filteredInfluencers.length === 0) {
      alert('No saved influencers to export')
      return
    }

    try {
      const csvHeader = 'Username,Full Name,Email,Category,Total Followers,Engagement Rate,Instagram,YouTube,TikTok,Verified,Saved Date\n'
      const csvContent = filteredInfluencers.map(inf => {
        const safeName = (inf.full_name || '').replace(/"/g, '""')
        const safeEmail = (inf.email || '').replace(/"/g, '""')
        const safeCategory = (inf.category || '').replace(/"/g, '""')
        
        return [
          inf.username,
          `"${safeName}"`,
          `"${safeEmail}"`,
          `"${safeCategory}"`,
          inf.total_followers,
          `${inf.engagement_rate.toFixed(1)}%`,
          `"${inf.instagram_handle || ''}"`,
          `"${inf.youtube_channel || ''}"`,
          `"${inf.tiktok_handle || ''}"`,
          inf.verified ? 'Yes' : 'No',
          inf.saved_date ? new Date(inf.saved_date).toLocaleDateString() : ''
        ].join(',')
      }).join('\n')

      const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `saved-influencers-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const formatFollowers = (count: number) => {
    if (!count || count === 0) return '0'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const getPlatformStats = (influencer: InfluencerResult) => {
    const stats = []
    
    if (influencer.instagram_handle && influencer.instagram_followers > 0) {
      stats.push({ 
        platform: 'Instagram', 
        followers: influencer.instagram_followers, 
        handle: influencer.instagram_handle,
        color: 'bg-pink-50 text-pink-600',
        url: `https://instagram.com/${influencer.instagram_handle}`,
        icon: '📷'
      })
    }
    
    if (influencer.youtube_channel && influencer.youtube_subscribers > 0) {
      stats.push({ 
        platform: 'YouTube', 
        followers: influencer.youtube_subscribers, 
        handle: influencer.youtube_channel,
        color: 'bg-red-50 text-red-600',
        url: influencer.youtube_url || `https://youtube.com/@${influencer.youtube_channel}`,
        icon: '🎥'
      })
    }
    
    if (influencer.tiktok_handle && influencer.tiktok_followers > 0) {
      stats.push({ 
        platform: 'TikTok', 
        followers: influencer.tiktok_followers, 
        handle: influencer.tiktok_handle,
        color: 'bg-gray-50 text-gray-600',
        url: `https://tiktok.com/@${influencer.tiktok_handle}`,
        icon: '🎵'
      })
    }
    
    return stats
  }

  const getEngagementColor = (rate: number) => {
    if (rate >= 6) return 'bg-green-100 text-green-700'
    if (rate >= 3) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const ProfileImage = ({ influencer }: { influencer: InfluencerResult }) => {
    const [imageError, setImageError] = useState(false)
    
    const fallbackInitial = (influencer.full_name || influencer.username).charAt(0).toUpperCase()
    
    if (!influencer.profile_image_url || imageError) {
      return (
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
          {fallbackInitial}
        </div>
      )
    }
    
    return (
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        <img 
          src={influencer.profile_image_url}
          alt={influencer.full_name || influencer.username}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('saved_influencers')
    router.push('/login')
  }

  const categories = [...new Set(savedInfluencers.map(inf => inf.category).filter(Boolean))]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your saved influencers...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header 
        user={user}
        onLogout={handleLogout}
        isSearchPage={false}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Saved Influencers
              </h1>
              <p className="text-gray-600">
                Manage your collection of {savedInfluencers.length} saved Pakistani creators
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/search"
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Search className="w-4 h-4" />
                Find More
              </Link>
              {filteredInfluencers.length > 0 && (
                <button
                  onClick={handleExportSaved}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search saved influencers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="saved_date">Recently Saved</option>
                <option value="followers">Most Followers</option>
                <option value="engagement">Best Engagement</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredInfluencers.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredInfluencers.map((influencer) => (
              <div 
                key={influencer.id} 
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all ${
                  viewMode === 'list' ? 'p-6' : 'overflow-hidden'
                }`}
              >
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <ProfileImage influencer={influencer} />
                        <button
                          onClick={() => handleRemoveInfluencer(influencer.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        {influencer.full_name || influencer.username}
                      </h3>
                      <p className="text-blue-600 text-sm mb-2">@{influencer.username}</p>
                      
                      {influencer.category && (
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full mb-3">
                          {influencer.category}
                        </span>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {formatFollowers(influencer.total_followers)}
                          </div>
                          <div className="text-xs text-gray-600">Followers</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold px-2 py-1 rounded ${getEngagementColor(influencer.engagement_rate)}`}>
                            {influencer.engagement_rate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">Engagement</div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {getPlatformStats(influencer).slice(0, 2).map((stat, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${stat.color}`}>
                            <span className="text-sm font-medium">{stat.platform}</span>
                            <span className="text-sm">{formatFollowers(stat.followers)}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setSelectedInfluencer(influencer)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </>
                ) : (
                  // List View
                  <div className="flex items-center gap-6">
                    <ProfileImage influencer={influencer} />
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">
                        {influencer.full_name || influencer.username}
                      </h3>
                      <p className="text-blue-600 text-sm">@{influencer.username}</p>
                      {influencer.category && (
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full mt-1">
                          {influencer.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="font-bold text-gray-900">
                          {formatFollowers(influencer.total_followers)}
                        </div>
                        <div className="text-sm text-gray-600">Followers</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`px-3 py-1 rounded font-bold ${getEngagementColor(influencer.engagement_rate)}`}>
                          {influencer.engagement_rate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Engagement</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedInfluencer(influencer)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleRemoveInfluencer(influencer.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery || selectedCategory ? 'No matching influencers found' : 'No saved influencers yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedCategory 
                ? 'Try adjusting your search or filter criteria' 
                : 'Start building your influencer collection by saving creators from search results'
              }
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Search className="w-5 h-5" />
              Find Influencers
            </Link>
          </div>
        )}

        {/* Detail Modal */}
        {selectedInfluencer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Influencer Details</h2>
                  <button
                    onClick={() => setSelectedInfluencer(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <ProfileImage influencer={selectedInfluencer} />
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedInfluencer.full_name || selectedInfluencer.username}
                      </h3>
                      <p className="text-blue-600">@{selectedInfluencer.username}</p>
                      {selectedInfluencer.verified && (
                        <p className="text-green-600 text-sm">✓ Verified</p>
                      )}
                    </div>
                  </div>

                  {selectedInfluencer.bio && (
                    <div>
                      <h4 className="font-semibold mb-2">About</h4>
                      <p className="text-gray-600">{selectedInfluencer.bio}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatFollowers(selectedInfluencer.total_followers)}
                      </div>
                      <div className="text-sm text-gray-600">Total Followers</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedInfluencer.engagement_rate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Engagement Rate</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Platform Breakdown</h4>
                    <div className="space-y-2">
                      {getPlatformStats(selectedInfluencer).map((stat, idx) => (
                        <div key={idx} className={`flex justify-between items-center p-3 rounded-lg ${stat.color}`}>
                          <div className="flex items-center gap-2">
                            <span>{stat.icon}</span>
                            <span className="font-medium">{stat.platform}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatFollowers(stat.followers)}</div>
                            <a 
                              href={stat.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs hover:underline flex items-center gap-1"
                            >
                              Visit <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedInfluencer.email && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Contact</h4>
                      <a 
                        href={`mailto:${selectedInfluencer.email}`}
                        className="text-green-700 hover:underline"
                      >
                        {selectedInfluencer.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}