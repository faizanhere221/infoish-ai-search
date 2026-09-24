'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import CampaignList from '@/components/campaigns/CampaignList'
import CampaignFilters, { EMPTY_FILTERS, type CampaignFilterState } from '@/components/campaigns/CampaignFilters'
import type { Campaign } from '@/types/campaigns'

type SortOption = 'newest' | 'deadline' | 'budget'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'deadline', label: 'Deadline Soonest' },
  { value: 'budget', label: 'Highest Budget' },
]

interface Profile {
  id: string
  [key: string]: unknown
}

// This page is the public/creator discovery view. Brands get a purpose-built
// management dashboard at /dashboard/campaigns (status tabs, edit/close/
// reopen, applications) — a logged-in brand is redirected there instead of
// rendering a second, duplicate "your campaigns" view here.
export default function CampaignsPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [filters, setFilters] = useState<CampaignFilterState>(EMPTY_FILTERS)
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.user_type === 'brand') {
        router.replace('/dashboard/campaigns')
        return
      }
      setIsLoggedIn(true)
      setUserType(user.user_type)
      setProfile(profileStr ? JSON.parse(profileStr) : null)
    }
    setAuthChecked(true)
  }, [router])

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch('/api/campaigns?limit=50', { headers })
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      } else {
        setLoadError(true)
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authChecked) {return}
    fetchCampaigns()
  }, [authChecked, fetchCampaigns])

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const matches = c.title.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
        if (!matches) {return false}
      }
      if (filters.category && c.category !== filters.category) {return false}
      if (filters.platforms.length > 0 && !filters.platforms.some((p) => c.platforms.includes(p))) {return false}
      if (filters.budgetMin) {
        const min = Number(filters.budgetMin)
        const campaignMax = c.budget_max ?? c.budget_min
        if (campaignMax !== null && campaignMax !== undefined && campaignMax < min) {return false}
      }
      if (filters.budgetMax) {
        const max = Number(filters.budgetMax)
        const campaignMin = c.budget_min ?? c.budget_max
        if (campaignMin !== null && campaignMin !== undefined && campaignMin > max) {return false}
      }
      return true
    })
  }, [campaigns, filters])

  const sortedCampaigns = useMemo(() => {
    const list = [...filteredCampaigns]
    list.sort((a, b) => {
      switch (sortBy) {
        case 'deadline': {
          if (!a.application_deadline) {return 1}
          if (!b.application_deadline) {return -1}
          return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime()
        }
        case 'budget':
          return (b.budget_max ?? b.budget_min ?? 0) - (a.budget_max ?? a.budget_min ?? 0)
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    return list
  }, [filteredCampaigns, sortBy])

  const activeFilterCount =
    (filters.category ? 1 : 0) + filters.platforms.length + (filters.budgetMin ? 1 : 0) + (filters.budgetMax ? 1 : 0)

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoggedIn && userType ? <DashboardHeader userType={userType} profile={profile} /> : <GuestHeader />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Discover Campaigns</h1>
          <p className="text-gray-500 mt-1">
            Browse sponsorship campaigns from tech brands and apply directly.
          </p>
        </div>

        <div className="mb-6">
          <CampaignFilters filters={filters} onChange={setFilters} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{sortedCampaigns.length}</span> campaign
            {sortedCampaigns.length === 1 ? '' : 's'} found
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">Couldn't load campaigns</h3>
            <p className="text-gray-500 mt-1">Something went wrong. Please try again.</p>
            <button
              onClick={fetchCampaigns}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:bg-brand-purple-dark"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : (
          <CampaignList
            campaigns={sortedCampaigns}
            variant="creator"
            loading={loading}
            emptyTitle={campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your filters'}
            emptyDescription={
              campaigns.length === 0
                ? 'Check back soon! Brands are creating campaigns.'
                : 'Try adjusting or clearing your filters.'
            }
            emptyAction={
              activeFilterCount > 0 || filters.search ? (
                <button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="px-4 py-2 text-brand-purple hover:bg-brand-pink/10 rounded-lg font-medium"
                >
                  Clear all filters
                </button>
              ) : undefined
            }
          />
        )}
      </main>
    </div>
  )
}

function GuestHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Infoishai</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/creators" className="text-gray-600 hover:text-gray-900">
                Find Creators
              </Link>
              <Link href="/campaigns" className="text-brand-purple font-medium">
                Campaigns
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:bg-brand-purple-dark"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
