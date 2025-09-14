'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import { Search, Filter, Download, ChevronLeft, ChevronRight, Heart, ExternalLink, X, Bookmark, Share2 } from 'lucide-react'

import { exportToCSV } from '@/lib/utils'

interface InfluencerResult {
  id: string;
  username: string;
  full_name?: string;
  bio?: string;
  category?: string;
  total_followers: number;
  engagement_rate: number;
  verified: boolean;
  
  // Platform data
  instagram_followers: number;
  youtube_subscribers: number;
  tiktok_followers: number;
  instagram_handle?: string;
  youtube_channel?: string;
  tiktok_handle?: string;
  
  // YouTube fields
  video_count?: number;
  total_views?: number;
  youtube_url?: string;
  last_updated?: string;
  
  profile_image_url?: string;
  email?: string;
  
  // UI state
  is_favorited?: boolean;
  is_saved?: boolean;
  match_score?: number;
  search_type?: string;
}

interface User {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: "free" | "premium" | "developer" | "pro"  // ADD developer and pro
  monthly_searches: number
  search_limit: number
}

interface SearchFilters {
  platform: string;
  category: string;
  minFollowers: string;
  maxFollowers: string;
  engagementMin: string;
  minVideoCount: string;
  minTotalViews: string;
  hasYouTubeUrl: boolean;
  verified: string;
}

export default function AuthenticatedInfluencerSearch() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<InfluencerResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchInsights, setSearchInsights] = useState<any>(null)
  const [savedInfluencers, setSavedInfluencers] = useState<InfluencerResult[]>([])
  const [showSaved, setShowSaved] = useState(false)
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerResult | null>(null)
  
  const router = useRouter()
  
  const [filters, setFilters] = useState<SearchFilters>({
    platform: '',
    category: '',
    minFollowers: '',
    maxFollowers: '',
    engagementMin: '',
    minVideoCount: '',
    minTotalViews: '',
    hasYouTubeUrl: false,
    verified: ''
  })

  const BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://infoish-ai-search-production.up.railway.app' 
    : 'http://127.0.0.1:8000'

  const categoryOptions = [
    'Beauty', 'Tech', 'Food', 'Gaming', 'Comedy', 'Travel', 'Fitness', 'Music', 
    'Lifestyle', 'Business', 'Education', 'News', 'General'
  ]

  const RESULTS_PER_PAGE = 12

  useEffect(() => {
    checkAuthentication()
    loadSavedInfluencers()
  }, [])

  useEffect(() => {
  checkAuthentication()
  loadSavedInfluencers()
  
  // Handle repeat search - MOVED OUT of nested useEffect
  const checkForRepeatSearch = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const autoQuery = urlParams.get('q')
      const isAuto = urlParams.get('auto')
      
      if (autoQuery && isAuto) {
        setQuery(autoQuery)
        window.history.replaceState({}, '', '/search')
        setTimeout(() => {
          handleSearch(1)
        }, 500)
        console.log(`Executing repeat search for: "${autoQuery}"`)
      }
    } catch (error) {
      console.error('Error handling repeat search:', error)
    }
  }
  
  checkForRepeatSearch()
}, [])

useEffect(() => {
  const keepBackendAlive = async () => {
    try {
      await fetch(`${BACKEND_URL}/keepalive`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('Backend keepalive ping successful')
    } catch (error) {
      console.warn('Backend keepalive failed:', error)
    }
  }

  const keepaliveInterval = setInterval(keepBackendAlive, 4 * 60 * 1000)
  keepBackendAlive()

  return () => {
    clearInterval(keepaliveInterval)
  }
}, [BACKEND_URL])

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
      localStorage.removeItem('auth_token')
      router.push('/login')
      return
    } finally {
      setIsLoading(false)
    }
  }


  const saveToRecentSearches = (searchQuery: string) => {
  if (!searchQuery.trim()) return
  
  try {
    const recentSearches = JSON.parse(localStorage.getItem('recent_searches') || '[]')
    
    const filteredSearches = recentSearches.filter((search: string) => 
      search.toLowerCase() !== searchQuery.toLowerCase()
    )
    
    const updatedSearches = [searchQuery.trim(), ...filteredSearches].slice(0, 10)
    
    localStorage.setItem('recent_searches', JSON.stringify(updatedSearches))
  } catch (error) {
    console.error('Failed to save recent search:', error)
  }
}

  const loadSavedInfluencers = () => {
    const saved = localStorage.getItem('saved_influencers')
    if (saved) {
      try {
        setSavedInfluencers(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved influencers:', error)
      }
    }
  }

  const handleSearch = async (page = 1) => {
  // Save to recent searches FIRST (but only if there's a valid query)
  if (query.trim()) {
    saveToRecentSearches(query.trim())
  }

  if (!query.trim() && !Object.values(filters).some(v => v && v !== false)) {
    setError('Please enter your search or apply filters')
    return
  }

  setSearching(true)
  setError('')
  setCurrentPage(page)
  
  try {
    const offset = (page - 1) * RESULTS_PER_PAGE
    
    const params = new URLSearchParams({
      query: query.trim() || '',
      limit: RESULTS_PER_PAGE.toString(),
      offset: offset.toString()
    })

    // Add all filters
    if (filters.platform) params.append('platform', filters.platform)
    if (filters.category) params.append('category', filters.category)
    if (filters.minFollowers) params.append('min_followers', filters.minFollowers)
    if (filters.maxFollowers) params.append('max_followers', filters.maxFollowers)
    if (filters.engagementMin) params.append('engagement_min', filters.engagementMin)
    if (filters.minVideoCount) params.append('min_video_count', filters.minVideoCount)
    if (filters.minTotalViews) params.append('min_total_views', filters.minTotalViews)
    if (filters.hasYouTubeUrl) params.append('has_youtube_url', 'true')
    if (filters.verified) params.append('verified', filters.verified)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    // Call backend directly to ensure search counting works
    const response = await fetch(`${BACKEND_URL}/search/influencers?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Search failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    
    if (data.success !== false) {
      const searchResults = data.results || []
      
      setResults(searchResults)
      setTotalResults(data.total || data.total_found || 0)
      setTotalPages(Math.ceil((data.total || data.total_found || 0) / RESULTS_PER_PAGE))
      setSearchInsights(data.search_insights || null)
      
      // CRITICAL: Update user state immediately after successful search
      if (data.user_info && user) {
        const updatedUser = {
          ...user,
          monthly_searches: user.monthly_searches + 1, // Increment locally
        }
        setUser(updatedUser)
        
        // Emit custom event for other components to listen to
        const searchEvent = new CustomEvent('searchCompleted', {
          detail: {
            monthly_searches: updatedUser.monthly_searches,
            search_limit: updatedUser.search_limit
          }
        })
        window.dispatchEvent(searchEvent)
        
        console.log(`Search completed. New count: ${updatedUser.monthly_searches}/${updatedUser.search_limit}`)
      }

      // Show upgrade message if user hit limits
      if (data.upgrade_message) {
        setError(data.upgrade_message)
      }
      
      console.log(`Page ${page}: Got ${searchResults.length} results, Total: ${data.total || data.total_found || 0}`)
    } else {
      throw new Error(data.message || 'Search failed')
    }
  } catch (err) {
    console.error('Search error:', err)
    setError(err instanceof Error ? err.message : 'Search failed')
    setResults([])
  } finally {
    setSearching(false)
  }
}

// ALSO ADD this function to refresh user data periodically
const refreshUserData = async () => {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const userData = await response.json()
      setUser(userData)
    }
  } catch (error) {
    console.error('Failed to refresh user data:', error)
  }
}

// ADD this useEffect to refresh user data after searches
useEffect(() => {
  // Refresh user data every time results change (after a search)
  if (results.length > 0 && user) {
    refreshUserData()
  }
}, [results])

  const handleSaveInfluencer = (influencer: InfluencerResult) => {
  const isCurrentlySaved = savedInfluencers.some(saved => saved.id === influencer.id)
  
  let updatedSaved = isCurrentlySaved
    ? savedInfluencers.filter(saved => saved.id !== influencer.id)
    : [...savedInfluencers, { ...influencer, is_saved: true }]

  setSavedInfluencers(updatedSaved)
  localStorage.setItem('saved_influencers', JSON.stringify(updatedSaved))
  
  // Update the results to reflect the saved state
  setResults(prevResults => 
    prevResults.map(result => 
      result.id === influencer.id 
        ? { ...result, is_saved: !isCurrentlySaved }
        : result
    )
  )

  // Optional: Show a brief toast notification
  const action = isCurrentlySaved ? 'removed from' : 'added to'
  console.log(`${influencer.full_name || influencer.username} ${action} saved list`)
}

  const handleFavorite = (influencerId: string, currentlyFavorited: boolean) => {
  // Simple local-only favorites for quick launch
  setResults(prevResults => 
    prevResults.map(result => 
      result.id === influencerId 
        ? {...result, is_favorited: !currentlyFavorited}
        : result
    )
  )
}

// That's it! No backend calls, no errors, just working favorites
// The heart will turn red immediately when clicked

// Optional: If you want persistence across browser sessions, add this enhanced version:
const handleFavoriteWithPersistence = (influencerId: string, currentlyFavorited: boolean) => {
  // Update the UI immediately
  setResults(prevResults => 
    prevResults.map(result => 
      result.id === influencerId 
        ? {...result, is_favorited: !currentlyFavorited}
        : result
    )
  )
  
  // Save to localStorage for persistence
  try {
    const favorites = JSON.parse(localStorage.getItem('favorite_influencers') || '[]')
    const updatedFavorites = currentlyFavorited
      ? favorites.filter((id: string) => id !== influencerId)
      : [...favorites, influencerId]
    
    localStorage.setItem('favorite_influencers', JSON.stringify(updatedFavorites))
  } catch (error) {
    console.log('Could not save favorites to localStorage')
  }
}

  const handleExportResults = async (exportSaved: boolean = false) => {
  if (exportSaved) {
    // Export saved influencers (this works fine)
    const dataToExport = savedInfluencers
    exportToCSV(dataToExport, true)
    return
  }

  // For search results, fetch ALL results with same search parameters
  setError('')
  
  try {
    console.log('Starting export with query:', query)
    console.log('Current filters:', filters)
    
    const params = new URLSearchParams({
      query: query.trim() || '',
      limit: '500', // Reasonable limit for export
      offset: '0'    // Start from beginning
    })

    // Add all your current filters - but validate them first
    if (filters.platform && filters.platform !== '') {
      params.append('platform', filters.platform)
    }
    if (filters.category && filters.category !== '') {
      params.append('category', filters.category)
    }
    if (filters.minFollowers && filters.minFollowers !== '') {
      params.append('min_followers', filters.minFollowers)
    }
    if (filters.maxFollowers && filters.maxFollowers !== '') {
      params.append('max_followers', filters.maxFollowers)
    }
    if (filters.engagementMin && filters.engagementMin !== '') {
      params.append('engagement_min', filters.engagementMin)
    }
    if (filters.minVideoCount && filters.minVideoCount !== '') {
      params.append('min_video_count', filters.minVideoCount)
    }
    if (filters.minTotalViews && filters.minTotalViews !== '') {
      params.append('min_total_views', filters.minTotalViews)
    }
    if (filters.hasYouTubeUrl === true) {
      params.append('has_youtube_url', 'true')
    }
    if (filters.verified && filters.verified !== '') {
      params.append('verified', filters.verified)
    }

    console.log('Export URL params:', params.toString())

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // Longer timeout for export

    const response = await fetch(`/api/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('Export response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('Export data received:', data)
      
      const allResults = data.results || []
      
      if (allResults.length === 0) {
        alert('No results found to export. Try adjusting your search criteria.')
        return
      }
      
      // Now export all results
      exportToCSV(allResults, false)
      
      alert(`Successfully exported ${allResults.length} influencers to CSV`)
    } else {
      // Get error details
      const errorText = await response.text()
      console.error('Export error response:', errorText)
      throw new Error(`Export failed (${response.status}): ${errorText}`)
    }
  } catch (error: unknown) {
    // FIXED: Proper error type handling
    console.error('Export failed:', error)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        alert('Export timed out. Please try with fewer results or contact support.')
      } else {
        alert(`Export failed: ${error.message}. Please try again or contact support.`)
      }
    } else {
      alert('Export failed due to an unknown error. Please try again or contact support.')
    }
  }
}


  const formatFollowers = (count: number) => {
    if (!count || count === 0) return '0'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const formatViews = (count: number): string => {
    if (!count || count === 0) return '0'
    if (count >= 1000000000) return `${(count / 1000000000).toFixed(1)}B`
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
        color: 'bg-pink-50 hover:bg-pink-100',
        url: `https://instagram.com/${influencer.instagram_handle}`,
        icon: '📷'
      })
    }
    
    if (influencer.youtube_channel && influencer.youtube_subscribers > 0) {
      stats.push({ 
        platform: 'YouTube', 
        followers: influencer.youtube_subscribers, 
        handle: influencer.youtube_channel,
        color: 'bg-red-50 hover:bg-red-100',
        url: influencer.youtube_url || `https://youtube.com/@${influencer.youtube_channel}`,
        icon: '🎥',
        extraInfo: influencer.video_count ? `${influencer.video_count} videos` : undefined
      })
    }
    
    if (influencer.tiktok_handle && influencer.tiktok_followers > 0) {
      stats.push({ 
        platform: 'TikTok', 
        followers: influencer.tiktok_followers, 
        handle: influencer.tiktok_handle,
        color: 'bg-gray-50 hover:bg-gray-100',
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

  const clearFilters = () => {
    setFilters({
      platform: '',
      category: '',
      minFollowers: '',
      maxFollowers: '',
      engagementMin: '',
      minVideoCount: '',
      minTotalViews: '',
      hasYouTubeUrl: false,
      verified: ''
    })
    setCurrentPage(1)
  }

  const handleQuickSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    setFilters(prev => ({ ...prev, category: '' }));
    setTimeout(() => handleSearch(1), 100);
  }

  const handleViewDetails = (influencer: InfluencerResult) => {
    setSelectedInfluencer(influencer)
  }

  const closeDetailsModal = () => {
    setSelectedInfluencer(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('saved_influencers')
    router.push('/login')
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const currentResults = showSaved ? savedInfluencers : results

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Component */}
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section - Only show when not viewing saved */}
        {!showSaved && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search Pakistani influencers (e.g., tech reviewers, beauty influencers, YouTube creators)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  disabled={searching}
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
              <button
                onClick={() => handleSearch(1)}
                disabled={searching}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg font-medium min-w-[140px] transition-all"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search insights */}
            {searchInsights && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-600 font-medium">
                  Search Strategy: {searchInsights.search_strategy} • 
                  Keyword matches: {searchInsights.keyword_matches || 0} • 
                  {searchInsights.youtube_data_included && '🎥 YouTube Enhanced • '}
                  Search time: {searchInsights.search_time_ms || 0}ms
                </div>
              </div>
            )}

            {/* Quick Search Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['Beauty Influencers', 'Tech Reviewers', 'Food Bloggers', 'Gaming Creators', 'YouTube Stars', 'Comedy Channels'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleQuickSearch(tag)}
                  className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-sm transition-colors"
                  disabled={searching}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
            >
              {showFilters ? '− Hide Filters' : '+ Show Filters'}
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                {Object.values(filters).filter(v => v && v !== false).length} active
              </span>
            </button>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <select
                    value={filters.platform}
                    onChange={(e) => setFilters({...filters, platform: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Platforms</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                  </select>

                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={filters.minFollowers}
                    onChange={(e) => setFilters({...filters, minFollowers: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Min Followers</option>
                    <option value="1000">1K+</option>
                    <option value="10000">10K+</option>
                    <option value="100000">100K+</option>
                    <option value="1000000">1M+</option>
                  </select>

                  <select
                    value={filters.verified}
                    onChange={(e) => setFilters({...filters, verified: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="true">Verified Only</option>
                    <option value="false">Unverified Only</option>
                  </select>
                </div>

                {/* YouTube Filters Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <select
                    value={filters.minVideoCount}
                    onChange={(e) => setFilters({...filters, minVideoCount: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Min Videos</option>
                    <option value="10">10+ videos</option>
                    <option value="50">50+ videos</option>
                    <option value="100">100+ videos</option>
                    <option value="500">500+ videos</option>
                  </select>

                  <select
                    value={filters.minTotalViews}
                    onChange={(e) => setFilters({...filters, minTotalViews: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Min Total Views</option>
                    <option value="100000">100K+ views</option>
                    <option value="1000000">1M+ views</option>
                    <option value="10000000">10M+ views</option>
                    <option value="100000000">100M+ views</option>
                  </select>

                  <label className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white">
                    <input
                      type="checkbox"
                      checked={filters.hasYouTubeUrl}
                      onChange={(e) => setFilters({...filters, hasYouTubeUrl: e.target.checked})}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Has YouTube URL</span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleSearch(1)}
                    disabled={searching}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700 px-4 py-2 border border-red-300 hover:border-red-400 rounded-lg"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results Header */}
        {currentResults.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {showSaved 
                ? `Saved Influencers (${savedInfluencers.length})`
                : `Found ${totalResults.toLocaleString()} Pakistani influencers`
              }
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleExportResults(showSaved)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export {showSaved ? 'Saved' : 'Results'}
              </button>
              {!showSaved && (
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPLACE your Results Grid section with this improved version */}
{currentResults.length > 0 && (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {currentResults.map((influencer) => (
        <div key={influencer.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
          {/* Card Header */}
          <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <ProfileImage influencer={influencer} />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {influencer.full_name || influencer.username}
                  </h3>
                  <p className="text-blue-600 text-sm mb-1">@{influencer.username}</p>
                  {influencer.youtube_subscribers > influencer.instagram_followers && 
                   influencer.youtube_subscribers > influencer.tiktok_followers && (
                    <p className="text-red-600 text-xs flex items-center gap-1">
                      🎥 {formatFollowers(influencer.youtube_subscribers)} YouTube subs
                    </p>
                  )}
                </div>
              </div>
              
              {/* Action Buttons - IMPROVED */}
              <div className="flex items-center gap-2">
                {/* Verified Badge */}
                {influencer.verified && (
                  <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                    ✓
                  </div>
                )}
                
                {/* Like Button (Heart - for favorites) */}
                <button
                  onClick={() => handleFavorite(influencer.id, influencer.is_favorited || false)}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    influencer.is_favorited 
                      ? 'bg-red-100 text-red-600 scale-110' 
                      : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                  }`}
                  title={influencer.is_favorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart 
                    className="w-4 h-4" 
                    fill={influencer.is_favorited ? "currentColor" : "none"}
                  />
                </button>
                
                {/* Save Button (Bookmark - for saved list) */}
                <button
                  onClick={() => handleSaveInfluencer(influencer)}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    savedInfluencers.some(saved => saved.id === influencer.id)
                      ? 'bg-green-100 text-green-600 scale-110' 
                      : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
                  }`}
                  title={savedInfluencers.some(saved => saved.id === influencer.id) ? "Remove from saved" : "Save for later"}
                >
                  <Bookmark 
                    className="w-4 h-4" 
                    fill={savedInfluencers.some(saved => saved.id === influencer.id) ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6">
            {/* Bio */}
            {influencer.bio && (
              <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                {influencer.bio}
              </p>
            )}

            {/* Key Metrics */}
            <div className="space-y-4 mb-6">
              <div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {formatFollowers(influencer.total_followers)}
                </div>
                <div className="text-sm text-gray-600">Total Reach</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className={`text-sm font-bold px-3 py-2 rounded-lg ${getEngagementColor(influencer.engagement_rate)}`}>
                    {influencer.engagement_rate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Engagement</div>
                </div>
                
                {influencer.category && (
                  <div className="text-center">
                    <div className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-xs font-medium">
                      <div className="truncate" title={influencer.category}>
                        {influencer.category.length > 12 ? influencer.category.substring(0, 12) + '...' : influencer.category}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Category</div>
                  </div>
                )}
              </div>
            </div>

            {/* YouTube Metrics */}
            {influencer.video_count && influencer.total_views && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-600 text-sm">🎥</span>
                  <span className="text-xs text-red-600 font-medium">YouTube Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-bold text-red-700">{influencer.video_count}</div>
                    <div className="text-red-600 text-xs">Videos</div>
                  </div>
                  <div>
                    <div className="font-bold text-red-700">{formatViews(influencer.total_views)}</div>
                    <div className="text-red-600 text-xs">Total Views</div>
                  </div>
                </div>
              </div>
            )}

            {/* Platform Stats */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold text-gray-700">Social Platforms</h4>
              {getPlatformStats(influencer).map((stat, idx) => (
                <div key={idx} className={`flex items-center justify-between ${stat.color} rounded-lg px-4 py-3 hover:shadow-md transition-all`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{stat.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{stat.platform}</div>
                      <a 
                        href={stat.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs hover:underline font-medium transition-colors hover:opacity-80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{stat.handle} →
                      </a>
                      {stat.extraInfo && (
                        <div className="text-xs text-gray-500 mt-1">{stat.extraInfo}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{formatFollowers(stat.followers)}</div>
                    <div className="text-xs opacity-75">followers</div>
                  </div>
                </div>
              ))}
              
              {getPlatformStats(influencer).length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  No social media data available
                </div>
              )}
            </div>

            {/* Contact Info */}
            {influencer.email && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 text-sm">📧</span>
                  <span className="text-xs text-green-600 font-medium">Contact Available</span>
                </div>
                <a 
                  href={`mailto:${influencer.email}`}
                  className="text-sm text-green-700 font-medium hover:underline"
                >
                  {influencer.email}
                </a>
              </div>
            )}

            {/* Action Buttons - IMPROVED */}
            <div className="flex gap-3">
              <button 
                onClick={() => handleViewDetails(influencer)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium text-sm transition-all"
              >
                View Details
              </button>
              
              {/* Share Button - REPLACED the clipboard icon with useful functionality */}
              <button 
                onClick={() => {
                  const shareData = {
                    title: `${influencer.full_name || influencer.username} - Pakistani Influencer`,
                    text: `Check out ${influencer.full_name || influencer.username} - ${formatFollowers(influencer.total_followers)} followers, ${influencer.engagement_rate.toFixed(1)}% engagement`,
                    url: window.location.href
                  }
                  
                  if (navigator.share) {
                    navigator.share(shareData).catch(() => {
                      // Fallback to clipboard
                      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
                        .then(() => alert('Profile details copied to clipboard!'))
                        .catch(() => alert('Unable to share or copy'))
                    })
                  } else {
                    // Fallback to clipboard
                    const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`
                    navigator.clipboard.writeText(text)
                      .then(() => alert('Profile details copied to clipboard!'))
                      .catch(() => alert(text))
                  }
                }}
                className="px-4 py-3 border border-gray-300 hover:bg-gray-50 rounded-lg transition-all flex items-center justify-center"
                title="Share influencer profile"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  


            {/* Pagination */}
            {!showSaved && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => handleSearch(currentPage - 1)}
                  disabled={currentPage === 1 || searching}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handleSearch(i + 1)}
                      disabled={searching}
                      className={`w-10 h-10 rounded-lg font-medium ${
                        i + 1 === currentPage 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handleSearch(currentPage + 1)}
                  disabled={currentPage === totalPages || searching}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Loading State */}
        {searching && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Searching Pakistani influencers...</p>
          </div>
        )}

        {/* Empty State */}
        {!searching && currentResults.length === 0 && (showSaved || query) && (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {showSaved ? 'No saved influencers' : 'No influencers found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {showSaved 
                ? 'Start saving influencers from your search results' 
                : 'Try adjusting your search terms or filters'
              }
            </p>
          </div>
        )}

        {/* Initial State */}
        {!searching && results.length === 0 && !query && !showSaved && (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Discover Pakistani Influencers
            </h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Search through our database of 1,800+ Pakistani content creators with enhanced YouTube analytics
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { name: 'Beauty', icon: '💄' },
                { name: 'Tech', icon: '📱' },
                { name: 'Gaming', icon: '🎮' },
                { name: 'YouTube', icon: '🎥' }
              ].map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleQuickSearch(category.name)}
                  className="p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="font-medium text-gray-900">{category.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedInfluencer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Influencer Details</h2>
                <button
                  onClick={closeDetailsModal}
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

                {/* YouTube Analytics Section */}
                {selectedInfluencer.video_count && selectedInfluencer.total_views && (
                  <div>
                    <h4 className="font-semibold mb-3">YouTube Analytics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-xl font-bold text-red-600">{selectedInfluencer.video_count}</div>
                        <div className="text-sm text-gray-600">Videos</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-xl font-bold text-red-600">{formatViews(selectedInfluencer.total_views)}</div>
                        <div className="text-sm text-gray-600">Total Views</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-xl font-bold text-red-600">
                          {selectedInfluencer.video_count ? Math.round(selectedInfluencer.total_views / selectedInfluencer.video_count / 1000) + 'K' : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Avg Views</div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-3">Platform Breakdown</h4>
                  <div className="space-y-2">
                    {getPlatformStats(selectedInfluencer).map((stat, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-3 rounded-lg ${stat.color}`}>
                        <div className="flex items-center gap-2">
                          <span>{stat.icon}</span>
                          <span className="font-medium">{stat.platform}</span>
                          {stat.extraInfo && <span className="text-xs text-gray-500">({stat.extraInfo})</span>}
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

                <div className="flex gap-3">
                  <button
                    onClick={() => handleSaveInfluencer(selectedInfluencer)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      savedInfluencers.some(saved => saved.id === selectedInfluencer.id)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    {savedInfluencers.some(saved => saved.id === selectedInfluencer.id) ? 'Saved ✓' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      const text = `${selectedInfluencer.full_name || selectedInfluencer.username} - ${formatFollowers(selectedInfluencer.total_followers)} followers - ${selectedInfluencer.engagement_rate.toFixed(1)}% engagement`
                      navigator.clipboard.writeText(text).catch(() => alert(`Copied: ${text}`))
                    }}
                    className="px-4 py-2 border hover:bg-gray-50 rounded-lg"
                  >
                    Copy Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}