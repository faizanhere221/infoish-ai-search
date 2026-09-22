'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2, Megaphone, Plus, RotateCcw } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import CampaignManagementCard from '@/components/campaigns/CampaignManagementCard'
import type { Campaign } from '@/types/campaigns'

type Tab = 'all' | 'active' | 'draft' | 'closed'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Drafts' },
  { id: 'closed', label: 'Closed' },
]

interface Profile {
  id: string
  [key: string]: unknown
}

export default function BrandCampaignsDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      }
    >
      <BrandCampaignsDashboardContent />
    </Suspense>
  )
}

function BrandCampaignsDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(
    searchParams.get('created') === '1' ? 'Campaign saved as draft' : null
  )

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const token = localStorage.getItem('auth_token')

    if (!userStr || !token) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.user_type !== 'brand') {
      router.push('/campaigns')
      return
    }

    setProfile(profileStr ? JSON.parse(profileStr) : null)
    setLoading(true)
    setLoadError(false)

    try {
      const res = await fetch('/api/campaigns?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
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
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  const statusCounts = useMemo(
    () => ({
      all: campaigns.length,
      active: campaigns.filter((c) => c.status === 'published').length,
      draft: campaigns.filter((c) => c.status === 'draft').length,
      closed: campaigns.filter((c) => c.status === 'closed' || c.status === 'cancelled' || c.status === 'completed')
        .length,
    }),
    [campaigns]
  )

  const tabbedCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (tab === 'all') {return true}
      if (tab === 'active') {return c.status === 'published'}
      if (tab === 'draft') {return c.status === 'draft'}
      if (tab === 'closed') {return c.status === 'closed' || c.status === 'cancelled' || c.status === 'completed'}
      return true
    })
  }, [campaigns, tab])

  async function handleClose(campaignId: string) {
    if (!confirm('Close this campaign? Creators will no longer be able to apply.')) {return}
    setPendingId(campaignId)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/campaigns/${campaignId}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? { ...c, status: 'closed' } : c)))
        showToast('Campaign closed')
      }
    } catch (err) {
      console.error('Error closing campaign:', err)
    } finally {
      setPendingId(null)
    }
  }

  async function handleReopen(campaignId: string) {
    setPendingId(campaignId)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/campaigns/${campaignId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? data.campaign : c)))
        showToast('Campaign reopened')
      }
    } catch (err) {
      console.error('Error reopening campaign:', err)
    } finally {
      setPendingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="brand" profile={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
            <p className="text-gray-500 mt-1">Manage your campaigns and review applications</p>
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
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                tab === t.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {t.label}
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${tab === t.id ? 'bg-violet-500' : 'bg-gray-100'}`}>
                {statusCounts[t.id]}
              </span>
            </button>
          ))}
        </div>

        {loadError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">Couldn't load your campaigns</h3>
            <p className="text-gray-500 mt-1">Something went wrong. Please try again.</p>
            <button
              onClick={load}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : tabbedCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tabbedCampaigns.map((campaign) => (
              <CampaignManagementCard
                key={campaign.id}
                campaign={campaign}
                onClose={handleClose}
                onReopen={handleReopen}
                pending={pendingId === campaign.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">
              {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns in this view'}
            </h3>
            <p className="text-gray-500 mt-1">
              {campaigns.length === 0
                ? 'Create your first campaign to find tech creators.'
                : 'Try a different tab.'}
            </p>
            {campaigns.length === 0 && (
              <Link
                href="/campaigns/create"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Create Campaign
              </Link>
            )}
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
