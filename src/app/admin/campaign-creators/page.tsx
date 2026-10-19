'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate as formatDateUTC } from '@/lib/format-date'
import {
  Search, X, RefreshCw, Filter, ChevronLeft, ChevronRight, Eye, AlertTriangle,
} from 'lucide-react'

interface AdminRow {
  id: string
  status: string
  planned_date: string | null
  posted_at: string | null
  created_at: string
  updated_at: string
  campaign_title: string | null
  creator_name: string | null
  brand_name: string | null
}

const STATUS_STYLES: Record<string, string> = {
  shortlisted: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-100 text-blue-700',
  negotiating: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-violet-100 text-violet-700',
  drafting: 'bg-cyan-100 text-cyan-700',
  draft_review: 'bg-indigo-100 text-indigo-700',
  scheduled: 'bg-blue-100 text-blue-700',
  posted: 'bg-teal-100 text-teal-700',
  completed: 'bg-emerald-100 text-emerald-700',
  dropped: 'bg-red-100 text-red-700',
}

const STATUSES = ['shortlisted', 'contacted', 'negotiating', 'confirmed', 'drafting', 'draft_review', 'scheduled', 'posted', 'completed', 'dropped']

function fmtDate(d: string | null) {
  return formatDateUTC(d)
}

function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) {return null}
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i
          return <button key={p} onClick={() => onPage(p)} className={`w-8 h-8 rounded text-sm font-medium ${p === page ? 'bg-violet-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
        })}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

function AdminCampaignCreatorsContent() {
  useDocumentTitle('Workflow Tracker')
  const router = useRouter()
  const searchParams = useSearchParams()

  const [rows, setRows] = useState<AdminRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [overdue, setOverdue] = useState(searchParams.get('overdue') === 'true')
  const [filter] = useState(searchParams.get('filter') ?? '')
  const [page, setPage] = useState(1)

  const fetchRows = useCallback(async (isRefresh = false) => {
    if (isRefresh) {setRefreshing(true)} else {setLoading(true)}
    setError(false)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) {params.set('search', search)}
      if (status) {params.set('status', status)}
      if (overdue) {params.set('overdue', 'true')}
      if (filter) {params.set('filter', filter)}

      const res = await fetch(`/api/admin/campaign-creators?${params}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      if (!res.ok) {throw new Error('Failed to load')}
      const data = await res.json()
      setRows(data.rows ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, search, status, overdue, filter, router])

  useEffect(() => { fetchRows() }, [fetchRows])

  const clearFilters = () => { setSearch(''); setStatus(''); setOverdue(false); setPage(1) }
  const hasFilters = Boolean(search || status || overdue)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Workflow Tracker</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} rows across every brand</p>
        </div>
        <button onClick={() => fetchRows(true)} disabled={refreshing} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search campaign, creator, or brand…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={overdue} onChange={e => { setOverdue(e.target.checked); setPage(1) }} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
            Overdue deliverables only
          </label>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="py-20 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-gray-700 font-medium mb-1">Couldn&apos;t load the tracker</p>
            <button onClick={() => fetchRows()} className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 mt-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : loading ? (
          <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-gray-400">Loading…</p></div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center"><Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 font-medium">No rows found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Creator</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Planned Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Updated</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-48">{r.campaign_title ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.creator_name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.brand_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(r.planned_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(r.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/campaign-creators/${r.id}`} className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-500 hover:text-violet-600 text-xs font-medium">
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={20} onPage={setPage} />
      </div>
    </div>
  )
}

export default function AdminCampaignCreatorsPage() {
  return (
    <Suspense>
      <AdminCampaignCreatorsContent />
    </Suspense>
  )
}
