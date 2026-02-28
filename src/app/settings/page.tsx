'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Bell, 
  CreditCard, 
  Shield, 
  Briefcase,
  LogOut,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Sparkles,
  DollarSign,
  ExternalLink
} from 'lucide-react'
import { NICHES, PLATFORMS, COUNTRIES, LANGUAGES, SERVICE_TYPES } from '@/utils/constants'

type SettingsTab = 'profile' | 'services' | 'platforms' | 'notifications' | 'payments' | 'security'

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
  is_available: boolean
  min_budget: number | null
  response_time: string | null
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
}

interface Platform {
  id?: string
  platform: string
  platform_username: string | null
  platform_url: string | null
  followers: number
}

interface Service {
  id?: string
  title: string
  description: string | null
  content_type: string
  platform: string
  price: number
  delivery_days: number
  revisions_included: number
  is_active: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [userEmail, setUserEmail] = useState('')

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'services' as SettingsTab, label: 'Services & Rates', icon: DollarSign },
    { id: 'platforms' as SettingsTab, label: 'Platforms', icon: Briefcase },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'payments' as SettingsTab, label: 'Payments', icon: CreditCard },
    { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const userStr = localStorage.getItem('auth_user')
      const profileStr = localStorage.getItem('auth_profile')
      
      if (!userStr) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userStr)
      setUserEmail(user.email)

      if (profileStr) {
        const savedProfile = JSON.parse(profileStr)
        setProfile(savedProfile)
        
        // Fetch platforms and services
        const res = await fetch(`/api/creators/${savedProfile.id}`)
        if (res.ok) {
          const data = await res.json()
          setPlatforms(data.creator.creator_platforms || [])
          setServices(data.creator.creator_services || [])
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load settings')
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    
    setSaving(true)
    setError(null)

    try {
      // Update profile
      const profileRes = await fetch(`/api/creators/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (!profileRes.ok) {
        const errorData = await profileRes.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      // Update platforms
      const platformsRes = await fetch(`/api/creators/${profile.id}/platforms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms }),
      })

      if (!platformsRes.ok) {
        console.error('Failed to update platforms')
      }

      // Update services
      const servicesRes = await fetch(`/api/creators/${profile.id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services }),
      })

      if (!servicesRes.ok) {
        const errorData = await servicesRes.json()
        console.error('Failed to update services:', errorData)
      }

      // Update localStorage
      localStorage.setItem('auth_profile', JSON.stringify(profile))

      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_profile')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold">Profile not found</h2>
          <Link href="/login" className="mt-4 inline-block text-violet-600">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/creator" 
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg font-medium hover:from-violet-700 hover:to-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-violet-50 text-violet-700 border-l-2 border-violet-600'
                        : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
              <div className="border-t border-gray-200">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {activeTab === 'profile' && (
                <ProfileSettings 
                  profile={profile} 
                  setProfile={setProfile}
                  userEmail={userEmail}
                />
              )}
              {activeTab === 'services' && (
                <ServicesSettings 
                  services={services}
                  setServices={setServices}
                  platforms={platforms}
                />
              )}
              {activeTab === 'platforms' && (
                <PlatformsSettings 
                  platforms={platforms}
                  setPlatforms={setPlatforms}
                />
              )}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'payments' && <PaymentSettings profile={profile} />}
              {activeTab === 'security' && <SecuritySettings />}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PROFILE SETTINGS
// ============================================================================
function ProfileSettings({ 
  profile, 
  setProfile,
  userEmail
}: { 
  profile: CreatorProfile
  setProfile: (p: CreatorProfile) => void
  userEmail: string
}) {
  const updateProfile = (field: keyof CreatorProfile, value: any) => {
    setProfile({ ...profile, [field]: value })
  }

  const toggleNiche = (niche: string) => {
    const niches = profile.niches || []
    if (niches.includes(niche)) {
      updateProfile('niches', niches.filter(n => n !== niche))
    } else if (niches.length < 5) {
      updateProfile('niches', [...niches, niche])
    }
  }

  const toggleLanguage = (lang: string) => {
    const languages = profile.languages || []
    if (languages.includes(lang)) {
      updateProfile('languages', languages.filter(l => l !== lang))
    } else {
      updateProfile('languages', [...languages, lang])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Update your personal information and public profile.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
          {profile.display_name?.charAt(0) || 'U'}
        </div>
        <div>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Change Avatar
          </button>
          <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 2MB.</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Display Name *</label>
          <input
            type="text"
            value={profile.display_name || ''}
            onChange={(e) => updateProfile('display_name', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
            <input
              type="text"
              value={profile.username || ''}
              disabled
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={userEmail}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            rows={4}
            value={profile.bio || ''}
            onChange={(e) => updateProfile('bio', e.target.value)}
            placeholder="Tell brands about yourself and your content..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{(profile.bio || '').length}/500 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <select
            value={profile.country || ''}
            onChange={(e) => updateProfile('country', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input
            type="text"
            value={profile.city || ''}
            onChange={(e) => updateProfile('city', e.target.value)}
            placeholder="Your city"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Budget</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              value={profile.min_budget || ''}
              onChange={(e) => updateProfile('min_budget', parseFloat(e.target.value) || null)}
              placeholder="100"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum deal value you accept</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Response Time</label>
          <select
            value={profile.response_time || ''}
            onChange={(e) => updateProfile('response_time', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="">Select response time</option>
            <option value="within_1_hour">Within 1 hour</option>
            <option value="within_24_hours">Within 24 hours</option>
            <option value="within_48_hours">Within 48 hours</option>
            <option value="within_week">Within a week</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.is_available}
              onChange={(e) => updateProfile('is_available', e.target.checked)}
              className="w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
            />
            <span className="text-gray-700">Available for new deals</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">Uncheck if you're not accepting new work right now</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Content Niches <span className="text-gray-400">(select up to 5)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {NICHES.map((niche) => (
              <button
                key={niche}
                type="button"
                onClick={() => toggleNiche(niche)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  profile.niches?.includes(niche)
                    ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {niche}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">Languages</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => toggleLanguage(lang.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  profile.languages?.includes(lang.code)
                    ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SERVICES & RATES SETTINGS
// ============================================================================
function ServicesSettings({ 
  services, 
  setServices,
  platforms 
}: { 
  services: Service[]
  setServices: (s: Service[]) => void
  platforms: Platform[]
}) {
  const addService = () => {
    setServices([
      ...services,
      {
        title: '',
        description: null,
        content_type: '',
        platform: platforms[0]?.platform || 'twitter',
        price: 0,
        delivery_days: 7,
        revisions_included: 1,
        is_active: true,
      }
    ])
  }

  const updateService = (index: number, field: keyof Service, value: any) => {
    const updated = [...services]
    updated[index] = { ...updated[index], [field]: value }
    setServices(updated)
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const activePlatforms = platforms.map(p => p.platform)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Services & Rates</h2>
          <p className="text-sm text-gray-500 mt-1">Define the services you offer and set your rates.</p>
        </div>
        <button
          onClick={addService}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 font-medium text-gray-900">No services yet</h3>
          <p className="text-sm text-gray-500 mt-1">Add services to let brands know what you offer</p>
          <button
            onClick={addService}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add Your First Service
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {services.map((service, index) => (
            <div key={index} className="p-6 border border-gray-200 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium text-gray-900">Service #{index + 1}</h3>
                <button
                  onClick={() => removeService(index)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Title *</label>
                  <input
                    type="text"
                    value={service.title}
                    onChange={(e) => updateService(index, 'title', e.target.value)}
                    placeholder="e.g., Twitter Thread about your product"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform *</label>
                  <select
                    value={service.platform}
                    onChange={(e) => updateService(index, 'platform', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  >
                    {PLATFORMS.filter(p => activePlatforms.includes(p.id) || activePlatforms.length === 0).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Type *</label>
                  <select
                    value={service.content_type}
                    onChange={(e) => updateService(index, 'content_type', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select type</option>
                    {SERVICE_TYPES[service.platform]?.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={service.price || ''}
                      onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="500"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Days</label>
                  <input
                    type="number"
                    value={service.delivery_days}
                    onChange={(e) => updateService(index, 'delivery_days', parseInt(e.target.value) || 7)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revisions Included</label>
                  <input
                    type="number"
                    value={service.revisions_included}
                    onChange={(e) => updateService(index, 'revisions_included', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={service.description || ''}
                    onChange={(e) => updateService(index, 'description', e.target.value)}
                    placeholder="Describe what's included in this service..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={service.is_active}
                      onChange={(e) => updateService(index, 'is_active', e.target.checked)}
                      className="w-5 h-5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <span className="text-gray-700">Service is active</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PLATFORMS SETTINGS
// ============================================================================
function PlatformsSettings({ 
  platforms, 
  setPlatforms 
}: { 
  platforms: Platform[]
  setPlatforms: (p: Platform[]) => void
}) {
  const addPlatform = () => {
    setPlatforms([
      ...platforms,
      {
        platform: 'twitter',
        platform_username: '',
        platform_url: '',
        followers: 0,
      }
    ])
  }

  const updatePlatform = (index: number, field: keyof Platform, value: any) => {
    const updated = [...platforms]
    updated[index] = { ...updated[index], [field]: value }
    setPlatforms(updated)
  }

  const removePlatform = (index: number) => {
    setPlatforms(platforms.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Social Platforms</h2>
          <p className="text-sm text-gray-500 mt-1">Add your social media accounts and follower counts.</p>
        </div>
        <button
          onClick={addPlatform}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          Add Platform
        </button>
      </div>

      {platforms.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 font-medium text-gray-900">No platforms added</h3>
          <p className="text-sm text-gray-500 mt-1">Add your social media platforms to show brands your reach</p>
          <button
            onClick={addPlatform}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add Platform
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {platforms.map((platform, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                    <select
                      value={platform.platform}
                      onChange={(e) => updatePlatform(index, 'platform', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      value={platform.platform_username || ''}
                      onChange={(e) => updatePlatform(index, 'platform_username', e.target.value)}
                      placeholder="@username"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Followers</label>
                    <input
                      type="number"
                      value={platform.followers || ''}
                      onChange={(e) => updatePlatform(index, 'followers', parseInt(e.target.value) || 0)}
                      placeholder="10000"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile URL</label>
                    <input
                      type="url"
                      value={platform.platform_url || ''}
                      onChange={(e) => updatePlatform(index, 'platform_url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => removePlatform(index)}
                  className="p-2 text-gray-400 hover:text-red-500 mt-7"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================
function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailNewDeals: true,
    emailMessages: true,
    emailPayments: true,
    emailMarketing: false,
  })

  const toggle = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Choose how you want to be notified.</p>
      </div>

      <div className="space-y-4">
        <ToggleItem
          title="New Deal Requests"
          description="Get notified when brands send you deal proposals"
          enabled={notifications.emailNewDeals}
          onToggle={() => toggle('emailNewDeals')}
        />
        <ToggleItem
          title="Messages"
          description="Get notified when you receive new messages"
          enabled={notifications.emailMessages}
          onToggle={() => toggle('emailMessages')}
        />
        <ToggleItem
          title="Payments"
          description="Get notified about payment updates and payouts"
          enabled={notifications.emailPayments}
          onToggle={() => toggle('emailPayments')}
        />
        <ToggleItem
          title="Marketing & Updates"
          description="Receive tips, product updates, and promotional content"
          enabled={notifications.emailMarketing}
          onToggle={() => toggle('emailMarketing')}
        />
      </div>
    </div>
  )
}

function ToggleItem({ title, description, enabled, onToggle }: { 
  title: string
  description: string
  enabled: boolean
  onToggle: () => void 
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-violet-600' : 'bg-gray-300'
        }`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'left-7' : 'left-1'
        }`} />
      </button>
    </div>
  )
}

// ============================================================================
// PAYMENT SETTINGS
// ============================================================================
function PaymentSettings({ profile }: { profile: CreatorProfile }) {
  const [stripeConnected] = useState(!!profile.stripe_account_id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your payout settings.</p>
      </div>

      <div className="p-6 bg-gradient-to-br from-violet-50 to-blue-50 rounded-xl border border-violet-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <CreditCard className="w-6 h-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Stripe Connect</h3>
            <p className="text-sm text-gray-600 mt-1">
              Connect your Stripe account to receive payments directly to your bank account.
            </p>
            {stripeConnected ? (
              <div className="mt-4 flex items-center gap-2 text-emerald-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Connected</span>
              </div>
            ) : (
              <button className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700">
                Connect Stripe
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Platform Fee:</strong> We charge a 10% fee on completed deals. This covers payment processing, escrow protection, and platform maintenance.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// SECURITY SETTINGS
// ============================================================================
function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account security.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
          <input
            type="password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <input
            type="password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
          <input
            type="password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800">
          Update Password
        </button>
      </div>
    </div>
  )
}