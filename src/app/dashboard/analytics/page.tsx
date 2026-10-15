'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, RotateCcw } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { formatMoney } from '@/components/campaigns/utils'

interface Profile { id: string; [key: string]: unknown }

interface MonthBucket { month: string; spend: number; charge: number; profit: number }
interface ClientBucket { client_name: string; spend: number; charge: number; profit: number }
interface CreatorEntry { creator_id: string; creator_name: string | null; creator_username: string | null; views: number; cost_per_view: number | null }

interface AnalyticsPayload {
  by_month: MonthBucket[]
  by_client: ClientBucket[]
  top_creators_by_views: CreatorEntry[]
  top_creators_by_cost_per_view: CreatorEntry[]
  on_time_rate: number | null
  available_clients: string[]
}

// Plain Tailwind bar — no chart library installed, so widths are computed
// directly from the data's own max value.
function Bar({ label, value, max, formatValue, colorClass = 'bg-brand-purple' }: {
  label: string; value: number; max: number; formatValue: (v: number) => string; colorClass?: string
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 flex-shrink-0 text-xs text-gray-500 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 flex-shrink-0 text-xs text-gray-700 text-right">{formatValue(value)}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [client, setClient] = useState('')

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
      router.push('/dashboard/creator')
      return
    }
    setProfile(profileStr ? JSON.parse(profileStr) : null)
    setLoading(true)
    setLoadError(false)

    const qs = new URLSearchParams()
    if (start) {qs.set('start', start)}
    if (end) {qs.set('end', end)}
    if (client) {qs.set('client', client)}

    try {
      const res = await fetch(`/api/analytics?${qs.toString()}`, { headers: { Authorization: `Bearer ${authToken}` } })
      if (res.ok) {
        setData(await res.json())
      } else {
        setLoadError(true)
      }
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [router, start, end, client])

  useEffect(() => { load() }, [load])

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    )
  }

  const currency = 'USD'
  const maxMonthCharge = Math.max(1, ...(data?.by_month.map((m) => m.charge) || [0]))
  const maxClientCharge = Math.max(1, ...(data?.by_client.map((c) => c.charge) || [0]))
  const maxViews = Math.max(1, ...(data?.top_creators_by_views.map((c) => c.views) || [0]))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="brand" profile={profile} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Analytics</h1>

        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Client</label>
            <select value={client} onChange={(e) => setClient(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">All clients</option>
              {data?.available_clients.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loadError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">Could not load analytics</h3>
            <button onClick={load} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:shadow-lg">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : !data || data.by_month.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No data for this range yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Charge by month</h2>
              <div className="space-y-2">
                {data.by_month.map((m) => (
                  <Bar key={m.month} label={m.month} value={m.charge} max={maxMonthCharge} formatValue={(v) => formatMoney(v, currency)} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Charge by client</h2>
              <div className="space-y-2">
                {data.by_client.map((c) => (
                  <Bar key={c.client_name} label={c.client_name} value={c.charge} max={maxClientCharge} formatValue={(v) => formatMoney(v, currency)} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Top creators by views</h2>
                <div className="space-y-2">
                  {data.top_creators_by_views.map((c) => (
                    <Bar
                      key={c.creator_id}
                      label={c.creator_name || c.creator_username || 'Creator'}
                      value={c.views}
                      max={maxViews}
                      formatValue={(v) => v.toLocaleString()}
                      colorClass="bg-brand-pink"
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Top creators by cost per view</h2>
                <div className="space-y-2 text-sm text-gray-600">
                  {data.top_creators_by_cost_per_view.length === 0 ? (
                    <p className="text-gray-400 text-xs">No charge/views data yet.</p>
                  ) : data.top_creators_by_cost_per_view.map((c) => (
                    <div key={c.creator_id} className="flex items-center justify-between">
                      <span className="truncate">{c.creator_name || c.creator_username}</span>
                      <span className="font-medium text-gray-900">{formatMoney(c.cost_per_view, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-1">On-time rate</h2>
              <p className="text-3xl font-bold text-gray-900">{data.on_time_rate === null ? '—' : `${data.on_time_rate.toFixed(1)}%`}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
