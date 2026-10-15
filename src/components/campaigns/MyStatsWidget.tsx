'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { formatMoney } from '@/components/campaigns/utils'

interface StatsPayload {
  campaigns_completed: number
  total_earned_by_currency: Record<string, number>
  on_time_rate: number | null
}

// Creator-facing summary of their own history across campaigns. Renders
// nothing while loading or if there's nothing to show yet.
export function MyStatsWidget() {
  const [stats, setStats] = useState<StatsPayload | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {return}
    fetch('/api/campaign-creators/my-stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats)
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded || !stats || stats.campaigns_completed === 0) {return null}

  const earnedEntries = Object.entries(stats.total_earned_by_currency)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
      <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
        <TrendingUp className="w-4 h-4 text-brand-purple-dark" />
        Your campaign stats
      </h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xl font-bold text-gray-900">{stats.campaigns_completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">
            {earnedEntries.length > 0 ? earnedEntries.map(([cur, amt]) => formatMoney(amt, cur)).join(', ') : '—'}
          </p>
          <p className="text-xs text-gray-500">Total earned</p>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{stats.on_time_rate === null ? '—' : `${stats.on_time_rate.toFixed(0)}%`}</p>
          <p className="text-xs text-gray-500">On-time</p>
        </div>
      </div>
    </div>
  )
}

export default MyStatsWidget
