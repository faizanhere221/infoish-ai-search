'use client'

import { useEffect, useState } from 'react'
import { Loader2, Mail } from 'lucide-react'

const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  messages: { label: 'Messages', description: 'Unread message digests when a conversation goes quiet for a while.' },
  offers: { label: 'Offers', description: 'A new offer, a counter-offer, or a response to one you sent.' },
  contracts: { label: 'Contracts', description: 'A contract ready to sign, countersign, or a change to one.' },
  work: { label: 'Work updates', description: 'Drafts to review, changes requested, deliverables posted.' },
  payments: { label: 'Payments', description: 'A payment marked paid, confirmed, or disputed.' },
  daily_summary: { label: 'Daily summary', description: 'One email a day with everything that happened and anything overdue.' },
  profile_tips: { label: 'Profile tips', description: 'Occasional reminders about what your profile is missing.' },
  founder_notes: { label: 'Notes from the founder', description: 'A one-time personal welcome from our founder.' },
}

const ORDER = ['messages', 'offers', 'contracts', 'work', 'payments', 'daily_summary', 'profile_tips', 'founder_notes']

export function EmailPreferencesSettings() {
  const [preferences, setPreferences] = useState<Record<string, boolean> | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {return}
    fetch('/api/account/email-preferences', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setPreferences(data.preferences))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (category: string) => {
    if (!preferences) {return}
    const token = localStorage.getItem('auth_token')
    if (!token) {return}
    const nextValue = !preferences[category]
    setSaving(category)
    setPreferences({ ...preferences, [category]: nextValue })
    try {
      await fetch('/api/account/email-preferences', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [category]: nextValue }),
      })
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
      </div>
    )
  }

  if (loadError || !preferences) {
    return <p className="text-sm text-gray-500">Couldn&apos;t load email preferences. Try refreshing the page.</p>
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900">Email notifications</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Choose which emails you get. Account and security emails (welcome, verification, password reset) always send.
      </p>
      <div className="space-y-4">
        {ORDER.map((category) => {
          const meta = CATEGORY_LABELS[category]
          const enabled = preferences[category] !== false
          return (
            <div key={category} className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{meta.label}</p>
                <p className="text-sm text-gray-500">{meta.description}</p>
              </div>
              <button
                onClick={() => toggle(category)}
                disabled={saving === category}
                aria-label={`Toggle ${meta.label} emails`}
                className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  enabled ? 'bg-brand-purple' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    enabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EmailPreferencesSettings
