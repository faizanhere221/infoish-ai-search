'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { formatMoney, formatDate } from '@/components/campaigns/utils'

interface Profile { id: string; [key: string]: unknown }

interface Payment {
  id: string
  campaign_creator_id: string
  amount: number
  currency: string
  type: string
  status: string
  due_date: string | null
  method: string | null
  reference: string | null
  dispute_reason: string | null
  campaign_title: string | null
  brand_name: string | null
}

type TabId = 'upcoming' | 'due' | 'paid' | 'confirmed'

const TABS: { id: TabId; label: string; status: string }[] = [
  { id: 'upcoming', label: 'Upcoming', status: 'scheduled' },
  { id: 'due', label: 'Due', status: 'due' },
  { id: 'paid', label: 'Paid', status: 'marked_paid' },
  { id: 'confirmed', label: 'Confirmed', status: 'confirmed' },
]

export default function EarningsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('due')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [disputingId, setDisputingId] = useState<string | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
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
    setProfile(JSON.parse(localStorage.getItem('auth_profile') || 'null'))
    setToken(authToken)
    setLoading(true)

    try {
      const res = await fetch('/api/campaign-creators/my-payments', { headers: { Authorization: `Bearer ${authToken}` } })
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const status = TABS.find((t) => t.id === tab)?.status
    return payments.filter((p) => p.status === status)
  }, [payments, tab])

  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const p of filtered) {totals[p.currency] = (totals[p.currency] || 0) + p.amount}
    return totals
  }, [filtered])

  async function confirmReceipt(p: Payment) {
    if (!token) {return}
    setBusyId(p.id)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${p.campaign_creator_id}/payments/${p.id}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to confirm')
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function submitDispute(p: Payment) {
    if (!token || !disputeReason.trim()) {return}
    setBusyId(p.id)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${p.campaign_creator_id}/payments/${p.id}/dispute`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to dispute')
        return
      }
      setDisputingId(null)
      setDisputeReason('')
      await load()
    } finally {
      setBusyId(null)
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
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-500 mt-1">Payments are made directly between brand and creator. Infoishai keeps the record.</p>
        </div>

        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === t.id ? 'bg-gradient-to-r from-brand-pink to-brand-purple text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        {Object.keys(totalsByCurrency).length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
            {Object.entries(totalsByCurrency).map(([currency, total]) => (
              <span key={currency} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
                {formatMoney(total, currency)} total
              </span>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Nothing here yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{p.campaign_title}</p>
                    <p className="text-xs text-gray-500">{p.brand_name}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatMoney(p.amount, p.currency)}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {p.due_date && <span>Due {formatDate(p.due_date)}</span>}
                  {p.method && <span>via {p.method}{p.reference ? ` · ${p.reference}` : ''}</span>}
                </div>
                {p.dispute_reason && p.status === 'disputed' && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 mt-2">{p.dispute_reason}</p>
                )}
                {p.status === 'marked_paid' && (
                  disputingId === p.id ? (
                    <div className="space-y-2 mt-2 p-3 bg-gray-50 rounded-lg">
                      <input value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="What's wrong?" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                      <div className="flex gap-2">
                        <button onClick={() => setDisputingId(null)} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
                        <button onClick={() => submitDispute(p)} disabled={busyId === p.id || !disputeReason.trim()} className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Dispute</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => confirmReceipt(p)} disabled={busyId === p.id} className="px-3 py-1.5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium disabled:opacity-50">
                        Confirm receipt
                      </button>
                      <button onClick={() => setDisputingId(p.id)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600">
                        Dispute
                      </button>
                    </div>
                  )
                )}
                <Link href={`/dashboard/my-campaigns/${p.campaign_creator_id}`} className="inline-block mt-2 text-xs text-brand-purple-dark hover:underline">
                  View campaign
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
