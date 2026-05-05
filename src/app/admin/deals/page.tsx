'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react'

interface Deal {
  id: string
  title: string
  status: string
  amount: number | null
  currency: string
  brand_name: string
  creator_name: string
  created_at: string
  updated_at: string
  brand_id: string
  creator_id: string
}

const STATUS_OPTIONS = ['', 'pending', 'active', 'completed', 'cancelled', 'rejected']

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-500/20 text-amber-400',
  active:    'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-slate-500/20 text-slate-400',
  rejected:  'bg-red-500/20 text-red-400',
}

export default function DealsPage() {
  const [deals, setDeals]     = useState<Deal[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)

  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]   = useState('')
  const [sortBy, setSortBy]   = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const limit = 20
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchDeals = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(p), limit: String(limit),
        sort_by: sortBy, sort_order: sortOrder,
      })
      if (search)   params.set('search', search)
      if (status)   params.set('status', status)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo)   params.set('date_to', dateTo)
      const res = await fetch(`/api/admin/deals?${params}`)
      const data = await res.json()
      setDeals(data.deals ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, search, status, dateFrom, dateTo, sortBy, sortOrder])

  useEffect(() => { fetchDeals(1); setPage(1) }, [search, status, dateFrom, dateTo, sortBy, sortOrder]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDeals(page) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  function exportCSV() {
    const headers = ['Title', 'Status', 'Amount', 'Currency', 'Brand', 'Creator', 'Created']
    const rows = deals.map(d => [
      d.title, d.status, String(d.amount ?? ''), d.currency,
      d.brand_name, d.creator_name, new Date(d.created_at).toISOString(),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'deals.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function handleSort(col: string) {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortOrder('desc') }
  }

  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 text-slate-500">
      {sortBy === col ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deals</h1>
          <p className="text-slate-400 text-sm mt-1">{total.toLocaleString()} total deals</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchDeals(page)} className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search deal title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500">
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700/50">
              <th onClick={() => handleSort('title')} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white">
                Title <SortIcon col="title" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Brand</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Creator</th>
              <th onClick={() => handleSort('status')} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white">
                Status <SortIcon col="status" />
              </th>
              <th onClick={() => handleSort('amount')} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white">
                Amount <SortIcon col="amount" />
              </th>
              <th onClick={() => handleSort('created_at')} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white">
                Created <SortIcon col="created_at" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="bg-slate-800/20">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-700 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : deals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">No deals found</td>
              </tr>
            ) : (
              deals.map(deal => (
                <tr key={deal.id} className="bg-slate-800/20 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white max-w-[200px] truncate">{deal.title}</div>
                    <div className="text-xs text-slate-500 font-mono">{deal.id.slice(0, 8)}…</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 max-w-[120px] truncate">{deal.brand_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-[120px] truncate">{deal.creator_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[deal.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {deal.amount ? `${deal.amount} ${deal.currency}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(deal.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Page {page} of {totalPages} ({total.toLocaleString()} deals)</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
