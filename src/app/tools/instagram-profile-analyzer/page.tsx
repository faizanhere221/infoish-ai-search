'use client'

import React, { useState } from 'react'
import { Search, TrendingUp, Users, Heart, MessageCircle, Eye, Instagram, CheckCircle, Clock, AlertCircle, ExternalLink, Calendar, Sparkles, Award, BarChart3, TrendingDown, Zap, Target, Activity } from 'lucide-react'

// Safe formatNumber function
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return '0'
  }
  
  const value = Number(num)
  
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  return value.toFixed(0)
}

// Safe percentage formatter
const formatPercentage = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return '0.00'
  }
  return Number(num).toFixed(2)
}

// Get engagement quality label
const getEngagementQuality = (rate: number): { label: string; color: string; icon: any } => {
  if (rate >= 10) return { label: 'Excellent', color: 'text-green-600', icon: Sparkles }
  if (rate >= 5) return { label: 'Very Good', color: 'text-blue-600', icon: TrendingUp }
  if (rate >= 3) return { label: 'Good', color: 'text-purple-600', icon: Target }
  if (rate >= 1) return { label: 'Average', color: 'text-yellow-600', icon: Activity }
  return { label: 'Low', color: 'text-gray-600', icon: TrendingDown }
}

// Get follower tier
const getFollowerTier = (followers: number): string => {
  if (followers >= 1000000) return '🌟 Mega Influencer'
  if (followers >= 100000) return '⭐ Macro Influencer'
  if (followers >= 10000) return '✨ Micro Influencer'
  if (followers >= 1000) return '💫 Nano Influencer'
  return '🌱 Growing Account'
}

export default function InstagramProfileAnalyzer() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null)

  const analyzeProfile = async () => {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    setIsLoading(true)
    setError('')
    setProfile(null)
    setMetrics(null)
    setPosts([])
    setRateLimitInfo(null)

    try {
      // Smart username extraction
      let cleanUsername = username.trim()
      
      // Extract from Instagram URL (https://www.instagram.com/username/ or https://instagram.com/username)
      const urlPattern = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/i
      const urlMatch = cleanUsername.match(urlPattern)
      if (urlMatch && urlMatch[1]) {
        cleanUsername = urlMatch[1]
      }
      
      // Remove @ symbol if present
      cleanUsername = cleanUsername.replace(/^@+/, '')
      
      // Remove trailing slashes
      cleanUsername = cleanUsername.replace(/\/+$/, '')
      
      // Remove any query parameters or hash
      cleanUsername = cleanUsername.split('?')[0].split('#')[0]
      
      // Validate username (Instagram usernames can only contain letters, numbers, periods, and underscores)
      const validUsernamePattern = /^[a-zA-Z0-9._]+$/
      if (!validUsernamePattern.test(cleanUsername)) {
        setError('Invalid Instagram username. Usernames can only contain letters, numbers, periods, and underscores.')
        setIsLoading(false)
        return
      }
      
      console.log('Original input:', username)
      console.log('Cleaned username:', cleanUsername)
      
      const backendUrl = process.env.NODE_ENV === 'production'
        ? 'https://infoish-ai-search-production.up.railway.app'
        : 'http://127.0.0.1:8000'

      console.log('Fetching from:', `${backendUrl}/api/analyze-instagram/${cleanUsername}`)

      const response = await fetch(
        `${backendUrl}/api/analyze-instagram/${cleanUsername}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('Response status:', response.status)

      // Handle 429 Rate Limit with detailed info
      if (response.status === 429) {
        const data = await response.json()
        setRateLimitInfo({
          message: data.message || 'Too many requests',
          retryAfter: data.retry_after || 60
        })
        throw new Error('Rate limit reached. Please wait before analyzing another profile.')
      }

      if (response.status === 404) {
        throw new Error('Profile not found. Please check the username and try again.')
      }

      if (response.status === 403) {
        throw new Error('This is a private profile. Only public profiles can be analyzed.')
      }

      if (response.status === 500) {
        throw new Error('Server error. The profile might be too large or temporarily unavailable. Please try again.')
      }

      if (!response.ok) {
        throw new Error('Failed to analyze profile. Please try again in a few moments.')
      }

      const data = await response.json()
      console.log('Received data:', data)
      
      if (!data || !data.profile) {
        throw new Error('No profile data received. Please try again.')
      }

      setProfile({
        username: data.profile.username || cleanUsername,
        full_name: data.profile.full_name || cleanUsername,
        biography: data.profile.biography || '',
        followers: data.profile.followers || 0,
        following: data.profile.following || 0,
        posts_count: data.profile.posts_count || 0,
        is_verified: data.profile.is_verified || false,
        is_private: data.profile.is_private || false,
        profile_pic_url: data.profile.profile_pic_url || '',
        external_url: data.profile.external_url || ''
      })
      
      setMetrics({
        engagement_rate: data.metrics?.engagement_rate || 0,
        avg_likes: data.metrics?.avg_likes || 0,
        avg_comments: data.metrics?.avg_comments || 0,
        total_posts_analyzed: data.metrics?.total_posts_analyzed || 0,
        best_post: data.metrics?.best_post || null,
        post_types: data.metrics?.post_types || { videos: 0, photos: 0 }
      })

      setPosts(data.posts || [])

      console.log('Analysis complete:', data.posts?.length || 0, 'posts')
      
    } catch (err: any) {
      console.error('Analysis error:', err)
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      analyzeProfile()
    }
  }

  // Calculate additional insights
  const getInsights = () => {
    if (!profile || !metrics || !posts.length) return null

    const followerEngagementRatio = (metrics.avg_likes + metrics.avg_comments) / profile.followers
    const commentLikeRatio = profile.followers > 0 ? metrics.avg_comments / metrics.avg_likes : 0
    const postingFrequency = posts.length
    const engagementQuality = getEngagementQuality(metrics.engagement_rate)
    const followerTier = getFollowerTier(profile.followers)

    // Consistency score (based on variance in likes)
    const likes = posts.map(p => p.likes)
    const avgLikes = likes.reduce((a, b) => a + b, 0) / likes.length
    const variance = likes.reduce((sum, likes) => sum + Math.pow(likes - avgLikes, 2), 0) / likes.length
    const stdDev = Math.sqrt(variance)
    const consistencyScore = avgLikes > 0 ? Math.max(0, 100 - (stdDev / avgLikes * 100)) : 0

    return {
      followerEngagementRatio,
      commentLikeRatio,
      postingFrequency,
      engagementQuality,
      followerTier,
      consistencyScore
    }
  }

  const insights = getInsights()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Instagram className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Instagram Profile Analyzer</h1>
                <p className="text-gray-600">Advanced analytics for any public Instagram profile</p>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <div className="text-sm text-gray-500">Rate Limit</div>
                <div className="text-lg font-semibold text-purple-600">10 profiles/min</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="max-w-2xl mx-auto">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Instagram Username
            </label>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="cristiano, @cristiano, or instagram.com/cristiano"
                  disabled={isLoading}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                onClick={analyzeProfile}
                disabled={isLoading || !username.trim()}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Analyze
                  </>
                )}
              </button>
            </div>

            {/* Input Format Info */}
            {!isLoading && !error && !rateLimitInfo && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                <p className="text-xs text-purple-700">
                  <span className="font-semibold">💡 Accepted formats:</span> username, @username, instagram.com/username, or full URL
                </p>
              </div>
            )}

            {/* Loading Message */}
            {isLoading && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      Analyzing profile...
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Fetching posts, calculating metrics, and generating insights. This may take 15-30 seconds.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Limit Warning */}
            {rateLimitInfo && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium mb-1">Rate Limit Reached</p>
                    <p className="text-sm text-yellow-700 mb-2">{rateLimitInfo.message}</p>
                    <p className="text-xs text-yellow-600">
                      ⏱️ Please wait {rateLimitInfo.retryAfter} seconds before analyzing another profile.
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      💡 Tip: You can analyze up to 10 different profiles per minute.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !rateLimitInfo && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800 font-medium mb-1">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                    {error.includes('private') && (
                      <p className="text-xs text-red-600 mt-2">
                        💡 Private profiles cannot be analyzed. Ask the user to make their profile public.
                      </p>
                    )}
                    {error.includes('not found') && (
                      <p className="text-xs text-red-600 mt-2">
                        💡 Double-check the username spelling and make sure the account exists.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {profile && metrics && insights && (
          <div className="space-y-8">
            
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Link */}
                <div className="flex-shrink-0">
                  <a
                    href={`https://www.instagram.com/${profile.username}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 flex items-center justify-center hover:scale-105 transition-transform shadow-lg relative group">
                      <div className="text-center">
                        <Instagram className="w-12 h-12 text-white mx-auto mb-1" />
                        <span className="text-xs text-white font-medium">View Profile</span>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-full transition-all"></div>
                    </div>
                  </a>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-3xl font-bold text-gray-900">@{profile.username}</h2>
                    {profile.is_verified && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                        <span className="text-xs font-medium text-blue-700">Verified</span>
                      </div>
                    )}
                  </div>
                  
                  {profile.full_name && profile.full_name !== profile.username && (
                    <p className="text-xl text-gray-700 mb-2">{profile.full_name}</p>
                  )}

                  {/* Follower Tier Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
                    <span className="text-sm font-semibold text-purple-700">{insights.followerTier}</span>
                  </div>
                  
                  {profile.biography && (
                    <p className="text-gray-600 mb-4 whitespace-pre-wrap">{profile.biography}</p>
                  )}

                  {profile.external_url && (
                    <a
                      href={profile.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-2"
                    >
                      🔗 {profile.external_url.replace(/^https?:\/\//,'').slice(0, 40)}...
                    </a>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatNumber(profile.posts_count)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatNumber(profile.followers)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatNumber(profile.following)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Following</div>
                </div>
              </div>
            </div>

            {/* Engagement Quality Banner */}
            <div className={`bg-gradient-to-r ${
              insights.engagementQuality.label === 'Excellent' ? 'from-green-500 to-emerald-500' :
              insights.engagementQuality.label === 'Very Good' ? 'from-blue-500 to-cyan-500' :
              insights.engagementQuality.label === 'Good' ? 'from-purple-500 to-pink-500' :
              insights.engagementQuality.label === 'Average' ? 'from-yellow-500 to-orange-500' :
              'from-gray-500 to-gray-600'
            } rounded-2xl shadow-xl p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {React.createElement(insights.engagementQuality.icon, { className: "w-12 h-12" })}
                  <div>
                    <h3 className="text-2xl font-bold">{insights.engagementQuality.label} Engagement</h3>
                    <p className="text-white/90">
                      This profile has {insights.engagementQuality.label.toLowerCase()} audience engagement metrics
                    </p>
                  </div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-5xl font-bold">{formatPercentage(metrics.engagement_rate)}%</div>
                  <div className="text-sm text-white/80">Engagement Rate</div>
                </div>
              </div>
            </div>

            {/* Main Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Engagement Rate */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-8 h-8" />
                  <h3 className="text-lg font-semibold">Engagement Rate</h3>
                </div>
                <div className="text-4xl font-bold mb-2">
                  {formatPercentage(metrics.engagement_rate)}%
                </div>
                <p className="text-purple-100 text-sm">
                  Based on {metrics.total_posts_analyzed} posts
                </p>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="text-xs text-purple-100">
                    Industry Average: 1-3%
                  </div>
                </div>
              </div>

              {/* Average Likes */}
              <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="w-8 h-8" />
                  <h3 className="text-lg font-semibold">Avg Likes</h3>
                </div>
                <div className="text-4xl font-bold mb-2">
                  {formatNumber(metrics.avg_likes)}
                </div>
                <p className="text-pink-100 text-sm">
                  Per post
                </p>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="text-xs text-pink-100">
                    {((metrics.avg_likes / profile.followers) * 100).toFixed(2)}% of followers
                  </div>
                </div>
              </div>

              {/* Average Comments */}
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="w-8 h-8" />
                  <h3 className="text-lg font-semibold">Avg Comments</h3>
                </div>
                <div className="text-4xl font-bold mb-2">
                  {formatNumber(metrics.avg_comments)}
                </div>
                <p className="text-blue-100 text-sm">
                  Per post
                </p>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="text-xs text-blue-100">
                    {metrics.avg_likes > 0 ? ((metrics.avg_comments / metrics.avg_likes) * 100).toFixed(1) : 0}% like-to-comment ratio
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Insights */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-purple-600" />
                Advanced Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Consistency Score */}
                <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Consistency Score</h4>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {insights.consistencyScore.toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {insights.consistencyScore >= 80 ? 'Very consistent engagement' :
                     insights.consistencyScore >= 60 ? 'Fairly consistent' :
                     insights.consistencyScore >= 40 ? 'Moderate variance' :
                     'High variance in performance'}
                  </p>
                </div>

                {/* Follower/Following Ratio */}
                <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">F/F Ratio</h4>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {profile.following > 0 ? (profile.followers / profile.following).toFixed(1) : '∞'}:1
                  </div>
                  <p className="text-sm text-gray-600">
                    {profile.followers > profile.following * 2 ? 'Strong follower base' :
                     profile.followers > profile.following ? 'Good ratio' :
                     'Growing account'}
                  </p>
                </div>

                {/* Post Types */}
                <div className="p-5 bg-gradient-to-br from-pink-50 to-red-50 rounded-xl border-2 border-pink-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5 text-pink-600" />
                    <h4 className="font-semibold text-gray-900">Content Mix</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">📷 Photos</span>
                      <span className="font-bold text-pink-600">{metrics.post_types?.photos || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">📹 Videos</span>
                      <span className="font-bold text-pink-600">{metrics.post_types?.videos || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Best Performing Post */}
                {metrics.best_post && (
                  <div className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-semibold text-gray-900">Best Post</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-gray-600">{formatNumber(metrics.best_post.likes)} likes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">{formatNumber(metrics.best_post.comments)} comments</span>
                      </div>
                      {metrics.best_post.url && (
                        <a
                          href={metrics.best_post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
                        >
                          View Post <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Engagement Per Follower */}
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Engagement/Follower</h4>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {(insights.followerEngagementRatio * 100).toFixed(2)}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {insights.followerEngagementRatio >= 0.03 ? 'Highly engaged audience' :
                     insights.followerEngagementRatio >= 0.01 ? 'Good engagement' :
                     'Room for improvement'}
                  </p>
                </div>

                {/* Comment Quality */}
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-semibold text-gray-900">Comment Quality</h4>
                  </div>
                  <div className="text-3xl font-bold text-indigo-600 mb-2">
                    {(insights.commentLikeRatio * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {insights.commentLikeRatio >= 0.05 ? 'High interaction' :
                     insights.commentLikeRatio >= 0.02 ? 'Good interaction' :
                     'Passive audience'}
                  </p>
                </div>

              </div>
            </div>

            {/* Recent Posts List */}
            {posts && posts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-7 h-7 text-purple-600" />
                    Recent Posts ({posts.length})
                  </h2>
                  <span className="text-sm text-gray-500">Last {posts.length} posts analyzed</span>
                </div>
                <div className="space-y-3">
                  {posts.map((post: any, index: number) => (
                    <a
                      key={post.shortcode || index}
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all group border-2 border-transparent hover:border-purple-200"
                    >
                      {/* Post Icon */}
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        {post.is_video ? (
                          <span className="text-2xl">📹</span>
                        ) : (
                          <span className="text-2xl">📷</span>
                        )}
                      </div>

                      {/* Post Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">Post {index + 1}</span>
                          {post.is_video && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              Video
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {post.caption && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {post.caption}
                          </p>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                            <span className="font-semibold text-gray-900">{formatNumber(post.likes)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                            <span className="font-semibold text-gray-900">{formatNumber(post.comments)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-purple-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-medium">
                              {(((post.likes + post.comments) / profile.followers) * 100).toFixed(2)}% ER
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View on Instagram */}
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-2 text-sm text-purple-600 font-medium group-hover:text-purple-700 transition-colors">
                          <span className="hidden sm:inline">View</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Summary */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-7 h-7" />
                Analysis Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Strengths</h4>
                  <ul className="space-y-2 text-white/90">
                    {metrics.engagement_rate >= 3 && (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>Strong engagement rate above industry average</span>
                      </li>
                    )}
                    {insights.consistencyScore >= 70 && (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>Consistent posting performance</span>
                      </li>
                    )}
                    {profile.followers > profile.following * 2 && (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>Excellent follower-to-following ratio</span>
                      </li>
                    )}
                    {insights.commentLikeRatio >= 0.03 && (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>High audience interaction with comments</span>
                      </li>
                    )}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Recommendations</h4>
                  <ul className="space-y-2 text-white/90">
                    {metrics.post_types?.videos === 0 && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>Try adding video content for better reach</span>
                      </li>
                    )}
                    {metrics.engagement_rate < 3 && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>Focus on increasing audience engagement</span>
                      </li>
                    )}
                    {insights.consistencyScore < 60 && (
                      <li className="flex items-start gap-2">
                        <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>Maintain consistent posting quality</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>Post during peak engagement hours</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* How It Works Section */}
        {!profile && !isLoading && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Enter Username</h3>
                <p className="text-sm text-gray-600">
                  Type any public Instagram username to analyze
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Analyze Profile</h3>
                <p className="text-sm text-gray-600">
                  We analyze 12 recent posts and calculate advanced metrics
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Get Insights</h3>
                <p className="text-sm text-gray-600">
                  View engagement rate, consistency score, and recommendations
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">✨ Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Engagement rate analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Consistency scoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Best post identification</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Content mix analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Follower tier classification</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Free & unlimited use</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}