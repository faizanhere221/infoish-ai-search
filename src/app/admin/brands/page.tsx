'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Download, ChevronUp, ChevronDown, ChevronsUpDown,
  Eye, UserX, UserCheck, ShieldCheck, ShieldX, Shield,
  X, RefreshCw, Filter, ChevronLeft, ChevronRight, Building2, AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminBrand {
  id: string
  user_id: string
  company_name: string
  company_website: string | null
  logo_url: string | null
  industry: string | null
  company_size: string | null
  country: string | null
  contact_name: string | null
  contact_role: string | null
  total_deals: number
  total_spent: number
  verification_status: 'pending' | 'verified' | 'rejected'
  created_at: string
  // Joined
  email: string
  is_active: boolean
  last_login_at: string | null
  role: string
}

interface BrandDetail {
  brand: AdminBrand & Record<string, unknown>
  user: Record<string, unknown> | null
  deals: Record<string, unknown>[]
}

const INDUSTRIES = ['SaaS', 'AI/ML', 'Developer Tools', 'Cloud Services', 'Cybersecurity', 'Fintech', 'E-commerce', 'Health Tech', 'EdTech', 'Marketing Tech', 'Enterprise Software', 'Gaming', 'Other']
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtRelative(d: string | null) {
  if (!d) return 'Never'
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}

function VerifyBadge({ status }: { status: string }) {
  if (status === 'verified') return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><ShieldCheck className="w-3 h-3" />Verified</span>
  if (status === 'rejected') return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><ShieldX className="w-3 h-3" />Rejected</span>
  return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Shield className="w-3 h-3" />Pending</span>
}

function StatusBadge({ active }: { active: boolean }) {
  return active
    ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Suspended</span>
}

function SortTh({ field, label, current, dir, onSort }: { field: string; label: string; current: string; dir: 'asc' | 'desc'; onSort: (f: string) => void }) {
  const active = current === field
  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 whitespace-nowrap" onClick={() => onSort(field)}>
      <span className="flex items-center gap-1">
        {label}
        {active ? dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" /> : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  )
}

function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null
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

export default function AdminBrandsPage() {
  const router = useRouter()

  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterMinSpent, setFilterMinSpent] = useState('')
  const [filterMaxSpent, setFilterMaxSpent] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterVerification, setFilterVerification] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modalDetail, setModalDetail] = useState<BrandDetail | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const fetchBrands = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', sort_by: sortField, sort_order: sortDir })
      if (search) params.set('search', search)
      if (filterIndustry) params.set('industry', filterIndustry)
      if (filterSize) params.set('company_size', filterSize)
      if (filterCountry) params.set('country', filterCountry)
      if (filterMinSpent) params.set('min_spent', filterMinSpent)
      if (filterMaxSpent) params.set('max_spent', filterMaxSpent)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterVerification) params.set('verification_status', filterVerification)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      const res = await fetch(`/api/admin/brands?${params}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      const data = await res.json()
      setBrands(data.brands ?? [])
      setTotal(data.total ?? 0)
    } finally { setLoading(false); setRefreshing(false) }
  }, [page, sortField, sortDir, search, filterIndustry, filterSize, filterCountry, filterMinSpent, filterMaxSpent, filterStatus, filterVerification, dateFrom, dateTo, router])

  useEffect(() => { fetchBrands() }, [fetchBrands])

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  const openDetail = async (id: string) => {
    setModalLoading(true); setModalDetail(null)
    const res = await fetch(`/api/admin/brands/${id}`)
    const data = await res.json()
    setModalDetail(data)
    setModalLoading(false)
  }

  const patchBrand = async (id: string, updates: Record<string, unknown>) => {
    setActionLoading(a => ({ ...a, [id]: true }))
    await fetch(`/api/admin/brands/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setBrands(bs => bs.map(b => b.id === id ? { ...b, ...updates } : b))
    if (modalDetail?.brand.id === id) {
      setModalDetail(m => m ? { ...m, brand: { ...m.brand, ...updates } } : m)
    }
    setActionLoading(a => ({ ...a, [id]: false }))
  }

  const deleteUser = async (brandId: string) => {
    // Find user_id for this brand and delete the user record
    const brand = brands.find(b => b.id === brandId)
    if (!brand) return
    setActionLoading(a => ({ ...a, [brandId]: true }))
    await fetch(`/api/admin/users/${brand.user_id}`, { method: 'DELETE' })
    setBrands(bs => bs.filter(b => b.id !== brandId))
    setTotal(t => t - 1)
    setConfirmDelete(null)
    setModalDetail(null)
    setActionLoading(a => ({ ...a, [brandId]: false }))
  }

  const clearFilters = () => {
    setSearch(''); setFilterIndustry(''); setFilterSize(''); setFilterCountry('')
    setFilterMinSpent(''); setFilterMaxSpent(''); setFilterStatus('all')
    setFilterVerification(''); setDateFrom(''); setDateTo(''); setPage(1)
  }

  const hasFilters = search || filterIndustry || filterSize || filterCountry || filterMinSpent || filterMaxSpent || filterStatus !== 'all' || filterVerification || dateFrom || dateTo

  const exportCsv = () => {
    const headers = ['Company', 'Contact', 'Email', 'Industry', 'Size', 'Country', 'Deals', 'Total Spent', 'Verification', 'Status', 'Joined']
    const rows = brands.map(b => [
      b.company_name, b.contact_name ?? '', b.email, b.industry ?? '', b.company_size ?? '',
      b.country ?? '', b.total_deals, `$${b.total_spent.toFixed(2)}`,
      b.verification_status, b.is_active ? 'Active' : 'Suspended', fmtDate(b.created_at),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `brands-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const toggleSelect = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Brands</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} total brands</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchBrands(true)} disabled={refreshing} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500">
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
            <input type="text" placeholder="Search company name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <select value={filterIndustry} onChange={e => { setFilterIndustry(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">All Industries</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={filterSize} onChange={e => { setFilterSize(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">Any Size</option>
            {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
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
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Min total spent ($)" value={filterMinSpent} onChange={e => { setFilterMinSpent(e.target.value); setPage(1) }} className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="text" placeholder="Max total spent ($)" value={filterMaxSpent} onChange={e => { setFilterMaxSpent(e.target.value); setPage(1) }} className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="text" placeholder="Country (US, GB…)" value={filterCountry} onChange={e => { setFilterCountry(e.target.value.toUpperCase()); setPage(1) }} className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
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
          <button onClick={() => { selected.forEach(id => patchBrand(id, { is_active: true })); setSelected(new Set()) }} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg">Activate All</button>
          <button onClick={() => { selected.forEach(id => patchBrand(id, { is_active: false })); setSelected(new Set()) }} className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg">Suspend All</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-gray-400">Loading brands…</p></div>
        ) : brands.length === 0 ? (
          <div className="py-20 text-center"><Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 font-medium">No brands found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="pl-4 pr-2 py-3 w-10">
                    <input type="checkbox" checked={selected.size === brands.length && brands.length > 0} onChange={() => setSelected(s => s.size === brands.length ? new Set() : new Set(brands.map(b => b.id)))} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  </th>
                  <SortTh field="company_name" label="Company" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Contact / Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Industry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Country</th>
                  <SortTh field="total_deals" label="Deals" current={sortField} dir={sortDir} onSort={handleSort} />
                  <SortTh field="total_spent" label="Total Spent" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Verification</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <SortTh field="created_at" label="Joined" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {brands.map(b => (
                  <tr key={b.id} className={`hover:bg-gray-50/60 transition-colors ${selected.has(b.id) ? 'bg-violet-50/30' : ''}`}>
                    <td className="pl-4 pr-2 py-3">
                      <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          {b.logo_url
                            ? <img src={b.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            : <Building2 className="w-4 h-4 text-blue-600" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate max-w-36">{b.company_name}</p>
                          {b.company_website && <p className="text-xs text-gray-400 truncate max-w-36">{b.company_website}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{b.contact_name || '—'}</p>
                      <p className="text-xs text-gray-400 truncate max-w-40">{b.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.industry || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.company_size || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.country || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{b.total_deals}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-700">${Number(b.total_spent).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-3"><VerifyBadge status={b.verification_status} /></td>
                    <td className="px-4 py-3"><StatusBadge active={b.is_active} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmtDate(b.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(b.id)} title="View" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => patchBrand(b.id, { verification_status: b.verification_status === 'verified' ? 'pending' : 'verified' })} disabled={!!actionLoading[b.id]}
                          title={b.verification_status === 'verified' ? 'Unverify' : 'Verify'}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-emerald-600">
                          {b.verification_status === 'verified' ? <ShieldX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => patchBrand(b.id, { is_active: !b.is_active })} disabled={!!actionLoading[b.id]}
                          title={b.is_active ? 'Suspend' : 'Activate'}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600">
                          {b.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Brand Account</h3>
                <p className="text-sm text-gray-500">This action is permanent.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteUser(confirmDelete)} disabled={!!actionLoading[confirmDelete]}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {actionLoading[confirmDelete] ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {(modalLoading || modalDetail) && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => { setModalDetail(null); setModalLoading(false) }} />
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl flex flex-col">
            {modalLoading ? (
              <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : modalDetail && (() => {
              const b = modalDetail.brand
              return (
                <>
                  <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {b.logo_url
                          ? <img src={String(b.logo_url)} alt="" className="w-12 h-12 rounded-xl object-cover" />
                          : <Building2 className="w-6 h-6 text-blue-600" />
                        }
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{String(b.company_name)}</h2>
                        <p className="text-sm text-gray-500">{String(b.email)}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <VerifyBadge status={String(b.verification_status)} />
                          <StatusBadge active={Boolean(b.is_active)} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setModalDetail(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
                  </div>

                  <div className="px-6 py-4 flex-1 space-y-5">
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Company Info</h3>
                      <div className="space-y-2 text-sm">
                        {[
                          ['Contact', b.contact_name as string || '—'],
                          ['Role', b.contact_role as string || '—'],
                          ['Industry', b.industry as string || '—'],
                          ['Size', b.company_size as string || '—'],
                          ['Country', b.country as string || '—'],
                          ['Website', b.company_website as string || '—'],
                          ['Total Deals', String(b.total_deals)],
                          ['Total Spent', `$${Number(b.total_spent).toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
                          ['Joined', fmtDate(b.created_at as string)],
                          ['Last Active', fmtRelative(modalDetail.user?.last_login_at as string ?? null)],
                        ].map(([label, val]) => (
                          <div key={label} className="flex justify-between">
                            <span className="text-gray-500">{label}</span>
                            <span className="text-gray-800 font-medium text-right max-w-xs truncate">{val}</span>
                          </div>
                        ))}
                      </div>
                    </section>

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
                    <button onClick={() => patchBrand(String(b.id), { verification_status: b.verification_status === 'verified' ? 'pending' : 'verified' })}
                      className={`flex-1 min-w-28 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${b.verification_status === 'verified' ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'}`}>
                      {b.verification_status === 'verified' ? 'Remove Verification' : 'Verify Brand'}
                    </button>
                    <button onClick={() => patchBrand(String(b.id), { is_active: !b.is_active })}
                      className={`flex-1 min-w-28 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${b.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'}`}>
                      {b.is_active ? 'Suspend' : 'Activate'}
                    </button>
                    <button onClick={() => { setModalDetail(null); setConfirmDelete(String(b.id)) }}
                      className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium">
                      Delete Account
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
