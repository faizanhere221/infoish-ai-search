'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { ExternalLink, Loader2, ShieldX } from 'lucide-react'
import Logo from '@/components/Logo'
import { CAMPAIGN_CREATOR_STATUS_LABELS, type CampaignCreatorStatus } from '@/types/campaigns'
import { formatMoney } from '@/components/campaigns/utils'
import { platformEmoji } from '@/utils/constants'

const STATUS_BADGE: Record<CampaignCreatorStatus, { bg: string; text: string }> = {
  shortlisted: { bg: 'bg-gray-100', text: 'text-gray-700' },
  contacted: { bg: 'bg-blue-100', text: 'text-blue-700' },
  negotiating: { bg: 'bg-amber-100', text: 'text-amber-700' },
  confirmed: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  drafting: { bg: 'bg-purple-100', text: 'text-purple-700' },
  draft_review: { bg: 'bg-orange-100', text: 'text-orange-700' },
  scheduled: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  posted: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  dropped: { bg: 'bg-red-100', text: 'text-red-700' },
}

interface ShareCreatorRow {
  id: string
  status: CampaignCreatorStatus
  planned_date: string | null
  posted_at: string | null
  posted_url: string | null
  currency: string
  charge_amount?: number | null
  views?: number
  engagements?: number
  cpm_on_charge?: number | null
  creator: {
    id: string
    username: string
    display_name: string
    profile_photo_url: string | null
    total_followers: number
    primary_platform: string | null
  } | null
}

interface SharePayload {
  campaign: { title: string; status: string }
  creators: ShareCreatorRow[]
  totals: { total_creators: number; posted_count: number; completed_count: number; total_charge?: number; total_views?: number }
  show_charge: boolean
  show_results: boolean
}

export default function SharePage() {
  const params = useParams<{ token: string }>()
  const [data, setData] = useState<SharePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/share/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {throw new Error('not found')}
        return res.json()
      })
      .then((payload) => { if (!cancelled) {setData(payload)} })
      .catch(() => { if (!cancelled) {setNotFound(true)} })
      .finally(() => { if (!cancelled) {setLoading(false)} })
    return () => { cancelled = true }
  }, [params.token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="font-semibold text-gray-900 text-lg">This link isn&apos;t available</h1>
          <p className="text-gray-500 mt-2">
            It may have been revoked, or the address isn&apos;t quite right. Please check with whoever sent you this link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2">
          <Logo size="sm" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{data.campaign.title}</h1>
        <p className="text-gray-500 mt-1">Campaign progress</p>

        <div className={`grid grid-cols-2 ${data.show_charge && data.show_results ? 'sm:grid-cols-5' : data.show_charge || data.show_results ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4 mt-6 mb-8`}>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{data.totals.total_creators}</p>
            <p className="text-xs text-gray-500 mt-1">Creators</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{data.totals.posted_count}</p>
            <p className="text-xs text-gray-500 mt-1">Posted</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{data.totals.completed_count}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>
          {data.show_charge && data.totals.total_charge !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{formatMoney(data.totals.total_charge, data.creators[0]?.currency || 'USD')}</p>
              <p className="text-xs text-gray-500 mt-1">Total</p>
            </div>
          )}
          {data.show_results && data.totals.total_views !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{data.totals.total_views.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Views</p>
            </div>
          )}
        </div>

        {data.creators.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No creators have been added to this campaign yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-4">Creator</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Planned date</th>
                  <th className="p-4">Posted</th>
                  {data.show_charge && <th className="p-4 text-right">Charge</th>}
                  {data.show_results && <th className="p-4 text-right">Views</th>}
                  {data.show_results && <th className="p-4 text-right">CPM</th>}
                </tr>
              </thead>
              <tbody>
                {data.creators.map((row) => {
                  const badge = STATUS_BADGE[row.status]
                  return (
                    <tr key={row.id} className="border-b border-gray-50 last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {row.creator?.profile_photo_url ? (
                              <Image src={row.creator.profile_photo_url} alt="" width={32} height={32} className="object-cover w-full h-full" />
                            ) : (
                              <span className="text-xs font-semibold text-brand-purple-dark">{row.creator?.display_name?.charAt(0) || '?'}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{row.creator?.display_name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {row.creator?.primary_platform ? platformEmoji(row.creator.primary_platform) : ''} @{row.creator?.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {CAMPAIGN_CREATOR_STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{row.planned_date ? new Date(row.planned_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                      <td className="p-4">
                        {row.posted_url ? (
                          <a href={row.posted_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-purple-dark hover:underline">
                            <ExternalLink className="w-4 h-4" /> View
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      {data.show_charge && (
                        <td className="p-4 text-right text-gray-900">
                          {formatMoney(row.charge_amount, row.currency)}
                        </td>
                      )}
                      {data.show_results && (
                        <td className="p-4 text-right text-gray-900">{(row.views ?? 0).toLocaleString()}</td>
                      )}
                      {data.show_results && (
                        <td className="p-4 text-right text-gray-900">
                          {row.cpm_on_charge ? formatMoney(row.cpm_on_charge, row.currency) : '—'}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">
          Powered by Infoishai — connecting brands with tech creators.
        </p>
      </main>
    </div>
  )
}
