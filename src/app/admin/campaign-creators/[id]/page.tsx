'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react'

interface Detail {
  row: Record<string, unknown> & { id: string; status: string; planned_date: string | null; posted_url: string | null }
  campaign: { id: string; title: string; brand_id: string; status: string; objective: string | null } | null
  creator: { id: string; username: string; display_name: string } | null
  brand: { id: string; company_name: string } | null
  offers: Record<string, unknown>[]
  contracts: Record<string, unknown>[]
  deliverables: (Record<string, unknown> & { id: string; title: string; status: string; results: Record<string, unknown>[] })[]
  events: Record<string, unknown>[]
  payments: Record<string, unknown>[]
}

type Tab = 'offers' | 'contracts' | 'deliverables' | 'payments' | 'events'
const TABS: { id: Tab; label: string }[] = [
  { id: 'offers', label: 'Offers' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'payments', label: 'Payments' },
  { id: 'events', label: 'Activity' },
]

function fmtDateTime(d: string | null) {
  if (!d) {return '—'}
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtMoney(amount: unknown, currency: unknown) {
  const n = Number(amount) || 0
  const symbols: Record<string, string> = { USD: '$', CAD: '$', AUD: '$', GBP: '£', EUR: '€' }
  const symbol = symbols[String(currency)]
  return symbol ? `${symbol}${n.toLocaleString()}` : `${n.toLocaleString()} ${currency}`
}

export default function AdminCampaignCreatorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('offers')

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch(`/api/admin/campaign-creators/${params.id}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      if (res.status === 404) { setNotFound(true); setLoading(false); return }
      if (!res.ok) {throw new Error('Failed to load')}
      setDetail(await res.json())
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  if (loading) {
    return <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-gray-400">Loading…</p></div>
  }
  if (notFound) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500 font-medium">Row not found</p>
        <Link href="/admin/campaign-creators" className="mt-4 inline-block text-sm text-violet-600 hover:text-violet-700">Back to Tracker</Link>
      </div>
    )
  }
  if (loadError || !detail) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-700 font-medium mb-1">Couldn&apos;t load this row</p>
        <button onClick={() => fetchDetail()} className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    )
  }

  const { row, campaign, creator, brand, offers, contracts, deliverables, events, payments } = detail

  return (
    <div className="space-y-6">
      <Link href="/admin/campaign-creators" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Tracker
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900">{campaign?.title ?? 'Untitled campaign'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {creator?.display_name ?? creator?.username ?? '—'} × {brand?.company_name ?? '—'}
        </p>
        <span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 capitalize">{row.status.replace('_', ' ')}</span>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'offers' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          {offers.length === 0 ? <p className="text-sm text-gray-400">No offers.</p> : (
            <div className="space-y-3">
              {offers.map((o) => (
                <div key={String(o.id)} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 capitalize">{String(o.from_party)} offered {fmtMoney(o.amount, o.currency)}</span>
                    <span className="text-xs text-gray-400 capitalize">{String(o.status)}</span>
                  </div>
                  {o.deliverables_summary ? <p className="text-gray-500 mt-1">{String(o.deliverables_summary)}</p> : null}
                  <p className="text-gray-400 text-xs mt-1">{fmtDateTime(String(o.created_at))}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          {contracts.length === 0 ? <p className="text-sm text-gray-400">No contracts.</p> : (
            <div className="space-y-3">
              {contracts.map((c) => (
                <div key={String(c.id)} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Version {String(c.version)}</span>
                    <span className="text-xs text-gray-400 capitalize">{String(c.status).replace('_', ' ')}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">Payment terms: {String(c.payment_terms_days)} days · Kill fee: {String(c.kill_fee_percent)}%</p>
                  {c.voided_reason ? <p className="text-red-600 text-xs mt-1">Voided: {String(c.voided_reason)}</p> : null}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    <span>Creator signed: {c.creator_signed_at ? fmtDateTime(String(c.creator_signed_at)) : '—'}</span>
                    <span>Brand signed: {c.brand_signed_at ? fmtDateTime(String(c.brand_signed_at)) : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'deliverables' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          {deliverables.length === 0 ? <p className="text-sm text-gray-400">No deliverables.</p> : (
            <div className="space-y-4">
              {deliverables.map((d) => (
                <div key={d.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{d.title}</span>
                    <span className="text-xs text-gray-400 capitalize">{d.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">Draft due: {fmtDateTime(String(d.draft_due ?? ''))} · Publish due: {fmtDateTime(String(d.publish_due ?? ''))}</p>
                  {d.results.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-3 text-xs text-gray-500">
                      {d.results.map((r) => (
                        <span key={String(r.id)}>👁 {String(r.views)} · ❤ {String(r.likes)} · 💬 {String(r.comments)}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          {payments.length === 0 ? <p className="text-sm text-gray-400">No payments.</p> : (
            <div className="space-y-2">
              {payments.map((p) => (
                <Link key={String(p.id)} href={`/admin/payments/${p.id}`} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg hover:bg-violet-50">
                  <span className="text-gray-700 capitalize">{String(p.type)} — {fmtMoney(p.amount, p.currency)}</span>
                  <span className="text-xs text-gray-400 capitalize">{String(p.status).replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          {events.length === 0 ? <p className="text-sm text-gray-400">No activity yet.</p> : (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={String(e.id)} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 capitalize">{String(e.event_type).replace(/_/g, ' ')} <span className="text-gray-400">· {String(e.actor_type)}</span></p>
                  </div>
                  <span className="text-gray-400 text-xs flex-shrink-0">{fmtDateTime(String(e.created_at))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
