'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { CampaignCreatorEvent } from '@/types/campaigns'

interface ActivityTabProps {
  campaignCreatorId: string
  token: string | null
}

const EVENT_LABELS: Record<string, string> = {
  offer_sent: 'sent an offer',
  offer_accepted: 'accepted an offer',
  offer_declined: 'declined an offer',
  offer_countered: 'countered an offer',
  offer_withdrawn: 'withdrew an offer',
  deliverable_draft_submitted: 'submitted a draft',
  deliverable_changes_requested: 'requested changes',
  deliverable_approved: 'approved a draft',
  deliverable_posted: 'marked a deliverable posted',
  deliverable_completed: 'marked a deliverable complete',
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function ActivityTab({ campaignCreatorId, token }: ActivityTabProps) {
  const [events, setEvents] = useState<CampaignCreatorEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/events`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      } else {
        setError('Could not load activity')
      }
    } catch {
      setError('Could not load activity — check your connection and try again')
    } finally {
      setLoading(false)
    }
  }, [campaignCreatorId, token])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  if (error) {
    return <p className="text-sm text-red-600 text-center py-4">{error}</p>
  }

  if (events.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No activity yet.</p>
  }

  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3 text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-purple mt-2 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-gray-700">
              <span className="font-medium capitalize">{event.actor_type}</span>{' '}
              {EVENT_LABELS[event.event_type] || event.event_type.replace(/_/g, ' ')}
              {typeof event.payload?.title === 'string' ? `: "${event.payload.title}"` : ''}
            </p>
            <p className="text-xs text-gray-400">{formatTimestamp(event.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default ActivityTab
