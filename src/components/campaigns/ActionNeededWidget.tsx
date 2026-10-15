'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ListChecks } from 'lucide-react'
import { formatDate } from '@/components/campaigns/utils'

interface ActionItem {
  campaign_creator_id: string
  campaign_id: string
  campaign_title: string
  counterpart_name: string
  label: string
  tab: string
  created_at: string
}

// "Action needed" list for a dashboard home, built from the same
// getNextStep() signals as the tracker row / campaign card, sorted
// oldest-first. Renders nothing while loading or if there's nothing to do,
// so it's safe to drop onto either dashboard home.
export function ActionNeededWidget({ viewerType }: { viewerType: 'brand' | 'creator' }) {
  const [items, setItems] = useState<ActionItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {return}
    fetch('/api/dashboard/action-needed', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setItems(data.items || []))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded || items.length === 0) {return null}

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
        <ListChecks className="w-4 h-4 text-brand-purple-dark" />
        Action needed ({items.length})
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.campaign_creator_id}
            href={
              viewerType === 'brand'
                ? `/dashboard/campaigns/${item.campaign_id}/tracker?row=${item.campaign_creator_id}&tab=${item.tab}`
                : `/dashboard/my-campaigns/${item.campaign_creator_id}?tab=${item.tab}`
            }
            className="flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-100 hover:border-brand-pink/30 hover:bg-gray-50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
              <p className="text-xs text-gray-500 truncate">
                {item.campaign_title} · {item.counterpart_name} · since {formatDate(item.created_at)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ActionNeededWidget
