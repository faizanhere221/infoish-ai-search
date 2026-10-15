'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Download, Loader2, RotateCcw } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { formatMoney, formatDate } from '@/components/campaigns/utils'

interface Profile { id: string; [key: string]: unknown }

interface PaymentRow {
  id: string
  campaign_creator_id: string
  amount: number
  currency: string
  type: string
  status: string
  due_date: string | null
  method: string | null
  reference: string | null
  campaign_title: string | null
  client_name: string | null
  creator_name: string | null
  creator_username: string | null
}

type TabId = 'due' | 'overdue' | 'waiting' | 'paid' | 'disputed'

const TABS: { id: TabId; label: string }[] = [
  { id: 'due', label: 'Due' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'waiting', label: 'Waiting for confirmation' },
  { id: 'paid', label: 'Paid' },
  { id: 'disputed', label: 'Disputed' },
]

function matchesTab(p: PaymentRow, tab: TabId): boolean {
  const overdue = p.status === 'due' && !!p.due_date && new Date(p.due_date) < new Date()
  if (tab === 'overdue') {return overdue}
  if (tab === 'due') {return p.status === 'due' && !overdue}
  if (tab === 'waiting') {return p.status === 'marked_paid'}
  if (tab === 'paid') {return p.status === 'confirmed'}
  if (tab === 'disputed') {return p.status === 'disputed'}
  return false
}

export default function PaymentsDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tab, setTab] = useState<TabId>('due')
  const [campaignFilter, setCampaignFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')

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

    try {
      const res = await fetch('/api/payments', { headers: { Authorization: `Bearer ${authToken}` } })
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
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

  const campaignOptions = useMemo(() => [...new Set(payments.map((p) => p.campaign_title).filter(Boolean))] as string[], [payments])
  const clientOptions = useMemo(() => [...new Set(payments.map((p) => p.client_name).filter(Boolean))] as string[], [payments])

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (!matchesTab(p, tab)) {return false}
      if (campaignFilter && p.campaign_title !== campaignFilter) {return false}
      if (clientFilter && p.client_name !== clientFilter) {return false}
      return true
    })
  }, [payments, tab, campaignFilter, clientFilter])

  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const p of filtered) {totals[p.currency] = (totals[p.currency] || 0) + p.amount}
    return totals
  }, [filtered])

  function exportCsv() {
    const header = ['Creator', 'Campaign', 'Client', 'Type', 'Status', 'Amount', 'Currency', 'Due date', 'Method', 'Reference']
    const lines = [header.join(',')]
    for (const p of filtered) {
      const fields = [
        p.creator_name || '', p.campaign_title || '', p.client_name || '', p.type, p.status,
        p.amount, p.currency, p.due_date || '', p.method || '', p.reference || '',
      ]
      lines.push(fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${tab}.csv`
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Payments are made directly between brand and creator. Infoishai keeps the record.</p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                tab === t.id ? 'bg-gradient-to-r from-brand-pink to-brand-purple text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">All campaigns</option>
            {campaignOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">All clients</option>
            {clientOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 ml-auto">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {Object.keys(totalsByCurrency).length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
            {Object.entries(totalsByCurrency).map(([currency, total]) => (
              <span key={currency} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
                {formatMoney(total, currency)} total
              </span>
            ))}
          </div>
        )}

        {loadError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">Could not load payments</h3>
            <button onClick={load} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:shadow-lg">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No payments here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3">Creator</th>
                  <th className="p-3">Campaign</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Due date</th>
                  <th className="p-3">Method</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{p.creator_name}</p>
                      <p className="text-xs text-gray-500">@{p.creator_username}</p>
                    </td>
                    <td className="p-3 text-gray-600">{p.campaign_title}</td>
                    <td className="p-3 text-gray-600">{p.client_name || '—'}</td>
                    <td className="p-3 text-gray-600 capitalize">{p.type.replace('_', ' ')}</td>
                    <td className="p-3 text-right text-gray-900">{formatMoney(p.amount, p.currency)}</td>
                    <td className="p-3 text-gray-600">{p.due_date ? formatDate(p.due_date) : '—'}</td>
                    <td className="p-3 text-gray-600">{p.method ? `${p.method}${p.reference ? ` · ${p.reference}` : ''}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
