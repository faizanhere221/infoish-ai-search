'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import InfluencerHeader from '@/components/influencer-header'
import { 
  Instagram, 
  Youtube, 
  TrendingUp, 
  Users, 
  Eye,
  Edit,
  Save,
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
  Mail,
  MapPin,
  Calendar,
  Award,
  Link as LinkIcon,
  ChevronRight,
  BarChart3,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react'

// Keep existing imports
import { supabase } from '@/lib/supabase'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

interface InfluencerProfile {
  id: string
  username: string
  full_name: string
  email: string
  bio?: string
  category?: string
  profile_image_url?: string
  instagram_handle?: string
  instagram_followers?: number
  youtube_channel?: string
  youtube_subscribers?: number
  youtube_url?: string
  tiktok_handle?: string
  tiktok_followers?: number
  total_followers?: number
  engagement_rate?: number
  verified: boolean
  created_at: string
  updated_at?: string
}

export default function InfluencerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<InfluencerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<InfluencerProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageHover, setImageHover] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchProfile()
  }, [])

  const checkAuth = () => {
    const authToken = localStorage.getItem('auth_token')
    const userType = localStorage.getItem('user_type')

    if (!authToken) {
      router.push('/influencer/login')
      return
    }

    if (userType !== 'influencer') {
      router.push('/')
      return
    }
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const authToken = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')

      if (!authToken) {
        router.push('/influencer/login')
        return
      }

      if (userData) {
        const parsedData = JSON.parse(userData)
        setProfile(parsedData)
        setEditedProfile(parsedData)
        setImagePreview(parsedData.profile_image_url || '')
      }

      const response = await fetch(`${BACKEND_URL}/influencers/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const profileData = data.influencer || data.profile || data
        
        setProfile(profileData)
        setEditedProfile(profileData)
        setImagePreview(profileData.profile_image_url || '')
        
        localStorage.setItem('user_data', JSON.stringify(profileData))
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        router.push('/influencer/login')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedProfile) return
    
    const { name, value } = e.target
    setEditedProfile({
      ...editedProfile,
      [name]: name.includes('followers') || name.includes('subscribers') 
        ? parseInt(value) || 0 
        : value
    })
  }

  // Handle image file selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    try {
      setUploadingImage(true)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      const fileExt = file.name.split('.').pop()
      const fileName = `${profile?.username}_${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('influencer-profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload image')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('influencer-profiles')
        .getPublicUrl(filePath)

      console.log('✅ Image uploaded:', publicUrl)

      if (editedProfile) {
        setEditedProfile({
          ...editedProfile,
          profile_image_url: publicUrl
        })
      }

      await saveProfileImage(publicUrl)

    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  // Save profile image immediately
  const saveProfileImage = async (imageUrl: string) => {
    try {
      const authToken = localStorage.getItem('auth_token')
      
      const response = await fetch(`${BACKEND_URL}/influencers/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile_image_url: imageUrl
        })
      })

      if (response.ok) {
        const data = await response.json()
        const profileData = data.influencer || data.profile || data
        
        setProfile(profileData)
        localStorage.setItem('user_data', JSON.stringify(profileData))
        
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        
        window.dispatchEvent(new Event('profileUpdated'))
      }
    } catch (error) {
      console.error('Failed to save image:', error)
    }
  }

  const handleSave = async () => {
    if (!editedProfile) return

    try {
      setSaving(true)
      setError('')
      
      const authToken = localStorage.getItem('auth_token')

      const response = await fetch(`${BACKEND_URL}/influencers/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: editedProfile.full_name,
          bio: editedProfile.bio,
          category: editedProfile.category,
          profile_image_url: editedProfile.profile_image_url,
          instagram_handle: editedProfile.instagram_handle,
          instagram_followers: editedProfile.instagram_followers,
          youtube_channel: editedProfile.youtube_channel,
          youtube_subscribers: editedProfile.youtube_subscribers,
          youtube_url: editedProfile.youtube_url,
          tiktok_handle: editedProfile.tiktok_handle,
          tiktok_followers: editedProfile.tiktok_followers,
          engagement_rate: editedProfile.engagement_rate
        })
      })

      if (response.ok) {
        const data = await response.json()
        const profileData = data.influencer || data.profile || data
        
        setProfile(profileData)
        setEditedProfile(profileData)
        
        localStorage.setItem('user_data', JSON.stringify(profileData))
        
        setSaveSuccess(true)
        setIsEditing(false)
        
        window.dispatchEvent(new Event('profileUpdated'))
        
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || errorData.message || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to update profile. Please check your connection.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setImagePreview(profile?.profile_image_url || '')
    setIsEditing(false)
    setError('')
  }

  // Helper functions
  const formatNumber = (num: number | undefined) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getEngagementLevel = (rate: number) => {
    if (rate >= 5) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' }
    if (rate >= 3) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (rate >= 1) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: JSX.Element } = {
      'tech': <BarChart3 className="w-5 h-5" />,
      'fashion': <Award className="w-5 h-5" />,
      'food': <Users className="w-5 h-5" />,
      'travel': <MapPin className="w-5 h-5" />,
      'fitness': <TrendingUp className="w-5 h-5" />,
    }
    return icons[category?.toLowerCase()] || <Eye className="w-5 h-5" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
        <InfluencerHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-ping"></div>
              <div className="relative w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Your Profile</h3>
            <p className="text-gray-600">Please wait while we fetch your data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
        <InfluencerHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center bg-white rounded-3xl shadow-2xl p-12 max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Profile Not Found</h3>
            <p className="text-gray-600 mb-6">We couldn't load your profile data.</p>
            <button
              onClick={() => router.push('/influencer/login')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  const engagementLevel = getEngagementLevel(profile.engagement_rate || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
      <InfluencerHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-green-800 font-semibold">Profile Updated!</p>
              <p className="text-green-600 text-sm">Your changes have been saved successfully.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          {/* Banner */}
          <div className="h-40 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-4 right-4">
              {profile.verified && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg text-white rounded-full text-sm font-semibold border border-white/30">
                  <CheckCircle className="w-4 h-4" />
                  Verified Creator
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-20">
              
              {/* Profile Picture */}
              <div 
                className="relative group"
                onMouseEnter={() => setImageHover(true)}
                onMouseLeave={() => setImageHover(false)}
              >
                {imagePreview || profile.profile_image_url ? (
                  <img
                    src={imagePreview || profile.profile_image_url}
                    alt={profile.full_name}
                    className="w-40 h-40 rounded-3xl object-cover border-8 border-white shadow-2xl transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center border-8 border-white shadow-2xl">
                    <Users className="w-20 h-20 text-white" />
                  </div>
                )}
                
                {/* Upload Overlay */}
                {(isEditing || imageHover) && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl cursor-pointer transition-opacity duration-300">
                    {uploadingImage ? (
                      <Loader className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <div className="text-center text-white">
                        <Camera className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Change Photo</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 mt-4 md:mt-0">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="full_name"
                      value={editedProfile?.full_name || ''}
                      onChange={handleInputChange}
                      className="text-3xl font-bold text-gray-900 border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all w-full"
                    />
                    <textarea
                      name="bio"
                      value={editedProfile?.bio || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full text-gray-600 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      {profile.full_name}
                    </h1>
                    <p className="text-xl text-purple-600 mb-3 font-semibold">
                      @{profile.username}
                    </p>
                    <p className="text-gray-600 mb-4 leading-relaxed max-w-2xl">
                      {profile.bio || 'No bio added yet. Click edit to add your story!'}
                    </p>
                  </>
                )}
                
                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700">{profile.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-xl">
                    {getCategoryIcon(profile.category || '')}
                    <span className="text-sm text-gray-700 capitalize font-medium">
                      {profile.category || 'General'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Update Tip */}
        <div className="mb-8 text-center">
          <div className="inline-block bg-white rounded-2xl shadow-lg px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Keep Your Profile Updated!</p>
                <p className="text-sm text-gray-600">Accurate stats help brands find and connect with you.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Total Followers */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Reach</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(profile.total_followers || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Across all platforms</p>
          </div>

          {/* Engagement Rate */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${engagementLevel.bg} rounded-xl shadow-lg`}>
                <Heart className={`w-6 h-6 ${engagementLevel.color}`} />
              </div>
              <span className={`px-3 py-1 ${engagementLevel.bg} ${engagementLevel.color} rounded-full text-xs font-semibold`}>
                {engagementLevel.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Engagement Rate</p>
            <p className="text-3xl font-bold text-gray-900">
              {(profile.engagement_rate || 0).toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Average interaction rate</p>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                {getCategoryIcon(profile.category || '')}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Content Category</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {profile.category || 'General'}
            </p>
            {isEditing && (
              <select
                name="category"
                value={editedProfile?.category || ''}
                onChange={handleInputChange}
                className="mt-2 w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-purple-500 outline-none"
              >
                <option value="tech">Tech</option>
                <option value="fashion">Fashion</option>
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                <option value="fitness">Fitness</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="gaming">Gaming</option>
                <option value="beauty">Beauty</option>
                <option value="business">Business</option>
              </select>
            )}
          </div>

          {/* Platforms Active */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Active Platforms</p>
            <p className="text-3xl font-bold text-gray-900">
              {[profile.instagram_handle, profile.youtube_channel, profile.tiktok_handle].filter(Boolean).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">Connected social accounts</p>
          </div>
        </div>

        {/* Social Media Platforms */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Instagram Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="h-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                    <Instagram className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Instagram</h3>
                </div>
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Handle</label>
                    <input
                      type="text"
                      name="instagram_handle"
                      value={editedProfile?.instagram_handle || ''}
                      onChange={handleInputChange}
                      placeholder="@username"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Followers</label>
                    <input
                      type="number"
                      name="instagram_followers"
                      value={editedProfile?.instagram_followers || 0}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {profile.instagram_handle ? (
                    <>
                      <a
                        href={`https://instagram.com/${profile.instagram_handle?.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-lg font-semibold text-purple-600 hover:text-purple-700 mb-4 group"
                      >
                        <span>{profile.instagram_handle}</span>
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </a>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Followers</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {formatNumber(profile.instagram_followers || 0)}
                            </p>
                          </div>
                          <Users className="w-12 h-12 text-purple-300" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Instagram className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">Not connected</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 text-purple-600 hover:text-purple-700 font-semibold text-sm"
                      >
                        Add Instagram Account
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* YouTube Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="h-3 bg-gradient-to-r from-red-500 to-red-600"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                    <Youtube className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">YouTube</h3>
                </div>
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Channel Name</label>
                    <input
                      type="text"
                      name="youtube_channel"
                      value={editedProfile?.youtube_channel || ''}
                      onChange={handleInputChange}
                      placeholder="Channel name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Channel URL</label>
                    <input
                      type="url"
                      name="youtube_url"
                      value={editedProfile?.youtube_url || ''}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/@channel"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subscribers</label>
                    <input
                      type="number"
                      name="youtube_subscribers"
                      value={editedProfile?.youtube_subscribers || 0}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {profile.youtube_channel ? (
                    <>
                      <a
                        href={profile.youtube_url || `https://youtube.com/@${profile.youtube_channel}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-lg font-semibold text-red-600 hover:text-red-700 mb-4 group"
                      >
                        <span>{profile.youtube_channel}</span>
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </a>
                      
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Subscribers</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {formatNumber(profile.youtube_subscribers || 0)}
                            </p>
                          </div>
                          <Youtube className="w-12 h-12 text-red-300" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Youtube className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">Not connected</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        Add YouTube Channel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* TikTok Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="h-3 bg-gradient-to-r from-gray-900 via-pink-500 to-cyan-500"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">TikTok</h3>
                </div>
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Handle</label>
                    <input
                      type="text"
                      name="tiktok_handle"
                      value={editedProfile?.tiktok_handle || ''}
                      onChange={handleInputChange}
                      placeholder="@username"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-2 focus:ring-gray-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Followers</label>
                    <input
                      type="number"
                      name="tiktok_followers"
                      value={editedProfile?.tiktok_followers || 0}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-2 focus:ring-gray-200 outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {profile.tiktok_handle ? (
                    <>
                      <a
                        href={`https://tiktok.com/@${profile.tiktok_handle?.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 mb-4 group"
                      >
                        <span>{profile.tiktok_handle}</span>
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </a>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Followers</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {formatNumber(profile.tiktok_followers || 0)}
                            </p>
                          </div>
                          <TrendingUp className="w-12 h-12 text-gray-300" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">Not connected</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 text-gray-900 hover:text-gray-700 font-semibold text-sm"
                      >
                        Add TikTok Account
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white rounded-2xl shadow-lg px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Keep Your Profile Updated!</p>
                <p className="text-sm text-gray-600">Accurate stats help brands find and connect with you.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}