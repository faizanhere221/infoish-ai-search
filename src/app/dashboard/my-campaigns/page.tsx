'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ExternalLink, Loader2, MessageSquare, Megaphone, RotateCcw } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { formatMoney, formatDate, CAMPAIGN_CREATOR_STATUS_BADGE } from '@/components/campaigns/utils'
import type { CampaignCreatorForCreator } from '@/types/campaigns'

interface Profile { id: string; [key: string]: unknown }

export default function MyCampaignsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rows, setRows] = useState<CampaignCreatorForCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const token = localStorage.getItem('auth_token')

    if (!userStr || !token) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.user_type !== 'creator') {
      router.push('/dashboard/brand')
      return
    }

    setProfile(profileStr ? JSON.parse(profileStr) : null)
    setLoading(true)
    setLoadError(false)

    try {
      const res = await fetch('/api/campaign-creators?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setRows(data.campaign_creators || [])
      } else {
        setLoadError(true)
      }
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  async function messageBrand(row: CampaignCreatorForCreator) {
    setPendingId(row.id)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ creator_id: profile?.id, brand_id: row.brand?.id }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/messages/${data.conversation.id}`)
      }
    } finally {
      setPendingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="creator" profile={profile} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
          <p className="text-gray-500 mt-1">Campaigns a brand has added you to, and where things stand.</p>
        </div>

        {loadError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">Couldn&apos;t load your campaigns</h3>
            <button onClick={load} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-medium">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">No campaigns yet</h3>
            <p className="text-gray-500 mt-1">
              You&apos;ll see a campaign here once a brand adds you to it, or hires you through an application.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const badge = CAMPAIGN_CREATOR_STATUS_BADGE[row.status]
              return (
                <div key={row.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{row.campaign?.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{row.brand?.company_name || 'Brand'}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span>Planned: {formatDate(row.planned_date)}</span>
                      {row.payout_amount !== null && <span>Payout: {formatMoney(row.payout_amount, row.currency)}</span>}
                      {row.posted_url && (
                        <a href={row.posted_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-purple-dark hover:underline">
                          <ExternalLink className="w-3.5 h-3.5" /> View post
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/campaigns/${row.campaign_id}`}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      View brief
                    </Link>
                    <Link
                      href={`/dashboard/my-campaigns/${row.id}`}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Offer & deliverables
                    </Link>
                    <button
                      onClick={() => messageBrand(row)}
                      disabled={pendingId === row.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
                    >
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
