'use client'

import { useState } from 'react'
import { Search, TrendingUp, Users, Heart, MessageCircle, Instagram, AlertCircle, CheckCircle, ArrowRight, Loader2, Eye, Bookmark, Share2, Crown, Zap, Target, Award, BarChart3 } from 'lucide-react'

interface InstagramProfile {
  username: string
  displayName: string
  bio: string
  followers: number
  following: number
  posts: number
  profilePicture: string
  isVerified: boolean
  category?: string
  location?: string
}

interface EngagementMetrics {
  engagementRate: number
  avgLikes: number
  avgComments: number
  avgViews?: number
  totalEngagements: number
  rating: string
  color: string
  description: string
}

interface PostData {
  id: string
  caption: string
  likes: number
  comments: number
  views?: number
  type: 'image' | 'video' | 'carousel'
  timestamp: string
  engagementRate: number
}

export default function InstagramProfileAnalyzer() {
  const [username, setUsername] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<InstagramProfile | null>(null)
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null)
  const [recentPosts, setRecentPosts] = useState<PostData[]>([])
  const [error, setError] = useState<string | null>(null)

  const extractUsername = (input: string): string => {
    // Handle Instagram URLs
    if (input.includes('instagram.com')) {
      const match = input.match(/instagram\.com\/([a-zA-Z0-9._]+)/)
      return match ? match[1] : input
    }
    // Remove @ symbol if present
    return input.replace('@', '').trim()
  }

  const analyzeProfile = async () => {
    const cleanUsername = extractUsername(username)
    
    if (!cleanUsername) {
      setError('Please enter a valid Instagram username or profile URL')
      return
    }

    setIsLoading(true)
    setError(null)
    setProfile(null)
    setMetrics(null)
    setRecentPosts([])

    try {
      // Call your backend API endpoint
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://infoish-ai-search-production.up.railway.app' 
        : 'http://127.0.0.1:8000'

      const response = await fetch(`${backendUrl}/api/analyze-instagram/${cleanUsername}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Profile not found. Please check the username and try again.')
        } else if (response.status === 403) {
          throw new Error('This profile is private. Only public profiles can be analyzed.')
        } else {
          throw new Error('Failed to analyze profile. Please try again.')
        }
      }

      const data = await response.json()

      // Set profile data
      setProfile({
        username: data.username,
        displayName: data.display_name,
        bio: data.bio,
        followers: data.followers,
        following: data.following,
        posts: data.posts,
        profilePicture: data.profile_picture,
        isVerified: data.is_verified,
        category: data.category,
        location: data.location
      })

      // Calculate engagement metrics
      const totalEngagements = data.avg_likes + data.avg_comments
      const engagementRate = (totalEngagements / data.followers) * 100

      // Determine rating
      let rating = ''
      let color = ''
      let description = ''

      if (engagementRate < 1) {
        rating = 'Low'
        color = 'text-red-600'
        description = 'Below average engagement'
      } else if (engagementRate < 3) {
        rating = 'Average'
        color = 'text-yellow-600'
        description = 'Standard engagement rate'
      } else if (engagementRate < 6) {
        rating = 'Good'
        color = 'text-blue-600'
        description = 'Above average engagement'
      } else if (engagementRate < 10) {
        rating = 'Excellent'
        color = 'text-green-600'
        description = 'High engagement rate'
      } else {
        rating = 'Outstanding'
        color = 'text-purple-600'
        description = 'Elite engagement rate'
      }

      setMetrics({
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        avgLikes: data.avg_likes,
        avgComments: data.avg_comments,
        avgViews: data.avg_views,
        totalEngagements,
        rating,
        color,
        description
      })

      // Set recent posts
      if (data.recent_posts) {
        setRecentPosts(data.recent_posts)
      }

    } catch (err: any) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      analyzeProfile()
    }
  }

  const resetAnalyzer = () => {
    setUsername('')
    setProfile(null)
    setMetrics(null)
    setRecentPosts([])
    setError(null)
  }

  const getFollowerRange = (followers: number): string => {
    if (followers < 1000) return '<1k'
    if (followers < 5000) return '1k-5k'
    if (followers < 10000) return '5k-10k'
    if (followers < 50000) return '10k-50k'
    if (followers < 100000) return '50k-100k'
    if (followers < 500000) return '100k-500k'
    if (followers < 1000000) return '500k-1M'
    return '1M+'
  }

  const getBenchmarkData = (followers: number) => {
    // Industry benchmarks based on follower count
    const ranges = {
      '<1k': { low: 8, median: 12, high: 18 },
      '1k-5k': { low: 5, median: 8, high: 12 },
      '5k-10k': { low: 4, median: 6, high: 9 },
      '10k-50k': { low: 2, median: 4, high: 7 },
      '50k-100k': { low: 1.5, median: 3, high: 5 },
      '100k-500k': { low: 1, median: 2, high: 4 },
      '500k-1M': { low: 0.8, median: 1.5, high: 3 },
      '1M+': { low: 0.5, median: 1, high: 2 }
    }

    const range = getFollowerRange(followers)
    return ranges[range as keyof typeof ranges] || ranges['1k-5k']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Instagram className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">Instagram Profile Analyzer</h1>
                <p className="text-xs sm:text-sm text-gray-600">Free tool by Infoishai</p>
              </div>
            </div>
            <a 
              href="/"
              className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              ← Back
            </a>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!profile ? (
          <>
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg mb-4 sm:mb-6 border border-purple-200">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                <span className="text-xs sm:text-sm font-bold text-purple-800">100% Free • No Login Required</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 sm:mb-6 leading-tight">
                Analyze Any Instagram Profile
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Get Instant Insights
                </span>
              </h2>
              
              <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8">
                Enter any public Instagram username to get detailed engagement analytics, performance metrics, and industry benchmarks.
              </p>

              {/* Features Pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-purple-200 shadow-sm">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">Engagement Rate</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-pink-200 shadow-sm">
                  <BarChart3 className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-semibold text-gray-700">Post Analytics</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-orange-200 shadow-sm">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-gray-700">Benchmarks</span>
                </div>
              </div>

              {/* Search Input */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-purple-200 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Instagram className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter username or paste profile URL"
                        className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      onClick={analyzeProfile}
                      disabled={isLoading || !username.trim()}
                      className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="hidden sm:inline">Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          <span>Analyze</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    Examples: @kakayrao, instagram.com/cristiano, virat.kohli
                  </p>

                  {error && (
                    <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-semibold">Error</p>
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100 hover:border-purple-300 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Instant Analysis</h3>
                <p className="text-gray-600 text-sm">Get comprehensive insights in seconds</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-100 hover:border-pink-300 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">100% Free</h3>
                <p className="text-gray-600 text-sm">No registration or payment required</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100 hover:border-orange-300 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Accurate Data</h3>
                <p className="text-gray-600 text-sm">Real-time metrics from public profiles</p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Profile Results */}
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Profile Header Card */}
              <div className="bg-white rounded-3xl shadow-2xl border-2 border-purple-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-8">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <img
                      src={profile.profilePicture || '/default-avatar.png'}
                      alt={profile.displayName}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-xl"
                    />
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                        <h2 className="text-3xl font-black text-white">{profile.displayName}</h2>
                        {profile.isVerified && (
                          <CheckCircle className="w-6 h-6 text-white fill-blue-500" />
                        )}
                      </div>
                      <p className="text-white/90 text-lg mb-2">@{profile.username}</p>
                      {profile.bio && (
                        <p className="text-white/80 text-sm max-w-2xl">{profile.bio}</p>
                      )}
                      {(profile.category || profile.location) && (
                        <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                          {profile.category && (
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold">
                              {profile.category}
                            </span>
                          )}
                          {profile.location && (
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold">
                              📍 {profile.location}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={resetAnalyzer}
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold py-3 px-6 rounded-xl transition-all border border-white/30"
                    >
                      Analyze Another
                    </button>
                  </div>
                </div>

                {/* Profile Stats */}
                <div className="grid grid-cols-3 gap-px bg-gray-200">
                  <div className="bg-white p-6 text-center">
                    <div className="text-3xl font-black text-gray-900 mb-1">
                      {profile.followers >= 1000000 
                        ? `${(profile.followers / 1000000).toFixed(1)}M`
                        : profile.followers >= 1000
                        ? `${(profile.followers / 1000).toFixed(1)}k`
                        : profile.followers}
                    </div>
                    <div className="text-sm text-gray-600 font-semibold">Followers</div>
                  </div>
                  <div className="bg-white p-6 text-center">
                    <div className="text-3xl font-black text-gray-900 mb-1">
                      {profile.following >= 1000 
                        ? `${(profile.following / 1000).toFixed(1)}k`
                        : profile.following}
                    </div>
                    <div className="text-sm text-gray-600 font-semibold">Following</div>
                  </div>
                  <div className="bg-white p-6 text-center">
                    <div className="text-3xl font-black text-gray-900 mb-1">{profile.posts}</div>
                    <div className="text-sm text-gray-600 font-semibold">Posts</div>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              {metrics && (
                <>
                  {/* Main Engagement Rate Card */}
                  <div className="bg-white rounded-3xl shadow-2xl border-2 border-purple-200 p-8 sm:p-12">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center gap-3 mb-4">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${
                          metrics.rating === 'Outstanding' ? 'from-purple-500 to-pink-500' :
                          metrics.rating === 'Excellent' ? 'from-green-500 to-emerald-500' :
                          metrics.rating === 'Good' ? 'from-blue-500 to-cyan-500' :
                          metrics.rating === 'Average' ? 'from-yellow-500 to-orange-500' :
                          'from-red-500 to-rose-500'
                        } flex items-center justify-center shadow-lg`}>
                          <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Engagement Rate</h3>
                      <div className={`text-7xl font-black mb-4 ${metrics.color}`}>
                        {metrics.engagementRate}%
                      </div>
                      <div className={`inline-block text-2xl font-black px-8 py-3 rounded-full mb-2 ${
                        metrics.rating === 'Outstanding' ? 'bg-purple-100 text-purple-700' :
                        metrics.rating === 'Excellent' ? 'bg-green-100 text-green-700' :
                        metrics.rating === 'Good' ? 'bg-blue-100 text-blue-700' :
                        metrics.rating === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {metrics.rating}
                      </div>
                      <p className="text-gray-600 text-lg">{metrics.description}</p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border-2 border-pink-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Heart className="w-5 h-5 text-pink-600" />
                          <div className="text-sm font-bold text-gray-600">Avg Likes</div>
                        </div>
                        <div className="text-3xl font-black text-gray-900">{metrics.avgLikes.toLocaleString()}</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <MessageCircle className="w-5 h-5 text-blue-600" />
                          <div className="text-sm font-bold text-gray-600">Avg Comments</div>
                        </div>
                        <div className="text-3xl font-black text-gray-900">{metrics.avgComments.toLocaleString()}</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <div className="text-sm font-bold text-gray-600">Total Engagement</div>
                        </div>
                        <div className="text-3xl font-black text-gray-900">{metrics.totalEngagements.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Benchmark Comparison */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200">
                      <h4 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                        <Target className="w-6 h-6 text-purple-600" />
                        Engagement Rate Distribution for {getFollowerRange(profile.followers)} Followers
                      </h4>
                      
                      <div className="relative">
                        <div className="h-12 bg-gradient-to-r from-red-500 via-yellow-500 via-blue-500 via-green-500 to-purple-500 rounded-xl relative overflow-hidden">
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                            style={{ left: `${Math.min(metrics.engagementRate / 20 * 100, 100)}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
                              <div className="text-xs font-bold text-gray-600">Your Profile</div>
                              <div className="text-lg font-black text-purple-600">{metrics.engagementRate}%</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between mt-4 text-sm font-semibold text-gray-600">
                          <div>
                            <div className="text-xs">Low</div>
                            <div>{getBenchmarkData(profile.followers).low}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs">Median</div>
                            <div>{getBenchmarkData(profile.followers).median}%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs">High</div>
                            <div>{getBenchmarkData(profile.followers).high}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Posts Analysis */}
                  {recentPosts.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-2xl border-2 border-purple-200 p-8">
                      <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                        Recent Posts Performance
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentPosts.slice(0, 6).map((post, index) => (
                          <div key={post.id} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-purple-300 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                  post.engagementRate > metrics.engagementRate 
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {post.engagementRate.toFixed(2)}% ER
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(post.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                              {post.caption || 'No caption'}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-pink-500" />
                                <span className="font-semibold">{post.likes.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4 text-blue-500" />
                                <span className="font-semibold">{post.comments.toLocaleString()}</span>
                              </div>
                              {post.views && (
                                <div className="flex items-center gap-1">
                                  <Eye className="w-4 h-4 text-purple-500" />
                                  <span className="font-semibold">{post.views.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA Section */}
                  <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-3xl p-12 text-center shadow-2xl">
                    <h3 className="text-3xl sm:text-4xl font-black text-white mb-4">
                      Want to Find More Influencers Like This?
                    </h3>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                      Search 1,800+ verified Pakistani influencers with detailed engagement metrics
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a
                        href="/"
                        className="inline-flex items-center justify-center gap-3 bg-white text-purple-600 hover:bg-gray-50 font-bold py-5 px-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                      >
                        <Search className="w-6 h-6" />
                        Search Influencers
                      </a>
                      <button
                        onClick={resetAnalyzer}
                        className="inline-flex items-center justify-center gap-3 border-3 border-white text-white hover:bg-white/10 font-bold py-5 px-10 rounded-2xl transition-all transform hover:scale-105 backdrop-blur-lg"
                      >
                        Analyze Another Profile
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}