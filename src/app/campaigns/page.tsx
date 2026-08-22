'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Plus, Loader2 } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import CampaignList from '@/components/campaigns/CampaignList'
import CampaignFilters, { EMPTY_FILTERS, type CampaignFilterState } from '@/components/campaigns/CampaignFilters'
import type { Campaign } from '@/types/campaigns'

type SortOption = 'newest' | 'deadline' | 'budget'
type BrandTab = 'all' | 'draft' | 'published' | 'closed'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'deadline', label: 'Deadline Soonest' },
  { value: 'budget', label: 'Highest Budget' },
]

const BRAND_TABS: { id: BrandTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'closed', label: 'Closed' },
]

interface Profile {
  id: string
  [key: string]: unknown
}

export default function CampaignsPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  // Creator/guest browsing
  const [filters, setFilters] = useState<CampaignFilterState>(EMPTY_FILTERS)
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Brand's own campaigns
  const [brandTab, setBrandTab] = useState<BrandTab>('all')

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    if (userStr) {
      const user = JSON.parse(userStr)
      setIsLoggedIn(true)
      setUserType(user.user_type)
      setProfile(profileStr ? JSON.parse(profileStr) : null)
    }
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (!authChecked) return

    async function fetchCampaigns() {
      setLoading(true)
      try {
        const token = localStorage.getItem('auth_token')
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch('/api/campaigns?limit=50', { headers })
        if (res.ok) {
          const data = await res.json()
          setCampaigns(data.campaigns || [])
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [authChecked])

  const isBrandOwner = userType === 'brand'

  const filteredCampaigns = useMemo(() => {
    if (isBrandOwner) return []
    return campaigns.filter((c) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const matches = c.title.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
        if (!matches) return false
      }
      if (filters.category && c.category !== filters.category) return false
      if (filters.platforms.length > 0 && !filters.platforms.some((p) => c.platforms.includes(p))) return false
      if (filters.budgetMin) {
        const min = Number(filters.budgetMin)
        const campaignMax = c.budget_max ?? c.budget_min
        if (campaignMax != null && campaignMax < min) return false
      }
      if (filters.budgetMax) {
        const max = Number(filters.budgetMax)
        const campaignMin = c.budget_min ?? c.budget_max
        if (campaignMin != null && campaignMin > max) return false
      }
      return true
    })
  }, [campaigns, filters, isBrandOwner])

  const sortedCampaigns = useMemo(() => {
    const list = [...filteredCampaigns]
    list.sort((a, b) => {
      switch (sortBy) {
        case 'deadline': {
          if (!a.application_deadline) return 1
          if (!b.application_deadline) return -1
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

  const statusCounts = useMemo(
    () => ({
      all: campaigns.length,
      draft: campaigns.filter((c) => c.status === 'draft').length,
      published: campaigns.filter((c) => c.status === 'published').length,
      closed: campaigns.filter((c) => c.status === 'closed' || c.status === 'cancelled').length,
    }),
    [campaigns]
  )

  const tabbedCampaigns = useMemo(() => {
    if (!isBrandOwner) return []
    return campaigns.filter((c) => {
      if (brandTab === 'all') return true
      if (brandTab === 'closed') return c.status === 'closed' || c.status === 'cancelled'
      return c.status === brandTab
    })
  }, [campaigns, brandTab, isBrandOwner])

  async function handleCloseCampaign(campaignId: string) {
    if (!confirm('Close this campaign? Creators will no longer be able to apply.')) return
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'closed' }),
      })
      if (res.ok) {
        setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? { ...c, status: 'closed' } : c)))
      }
    } catch (err) {
      console.error('Error closing campaign:', err)
    }
  }

  const activeFilterCount =
    (filters.category ? 1 : 0) + filters.platforms.length + (filters.budgetMin ? 1 : 0) + (filters.budgetMax ? 1 : 0)

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoggedIn && userType ? <DashboardHeader userType={userType} profile={profile} /> : <GuestHeader />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isBrandOwner ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
                <p className="text-gray-500 mt-1">Manage the campaigns you've created</p>
              </div>
              <Link
                href="/campaigns/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Create Campaign
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {BRAND_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setBrandTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    brandTab === tab.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                      brandTab === tab.id ? 'bg-violet-500' : 'bg-gray-100'
                    }`}
                  >
                    {statusCounts[tab.id]}
                  </span>
                </button>
              ))}
            </div>

            <CampaignList
              campaigns={tabbedCampaigns}
              variant="brand"
              loading={loading}
              onClose={handleCloseCampaign}
              emptyTitle={campaigns.length === 0 ? "You haven't created any campaigns yet" : 'No campaigns in this view'}
              emptyDescription={
                campaigns.length === 0
                  ? 'Create your first campaign to start receiving applications from creators.'
                  : 'Try a different tab.'
              }
              emptyAction={
                campaigns.length === 0 ? (
                  <Link
                    href="/campaigns/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
                  >
                    <Plus className="w-4 h-4" />
                    Create Campaign
                  </Link>
                ) : undefined
              }
            />
          </>
        ) : (
          <>
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
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <CampaignList
              campaigns={sortedCampaigns}
              variant="creator"
              loading={loading}
              emptyTitle={campaigns.length === 0 ? 'No campaigns available yet' : 'No campaigns match your filters'}
              emptyDescription={
                campaigns.length === 0
                  ? 'Check back soon — brands are getting set up.'
                  : 'Try adjusting or clearing your filters.'
              }
              emptyAction={
                activeFilterCount > 0 || filters.search ? (
                  <button
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="px-4 py-2 text-violet-600 hover:bg-violet-50 rounded-lg font-medium"
                  >
                    Clear all filters
                  </button>
                ) : undefined
              }
            />
          </>
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
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Infoishai</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/creators" className="text-gray-600 hover:text-gray-900">
                Find Creators
              </Link>
              <Link href="/campaigns" className="text-violet-600 font-medium">
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
              className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
