'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import {Mail, Youtube, Eye, Search, Filter, Download, ChevronLeft, ChevronRight, Heart, ExternalLink, X, Bookmark, Share2 } from 'lucide-react'

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


      let displayTotal = data.total || data.total_found || 0
      let displayPages = Math.ceil(displayTotal / RESULTS_PER_PAGE)
      
      // If user is free and we got exactly 5 results, adjust display
      {user?.subscription_tier === 'free' && results.length >= 5 && !showSaved && (
  <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-bold text-blue-900 mb-2">Want to see all {totalResults}+ results?</h3>
        <p className="text-blue-700 text-sm mb-3">
          Free accounts are limited to 5 results per search. Upgrade to see unlimited results and export data.
        </p>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-blue-600">✓ Unlimited search results</span>
          <span className="text-blue-600">✓ Export to CSV</span>
          <span className="text-blue-600">✓ Advanced filters</span>
        </div>
      </div>
      <button 
        onClick={() => router.push('/pricing')}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
      >
        Upgrade Now
      </button>
    </div>
  </div>
)}
      
      setResults(searchResults)
      setTotalResults(displayTotal)  // Use adjusted total
      setTotalPages(displayPages)    // Use adjusted pages
      setSearchInsights(data.search_insights || null)
      
      // Update user state immediately after successful search
      if (data.user_info && user) {
        const updatedUser = {
          ...user,
          monthly_searches: data.user_info.monthly_searches || user.monthly_searches + 1,
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
      
      console.log(`Page ${page}: Got ${searchResults.length} results, Displaying total: ${displayTotal}`)
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

const canUserExport = (user: User | null): boolean => {
  if (!user) return false;
  return user.subscription_tier !== 'free';
};

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

    // Block free users from exporting search results
  if (!canUserExport(user) && !exportSaved) {
    alert('Export feature is available for Starter, Pro, and Developer accounts. Please upgrade your plan.');
    return;
  }
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
    //setTimeout(() => handleSearch(1), 100);
  }

  const handleViewDetails = (influencer: InfluencerResult) => {
     console.log('View Details clicked for:', influencer.username)
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
  <div className="min-h-screen bg-white">
    {/* Header Component */}
    <Header />

    {/* Main Content */}
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Section - Only show when not viewing saved */}
      {!showSaved && (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-black/10 p-8 mb-8">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search Pakistani influencers (e.g., tech reviewers, beauty influencers, YouTube creators)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
                className="w-full px-5 py-4 pl-12 text-black placeholder-black/50 bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-base"
                disabled={searching}
              />
              <Search className="w-5 h-5 text-black/60 absolute left-4 top-4.5" />
            </div>
            <button
              onClick={() => handleSearch(1)}
              disabled={searching}
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:from-black/30 disabled:to-black/40 text-white px-8 py-4 rounded-2xl font-semibold min-w-[140px] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search insights */}
          {searchInsights && (
            <div className="mb-6 p-4 bg-blue-500/10 backdrop-blur-lg rounded-2xl border border-blue-500/20">
              <div className="text-sm text-blue-600 font-medium">
                Search Strategy: {searchInsights.search_strategy} • 
                Keyword matches: {searchInsights.keyword_matches || 0} • 
                {searchInsights.youtube_data_included && '🎥 YouTube Enhanced • '}
                Search time: {searchInsights.search_time_ms || 0}ms
              </div>
            </div>
          )}

          {/* Quick Search Tags */}
          <div className="flex flex-wrap gap-3 mb-6">
            {['Beauty Influencers', 'Tech Reviewers', 'Food Bloggers', 'Gaming Creators', 'YouTube Stars', 'Comedy Channels'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleQuickSearch(tag)}
                className="px-4 py-2 bg-white/60 hover:bg-blue-500/10 border border-black/10 hover:border-blue-500/30 text-black hover:text-blue-600 rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-lg transform hover:scale-105"
                disabled={searching}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-500 hover:text-green-500 font-semibold mb-6 flex items-center gap-3 bg-white/60 backdrop-blur-lg px-4 py-3 rounded-xl border border-black/10 hover:border-blue-500/30 transition-all duration-300"
          >
            <span>{showFilters ? '− Hide Filters' : '+ Show Filters'}</span>
            <span className="text-xs bg-blue-500/20 text-blue-600 px-3 py-1 rounded-full font-bold">
              {Object.values(filters).filter(v => v && v !== false).length}
            </span>
          </button>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white/50 backdrop-blur-xl rounded-3xl p-8 border border-black/10">
              <h3 className="text-lg font-bold text-black mb-6">Filter Results</h3>
              
              {/* Main Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black">Platform</label>
                  <select
                    value={filters.platform}
                    onChange={(e) => setFilters({...filters, platform: e.target.value})}
                    className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  >
                    <option value="">All Platforms</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  >
                    <option value="">All Categories</option>
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black">Min Followers</label>
                  <select
                    value={filters.minFollowers}
                    onChange={(e) => setFilters({...filters, minFollowers: e.target.value})}
                    className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  >
                    <option value="">Min Followers</option>
                    <option value="1000">1K+</option>
                    <option value="10000">10K+</option>
                    <option value="100000">100K+</option>
                    <option value="1000000">1M+</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black">Status</label>
                  <select
                    value={filters.verified}
                    onChange={(e) => setFilters({...filters, verified: e.target.value})}
                    className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  >
                    <option value="">All Status</option>
                    <option value="true">Verified Only</option>
                    <option value="false">Unverified Only</option>
                  </select>
                </div>
              </div>

              {/* YouTube Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black">Min Videos</label>
                  <select
                    value={filters.minVideoCount}
                    onChange={(e) => setFilters({...filters, minVideoCount: e.target.value})}
                    className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  >
                    <option value="">Min Videos</option>
                    <option value="10">10+ videos</option>
                    <option value="50">50+ videos</option>
                    <option value="100">100+ videos</option>
                    <option value="500">500+ videos</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black">Min Total Views</label>
                  <select
                    value={filters.minTotalViews}
                    onChange={(e) => setFilters({...filters, minTotalViews: e.target.value})}
                    className="w-full px-4 py-3 text-black bg-white/80 backdrop-blur-lg border-2 border-black/20 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  >
                    <option value="">Min Total Views</option>
                    <option value="100000">100K+ views</option>
                    <option value="1000000">1M+ views</option>
                    <option value="10000000">10M+ views</option>
                    <option value="100000000">100M+ views</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-black">YouTube URL</label>
                  <label className="flex items-center gap-3 px-4 py-3 border-2 border-black/20 rounded-xl bg-white/80 backdrop-blur-lg hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasYouTubeUrl}
                      onChange={(e) => setFilters({...filters, hasYouTubeUrl: e.target.checked})}
                      className="w-4 h-4 text-blue-500 bg-white border-2 border-black/30 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-black">Has YouTube URL</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="text-sm text-black/70">
                  {Object.values(filters).filter(v => v && v !== false).length} filters active
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSearch(1)}
                    disabled={searching}
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:from-black/30 disabled:to-black/40 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="text-red-500 hover:text-red-600 font-medium px-6 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all duration-300 border border-red-500/20"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Tips - Mobile Friendly */}
          <div className="bg-gradient-to-r from-blue-500/5 to-green-500/5 rounded-2xl p-6 border border-blue-500/10">
            <h4 className="font-semibold text-black mb-3">💡 Search Tips</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-black/70">
              <div>• Try specific niches: "tech reviewer", "cooking channel"</div>
              <div>• Use platform names: "YouTube gaming creators"</div>
              <div>• Search by location: "Lahore food bloggers"</div>
              <div>• Try category + size: "beauty micro influencers"</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-6 py-4 rounded-2xl mb-6 backdrop-blur-lg">
          <div className="font-semibold mb-1">Search Error:</div>
          <div>{error}</div>
        </div>
      )}

      {/* Results Header */}
      {currentResults.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-black/10">
          <h2 className="text-xl font-bold text-black">
            {showSaved 
              ? `Saved Influencers (${savedInfluencers.length})`
              : user?.subscription_tier === 'free' && results.length >= 5
                ? `Showing ${results.length} of ${totalResults}+ Pakistani influencers (Free Account - Upgrade for more)`
                : `Found ${totalResults.toLocaleString()} Pakistani influencers`
            }
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {canUserExport(user) ? (
              <button
                onClick={() => handleExportResults(showSaved)}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export {showSaved ? 'Saved' : 'Results'}
              </button>
            ) : (
              <div className="relative group">
                <button
                  disabled
                  className="bg-black/20 text-black/50 px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Export Disabled
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-black text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Upgrade to Starter plan to export results
                </div>
              </div>
            )}
            {!showSaved && (
              <div className="text-sm text-black/60 bg-white/60 px-4 py-2 rounded-xl">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>
        </div>
      )}
    









{/* REPLACE your Results Grid section with this improved landscape version */}
{/* REPLACE your Results Grid section with this improved responsive version */}
{currentResults.length > 0 && (
  <>
    <div className="space-y-4 mb-8">
      {currentResults.map((influencer, index) => (
        <div 
          key={influencer.id} 
          className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-black/10 transform hover:scale-[1.01] animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Compact Responsive Layout */}
          <div className="flex flex-col md:flex-row">
            
            {/* Left Section - Profile & Core Info - Reduced width */}
            <div className="md:w-80 p-4 bg-gradient-to-br from-blue-500/5 to-green-500/5 border-r border-black/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <ProfileImage influencer={influencer} />
                  {influencer.verified && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-black mb-1 truncate">
                    {influencer.full_name || influencer.username}
                  </h3>
                  <p className="text-blue-500 font-medium text-sm truncate">@{influencer.username}</p>
                  
                  {/* Engagement Rate - Compact */}
                  <div className={`inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-lg text-xs font-bold ${getEngagementColor(influencer.engagement_rate)}`}>
                    <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                    {influencer.engagement_rate.toFixed(1)}% Engagement
                  </div>
                </div>
              </div>

              {/* Total Followers - Compact Display */}
              <div className="text-center bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-xl p-3 mb-3">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                  {formatFollowers(influencer.total_followers)}
                </div>
                <div className="text-xs text-black/60 font-medium">Total Followers</div>
              </div>

              {/* Contact Info - If Available */}
              {influencer.email && (
                <div className="bg-green-500/10 backdrop-blur-lg rounded-xl p-3 border border-green-500/20 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-semibold text-black">Contact</span>
                  </div>
                  <a 
                    href={`mailto:${influencer.email}`}
                    className="text-green-600 hover:text-green-700 font-medium text-xs transition-colors hover:underline block truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {influencer.email}
                  </a>
                </div>
              )}

              {/* Compact Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavorite(influencer.id, influencer.is_favorited || false);
                  }}
                  className={`py-2 px-2 rounded-lg transition-all duration-300 text-xs font-medium ${
                    influencer.is_favorited 
                      ? 'bg-red-500/20 text-red-500' 
                      : 'bg-black/10 text-black/70 hover:bg-red-500/10 hover:text-red-500'
                  }`}
                >
                  <Heart 
                    className="w-3 h-3 mx-auto mb-1" 
                    fill={influencer.is_favorited ? "currentColor" : "none"}
                  />
                  Like
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveInfluencer(influencer);
                  }}
                  className={`py-2 px-2 rounded-lg transition-all duration-300 text-xs font-medium ${
                    savedInfluencers.some(saved => saved.id === influencer.id)
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-black/10 text-black/70 hover:bg-green-500/10 hover:text-green-500'
                  }`}
                >
                  <Bookmark 
                    className="w-3 h-3 mx-auto mb-1" 
                    fill={savedInfluencers.some(saved => saved.id === influencer.id) ? "currentColor" : "none"}
                  />
                  Save
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const shareData = {
                      title: `${influencer.full_name || influencer.username}`,
                      text: `${formatFollowers(influencer.total_followers)} followers, ${influencer.engagement_rate.toFixed(1)}% engagement`,
                      url: window.location.href
                    };
                    
                    if (navigator.share) {
                      navigator.share(shareData).catch(() => {
                        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`)
                          .then(() => alert('Copied!'))
                          .catch(() => alert('Unable to share'));
                      });
                    } else {
                      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`)
                        .then(() => alert('Copied!'))
                        .catch(() => alert(`${shareData.title}\n${shareData.text}`));
                    }
                  }}
                  className="py-2 px-2 rounded-lg bg-black/10 text-black/70 hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-300 text-xs font-medium"
                >
                  <Share2 className="w-3 h-3 mx-auto mb-1" />
                  Share
                </button>
              </div>

              {/* View Details Button - Compact */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(influencer);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 text-sm flex items-center justify-center gap-2"
              >
                <Eye className="w-3 h-3" />
                View Details
              </button>
            </div>

            {/* Right Section - Platform Details - Flexible width */}
            <div className="flex-1 p-4">
              
              {/* Bio - If Available */}
              {influencer.bio && (
                <div className="mb-3">
                  <p className="text-black/70 line-clamp-2 leading-relaxed text-sm">
                    {influencer.bio}
                  </p>
                </div>
              )}

              {/* Dynamic Platform Stats - Only show platforms with data */}
              <div className="mb-3">
                {(() => {
                  const platforms = [];
                  
                  // Instagram
                  if (influencer.instagram_followers > 0) {
                    platforms.push({
                      platform: 'Instagram',
                      icon: '📷',
                      followers: influencer.instagram_followers,
                      handle: influencer.instagram_handle || influencer.username,
                      url: `https://instagram.com/${influencer.instagram_handle || influencer.username}`,
                      color: 'bg-pink-500/10 text-pink-600 border-pink-500/20'
                    });
                  }
                  
                  // YouTube
                  if (influencer.youtube_subscribers > 0) {
                    platforms.push({
                      platform: 'YouTube',
                      icon: '🎥',
                      followers: influencer.youtube_subscribers,
                      handle: influencer.youtube_channel || influencer.username,
                      url: influencer.youtube_url || `https://youtube.com/@${influencer.youtube_channel || influencer.username}`,
                      color: 'bg-red-500/10 text-red-600 border-red-500/20',
                      extraInfo: influencer.video_count ? `${influencer.video_count} videos` : null
                    });
                  }
                  
                  // TikTok
                  if (influencer.tiktok_followers > 0) {
                    platforms.push({
                      platform: 'TikTok',
                      icon: '🎵',
                      followers: influencer.tiktok_followers,
                      handle: influencer.tiktok_handle || influencer.username,
                      url: `https://tiktok.com/@${influencer.tiktok_handle || influencer.username}`,
                      color: 'bg-black/10 text-black border-black/20'
                    });
                  }

                  // If no platforms have data, show a placeholder
                  if (platforms.length === 0) {
                    return (
                      <div className="bg-gray-500/10 text-gray-600 rounded-xl p-3 text-center text-sm">
                        <div className="text-gray-400 mb-1">📱</div>
                        Social media data not available
                      </div>
                    );
                  }

                  // Responsive grid based on number of platforms
                  const gridCols = platforms.length === 1 ? 'grid-cols-1' : 
                                  platforms.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
                                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

                  return (
                    <div className={`grid ${gridCols} gap-2`}>
                      {platforms.map((platform, idx) => (
                        <a
                          key={idx}
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${platform.color} rounded-xl p-3 hover:shadow-md transition-all duration-300 transform hover:scale-105 group border`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                              {platform.icon}
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="font-bold text-sm">{formatFollowers(platform.followers)}</div>
                          <div className="text-xs opacity-80 font-medium">{platform.platform}</div>
                          <div className="text-xs opacity-60 truncate">@{platform.handle}</div>
                          {platform.extraInfo && (
                            <div className="text-xs opacity-60 mt-1">{platform.extraInfo}</div>
                          )}
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* YouTube Enhanced Metrics - Only if data exists */}
              {influencer.video_count && influencer.total_views && (
                <div className="bg-red-500/10 backdrop-blur-lg rounded-xl p-3 border border-red-500/20 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-black">YouTube Analytics</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-red-600">{influencer.video_count}</div>
                      <div className="text-xs text-red-600">Videos</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600">{formatViews(influencer.total_views)}</div>
                      <div className="text-xs text-red-600">Total Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600">
                        {Math.round(influencer.total_views / influencer.video_count / 1000)}K
                      </div>
                      <div className="text-xs text-red-600">Avg Views</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Badge */}
              {influencer.category && (
                <div>
                  <span className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 px-3 py-1 rounded-lg text-sm font-medium border border-blue-500/20">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    {influencer.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Pagination - Compact Design */}
    {!showSaved && totalPages > 1 && !(user?.subscription_tier === 'free' && results.length >= 5) && (
      <div className="flex justify-center items-center gap-2 bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-black/10">
        <button
          onClick={() => handleSearch(currentPage - 1)}
          disabled={currentPage === 1 || searching}
          className="flex items-center gap-1 px-3 py-2 bg-white/80 backdrop-blur-lg text-black rounded-lg hover:bg-blue-500/10 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-black/10 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handleSearch(i + 1)}
              disabled={searching}
              className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 text-sm ${
                i + 1 === currentPage 
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg scale-105' 
                  : 'bg-white/80 backdrop-blur-lg text-black hover:bg-blue-500/10 hover:text-blue-500 border border-black/10'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => handleSearch(currentPage + 1)}
          disabled={currentPage === totalPages || searching}
          className="flex items-center gap-1 px-3 py-2 bg-white/80 backdrop-blur-lg text-black rounded-lg hover:bg-blue-500/10 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-black/10 text-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )}
  </>
)}

{/* Loading State - Compact */}
{searching && (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
    <p className="text-black/70 font-semibold mt-4 animate-pulse">Searching Pakistani influencers...</p>
  </div>
)}

{/* Empty State - Compact */}
{!searching && currentResults.length === 0 && (showSaved || query) && (
  <div className="text-center py-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-black/10">
    <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <Search className="w-8 h-8 text-black/60" />
    </div>
    <h3 className="text-xl font-bold text-black mb-2">
      {showSaved ? 'No saved influencers' : 'No influencers found'}
    </h3>
    <p className="text-black/60 mb-4 text-sm">
      {showSaved 
        ? 'Start saving influencers from your search results' 
        : 'Try adjusting your search terms or filters'
      }
    </p>
  </div>
)}

{/* Initial State - Compact */}
{!searching && results.length === 0 && !query && !showSaved && (
  <div className="text-center py-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-black/10">
    <h2 className="text-2xl font-bold text-black mb-3">
      Discover Pakistani Influencers
    </h2>
    <p className="text-black/70 mb-6 max-w-xl mx-auto text-sm">
      Search through our database of 1,800+ Pakistani content creators with enhanced YouTube analytics
    </p>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
      {[
        { name: 'Beauty', icon: '💄' },
        { name: 'Tech', icon: '📱' },
        { name: 'Gaming', icon: '🎮' },
        { name: 'YouTube', icon: '🎥' }
      ].map((category, index) => (
        <button
          key={category.name}
          onClick={() => handleQuickSearch(category.name)}
          className="p-4 bg-gradient-to-r from-blue-500/5 to-green-500/5 hover:from-blue-500/10 hover:to-green-500/10 rounded-xl transition-all duration-300 transform hover:scale-105 border border-black/5 animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="text-2xl mb-2">{category.icon}</div>
          <div className="font-semibold text-black text-sm">{category.name}</div>
        </button>
      ))}
    </div>
  </div>
)}
</div>
</div>
 )}