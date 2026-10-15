'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { formatMoney } from '@/components/campaigns/utils'

interface Profile { id: string; [key: string]: unknown }

interface CreatorReportRow {
  campaign_creator_id: string
  creator_name: string | null
  creator_username: string | null
  status: string
  payout_amount: number | null
  charge_amount: number | null
  currency: string
  posted_count: number
  views: number
  engagements: number
  engagement_rate: number | null
  cpm_on_charge: number | null
  cpm_on_payout: number | null
  on_time_rate: number | null
}

interface ReportTotals {
  posted_count: number
  views: number
  engagements: number
  engagement_rate: number | null
  total_payout: number
  total_charge: number
  total_profit: number
  cpm_on_charge: number | null
  cpm_on_payout: number | null
  cost_per_engagement_charge: number | null
  cost_per_engagement_payout: number | null
  on_time_rate: number | null
}

function pct(v: number | null): string {
  return v === null ? '—' : `${v.toFixed(1)}%`
}

function money(v: number | null, currency: string): string {
  return v === null ? '—' : formatMoney(v, currency)
}

export default function CampaignReportPage() {
  const params = useParams<{ id: string }>()
  const campaignId = params.id
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [campaignTitle, setCampaignTitle] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [totals, setTotals] = useState<ReportTotals | null>(null)
  const [creators, setCreators] = useState<CreatorReportRow[]>([])
  const [paymentsByCurrency, setPaymentsByCurrency] = useState<{ currency: string; paid: number; outstanding: number }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const authToken = localStorage.getItem('auth_token')
    if (!userStr || !authToken) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    if (user.user_type !== 'brand') {
      router.push('/dashboard/campaigns')
      return
    }
    setProfile(profileStr ? JSON.parse(profileStr) : null)
    setLoading(true)

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/report`, { headers: { Authorization: `Bearer ${authToken}` } })
      if (!res.ok) {
        router.push(`/dashboard/campaigns/${campaignId}/tracker`)
        return
      }
      const data = await res.json()
      setCampaignTitle(data.campaign?.title || '')
      setCurrency(data.campaign?.currency || 'USD')
      setTotals(data.totals)
      setCreators(data.creators || [])
      setPaymentsByCurrency(data.payments_by_currency || [])
    } finally {
      setLoading(false)
    }
  }, [campaignId, router])

  useEffect(() => { load() }, [load])

  function exportCsv() {
    const header = ['Creator', 'Handle', 'Status', 'Posted', 'Views', 'Engagements', 'Engagement rate', 'Payout', 'Charge', 'CPM (charge)', 'CPM (payout)', 'On-time %']
    const lines = [header.join(',')]
    for (const c of creators) {
      const fields = [
        c.creator_name || '', c.creator_username || '', c.status, c.posted_count,
        c.views, c.engagements, c.engagement_rate?.toFixed(1) ?? '',
        c.payout_amount ?? '', c.charge_amount ?? '',
        c.cpm_on_charge?.toFixed(2) ?? '', c.cpm_on_payout?.toFixed(2) ?? '', c.on_time_rate?.toFixed(1) ?? '',
      ]
      lines.push(fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaignTitle || 'campaign'}-report.csv`
    a.click()
    URL.revokeObjectURL(url)
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
      <DashboardHeader userType="brand" profile={profile} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link href={`/dashboard/campaigns/${campaignId}/tracker`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="font-semibold text-gray-900 truncate">{campaignTitle} — Report</h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!totals ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No creators on this campaign yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">Posted</p>
                <p className="text-2xl font-bold text-gray-900">{totals.posted_count}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">Views</p>
                <p className="text-2xl font-bold text-gray-900">{totals.views.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">Engagements</p>
                <p className="text-2xl font-bold text-gray-900">{totals.engagements.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">Engagement rate</p>
                <p className="text-2xl font-bold text-gray-900">{pct(totals.engagement_rate)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">Payout</p>
                <p className="text-2xl font-bold text-gray-900">{money(totals.total_payout, currency)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">Charge</p>
                <p className="text-2xl font-bold text-gray-900">{money(totals.total_charge, currency)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">Profit</p>
                <p className={`text-2xl font-bold ${totals.total_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{money(totals.total_profit, currency)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">On-time rate</p>
                <p className="text-2xl font-bold text-gray-900">{pct(totals.on_time_rate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">CPM (on charge)</p>
                <p className="text-xl font-semibold text-gray-900">{totals.cpm_on_charge ? money(totals.cpm_on_charge, currency) : '—'}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">CPM (on payout)</p>
                <p className="text-xl font-semibold text-gray-900">{totals.cpm_on_payout ? money(totals.cpm_on_payout, currency) : '—'}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">Cost / engagement (charge)</p>
                <p className="text-xl font-semibold text-gray-900">{totals.cost_per_engagement_charge ? money(totals.cost_per_engagement_charge, currency) : '—'}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-gray-500 text-sm mb-1">Cost / engagement (payout)</p>
                <p className="text-xl font-semibold text-gray-900">{totals.cost_per_engagement_payout ? money(totals.cost_per_engagement_payout, currency) : '—'}</p>
              </div>
            </div>

            {paymentsByCurrency.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <h2 className="font-semibold text-gray-900 mb-3">Paid vs. outstanding</h2>
                <div className="flex flex-wrap gap-6">
                  {paymentsByCurrency.map((p) => (
                    <div key={p.currency}>
                      <p className="text-xs text-gray-500 mb-1">{p.currency}</p>
                      <p className="text-sm text-gray-700">
                        <span className="text-emerald-600 font-semibold">{money(p.paid, p.currency)}</span> paid &middot;{' '}
                        <span className="text-amber-600 font-semibold">{money(p.outstanding, p.currency)}</span> outstanding
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mb-3">
              <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="p-3">Creator</th>
                    <th className="p-3 text-right">Posted</th>
                    <th className="p-3 text-right">Views</th>
                    <th className="p-3 text-right">Engagements</th>
                    <th className="p-3 text-right">Eng. rate</th>
                    <th className="p-3 text-right">Payout</th>
                    <th className="p-3 text-right">Charge</th>
                    <th className="p-3 text-right">CPM (charge)</th>
                    <th className="p-3 text-right">On-time</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((c) => (
                    <tr key={c.campaign_creator_id} className="border-b border-gray-50 last:border-0">
                      <td className="p-3">
                        <p className="font-medium text-gray-900">{c.creator_name}</p>
                        <p className="text-xs text-gray-500">@{c.creator_username}</p>
                      </td>
                      <td className="p-3 text-right">{c.posted_count}</td>
                      <td className="p-3 text-right">{c.views.toLocaleString()}</td>
                      <td className="p-3 text-right">{c.engagements.toLocaleString()}</td>
                      <td className="p-3 text-right">{pct(c.engagement_rate)}</td>
                      <td className="p-3 text-right">{money(c.payout_amount, c.currency)}</td>
                      <td className="p-3 text-right">{money(c.charge_amount, c.currency)}</td>
                      <td className="p-3 text-right">{c.cpm_on_charge ? money(c.cpm_on_charge, c.currency) : '—'}</td>
                      <td className="p-3 text-right">{pct(c.on_time_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
