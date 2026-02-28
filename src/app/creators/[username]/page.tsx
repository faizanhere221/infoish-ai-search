'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Star,
  CheckCircle,
  Clock,
  MessageSquare,
  Briefcase,
  Users,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  Mail,
  Mic,
  Music2,
  Edit
} from 'lucide-react'

interface CreatorProfile {
  id: string
  user_id: string
  username: string
  display_name: string
  bio: string | null
  profile_photo_url: string | null
  country: string | null
  city: string | null
  niches: string[]
  languages: string[]
  verification_status: string
  total_followers: number
  completed_deals: number
  total_reviews: number
  avg_rating: number | null
  is_available: boolean
  min_budget: number | null
  response_time: string | null
  created_at: string
  creator_platforms: Platform[]
  creator_services: Service[]
}

interface Platform {
  id: string
  platform: string
  platform_username: string | null
  platform_url: string | null
  followers: number
}

interface Service {
  id: string
  title: string
  description: string | null
  content_type: string
  platform: string
  price: number
  delivery_days: number
  revisions_included: number
  is_active: boolean
}

const PLATFORM_ICONS: Record<string, any> = {
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  github: Github,
  newsletter: Mail,
  podcast: Mic,
  tiktok: Music2,
}

const PLATFORM_NAMES: Record<string, string> = {
  twitter: 'Twitter/X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  newsletter: 'Newsletter',
  podcast: 'Podcast',
  tiktok: 'TikTok',
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
  DE: 'Germany',
  NL: 'Netherlands',
  IN: 'India',
  PK: 'Pakistan',
  SG: 'Singapore',
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  de: 'German',
  fr: 'French',
  pt: 'Portuguese',
  hi: 'Hindi',
  ur: 'Urdu',
  zh: 'Chinese',
  ja: 'Japanese',
  ar: 'Arabic',
}

export default function CreatorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'reviews'>('services')
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [contacting, setContacting] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)
  const [brandProfile, setBrandProfile] = useState<any>(null)

  useEffect(() => {
    if (username) {
      fetchCreator()
      checkIfOwnProfile()
    }
  }, [username])

  const checkIfOwnProfile = () => {
    try {
      const userStr = localStorage.getItem('auth_user')
      const profileStr = localStorage.getItem('auth_profile')
      
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserType(user.user_type)
      }
      
      if (profileStr) {
        const profile = JSON.parse(profileStr)
        if (profile.username === username) {
          setIsOwnProfile(true)
        }
        // If brand, store brand profile for messaging
        if (profile.company_name) {
          setBrandProfile(profile)
        }
      }
    } catch (err) {
      console.error('Error checking profile:', err)
    }
  }

  const handleContactCreator = async () => {
    if (!brandProfile || !creator) {
      // Not logged in as brand
      router.push('/login?redirect=' + encodeURIComponent(`/creators/${username}`))
      return
    }

    setContacting(true)
    try {
      // Create or get conversation
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_id: creator.id,
          brand_id: brandProfile.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/messages/${data.conversation.id}`)
      } else {
        console.error('Failed to create conversation')
        alert('Failed to start conversation. Please try again.')
      }
    } catch (err) {
      console.error('Error contacting creator:', err)
      alert('Failed to start conversation. Please try again.')
    }
    setContacting(false)
  }

  const handleBack = () => {
    if (isOwnProfile) {
      router.push('/dashboard/creator')
    } else {
      router.push('/creators')
    }
  }

  useEffect(() => {
    if (username) {
      fetchCreator()
    }
  }, [username])

  const fetchCreator = async () => {
    try {
      const res = await fetch(`/api/creators/${username}`)
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Creator not found')
        } else {
          setError('Failed to load creator profile')
        }
        setLoading(false)
        return
      }

      const data = await res.json()
      setCreator(data.creator)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching creator:', err)
      setError('Failed to load creator profile')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">{error || 'Creator not found'}</h2>
          <Link 
            href="/creators" 
            className="mt-4 inline-block px-6 py-2 bg-violet-600 text-white rounded-lg"
          >
            Browse Creators
          </Link>
        </div>
      </div>
    )
  }

  const activeServices = creator.creator_services?.filter(s => s.is_active) || []
  const platforms = creator.creator_platforms || []
  const minPrice = activeServices.length > 0 
    ? Math.min(...activeServices.map(s => s.price))
    : null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatFollowers = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getResponseTimeText = (time: string | null): string => {
    if (!time) return 'N/A'
    const map: Record<string, string> = {
      'within_1_hour': 'Within 1 hour',
      'within_24_hours': 'Within 24 hours',
      'within_48_hours': 'Within 48 hours',
      'within_week': 'Within a week',
    }
    return map[time] || time
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{isOwnProfile ? 'Back to Dashboard' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-4">
              {isOwnProfile && (
                <Link 
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-violet-600 hover:bg-violet-50 rounded-lg font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Link>
              )}
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Infoishai</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {creator.profile_photo_url ? (
                    <img 
                      src={creator.profile_photo_url} 
                      alt={creator.display_name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                      {creator.display_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">{creator.display_name}</h1>
                        {creator.verification_status === 'verified' && (
                          <CheckCircle className="w-6 h-6 text-blue-500" />
                        )}
                      </div>
                      <p className="text-gray-500">@{creator.username}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {creator.verification_status === 'verified' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Verified Creator
                      </span>
                    )}
                    {creator.is_available && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        Available for work
                      </span>
                    )}
                  </div>

                  {/* Location & Join Date */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    {(creator.city || creator.country) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {[creator.city, creator.country ? COUNTRY_NAMES[creator.country] || creator.country : null].filter(Boolean).join(', ')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {formatDate(creator.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatFollowers(creator.total_followers)}</p>
                  <p className="text-sm text-gray-500">Total Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {creator.avg_rating ? creator.avg_rating.toFixed(1) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">{creator.total_reviews} reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{creator.completed_deals}</p>
                  <p className="text-sm text-gray-500">Completed Deals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {getResponseTimeText(creator.response_time).split(' ')[1] || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">Response Time</p>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
              {creator.bio ? (
                <p className="text-gray-600 whitespace-pre-wrap">{creator.bio}</p>
              ) : (
                <p className="text-gray-400 italic">No bio provided</p>
              )}

              {/* Niches */}
              {creator.niches && creator.niches.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Specializes in:</h3>
                  <div className="flex flex-wrap gap-2">
                    {creator.niches.map((niche) => (
                      <span 
                        key={niche}
                        className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium"
                      >
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {creator.languages && creator.languages.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Languages:</h3>
                  <div className="flex flex-wrap gap-2">
                    {creator.languages.map((lang) => (
                      <span 
                        key={lang}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {LANGUAGE_NAMES[lang] || lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('services')}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
                    activeTab === 'services'
                      ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Services ({activeServices.length})
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
                    activeTab === 'portfolio'
                      ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Portfolio (0)
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
                    activeTab === 'reviews'
                      ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Reviews ({creator.total_reviews})
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'services' && (
                  <div className="space-y-4">
                    {activeServices.length > 0 ? (
                      activeServices.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
                        <p className="mt-2 text-gray-500">No services listed yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'portfolio' && (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-gray-500">No portfolio items yet</p>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-gray-500">No reviews yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              {minPrice && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Starting at</p>
                  <p className="text-3xl font-bold text-gray-900">${minPrice.toLocaleString()}</p>
                </div>
              )}

              <button 
                onClick={handleContactCreator}
                disabled={contacting || isOwnProfile}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {contacting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting chat...
                  </>
                ) : isOwnProfile ? (
                  <>
                    <Edit className="w-5 h-5" />
                    Edit Profile
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    {userType === 'brand' ? 'Contact Creator' : 'Sign in as Brand'}
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-3">
                Usually responds {getResponseTimeText(creator.response_time).toLowerCase()}
              </p>
            </div>

            {/* Platforms */}
            {platforms.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Platforms</h3>
                <div className="space-y-3">
                  {platforms.map((platform) => {
                    const Icon = PLATFORM_ICONS[platform.platform] || Users
                    return (
                      <div key={platform.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {platform.platform_username || PLATFORM_NAMES[platform.platform] || platform.platform}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatFollowers(platform.followers)} followers
                            </p>
                          </div>
                        </div>
                        {platform.platform_url && (
                          <a 
                            href={platform.platform_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-violet-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Service Card Component
function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="p-4 border border-gray-200 rounded-xl hover:border-violet-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{service.title}</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {PLATFORM_NAMES[service.platform] || service.platform}
            </span>
          </div>
          {service.description && (
            <p className="text-sm text-gray-600 mt-2">{service.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {service.delivery_days} days delivery
            </span>
            <span>{service.revisions_included} revision{service.revisions_included !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-xl font-bold text-gray-900">${service.price.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}