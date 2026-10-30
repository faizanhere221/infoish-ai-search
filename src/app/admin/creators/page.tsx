'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ReasonDialog } from '@/components/admin/ReasonDialog'
import { formatDate as formatDateUTC } from '@/lib/format-date'
import { platformIcon } from '@/lib/platform-icons'
import { NICHES, PLATFORMS, platformName } from '@/utils/constants'
import {
  Search, Download, ChevronUp, ChevronDown, ChevronsUpDown,
  Eye, UserX, UserCheck, Star, Shield, ShieldCheck, ShieldX,
  Sparkles, X, RefreshCw, Filter, ChevronLeft, ChevronRight,
  EyeOff,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminCreator {
  id: string
  user_id: string
  username: string
  display_name: string
  country: string | null
  niches: string[]
  total_followers: number
  avg_engagement_rate: number | null
  avg_rating: number | null
  total_reviews: number
  completed_deals: number
  verification_status: 'pending' | 'verified' | 'rejected'
  is_available: boolean
  is_featured: boolean
  hidden_from_marketplace: boolean
  created_at: string
  // Joined
  email: string
  is_active: boolean
  deleted_at: string | null
  last_login_at: string | null
  role: string
  platform_list: string[]
}

interface CreatorDetail {
  creator: AdminCreator & Record<string, unknown>
  user: Record<string, unknown> | null
  platforms: Record<string, unknown>[]
  services: Record<string, unknown>[]
  deals: Record<string, unknown>[]
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  return formatDateUTC(d)
}

function fmtNum(n: number) {
  if (n >= 1000000) {return `${(n / 1000000).toFixed(1)}M`}
  if (n >= 1000) {return `${(n / 1000).toFixed(0)}K`}
  return String(n)
}

function VerifyBadge({ status }: { status: string }) {
  if (status === 'verified') {return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><ShieldCheck className="w-3 h-3" />Verified</span>}
  if (status === 'rejected') {return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><ShieldX className="w-3 h-3" />Rejected</span>}
  return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Shield className="w-3 h-3" />Pending</span>
}

function StatusBadge({ active, deletedAt }: { active: boolean; deletedAt?: string | null }) {
  if (deletedAt) {return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">Deleted</span>}
  return active
    ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Suspended</span>
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) {return <span className="text-gray-400 text-xs">—</span>}
  return (
    <span className="flex items-center gap-0.5">
      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
      <span className="text-xs font-medium text-gray-700">{Number(rating).toFixed(1)}</span>
    </span>
  )
}

function SortTh({ field, label, current, dir, onSort, className = '' }: { field: string; label: string; current: string; dir: 'asc' | 'desc'; onSort: (f: string) => void; className?: string }) {
  const active = current === field
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 whitespace-nowrap ${className}`} onClick={() => onSort(field)}>
      <span className="flex items-center gap-1">
        {label}
        {active ? dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" /> : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  )
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminCreatorsPage() {
  useDocumentTitle('Creators')
  const router = useRouter()

  // The "Deleted" status filter is super_admin only — client-side this is
  // just UX (hide the option), the server-side 403 on status=deleted for
  // a plain admin is the real gate.
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  useEffect(() => { setIsSuperAdmin(localStorage.getItem('admin_role') === 'super_admin') }, [])

  const [creators, setCreators] = useState<AdminCreator[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')
  const [filterNiche, setFilterNiche] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterMinFollowers, setFilterMinFollowers] = useState('')
  const [filterMaxFollowers, setFilterMaxFollowers] = useState('')
  const [filterMinRating, setFilterMinRating] = useState('')
  const [filterAvailable, setFilterAvailable] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterVerification, setFilterVerification] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modalDetail, setModalDetail] = useState<CreatorDetail | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const fetchCreators = useCallback(async (isRefresh = false) => {
    if (isRefresh) {setRefreshing(true);} else {setLoading(true)}
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', sort_by: sortField, sort_order: sortDir })
      if (search) {params.set('search', search)}
      if (filterNiche) {params.set('niche', filterNiche)}
      if (filterPlatform) {params.set('platform', filterPlatform)}
      if (filterCountry) {params.set('country', filterCountry)}
      if (filterMinFollowers) {params.set('min_followers', filterMinFollowers)}
      if (filterMaxFollowers) {params.set('max_followers', filterMaxFollowers)}
      if (filterMinRating) {params.set('min_rating', filterMinRating)}
      if (filterAvailable) {params.set('is_available', filterAvailable)}
      // status=deleted is super_admin only server-side (403 for anyone
      // else) — never send it unless we've confirmed that role.
      if (filterStatus !== 'all' && !(filterStatus === 'deleted' && !isSuperAdmin)) {params.set('status', filterStatus)}
      if (filterVerification) {params.set('verification_status', filterVerification)}
      if (dateFrom) {params.set('date_from', dateFrom)}
      if (dateTo) {params.set('date_to', dateTo)}

      const res = await fetch(`/api/admin/creators?${params}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      const data = await res.json()
      setCreators(data.creators ?? [])
      setTotal(data.total ?? 0)
    } finally { setLoading(false); setRefreshing(false) }
  }, [page, sortField, sortDir, search, filterNiche, filterPlatform, filterCountry, filterMinFollowers, filterMaxFollowers, filterMinRating, filterAvailable, filterStatus, filterVerification, dateFrom, dateTo, router, isSuperAdmin])

  useEffect(() => { fetchCreators() }, [fetchCreators])

  const handleSort = (field: string) => {
    if (sortField === field) {setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  const openDetail = async (id: string) => {
    setModalLoading(true); setModalDetail(null)
    const res = await fetch(`/api/admin/creators/${id}`)
    const data = await res.json()
    setModalDetail(data)
    setModalLoading(false)
  }

  // Every action below goes through its own dedicated, logged endpoint —
  // never the generic PATCH, which now rejects verification_status/
  // is_featured/is_active entirely. Applies the real server response
  // (not an unconditional optimistic guess) so a failure never silently
  // shows the wrong state — see docs/ADMIN_AUDIT.md for why that mattered
  // (is_featured 500ing used to get masked by an optimistic update).
  type PendingCreatorAction =
    | { kind: 'verify'; creatorId: string; nextStatus: 'verified' | 'pending' }
    | { kind: 'feature'; creatorId: string; nextFeatured: boolean }
    | { kind: 'hide'; creatorId: string; nextHidden: boolean }
    | { kind: 'availability'; creatorId: string; nextAvailable: boolean }
    | { kind: 'suspend' | 'activate'; creatorId: string; userId: string }
    | { kind: 'bulk-suspend' | 'bulk-activate' }
  const [pendingAction, setPendingAction] = useState<PendingCreatorAction | null>(null)
  const [actionError, setActionError] = useState('')

  const applyLocal = (id: string, updates: Record<string, unknown>) => {
    setCreators(cs => cs.map(c => c.id === id ? { ...c, ...updates } : c))
    if (modalDetail?.creator.id === id) {
      setModalDetail(m => m ? { ...m, creator: { ...m.creator, ...updates } } : m)
    }
  }

  const confirmPendingAction = async (reason: string) => {
    if (!pendingAction) {return}
    setActionError('')
    try {
      if (pendingAction.kind === 'verify') {
        const res = await fetch(`/api/admin/creators/${pendingAction.creatorId}/verify`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: pendingAction.nextStatus, reason }),
        })
        if (!res.ok) {throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update verification')}
        applyLocal(pendingAction.creatorId, { verification_status: pendingAction.nextStatus })
      } else if (pendingAction.kind === 'feature') {
        const res = await fetch(`/api/admin/creators/${pendingAction.creatorId}/feature`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured: pendingAction.nextFeatured, reason }),
        })
        if (!res.ok) {throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update feature status')}
        applyLocal(pendingAction.creatorId, { is_featured: pendingAction.nextFeatured })
      } else if (pendingAction.kind === 'hide') {
        const res = await fetch(`/api/admin/creators/${pendingAction.creatorId}/hide`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hidden: pendingAction.nextHidden, reason }),
        })
        if (!res.ok) {throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update marketplace visibility')}
        applyLocal(pendingAction.creatorId, { hidden_from_marketplace: pendingAction.nextHidden })
      } else if (pendingAction.kind === 'availability') {
        const res = await fetch(`/api/admin/creators/${pendingAction.creatorId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_available: pendingAction.nextAvailable, reason }),
        })
        if (!res.ok) {throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update availability')}
        applyLocal(pendingAction.creatorId, { is_available: pendingAction.nextAvailable })
      } else if (pendingAction.kind === 'suspend' || pendingAction.kind === 'activate') {
        const res = await fetch(`/api/admin/users/${pendingAction.userId}/${pendingAction.kind}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        })
        if (!res.ok) {throw new Error((await res.json().catch(() => ({}))).error || `Failed to ${pendingAction.kind} user`)}
        applyLocal(pendingAction.creatorId, { is_active: pendingAction.kind === 'activate' })
      } else {
        const activate = pendingAction.kind === 'bulk-activate'
        const ids = Array.from(selected)
        const targets = creators.filter(c => ids.includes(c.id))
        await Promise.all(targets.map(c => fetch(`/api/admin/users/${c.user_id}/${activate ? 'activate' : 'suspend'}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        })))
        setCreators(cs => cs.map(c => ids.includes(c.id) ? { ...c, is_active: activate } : c))
        setSelected(new Set())
      }
      setPendingAction(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  const clearFilters = () => {
    setSearch(''); setFilterNiche(''); setFilterPlatform(''); setFilterCountry('')
    setFilterMinFollowers(''); setFilterMaxFollowers(''); setFilterMinRating('')
    setFilterAvailable(''); setFilterStatus('all'); setFilterVerification('')
    setDateFrom(''); setDateTo(''); setPage(1)
  }

  const hasFilters = search || filterNiche || filterPlatform || filterCountry || filterMinFollowers || filterMaxFollowers || filterMinRating || filterAvailable || filterStatus !== 'all' || filterVerification || dateFrom || dateTo

  const exportCsv = () => {
    const headers = ['Username', 'Display Name', 'Email', 'Country', 'Niches', 'Platforms', 'Followers', 'Rating', 'Deals', 'Verification', 'Status', 'Available', 'Featured', 'Hidden', 'Joined']
    const rows = creators.map(c => [
      c.username, c.display_name, c.email, c.country ?? '', c.niches.join(';'),
      c.platform_list.join(';'), c.total_followers, c.avg_rating ?? '',
      c.completed_deals, c.verification_status, c.deleted_at ? 'Deleted' : c.is_active ? 'Active' : 'Suspended',
      c.is_available ? 'Yes' : 'No', c.is_featured ? 'Yes' : 'No', c.hidden_from_marketplace ? 'Yes' : 'No', fmtDate(c.created_at),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `creators-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const toggleSelect = (id: string) => setSelected(s => {
    const n = new Set(s)
    if (n.has(id)) { n.delete(id) } else { n.add(id) }
    return n
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Creators</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} total creators</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchCreators(true)} disabled={refreshing} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-600">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search username, name, or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <select value={filterNiche} onChange={e => { setFilterNiche(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">All Niches</option>
            {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={filterPlatform} onChange={e => { setFilterPlatform(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterVerification} onChange={e => { setFilterVerification(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">Any Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            {isSuperAdmin && <option value="deleted">Deleted</option>}
          </select>
          <select value={filterAvailable} onChange={e => { setFilterAvailable(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">Any Availability</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Min followers" value={filterMinFollowers} onChange={e => { setFilterMinFollowers(e.target.value); setPage(1) }}
            className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="text" placeholder="Max followers" value={filterMaxFollowers} onChange={e => { setFilterMaxFollowers(e.target.value); setPage(1) }}
            className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <select value={filterMinRating} onChange={e => { setFilterMinRating(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">Any Rating</option>
            {[4.5, 4, 3.5, 3].map(r => <option key={r} value={r}>{r}★ and above</option>)}
          </select>
          <input type="text" placeholder="Country (US, GB…)" value={filterCountry} onChange={e => { setFilterCountry(e.target.value.toUpperCase()); setPage(1) }}
            className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-sm font-medium text-violet-700">{selected.size} selected</span>
          <button onClick={() => setPendingAction({ kind: 'bulk-suspend' })} className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg">Suspend All</button>
          <button onClick={() => setPendingAction({ kind: 'bulk-activate' })} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg">Activate All</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-gray-400">Loading creators…</p></div>
        ) : creators.length === 0 ? (
          <div className="py-20 text-center"><Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 font-medium">No creators found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="pl-4 pr-2 py-3 w-10">
                    <input type="checkbox" checked={selected.size === creators.length && creators.length > 0} onChange={() => setSelected(s => s.size === creators.length ? new Set() : new Set(creators.map(c => c.id)))} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  </th>
                  <SortTh field="username" label="Creator" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Niches</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Platforms</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Country</th>
                  <SortTh field="total_followers" label="Followers" current={sortField} dir={sortDir} onSort={handleSort} />
                  <SortTh field="avg_rating" label="Rating" current={sortField} dir={sortDir} onSort={handleSort} />
                  <SortTh field="completed_deals" label="Deals" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Verification</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <SortTh field="created_at" label="Joined" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {creators.map(c => (
                  <tr key={c.id} className={`hover:bg-gray-50/60 transition-colors ${selected.has(c.id) ? 'bg-violet-50/30' : ''}`}>
                    <td className="pl-4 pr-2 py-3">
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-600 flex-shrink-0">
                          {c.display_name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                            {c.display_name}
                            {c.is_featured && <span title="Featured"><Sparkles className="w-3 h-3 text-amber-400" /></span>}
                            {c.hidden_from_marketplace && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700" title="Hidden from marketplace">
                                <EyeOff className="w-3 h-3" />Hidden
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">@{c.username} · {c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-36">
                        {c.niches.slice(0, 2).map(n => (
                          <span key={n} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{n}</span>
                        ))}
                        {c.niches.length > 2 && <span className="text-xs text-gray-400">+{c.niches.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {c.platform_list.slice(0, 4).map(p => {
                          const Icon = platformIcon(p)
                          return (
                            <span key={p} className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-gray-600" title={platformName(p)}>
                              <Icon className="w-3 h-3" />
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.country ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{fmtNum(c.total_followers)}</td>
                    <td className="px-4 py-3"><Stars rating={c.avg_rating} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.completed_deals}</td>
                    <td className="px-4 py-3"><VerifyBadge status={c.verification_status} /></td>
                    <td className="px-4 py-3"><StatusBadge active={c.is_active} deletedAt={c.deleted_at} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmtDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(c.id)} title="View" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => setPendingAction({ kind: 'verify', creatorId: c.id, nextStatus: c.verification_status === 'verified' ? 'pending' : 'verified' })}
                          title={c.verification_status === 'verified' ? 'Unverify' : 'Verify'}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-600">
                          {c.verification_status === 'verified' ? <ShieldX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setPendingAction({ kind: 'feature', creatorId: c.id, nextFeatured: !c.is_featured })}
                          title={c.is_featured ? 'Unfeature' : 'Feature'}
                          className={`p-1.5 rounded hover:bg-gray-100 ${c.is_featured ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}>
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPendingAction({ kind: 'hide', creatorId: c.id, nextHidden: !c.hidden_from_marketplace })}
                          title={c.hidden_from_marketplace ? 'Unhide from marketplace' : 'Hide from marketplace'}
                          className={`p-1.5 rounded hover:bg-gray-100 ${c.hidden_from_marketplace ? 'text-violet-600' : 'text-gray-400 hover:text-violet-600'}`}>
                          <EyeOff className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPendingAction({ kind: c.is_active ? 'suspend' : 'activate', creatorId: c.id, userId: c.user_id })}
                          title={c.is_active ? 'Suspend' : 'Activate'}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600">
                          {c.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={20} onPage={setPage} />
      </div>

      {/* Detail drawer */}
      {(modalLoading || modalDetail) && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => { setModalDetail(null); setModalLoading(false) }} />
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl flex flex-col">
            {modalLoading ? (
              <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : modalDetail && (() => {
              const c = modalDetail.creator
              return (
                <>
                  <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">{c.display_name as string}</h2>
                      <p className="text-sm text-gray-500">@{c.username as string} · {c.email as string}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <VerifyBadge status={c.verification_status as string} />
                        <StatusBadge active={c.is_active as boolean} deletedAt={c.deleted_at as string | null} />
                        {c.is_featured && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Sparkles className="w-3 h-3" />Featured</span>}
                        {c.hidden_from_marketplace && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700"><EyeOff className="w-3 h-3" />Hidden from marketplace</span>}
                      </div>
                    </div>
                    <button onClick={() => setModalDetail(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
                  </div>

                  <div className="px-6 py-4 flex-1 space-y-5">
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Stats</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['Followers', fmtNum(Number(c.total_followers))],
                          ['Engagement', c.avg_engagement_rate ? `${Number(c.avg_engagement_rate).toFixed(1)}%` : '—'],
                          ['Rating', c.avg_rating ? `${Number(c.avg_rating).toFixed(1)} ★` : '—'],
                          ['Reviews', String(c.total_reviews)],
                          ['Completed Deals', String(c.completed_deals)],
                          ['Country', (c.country as string) || '—'],
                        ].map(([label, val]) => (
                          <div key={label} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">{val}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {(c.niches as string[]).length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Niches</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {(c.niches as string[]).map((n: string) => <span key={n} className="px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-full">{n}</span>)}
                        </div>
                      </section>
                    )}

                    {modalDetail.platforms.length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Platforms</h3>
                        <div className="space-y-2">
                          {modalDetail.platforms.map((p: Record<string, unknown>) => (
                            <div key={String(p.id)} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-700">{platformName(String(p.platform))}</span>
                              <span className="text-gray-500">{fmtNum(Number(p.followers))} followers</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {modalDetail.deals.length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent Deals</h3>
                        <div className="space-y-2">
                          {modalDetail.deals.map((d: Record<string, unknown>) => (
                            <div key={String(d.id)} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-700 truncate max-w-52">{String(d.title)}</p>
                                <p className="text-xs text-gray-400 capitalize">{String(d.status).replace('_', ' ')}</p>
                              </div>
                              <span className="font-semibold text-gray-700">${Number(d.amount).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2">
                    <button onClick={() => setPendingAction({ kind: 'verify', creatorId: String(c.id), nextStatus: c.verification_status === 'verified' ? 'pending' : 'verified' })}
                      className={`flex-1 min-w-28 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${c.verification_status === 'verified' ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'}`}>
                      {c.verification_status === 'verified' ? 'Remove Verification' : 'Verify Creator'}
                    </button>
                    <button onClick={() => setPendingAction({ kind: 'feature', creatorId: String(c.id), nextFeatured: !c.is_featured })}
                      className={`flex-1 min-w-28 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${c.is_featured ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'}`}>
                      {c.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button onClick={() => setPendingAction({ kind: 'hide', creatorId: String(c.id), nextHidden: !c.hidden_from_marketplace })}
                      className={`flex-1 min-w-28 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${c.hidden_from_marketplace ? 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'}`}>
                      {c.hidden_from_marketplace ? 'Unhide from Marketplace' : 'Hide from Marketplace'}
                    </button>
                    <button onClick={() => setPendingAction({ kind: c.is_active ? 'suspend' : 'activate', creatorId: String(c.id), userId: String(c.user_id) })}
                      className={`flex-1 min-w-28 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${c.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'}`}>
                      {c.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {pendingAction && (
        <ReasonDialog
          title={
            pendingAction.kind === 'verify' ? (pendingAction.nextStatus === 'verified' ? 'Verify creator' : 'Remove verification')
            : pendingAction.kind === 'feature' ? (pendingAction.nextFeatured ? 'Feature creator' : 'Unfeature creator')
            : pendingAction.kind === 'hide' ? (pendingAction.nextHidden ? 'Hide from marketplace' : 'Unhide from marketplace')
            : pendingAction.kind === 'availability' ? 'Change availability'
            : pendingAction.kind === 'suspend' ? 'Suspend creator'
            : pendingAction.kind === 'activate' ? 'Activate creator'
            : pendingAction.kind === 'bulk-suspend' ? `Suspend creators (${selected.size})`
            : `Activate creators (${selected.size})`
          }
          description={
            pendingAction.kind === 'suspend' || pendingAction.kind === 'bulk-suspend'
              ? "The user can't log in while suspended. A session token they already have stays valid until it naturally expires."
              : pendingAction.kind === 'hide'
                ? pendingAction.nextHidden
                  ? "Removes this creator from the marketplace listing, search, sitemap, roster, and campaign discovery. They can still log in and use their dashboard normally — this isn't suspension."
                  : undefined
                : undefined
          }
          danger={pendingAction.kind === 'suspend' || pendingAction.kind === 'bulk-suspend'}
          confirmLabel="Confirm"
          onConfirm={confirmPendingAction}
          onClose={() => { setPendingAction(null); setActionError('') }}
        />
      )}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg shadow-lg max-w-sm">
          {actionError}
        </div>
      )}
    </div>
  )
}
