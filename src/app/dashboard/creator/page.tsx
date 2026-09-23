'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Clock, AlertCircle, Share2 } from 'lucide-react'
import ProfileCompletionCard from '@/components/dashboard/ProfileCompletionCard'
import DashboardStats from '@/components/dashboard/DashboardStats'
import CreatorPlatforms from '@/components/dashboard/CreatorPlatforms'
import CreatorServices from '@/components/dashboard/CreatorServices'
import OnboardingWizard from '@/components/dashboard/OnboardingWizard'
import { calculateProfileCompletion } from '@/lib/profile-completion'

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
  description?: string | null
  content_type?: string | null
  platform?: string | null
  price: number
  delivery_days?: number
  revisions_included?: number
  is_active: boolean
}

interface CreatorProfile {
  id: string
  user_id: string
  username: string
  display_name: string
  bio: string | null
  profile_photo_url: string | null
  niches: string[]
  verification_status: string
  is_available: boolean
  profile_views?: number
  creator_platforms: Platform[]
  creator_services: Service[]
}

const ONBOARDING_THRESHOLD = 50

export default function CreatorDashboard() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onboardingDismissed, setOnboardingDismissed] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('auth_user')
      if (!userStr) {
        setError('Please log in to view your dashboard')
        setLoading(false)
        return
      }

      const user = JSON.parse(userStr)
      const res = await fetch(`/api/creators/${user.id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.creator)
        localStorage.setItem('auth_profile', JSON.stringify(data.creator))
        setOnboardingDismissed(localStorage.getItem(`onboarding_dismissed_${data.creator.id}`) === 'true')
      } else {
        setError('Profile not found')
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-40 bg-gray-200 rounded-xl w-full" />
        <div className="h-40 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">{error || 'Profile not found'}</h2>
          <a
            href={error === 'Please log in to view your dashboard' ? '/login' : '/signup/creator'}
            className="mt-4 inline-block px-6 py-2 bg-violet-600 text-white rounded-lg"
          >
            {error === 'Please log in to view your dashboard' ? 'Go to Login' : 'Complete Profile'}
          </a>
        </div>
      </div>
    )
  }

  const platforms = profile.creator_platforms || []
  const totalFollowers = platforms.reduce((sum, p) => sum + (p.followers || 0), 0)

  const completion = calculateProfileCompletion(profile)
  const showOnboarding = completion.percentage < ONBOARDING_THRESHOLD && !onboardingDismissed

  const dismissOnboarding = () => {
    localStorage.setItem(`onboarding_dismissed_${profile.id}`, 'true')
    setOnboardingDismissed(true)
  }

  return (
    <div className="space-y-6">
      {/* Profile card — first thing creators see */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {profile.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_photo_url}
              alt={profile.display_name}
              className="w-24 h-24 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {profile.display_name?.charAt(0) || 'U'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
            <p className="text-gray-500">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {profile.verification_status === 'verified' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified Creator
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Verification Pending
                </span>
              )}
              {(profile.niches || []).slice(0, 3).map((niche) => (
                <span key={niche} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {niche}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-shrink-0">
            <Link
              href={`/creators/${profile.username}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-violet-700 hover:to-blue-700"
            >
              <Share2 className="w-4 h-4" />
              View Public Profile
            </Link>
          </div>
        </div>
      </div>

      {showOnboarding && (
        <OnboardingWizard
          creator={profile}
          onSaved={fetchDashboardData}
          onComplete={() => { dismissOnboarding(); fetchDashboardData() }}
          onDismiss={dismissOnboarding}
        />
      )}

      <ProfileCompletionCard completion={completion} />

      <DashboardStats profileViews={profile.profile_views ?? 0} totalFollowers={totalFollowers} />

      <CreatorPlatforms platforms={platforms} />

      <CreatorServices services={profile.creator_services || []} />
    </div>
  )
}

