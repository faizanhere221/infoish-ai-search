// src/app/register-influencer/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Link from 'next/link'
import { 
  User, Mail, Instagram, Youtube, Music, MessageSquare, 
  TrendingUp, CheckCircle, AlertCircle, Copy, Eye, EyeOff, LogIn, ArrowRight, Sparkles, DollarSign, Hash
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Image, Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
interface RegistrationForm {
  username: string
  full_name: string
  email: string
  bio: string
  category: string
  instagram_handle: string
  instagram_followers: number
  youtube_channel: string
  youtube_subscribers: number
  youtube_url: string
  video_count: number
  total_views: number
  tiktok_handle: string
  tiktok_followers: number
  profile_image_url: string
  engagement_rate: number
}

interface SuccessData {
  success: boolean
  message: string
  influencer: {
    id: string
    username: string
    full_name: string
    email: string
    category: string
    total_followers: number
    created_at: string
  }
  temporary_credentials: {
    email: string
    temporary_password: string
    message: string
  }
  email_sent: boolean
  next_step: {
    action: string
    url: string
    instruction: string
  }
}

export default function InfluencerRegistration() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)
  const [step, setStep] = useState(1)
  
  // State for success screen
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)


  const [profileImage, setProfileImage] = useState<File | null>(null)
const [profileImagePreview, setProfileImagePreview] = useState<string>('')
const [uploadingImage, setUploadingImage] = useState(false)

  
  const [formData, setFormData] = useState<RegistrationForm>({
    username: '',
    full_name: '',
    email: '',
    bio: '',
    category: '',
    instagram_handle: '',
    instagram_followers: 0,
    youtube_channel: '',
    youtube_subscribers: 0,
    youtube_url: '',
    video_count: 0,
    total_views: 0,
    tiktok_handle: '',
    tiktok_followers: 0,
    profile_image_url: '',
    engagement_rate: 0
  })

  const BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://infoish-ai-search-production.up.railway.app' 
    : 'http://127.0.0.1:8000'

  const categoryOptions = [
    'Beauty', 'Tech', 'Food', 'Gaming', 'Comedy', 'Travel', 'Fitness', 
    'Music', 'Lifestyle', 'Business', 'Education', 'News', 'Fashion', 'General'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('followers') || name.includes('subscribers') || name.includes('count') || name.includes('views') || name === 'engagement_rate'
        ? parseFloat(value) || 0
        : value
    }))
  }

  const getTotalFollowers = () => {
    return formData.instagram_followers + formData.youtube_subscribers + formData.tiktok_followers
  }

  const validateStep1 = () => {
    if (!formData.username.trim()) {
      setError('Username is required')
      return false
    }
    if (!formData.full_name.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Valid email is required')
      return false
    }
    if (!formData.category) {
      setError('Please select a category')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    const totalFollowers = getTotalFollowers()
    
    if (totalFollowers < 1000) {
      setError('Minimum 1,000 total followers required across all platforms')
      return false
    }
    
    if (!formData.instagram_handle && !formData.youtube_channel && !formData.tiktok_handle) {
      setError('At least one social media platform is required')
      return false
    }
    
    return true
  }

  const handleNextStep = () => {
    setError('')
    
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  console.log('🔵 1. Form submitted!')
  
  setError('')
  setLoading(true)
  console.log('🔵 2. Loading state set to true')

  try {
    // Final validation
    console.log('🔵 3. Starting validation...')
    if (!validateStep1()) {
      console.log('❌ Step 1 validation failed')
      setLoading(false)
      return
    }
    
    if (!validateStep2()) {
      console.log('❌ Step 2 validation failed')
      setLoading(false)
      return
    }

    console.log('✅ Validation passed')

    // 🆕 STEP 1: Upload profile image if selected
    let profileImageUrl = formData.profile_image_url || ''
    
    if (profileImage) {
      console.log('📸 Uploading profile image...')
      const uploadedUrl = await uploadProfileImage()
      
      if (uploadedUrl) {
        profileImageUrl = uploadedUrl
        console.log('✅ Profile image uploaded:', uploadedUrl)
      } else {
        console.log('⚠️ Image upload failed, continuing without image')
        // Continue registration even if image upload fails
      }
    }

    // Calculate total followers
    const totalFollowers = getTotalFollowers()
    console.log('🔵 4. Total followers:', totalFollowers)

    // Prepare data for API
    const registrationData = {
      username: formData.username.trim(),
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      bio: formData.bio.trim() || null,
      category: formData.category.toLowerCase(),
      instagram_handle: formData.instagram_handle.trim() || null,
      instagram_followers: formData.instagram_followers,
      youtube_channel: formData.youtube_channel.trim() || null,
      youtube_subscribers: formData.youtube_subscribers,
      youtube_url: formData.youtube_url.trim() || null,
      video_count: formData.video_count,
      total_views: formData.total_views,
      tiktok_handle: formData.tiktok_handle.trim() || null,
      tiktok_followers: formData.tiktok_followers,
      profile_image_url: profileImageUrl,  // 🆕 Use uploaded image URL
      engagement_rate: formData.engagement_rate || 0,
      source: 'self_registered',
      verified: false
    }

    console.log('🔵 5. Backend URL:', BACKEND_URL)
    console.log('🔵 6. Registration data:', registrationData)

    // Add timeout to prevent infinite loading
    console.log('🔵 7. Starting fetch request...')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout!')
      controller.abort()
    }, 30000) // 30 second timeout

    const response = await fetch(`${BACKEND_URL}/influencers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    console.log('🔵 8. Response received! Status:', response.status)

    const data = await response.json()
    console.log('🔵 9. Response data:', data)

    if (response.ok) {
      console.log('✅ Registration successful!')
      console.log('🔵 10. Setting success data:', data)
      
      // Store user type as influencer
      localStorage.setItem('user_type', 'influencer')
      console.log('✅ User type set to: influencer')
      
      // Store auth token if provided by backend
      if (data.token) {
        localStorage.setItem('auth_token', data.token)
        console.log('✅ Auth token stored:', data.token)
      }
      
      // Store user data if provided by backend
      if (data.user || data.influencer) {
        localStorage.setItem('user_data', JSON.stringify(data.user || data.influencer))
        console.log('✅ User data stored')
      }
      
      // Set both success flag AND successData
      setSuccess(true)
      setSuccessData(data)
      
    } else {
      console.error('❌ Registration failed:', data)
      setError(data.detail || data.message || 'Registration failed. Please try again.')
    }
  } catch (err) {
    console.error('💥 Error caught:', err)
    
    if (err instanceof Error) {
      console.error('Error name:', err.name)
      console.error('Error message:', err.message)
      
      if (err.name === 'AbortError') {
        setError('Request timeout. Server took too long to respond. Please try again.')
      } else {
        setError(`Network error: ${err.message}`)
      }
    } else {
      setError('Unknown error occurred. Please check your connection and try again.')
    }
  } finally {
    console.log('🔵 11. Finally block - setting loading to false')
    setLoading(false)
  }
}



// Handle image selection
const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file (PNG, JPG, etc.)')
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size should be less than 5MB')
    return
  }

  setProfileImage(file)
  
  // Create preview
  const reader = new FileReader()
  reader.onloadend = () => {
    setProfileImagePreview(reader.result as string)
  }
  reader.readAsDataURL(file)
}

// Upload image to Supabase Storage
const uploadProfileImage = async (): Promise<string | null> => {
  if (!profileImage) return null

  try {
    setUploadingImage(true)
    console.log('📸 Uploading profile image...')
    
    // Generate unique filename
    const fileExt = profileImage.name.split('.').pop()
    const fileName = `${formData.username}_${Date.now()}.${fileExt}`
    const filePath = `profiles/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('influencer-profiles')
      .upload(filePath, profileImage, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Upload error:', error)
      alert('Image upload failed. Please try again.')
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('influencer-profiles')
      .getPublicUrl(filePath)

    console.log('✅ Image uploaded successfully:', publicUrl)
    return publicUrl

  } catch (error) {
    console.error('❌ Image upload error:', error)
    alert('Failed to upload image. Please try again.')
    return null
  } finally {
    setUploadingImage(false)
  }
}

// Remove selected image
const removeImage = () => {
  setProfileImage(null)
  setProfileImagePreview('')
  setFormData({
    ...formData,
    profile_image_url: ''
  })
}



  
  // ✅ SUCCESS SCREEN - Now will display properly!
// ✅ CLEAN SUCCESS SCREEN - Replace your entire success screen section
  if (success && successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        {/* Simple Logo Header */}
        <div className="absolute top-4 left-4">
          <Link href="/">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent cursor-pointer">
              Infoish
            </div>
          </Link>
        </div>

        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎉 Welcome to InfoIshai!
            </h1>
            <p className="text-xl text-gray-700 mb-2">
              Hi <span className="font-bold">{successData.influencer?.full_name}</span>! 
            </p>
            <p className="text-gray-600">
              Your influencer profile is ready. Let's get you started!
            </p>
          </div>

          {/* Credentials Section - Only show if available */}
          {successData.temporary_credentials && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Your Login Credentials</h3>
                  <p className="text-sm text-gray-600">
                    {successData.email_sent 
                      ? "Also sent to your email" 
                      : "Save these - you'll need them to login"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 bg-white rounded-xl p-4 mb-3">
                {/* Email */}
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold">Email</label>
                  <div className="flex items-center justify-between mt-1 gap-3">
                    <span className="font-semibold text-gray-900 break-all">
                      {successData.temporary_credentials.email}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(successData.temporary_credentials.email)
                        toast.success('Email copied!')
                      }}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>
                
                {/* Password */}
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold">Password</label>
                  <div className="flex items-center justify-between mt-1 gap-3">
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-2 rounded break-all">
                      {successData.temporary_credentials.temporary_password}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(successData.temporary_credentials.temporary_password)
                        toast.success('Password copied!')
                      }}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              
              {!successData.email_sent && (
                <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Important:</strong> Save this password now! You can change it later in your dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Start Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Quick Start Guide
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  1
                </div>
                <p className="text-sm text-gray-700 pt-1">
                  <strong className="text-gray-900">Complete your profile</strong> - Add photo, bio & contact info
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  2
                </div>
                <p className="text-sm text-gray-700 pt-1">
                  <strong className="text-gray-900">Link social media</strong> - Connect Instagram, YouTube, TikTok
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  3
                </div>
                <p className="text-sm text-gray-700 pt-1">
                  <strong className="text-gray-900">Get discovered</strong> - Brands will find you in search results
                </p>
              </div>
            </div>
          </div>

          {/* Main CTA */}
          <button
            onClick={() => {
              console.log('🎯 Navigating to influencer dashboard...')
              console.log('✅ User type:', localStorage.getItem('user_type'))
              router.push('/influencer/dashboard')
            }}
            className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 mb-4"
          >
            <TrendingUp className="w-6 h-6" />
            Go to My Dashboard
            <ArrowRight className="w-6 h-6" />
          </button>

          {/* Secondary Action */}
          <p className="text-center text-sm text-gray-500">
            Need help? <a href="/contact" className="text-purple-600 hover:text-purple-700 font-medium">Contact Support</a>
          </p>
        </div>
      </div>
    )
  }











  // REGISTRATION FORM (Steps 1-3)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Register as an Influencer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join Pakistan's leading influencer discovery platform. Get discovered by brands looking for creators like you.
          </p>
          <div className="flex items-center justify-center gap-8 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Free Registration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Instant Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Get Discovered</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium hidden sm:inline">Basic Info</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-3 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium hidden sm:inline">Social Media</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-3 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-medium hidden sm:inline">Review</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}





















        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
          
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Step 1: Basic Information</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username * <span className="text-gray-500 font-normal">(will be your unique identifier)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="e.g., tech_reviewer_pk"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  required
                >
                  <option value="">Select your category</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell brands about yourself and your content..."
                    rows={4}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Profile Image <span className="text-gray-500 font-normal">(optional)</span>
  </label>
  
  {/* Image Preview */}
  {profileImagePreview && (
    <div className="mb-4 relative inline-block">
      <img 
        src={profileImagePreview} 
        alt="Profile preview" 
        className="w-32 h-32 rounded-full object-cover border-4 border-purple-200 shadow-lg"
      />
      <button
        type="button"
        onClick={removeImage}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all shadow-lg"
        title="Remove image"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )}
  
  {/* Upload Options */}
  <div className="grid md:grid-cols-2 gap-4">
    {/* File Upload */}
    <div>
      <label className="cursor-pointer">
        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-500 transition-all bg-gray-50 hover:bg-purple-50">
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">
              {profileImage ? profileImage.name : 'Upload from computer'}
            </span>
            <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
          </div>
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleImageSelect}
            className="hidden"
            disabled={loading || uploadingImage}
          />
        </div>
      </label>
    </div>
    
    {/* URL Input */}
    <div>
      <label className="block text-xs text-gray-500 mb-2">Or paste image URL:</label>
      <div className="relative">
        <Image className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        <input
          type="url"
          name="profile_image_url"
          value={formData.profile_image_url}
          onChange={handleInputChange}
          placeholder="https://example.com/image.jpg"
          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!!profileImage || loading || uploadingImage}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {profileImage ? 'Remove uploaded image to use URL' : 'Direct link to your photo'}
      </p>
    </div>
  </div>
  
  {/* Upload Status */}
  {uploadingImage && (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
      <span className="text-sm text-blue-700 font-medium">Uploading image...</span>
    </div>
  )}
</div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                Next: Social Media Details →
              </button>
            </div>
          )}

          {/* STEP 2: Social Media */}
          {step === 2 && (
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Step 2: Social Media Platforms</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 font-medium">
                  ⚠️ Minimum 1,000 total followers required across all platforms
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  Current total: <span className="font-bold">{getTotalFollowers().toLocaleString()}</span> followers
                </p>
              </div>

              {/* Instagram */}
              <div className="border-2 border-pink-200 rounded-lg p-6 bg-pink-50">
                <div className="flex items-center gap-3 mb-4">
                  <Instagram className="w-6 h-6 text-pink-600" />
                  <h4 className="text-lg font-bold text-gray-900">Instagram</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram Handle</label>
                    <input
                      type="text"
                      name="instagram_handle"
                      value={formData.instagram_handle}
                      onChange={handleInputChange}
                      placeholder="@yourhandle"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Followers</label>
                    <input
                      type="number"
                      name="instagram_followers"
                      value={formData.instagram_followers || ''}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* YouTube */}
              <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                <div className="flex items-center gap-3 mb-4">
                  <Youtube className="w-6 h-6 text-red-600" />
                  <h4 className="text-lg font-bold text-gray-900">YouTube</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Channel Name</label>
                    <input
                      type="text"
                      name="youtube_channel"
                      value={formData.youtube_channel}
                      onChange={handleInputChange}
                      placeholder="Your Channel Name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Channel URL</label>
                    <input
                      type="url"
                      name="youtube_url"
                      value={formData.youtube_url}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/@yourchannel"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subscribers</label>
                      <input
                        type="number"
                        name="youtube_subscribers"
                        value={formData.youtube_subscribers || ''}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Video Count</label>
                      <input
                        type="number"
                        name="video_count"
                        value={formData.video_count || ''}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Views</label>
                    <input
                      type="number"
                      name="total_views"
                      value={formData.total_views || ''}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* TikTok */}
              <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <Music className="w-6 h-6 text-gray-800" />
                  <h4 className="text-lg font-bold text-gray-900">TikTok</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">TikTok Handle</label>
                    <input
                      type="text"
                      name="tiktok_handle"
                      value={formData.tiktok_handle}
                      onChange={handleInputChange}
                      placeholder="@yourhandle"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Followers</label>
                    <input
                      type="number"
                      name="tiktok_followers"
                      value={formData.tiktok_followers || ''}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Engagement Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Engagement Rate (%) <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="engagement_rate"
                    value={formData.engagement_rate || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 3.5"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 rounded-lg font-semibold transition-all"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={getTotalFollowers() < 1000}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg disabled:cursor-not-allowed"
                >
                  Next: Review →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Step 3: Review Your Information</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="font-bold text-gray-900">@{formData.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-bold text-gray-900">{formData.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-bold text-gray-900">{formData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-bold text-gray-900 capitalize">{formData.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Followers</p>
                  <p className="font-bold text-blue-600 text-2xl">{getTotalFollowers().toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-bold text-green-900 mb-3">What happens next?</h4>
                <ul className="space-y-2 text-green-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Your profile will be created instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>You'll appear in search results within 24 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>Brands can discover and contact you directly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>You can manage your profile anytime from your dashboard</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 rounded-lg font-semibold transition-all"
                >
                  ← Back
                </button>
             <button
  type="submit"
  disabled={loading || uploadingImage}
  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
>
  {uploadingImage ? (
    <>
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
      Uploading Image...
    </>
  ) : loading ? (
    <>
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
      Registering...
    </>
  ) : (
    <>
      Register Now
      <ArrowRight className="w-5 h-5" />
    </>
  )}
</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}