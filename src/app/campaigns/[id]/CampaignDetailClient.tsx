'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, Megaphone, X } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import Header from '@/components/header'
import CampaignDetail, { type CampaignViewerRole, type MyApplicationSummary } from '@/components/campaigns/CampaignDetail'
import type { Campaign } from '@/types/campaigns'

interface Profile {
  id: string
  [key: string]: unknown
}

// `initialCampaign` is server-rendered only when the campaign is published
// and public (see src/lib/campaigns/public.ts), so its details are in the
// initial HTML. For anything else it's null and nothing about the campaign
// reaches the HTML: the client fetches with the viewer's token, which is
// how the owning brand and tracked creators still see private, draft, or
// closed campaigns.
export default function CampaignDetailClient({
  campaignId,
  initialCampaign,
}: {
  campaignId: string
  initialCampaign: Campaign | null
}) {
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState<'brand' | 'creator' | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [campaign, setCampaign] = useState<Campaign | null>(initialCampaign)
  const [loading, setLoading] = useState(initialCampaign === null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [myApplication, setMyApplication] = useState<MyApplicationSummary | null>(null)
  const [closing, setClosing] = useState(false)
  const [reopening, setReopening] = useState(false)

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

  // `background` refreshes a server-rendered campaign for a logged-in viewer
  // (owner-only fields, the creator's own application) without swapping the
  // page for a spinner.
  const fetchCampaign = useCallback(async (background = false) => {
    if (!background) {setLoading(true)}
    setLoadError(null)
    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      const res = await fetch(`/api/campaigns/${campaignId}`, { headers })

      if (res.status === 404) {
        setLoadError('not_found')
        return
      }
      if (!res.ok) {
        // A failed background refresh keeps the server-rendered campaign.
        if (!background) {setLoadError('error')}
        return
      }

      const data = await res.json()
      setCampaign(data.campaign)

      const user = localStorage.getItem('auth_user')
      if (user && JSON.parse(user).user_type === 'creator' && token) {
        const appRes = await fetch(`/api/applications?campaign_id=${campaignId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (appRes.ok) {
          const appData = await appRes.json()
          const existing = appData.applications?.[0]
          if (existing) {setMyApplication({ id: existing.id, status: existing.status })}
        }
      }
    } catch (err) {
      console.error('Error fetching campaign:', err)
      if (!background) {setLoadError('error')}
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    if (!authChecked || !campaignId) {return}
    // An anonymous visitor already has everything the API would give them.
    if (initialCampaign !== null && !isLoggedIn) {return}
    fetchCampaign(initialCampaign !== null)
  }, [authChecked, campaignId, initialCampaign, isLoggedIn, fetchCampaign])

  async function handleCloseCampaign() {
    if (!campaign) {return}
    if (!confirm('Close this campaign? Creators will no longer be able to apply.')) {return}

    setClosing(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/campaigns/${campaign.id}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setCampaign((prev) => (prev ? { ...prev, status: 'closed' } : prev))
      }
    } catch (err) {
      console.error('Error closing campaign:', err)
    } finally {
      setClosing(false)
    }
  }

  async function handleReopenCampaign() {
    if (!campaign) {return}

    setReopening(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/campaigns/${campaign.id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCampaign(data.campaign)
      }
    } catch (err) {
      console.error('Error reopening campaign:', err)
    } finally {
      setReopening(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (loadError || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        {isLoggedIn && userType ? <DashboardHeader userType={userType} profile={profile} /> : <Header />}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Campaign not found</h1>
          <p className="text-gray-500 mt-1">
            This campaign doesn't exist, or you don't have access to view it.
          </p>
          <Link
            href="/campaigns"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </Link>
        </main>
      </div>
    )
  }

  const viewerRole: CampaignViewerRole =
    userType === 'creator'
      ? 'creator'
      : userType === 'brand' && profile?.id === campaign.brand_id
      ? 'owner'
      : 'other'

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoggedIn && userType ? <DashboardHeader userType={userType} profile={profile} /> : <Header />}

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link href="/campaigns" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <p className="font-semibold text-gray-900 truncate">Campaign Details</p>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Its own Suspense boundary: useSearchParams() would otherwise
            opt the whole page out of server rendering. */}
        <Suspense fallback={null}>
          <SuccessBanner />
        </Suspense>

        <CampaignDetail
          campaign={campaign}
          viewerRole={viewerRole}
          isLoggedIn={isLoggedIn}
          myApplication={myApplication}
          closing={closing}
          onClose={handleCloseCampaign}
          reopening={reopening}
          onReopen={handleReopenCampaign}
        />
      </main>
    </div>
  )
}

function SuccessBanner() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState<string | null>(() => {
    if (searchParams.get('applied') === '1') {return 'Application submitted successfully!'}
    if (searchParams.get('published') === '1') {return 'Campaign published successfully!'}
    if (searchParams.get('updated') === '1') {return 'Campaign updated successfully!'}
    return null
  })

  if (!message) {return null}

  return (
    <div className="flex items-center justify-between gap-3 mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
      <span className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        {message}
      </span>
      <button
        type="button"
        onClick={() => setMessage(null)}
        className="text-emerald-600 hover:text-emerald-800"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
