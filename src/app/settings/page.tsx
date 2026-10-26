'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User,
  Shield,
  Briefcase,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  DollarSign,
  Wallet,
  Mail,
} from 'lucide-react'
import { NICHES, PLATFORMS, COUNTRIES, LANGUAGES, SERVICE_TYPES } from '@/utils/constants'
import { normalizeProfileUrl, parseFollowerCount, parsePrice } from '@/lib/creators/platform-input'
import AvatarUpload from '@/components/AvatarUpload'
import DashboardHeader from '@/components/DashboardHeader'
import { PayoutMethodsSettings } from '@/components/payments/PayoutMethodsSettings'
import { EmailPreferencesSettings } from '@/components/settings/EmailPreferencesSettings'

type SettingsTab = 'profile' | 'services' | 'platforms' | 'payouts' | 'notifications' | 'security'

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
}

interface Platform {
  id?: string
  platform: string
  platform_username: string | null
  platform_url: string | null
  followers: number
  // Client-only: the raw text in the Followers box, so "5k" stays as typed
  // while `followers` holds the parsed number. Never sent to the API.
  followers_input?: string
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
  // Client-only raw Price text (see Platform.followers_input).
  price_input?: string
}

// Lets GET /api/creators/[id]?include_inactive=1 recognize the owner, so
// paused services load too (otherwise the next save would delete them).
function ownerHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <SettingsPageInner />
    </Suspense>
  )
}

function SettingsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') as SettingsTab | null
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    initialTab && ['profile', 'services', 'platforms', 'payouts', 'security'].includes(initialTab)
      ? initialTab
      : 'profile'
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [userEmail, setUserEmail] = useState('')
  // JSON of what the server last returned. Edits on the Platforms/Services
  // tabs only live in this page's state until the top Save button runs, so
  // compare against it to show "Unsaved changes" and warn before leaving.
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)

  const currentSnapshot = useMemo(
    () => JSON.stringify({ profile, platforms, services }),
    [profile, platforms, services]
  )
  const hasUnsavedChanges = savedSnapshot !== null && savedSnapshot !== currentSnapshot

  const applyServerCreator = useCallback(
    (creator: CreatorProfile & { creator_platforms?: Platform[]; creator_services?: Service[] }) => {
      const { creator_platforms: freshPlatforms, creator_services: freshServices, ...rest } = creator
      setProfile(rest)
      setPlatforms(freshPlatforms || [])
      setServices(freshServices || [])
      setSavedSnapshot(
        JSON.stringify({ profile: rest, platforms: freshPlatforms || [], services: freshServices || [] })
      )
      localStorage.setItem('auth_profile', JSON.stringify(creator))
    },
    []
  )

  useEffect(() => {
    if (!hasUnsavedChanges) {return}
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'platforms' as SettingsTab, label: 'Platforms', icon: Briefcase },
    { id: 'services' as SettingsTab, label: 'Services & Rates', icon: DollarSign },
    { id: 'payouts' as SettingsTab, label: 'Payouts', icon: Wallet },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Mail },
    { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
  ]

  const loadData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('auth_user')

      if (!userStr) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userStr)
      setUserEmail(user.email)

      // Always fetch the creator profile fresh by user_id rather than relying on
      // a cached `auth_profile` blob — that cache can be missing/stale and never
      // includes platforms/services anyway.
      const res = await fetch(`/api/creators/${user.id}?include_inactive=1`, {
        cache: 'no-store',
        headers: ownerHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        applyServerCreator(data.creator)
      } else {
        setError('Failed to load your profile')
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load settings')
      setLoading(false)
    }
  }, [router, applyServerCreator])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = async () => {
    if (!profile) {return}

    setSaving(true)
    setSaved(false)
    setError(null)

    const authToken = localStorage.getItem('auth_token')
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
    if (authToken) {authHeaders.Authorization = `Bearer ${authToken}`}

    const sectionErrors: string[] = []

    // Validate up front so a bad row produces a clear message instead of a
    // silent/opaque 400 from the API (empty service titles were rejected).
    const untitled = services.findIndex((s) => !s.title || !s.title.trim())
    if (untitled !== -1) {
      setError(`Service #${untitled + 1} needs a title before it can be saved.`)
      setActiveTab('services')
      setSaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const seenPlatforms = new Set<string>()
    for (const p of platforms) {
      if (seenPlatforms.has(p.platform)) {
        setError('Each platform can only be added once. Remove the duplicate and try again.')
        setActiveTab('platforms')
        setSaving(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      seenPlatforms.add(p.platform)
    }
    const failValidation = (message: string, tab: SettingsTab) => {
      setError(message)
      setActiveTab(tab)
      setSaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    const platformName = (id: string) => PLATFORMS.find((x) => x.id === id)?.name || id
    for (const p of platforms) {
      if (p.followers_input !== undefined && parseFollowerCount(p.followers_input) === null) {
        failValidation(`${platformName(p.platform)}: "${p.followers_input}" is not a follower count. Use a number like 5076, 5,076, or 5k.`, 'platforms')
        return
      }
      const url = normalizeProfileUrl(p.platform_url)
      if (!url.ok) {
        failValidation(`${platformName(p.platform)}: ${url.error}`, 'platforms')
        return
      }
    }
    const badPrice = services.findIndex((s) => s.price_input !== undefined && parsePrice(s.price_input) === null)
    if (badPrice !== -1) {
      failValidation(`Service #${badPrice + 1}: "${services[badPrice].price_input}" is not a valid price.`, 'services')
      return
    }

    try {
      // Update profile
      const profileRes = await fetch(`/api/creators/${profile.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          display_name: profile.display_name,
          bio: profile.bio,
          country: profile.country,
          city: profile.city,
          niches: profile.niches,
          languages: profile.languages,
          is_available: profile.is_available,
          min_budget: profile.min_budget,
          response_time: profile.response_time,
          profile_photo_url: profile.profile_photo_url,
        }),
      })

      if (!profileRes.ok) {
        const errorData = await profileRes.json().catch(() => ({}))
        sectionErrors.push(errorData.error || 'Failed to save profile')
      }

      // Update platforms
      const platformsRes = await fetch(`/api/creators/${profile.id}/platforms`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          platforms: platforms.map((p) => ({
            platform: p.platform,
            platform_username: p.platform_username?.trim() || null,
            platform_url: (() => {
              const url = normalizeProfileUrl(p.platform_url)
              return url.ok ? url.url : null
            })(),
            followers: Number.isFinite(p.followers) ? Math.max(0, Math.round(p.followers)) : 0,
          })),
        }),
      })

      if (!platformsRes.ok) {
        const errorData = await platformsRes.json().catch(() => ({}))
        sectionErrors.push(errorData.error || 'Failed to save platforms')
      } else {
        const data = await platformsRes.json().catch(() => null)
        if (data?.platforms) {setPlatforms(data.platforms)}
      }

      // Update services
      const servicesRes = await fetch(`/api/creators/${profile.id}/services`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          services: services.map((s) => ({
            title: s.title.trim(),
            description: s.description?.trim() || null,
            content_type: s.content_type || null,
            platform: s.platform || null,
            price: Number.isFinite(s.price) ? Math.max(0, s.price) : 0,
            delivery_days: Math.min(365, Math.max(1, Math.floor(s.delivery_days) || 7)),
            revisions_included: Math.min(20, Math.max(0, Math.floor(s.revisions_included) || 0)),
            is_active: s.is_active,
          })),
        }),
      })

      if (!servicesRes.ok) {
        const errorData = await servicesRes.json().catch(() => ({}))
        sectionErrors.push(errorData.error || 'Failed to save services')
      } else {
        const data = await servicesRes.json().catch(() => null)
        if (data?.services) {setServices(data.services)}
      }

      if (sectionErrors.length > 0) {
        // Keep the unsaved edits on screen (no reload) so the creator can retry.
        showSaveError(`Not all changes were saved. ${sectionErrors.join(' ')} Please try again.`)
        return
      }

      // Reload from the server so the UI reflects exactly what was persisted.
      // Only claim success once that read-back confirms it.
      const freshRes = await fetch(`/api/creators/${profile.user_id}?include_inactive=1`, {
        cache: 'no-store',
        headers: ownerHeaders(),
      })
      if (!freshRes.ok) {
        showSaveError('Your changes were sent, but reloading them failed. Refresh the page to check they saved.')
        return
      }
      const fresh = await freshRes.json()
      applyServerCreator(fresh.creator)

      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      console.error('Error saving:', err)
      showSaveError('Failed to save changes. Check your connection and try again.')
    }
  }

  const showSaveError = (message: string) => {
    setError(message)
    setSaved(false)
    setSaving(false)
    // The banner sits under the page header — scroll so it is visible from
    // any tab, otherwise a failure further down the page looks like nothing happened.
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <DashboardHeader userType="creator" profile={profile} />

      {/* Page title + save bar */}
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
            <div className="flex items-center gap-3">
            {hasUnsavedChanges && !saving && (
              <span className="hidden sm:inline text-sm font-medium text-amber-600">Unsaved changes</span>
            )}
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

      {saved && !error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div role="status" className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700">Your profile, platforms, and services are saved.</p>
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
              {activeTab === 'payouts' && <PayoutMethodsSettings />}
              {activeTab === 'notifications' && <EmailPreferencesSettings />}
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
  const updateProfile = (field: keyof CreatorProfile, value: CreatorProfile[keyof CreatorProfile]) => {
    setProfile({ ...profile, [field]: value })
  }

  const handleAvatarUploaded = (url: string) => {
    updateProfile('profile_photo_url', url)

    const profileStr = localStorage.getItem('auth_profile')
    if (profileStr) {
      const savedProfile = JSON.parse(profileStr)
      savedProfile.profile_photo_url = url
      localStorage.setItem('auth_profile', JSON.stringify(savedProfile))
    }
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
      <div className="pb-6 border-b border-gray-200">
        <AvatarUpload
          currentUrl={profile.profile_photo_url}
          fallbackLetter={profile.display_name?.charAt(0) || 'U'}
          uploadUrl={`/api/creators/${profile.id}/avatar`}
          size={80}
          onUploaded={handleAvatarUploaded}
        />
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

  const updateService = (index: number, field: keyof Service, value: Service[keyof Service]) => {
    updateServiceFields(index, { [field]: value })
  }

  const updateServiceFields = (index: number, patch: Partial<Service>) => {
    const updated = [...services]
    updated[index] = { ...updated[index], ...patch }
    setServices(updated)
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Services & Rates</h2>
          <p className="text-sm text-gray-500 mt-1">
            List the services you offer and set your rates. Click Save Changes at the top to save them.
          </p>
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
                    // Content types are per platform; keeping the old one left a
                    // hidden value (the select showed "Select type") that still saved.
                    onChange={(e) => updateServiceFields(index, { platform: e.target.value, content_type: '' })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  >
                    {PLATFORMS.map((p) => (
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
                    {/* Text, not type="number": a number input reports "" for
                        "1,000" or "$100", which used to save as $0 with no error. */}
                    <input
                      type="text"
                      inputMode="decimal"
                      value={service.price_input ?? (service.price ? String(service.price) : '')}
                      onChange={(e) => {
                        const parsed = parsePrice(e.target.value)
                        updateServiceFields(index, {
                          price_input: e.target.value,
                          ...(parsed !== null ? { price: parsed } : {}),
                        })
                      }}
                      placeholder="500"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  {service.price_input !== undefined && parsePrice(service.price_input) === null && (
                    <p className="mt-1 text-xs text-red-600">Enter a price like 100 or 1,000.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Days</label>
                  <input
                    type="number"
                    value={service.delivery_days}
                    min={1}
                    onChange={(e) => updateService(index, 'delivery_days', parseInt(e.target.value) || 7)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revisions Included</label>
                  <input
                    type="number"
                    value={service.revisions_included}
                    min={0}
                    // `parseInt(...) || 1` turned a typed 0 into 1, so "no revisions" never saved.
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10)
                      updateService(index, 'revisions_included', Number.isFinite(n) ? Math.max(0, n) : 1)
                    }}
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
    // Each platform type can only be added once (enforced by the API) — default
    // to the first platform not already in the list instead of always 'twitter',
    // so clicking "Add Platform" twice doesn't create a save-breaking duplicate.
    const used = new Set(platforms.map((p) => p.platform))
    const nextPlatform = PLATFORMS.find((p) => !used.has(p.id))?.id || 'other'

    setPlatforms([
      ...platforms,
      {
        platform: nextPlatform,
        platform_username: '',
        platform_url: '',
        followers: 0,
      }
    ])
  }

  const updatePlatform = (index: number, field: keyof Platform, value: Platform[keyof Platform]) => {
    updatePlatformFields(index, { [field]: value })
  }

  const updatePlatformFields = (index: number, patch: Partial<Platform>) => {
    const updated = [...platforms]
    updated[index] = { ...updated[index], ...patch }
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
          <p className="text-sm text-gray-500 mt-1">
            Add your social media accounts and follower counts. Click Save Changes at the top to save them.
          </p>
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
                    {/* Text, not type="number": a number input reports "" for
                        "5,076" or "5k", which used to save as 0 followers with no error. */}
                    <input
                      type="text"
                      inputMode="numeric"
                      value={platform.followers_input ?? (platform.followers ? String(platform.followers) : '')}
                      onChange={(e) => {
                        const parsed = parseFollowerCount(e.target.value)
                        updatePlatformFields(index, {
                          followers_input: e.target.value,
                          ...(parsed !== null ? { followers: parsed } : {}),
                        })
                      }}
                      placeholder="10,000 or 10k"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                    {platform.followers_input !== undefined && parseFollowerCount(platform.followers_input) === null && (
                      <p className="mt-1 text-xs text-red-600">Enter a number like 5076, 5,076, or 5k.</p>
                    )}
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
                    {(() => {
                      const result = normalizeProfileUrl(platform.platform_url)
                      return result.ok ? null : <p className="mt-1 text-xs text-red-600">{result.error}</p>
                    })()}
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