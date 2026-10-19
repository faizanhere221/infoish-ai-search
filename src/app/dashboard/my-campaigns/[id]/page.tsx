'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { OfferTab } from '@/components/campaigns/drawer/OfferTab'
import { DeliverablesTab } from '@/components/campaigns/drawer/DeliverablesTab'
import { ContractTab } from '@/components/campaigns/drawer/ContractTab'
import { PaymentsTab } from '@/components/campaigns/drawer/PaymentsTab'
import { ActivityTab } from '@/components/campaigns/drawer/ActivityTab'
import { CAMPAIGN_CREATOR_STATUS_BADGE } from '@/components/campaigns/utils'
import type { CampaignCreatorForCreator } from '@/types/campaigns'

interface Profile { id: string; [key: string]: unknown }

type Tab = 'offer' | 'deliverables' | 'contract' | 'payments' | 'activity'
const TABS: { id: Tab; label: string }[] = [
  { id: 'offer', label: 'Offer' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'contract', label: 'Contract' },
  { id: 'payments', label: 'Payments' },
  { id: 'activity', label: 'Activity' },
]

export default function MyCampaignDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <MyCampaignDetailPageContent />
    </Suspense>
  )
}

function MyCampaignDetailPageContent() {
  const params = useParams<{ id: string }>()
  const rowId = params.id
  const router = useRouter()
  const searchParams = useSearchParams()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [row, setRow] = useState<CampaignCreatorForCreator | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('offer')

  // Deep link from a chat message card or notification: ?tab=<tab> opens
  // straight to the right tab, same as clicking it manually would.
  useEffect(() => {
    const requestedTab = searchParams.get('tab') as Tab | null
    if (requestedTab && TABS.some((t) => t.id === requestedTab)) {
      setTab(requestedTab)
    }
  }, [searchParams])

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const authToken = localStorage.getItem('auth_token')

    if (!userStr || !authToken) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    if (user.user_type !== 'creator') {
      router.push('/dashboard/brand')
      return
    }

    setProfile(profileStr ? JSON.parse(profileStr) : null)
    setToken(authToken)
    setLoading(true)

    try {
      const res = await fetch('/api/campaign-creators?limit=100', { headers: { Authorization: `Bearer ${authToken}` } })
      if (res.ok) {
        const data = await res.json()
        const match = (data.campaign_creators || []).find((r: CampaignCreatorForCreator) => r.id === rowId)
        setRow(match || null)
      }
    } finally {
      setLoading(false)
    }
  }, [rowId, router])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    )
  }

  if (!row) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userType="creator" profile={profile} />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-gray-600">This campaign isn&apos;t available.</p>
          <Link href="/dashboard/my-campaigns" className="mt-4 inline-block text-brand-purple-dark hover:underline">Back to My Campaigns</Link>
        </main>
      </div>
    )
  }

  const badge = CAMPAIGN_CREATOR_STATUS_BADGE[row.status]

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="creator" profile={profile} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link href="/dashboard/my-campaigns" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="min-w-0 flex items-center gap-2">
              <h1 className="font-semibold text-gray-900 truncate">{row.campaign?.title}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${badge.bg} ${badge.text}`}>{badge.label}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-500 mb-6">{row.brand?.company_name}</p>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-100" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                  tab === t.id ? 'border-brand-pink text-brand-purple-dark' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-4">
            {tab === 'offer' && profile && (
              <OfferTab
                campaignCreatorId={row.id}
                creatorId={profile.id}
                actorType="creator"
                token={token}
                currency={row.currency}
                onOfferAccepted={load}
              />
            )}
            {tab === 'deliverables' && <DeliverablesTab campaignCreatorId={row.id} actorType="creator" token={token} />}
            {tab === 'contract' && <ContractTab campaignCreatorId={row.id} actorType="creator" token={token} />}
            {tab === 'payments' && <PaymentsTab campaignCreatorId={row.id} actorType="creator" rowStatus={row.status} token={token} />}
            {tab === 'activity' && <ActivityTab campaignCreatorId={row.id} token={token} />}
          </div>
        </div>
      </main>
    </div>
  )
}
