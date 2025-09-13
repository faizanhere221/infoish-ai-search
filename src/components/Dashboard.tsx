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
  Filter
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name?: string
  profile_picture?: string
  subscription_tier: "free" | "starter" | "pro"
  monthly_searches: number
  search_limit: number
  created_at?: string
}

interface DashboardStats {
  totalSearches: number
  savedInfluencers: number
  recentSearches: string[]
  topCategories: string[]
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalSearches: 0,
    savedInfluencers: 0,
    recentSearches: [],
    topCategories: []
  })
  const [savedInfluencers, setSavedInfluencers] = useState<any[]>([])
  const router = useRouter()

  const BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-production-url.com' 
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
      // For localhost development, create mock user
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
    // Load saved influencers from localStorage
    const saved = localStorage.getItem('saved_influencers')
    if (saved) {
      try {
        const savedData = JSON.parse(saved)
        setSavedInfluencers(savedData)
        setStats(prev => ({
          ...prev,
          savedInfluencers: savedData.length
        }))
      } catch (error) {
        console.error('Error loading saved influencers:', error)
      }
    }

    // Load search history and stats (mock data for localhost)
    const searchHistory = localStorage.getItem('search_history')
    if (searchHistory) {
      try {
        const history = JSON.parse(searchHistory)
        setStats(prev => ({
          ...prev,
          totalSearches: history.length,
          recentSearches: history.slice(-5).reverse(),
          topCategories: ['Beauty', 'Tech', 'Gaming', 'Food']
        }))
      } catch (error) {
        console.error('Error loading search history:', error)
      }
    } else {
      // Mock data for development
      setStats(prev => ({
        ...prev,
        totalSearches: 8,
        recentSearches: ['beauty influencers', 'tech reviewers', 'gaming creators', 'food bloggers'],
        topCategories: ['Beauty', 'Tech', 'Gaming', 'Food']
      }))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('saved_influencers')
    localStorage.removeItem('search_history')
    router.push('/login')
  }

  const getSearchesRemaining = () => {
    if (!user) return 0
    return Math.max(0, user.search_limit - user.monthly_searches)
  }

  const handleDashboardExport = async () => {
  try {
    // Get saved influencers from localStorage
    const savedInfluencers = JSON.parse(localStorage.getItem('saved_influencers') || '[]')
    
    if (savedInfluencers.length === 0) {
      alert('No saved influencers to export. Save some influencers first!')
      return
    }

    // Import your existing exportToCSV function (or define it here)
    // Assuming you have this function from your search page
    const { exportToCSV } = await import('@/lib/utils')
    
    // Export the saved influencers
    exportToCSV(savedInfluencers, true) // true indicates this is saved data
    
    // Optional: Show success message
    alert(`Successfully exported ${savedInfluencers.length} saved influencers to CSV`)
    
  } catch (error) {
    console.error('Dashboard export failed:', error)
    alert('Export failed. Please try again.')
  }
}


  const getUsagePercentage = () => {
    if (!user) return 0
    return Math.round((user.monthly_searches / user.search_limit) * 100)
  }

  const isNearLimit = () => {
    return getSearchesRemaining() <= Math.ceil((user?.search_limit || 15) * 0.2)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.full_name?.split(' ')[0] || user.email.split('@')[0]}!
          </h1>
          <p className="text-gray-600">
            Here's your influencer marketing dashboard overview
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Searches This Month */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                isNearLimit() ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {getUsagePercentage()}% used
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {user.monthly_searches}
            </h3>
            <p className="text-gray-600 text-sm">
              of {user.search_limit} searches this month
            </p>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isNearLimit() ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${getUsagePercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* Saved Influencers */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.savedInfluencers}
            </h3>
            <p className="text-gray-600 text-sm">Saved influencers</p>
            <Link href="/saved" className="text-green-600 text-sm font-medium hover:underline mt-2 inline-block">
              View all saved →
            </Link>
          </div>

          {/* Plan Status */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                user.subscription_tier === 'pro' ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                {user.subscription_tier === 'pro' ? (
                  <Crown className="w-6 h-6 text-yellow-600" />
                ) : (
                  <Users className="w-6 h-6 text-gray-600" />
                )}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1 capitalize">
              {user.subscription_tier}
            </h3>
            <p className="text-gray-600 text-sm">Current plan</p>
            {user.subscription_tier === 'free' && (
              <Link href="/pricing" className="text-green-600 text-sm font-medium hover:underline mt-2 inline-block">
                Upgrade now →
              </Link>
            )}
          </div>

          {/* Database Access */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              1,800+
            </h3>
            <p className="text-gray-600 text-sm">Pakistani influencers</p>
            <Link href="/search" className="text-purple-600 text-sm font-medium hover:underline mt-2 inline-block">
              Start searching →
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link 
                  href="/search" 
                  className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                >
                  <Search className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-green-600">
                      Find Influencers
                    </div>
                    <div className="text-sm text-gray-500">
                      Search our database
                    </div>
                  </div>
                </Link>

                <Link 
                  href="/search" 
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <Star className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-blue-600">
                      View Saved
                    </div>
                    <div className="text-sm text-gray-500">
                      {stats.savedInfluencers} saved influencers
                    </div>
                  </div>
                </Link>

                {user.subscription_tier === 'free' && (
                  <Link 
                    href="/pricing" 
                    className="flex items-center gap-3 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group"
                  >
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-yellow-600">
                        Upgrade Plan
                      </div>
                      <div className="text-sm text-gray-500">
                        Unlock unlimited searches
                      </div>
                    </div>
                  </Link>
                )}

                <button 
  onClick={handleDashboardExport}
  className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group w-full text-left"
>
  <Download className="w-5 h-5 text-purple-600" />
  <div>
    <div className="font-medium text-gray-900 group-hover:text-purple-600">
      Export Data
    </div>
    <div className="text-sm text-gray-500">
      Download your saved list
    </div>
  </div>
</button>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Account</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {user.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt={user.full_name || user.email}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.full_name || user.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-500 mb-1">Member since</div>
                  <div className="font-medium text-gray-900">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'January 2024'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Searches */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Recent Searches</h2>
                <Link href="/search" className="text-green-600 text-sm font-medium hover:underline">
                  Search again
                </Link>
              </div>
              
              {stats.recentSearches.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentSearches.map((search, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 capitalize">{search}</div>
                        <div className="text-sm text-gray-500">
                          {index === 0 ? 'Today' : `${index + 1} days ago`}
                        </div>
                      </div>
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        Repeat
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No searches yet</p>
                  <Link href="/search" className="text-green-600 font-medium hover:underline">
                    Start your first search
                  </Link>
                </div>
              )}
            </div>

            {/* Popular Categories */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Categories</h2>
              <div className="grid grid-cols-2 gap-4">
                {stats.topCategories.map((category, index) => (
                  <Link
                    key={category}
                    href={`/search?category=${category.toLowerCase()}`}
                    className="p-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        {category === 'Beauty' && '💄'}
                        {category === 'Tech' && '📱'}
                        {category === 'Gaming' && '🎮'}
                        {category === 'Food' && '🍔'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-green-600">
                          {category}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.floor(Math.random() * 200) + 50}+ influencers
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Usage Insights */}
            {user.subscription_tier === 'free' && isNearLimit() && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">
                      You're almost out of searches!
                    </h3>
                    <p className="text-gray-700 mb-4">
                      You have {getSearchesRemaining()} searches remaining this month. 
                      Upgrade to Premium for unlimited searches and advanced features.
                    </p>
                    <Link 
                      href="/pricing"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      Upgrade Now
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