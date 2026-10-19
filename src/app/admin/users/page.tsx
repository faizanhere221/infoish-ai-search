'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ReasonDialog } from '@/components/admin/ReasonDialog'
import {
  Search, Download, ChevronUp, ChevronDown, ChevronsUpDown,
  Eye, UserX, UserCheck, Trash2, X, RefreshCw,
  ChevronLeft, ChevronRight, Shield, User, Building2,
  Filter, ExternalLink,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  email: string
  user_type: 'creator' | 'brand' | 'admin'
  role: string
  is_active: boolean
  deleted_at: string | null
  email_verified: boolean
  created_at: string
  last_login_at: string | null
  profile_name: string
  profile_username: string
}

interface UserDetail {
  user: AdminUser
  profile: Record<string, unknown> | null
  deals: { id: string; title: string; status: string; amount: number; currency: string; created_at: string }[]
  workflow: {
    rows: { id: string; campaign_title: string; other_name: string; status: string; updated_at: string }[]
    rowStatusCounts: Record<string, number>
    totalRows: number
  }
  contracts: {
    items: { id: string; version: number; status: string; created_at: string; campaign_title: string; other_name: string }[]
    statusCounts: Record<string, number>
    total: number
  }
  payments: {
    items: { id: string; amount: number; currency: string; status: string; due_date: string | null; created_at: string; campaign_title: string; other_name: string }[]
    totals: Record<string, Record<string, number>>
    total: number
  }
  reports: {
    items: { id: string; role: 'reporter' | 'reported'; counterpart_email: string; category: string; status: string; created_at: string }[]
    openCount: number
  }
  recentActivity: { id: string; label: string; created_at: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) {return '—'}
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtRelative(d: string | null) {
  if (!d) {return 'Never'}
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) {return `${mins}m ago`}
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) {return `${hrs}h ago`}
  const days = Math.floor(hrs / 24)
  if (days < 30) {return `${days}d ago`}
  return fmtDate(d)
}

function StatusBadge({ active, deletedAt }: { active: boolean; deletedAt?: string | null }) {
  if (deletedAt) {return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">Deleted</span>}
  return active
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Suspended</span>
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'creator') {return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700"><User className="w-3 h-3" />Creator</span>}
  if (type === 'brand') {return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Building2 className="w-3 h-3" />Brand</span>}
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Shield className="w-3 h-3" />Admin</span>
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'super_admin') {return <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">Super Admin</span>}
  if (role === 'admin') {return <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">Admin</span>}
  return null
}

function SortTh({
  field, label, current, dir, onSort, className = '',
}: {
  field: string; label: string; current: string; dir: 'asc' | 'desc'; onSort: (f: string) => void; className?: string
}) {
  const active = current === field
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 whitespace-nowrap ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active
          ? dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  )
}

function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) {return null}
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()} users
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i
          return (
            <button key={p} onClick={() => onPage(p)}
              className={`w-8 h-8 rounded text-sm font-medium ${p === page ? 'bg-violet-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
              {p}
            </button>
          )
        })}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AdminUsersContent() {
  useDocumentTitle('Users')
  const router = useRouter()
  const searchParams = useSearchParams()

  // The "Deleted" status filter is super_admin only — client-side this is
  // just UX (hide the option), the server-side 403 on status=deleted for
  // a plain admin is the real gate.
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  useEffect(() => { setIsSuperAdmin(localStorage.getItem('admin_role') === 'super_admin') }, [])

  // Data state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filter state — read once from the URL on mount, so dashboard tile deep
  // links (e.g. /admin/users?date_from=...&type=creator) actually apply.
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [filterType, setFilterType] = useState(searchParams.get('type') ?? 'all')
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') ?? 'all')
  const [filterRole, setFilterRole] = useState(searchParams.get('role') ?? 'all')
  const [filterVerified, setFilterVerified] = useState(searchParams.get('verified') ?? '')
  const [filterFeatured, setFilterFeatured] = useState(searchParams.get('featured') === 'true')
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? '')
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? '')

  // Sort + pagination
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Modal
  const [modalUser, setModalUser] = useState<UserDetail | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Every mutating action (single or bulk) goes through this — a reason is
  // required before it fires, shown via the shared ReasonDialog.
  type PendingAction =
    | { type: 'activate' | 'suspend' | 'delete'; userId: string }
    | { type: 'bulk-activate' | 'bulk-suspend' | 'bulk-delete' }
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  // Shown in the delete confirmation dialog so the admin knows which mode
  // will actually apply (hard delete vs soft-delete + anonymization)
  // before confirming — fetched fresh every time, never assumed.
  interface DeletionPreview { blocked: boolean; blockingReasons: string[]; mode: 'hard' | 'soft' | null; linkedRecords: string[] }
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null)
  const [deletionPreviewLoading, setDeletionPreviewLoading] = useState(false)

  const openDeleteConfirm = async (userId: string) => {
    setPendingAction({ type: 'delete', userId })
    setDeletionPreview(null)
    setDeletionPreviewLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/deletion-preview`)
      const data = await res.json()
      if (res.ok) {setDeletionPreview(data)}
    } finally {
      setDeletionPreviewLoading(false)
    }
  }

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {setRefreshing(true)}
    else {setLoading(true)}

    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        sort_by: sortField, sort_order: sortDir,
      })
      if (search) {params.set('search', search)}
      if (filterType !== 'all') {params.set('type', filterType)}
      // status=deleted is super_admin only server-side (403 for anyone
      // else) — never send it unless we've confirmed that role, so a
      // stale filter value for a plain admin can't trigger a 403 that
      // the code below would otherwise treat as a login redirect.
      if (filterStatus !== 'all' && !(filterStatus === 'deleted' && !isSuperAdmin)) {params.set('status', filterStatus)}
      if (filterRole !== 'all') {params.set('role', filterRole)}
      if (filterVerified) {params.set('verified', filterVerified)}
      if (filterFeatured) {params.set('featured', 'true')}
      if (dateFrom) {params.set('date_from', dateFrom)}
      if (dateTo) {params.set('date_to', dateTo)}

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, sortField, sortDir, search, filterType, filterStatus, filterRole, filterVerified, filterFeatured, dateFrom, dateTo, router, isSuperAdmin])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  const openDetail = async (userId: string) => {
    setModalLoading(true)
    setModalUser(null)
    const res = await fetch(`/api/admin/users/${userId}`)
    const data = await res.json()
    setModalUser(data)
    setModalLoading(false)
  }

  // Single-user activate/suspend/delete all go through the dedicated,
  // logged routes now — never the generic PATCH/DELETE directly.
  const runSingleAction = async (reason: string, type: 'activate' | 'suspend' | 'delete', userId: string) => {
    if (type === 'delete') {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete user')
      }
      setUsers(u => u.filter(x => x.id !== userId))
      setTotal(t => t - 1)
      if (modalUser?.user.id === userId) {setModalUser(null)}
      return
    }

    const res = await fetch(`/api/admin/users/${userId}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Failed to ${type} user`)
    }
    const isActive = type === 'activate'
    setUsers(u => u.map(x => x.id === userId ? { ...x, is_active: isActive } : x))
    if (modalUser?.user.id === userId) {
      setModalUser(m => m ? { ...m, user: { ...m.user, is_active: isActive } } : m)
    }
  }

  const runBulkAction = async (reason: string, type: 'bulk-activate' | 'bulk-suspend' | 'bulk-delete') => {
    const ids = Array.from(selected)
    if (type === 'bulk-delete') {
      await Promise.all(ids.map(id => fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })))
      setUsers(u => u.filter(x => !selected.has(x.id)))
      setTotal(t => t - ids.length)
    } else {
      const action = type === 'bulk-activate' ? 'activate' : 'suspend'
      const isActive = action === 'activate'
      await Promise.all(ids.map(id => fetch(`/api/admin/users/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })))
      setUsers(u => u.map(x => selected.has(x.id) ? { ...x, is_active: isActive } : x))
    }
    setSelected(new Set())
  }

  const [actionError, setActionError] = useState('')
  const confirmPendingAction = async (reason: string) => {
    if (!pendingAction) {return}
    setActionError('')
    try {
      if ('userId' in pendingAction) {
        await runSingleAction(reason, pendingAction.type, pendingAction.userId)
      } else {
        await runBulkAction(reason, pendingAction.type)
      }
      setPendingAction(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  // Real server-side export (up to 10,000 rows, not just the current page)
  // — a plain navigation so the browser sends the auth_token cookie; no
  // separate client-side CSV construction needed.
  const exportCsv = () => {
    const params = new URLSearchParams()
    if (search) {params.set('search', search)}
    if (filterType !== 'all') {params.set('user_type', filterType)}
    if (filterStatus !== 'all' && !(filterStatus === 'deleted' && !isSuperAdmin)) {params.set('status', filterStatus)}
    window.open(`/api/admin/users/export?${params.toString()}`, '_blank')
  }

  const hasFilters = Boolean(search || filterType !== 'all' || filterStatus !== 'all' || filterRole !== 'all' || filterVerified || filterFeatured || dateFrom || dateTo)
  const clearFilters = () => {
    setSearch(''); setFilterType('all'); setFilterStatus('all'); setFilterRole('all')
    setFilterVerified(''); setFilterFeatured(false); setDateFrom(''); setDateTo(''); setPage(1)
  }

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const n = new Set(s)
      if (n.has(id)) { n.delete(id) } else { n.add(id) }
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === users.length) {setSelected(new Set())}
    else {setSelected(new Set(users.map(u => u.id)))}
  }

  const allSelected = users.length > 0 && selected.size === users.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} total users</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchUsers(true)} disabled={refreshing} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500">
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
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or handle…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="all">All Types</option>
            <option value="creator">Creators</option>
            <option value="brand">Brands</option>
            <option value="admin">Admins</option>
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            {isSuperAdmin && <option value="deleted">Deleted</option>}
          </select>
          <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select value={filterVerified} onChange={e => { setFilterVerified(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">Any Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer select-none">
            <input type="checkbox" checked={filterFeatured} onChange={e => { setFilterFeatured(e.target.checked); setPage(1) }}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
            Featured only
          </label>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-violet-700">{selected.size} selected</span>
          <button onClick={() => setPendingAction({ type: 'bulk-activate' })} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Activate</button>
          <button onClick={() => setPendingAction({ type: 'bulk-suspend' })} className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700">Suspend</button>
          <button onClick={() => setPendingAction({ type: 'bulk-delete' })} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Clear selection</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center">
            <Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No users found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="pl-4 pr-2 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  </th>
                  <SortTh field="email" label="Email" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <SortTh field="created_at" label="Joined" current={sortField} dir={sortDir} onSort={handleSort} />
                  <SortTh field="last_login_at" label="Last Active" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50/60 transition-colors ${selected.has(u.id) ? 'bg-violet-50/30' : ''}`}>
                    <td className="pl-4 pr-2 py-3">
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.email}</p>
                          {u.role !== 'user' && <RoleBadge role={u.role} />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={u.user_type} /></td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{u.profile_name || '—'}</p>
                      {u.profile_username && <p className="text-xs text-gray-400">@{u.profile_username}</p>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge active={u.is_active} deletedAt={u.deleted_at} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmtRelative(u.last_login_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(u.id)} title="View details"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPendingAction({ type: u.is_active ? 'suspend' : 'activate', userId: u.id })}
                          title={u.is_active ? 'Suspend' : 'Activate'}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors">
                          {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openDeleteConfirm(u.id)} title="Delete"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
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

      {/* Every activate/suspend/delete action — single or bulk — confirms
          through this one dialog, reason required. */}
      {pendingAction && (
        <ReasonDialog
          title={
            pendingAction.type === 'delete' || pendingAction.type === 'bulk-delete'
              ? 'Delete user' + (pendingAction.type === 'bulk-delete' ? `s (${selected.size})` : '')
              : pendingAction.type === 'suspend' || pendingAction.type === 'bulk-suspend'
                ? 'Suspend user' + (pendingAction.type === 'bulk-suspend' ? `s (${selected.size})` : '')
                : 'Activate user' + (pendingAction.type === 'bulk-activate' ? `s (${selected.size})` : '')
          }
          description={
            pendingAction.type === 'delete'
              ? deletionPreviewLoading
                ? 'Checking this account for linked records…'
                : deletionPreview?.blocked
                  ? `Cannot delete: ${deletionPreview.blockingReasons.join('; ')}. Resolve these first.`
                  : deletionPreview?.mode === 'hard'
                    ? 'This account has no linked records anywhere (no messages, campaigns, deals, reviews, or reports) — it will be permanently deleted, not just anonymized. This cannot be undone.'
                    : deletionPreview?.mode === 'soft'
                      ? `This account has history to preserve (${deletionPreview.linkedRecords.join(', ')}) — it will be soft-deleted and anonymized (email, name, avatar, payout methods removed). Content and financial records are kept. This cannot be undone.`
                      : 'The account is soft-deleted and anonymized (email, name, avatar, payout methods removed). Content and financial records are kept. This cannot be undone, and is blocked if the user has unsettled payments or an active contract.'
              : pendingAction.type === 'bulk-delete'
                ? 'The account is soft-deleted and anonymized (email, name, avatar, payout methods removed). Content and financial records are kept. This cannot be undone, and is blocked if the user has unsettled payments or an active contract.'
                : pendingAction.type === 'suspend' || pendingAction.type === 'bulk-suspend'
                  ? "The user can't log in while suspended. Note: a session token they already have stays valid until it naturally expires — suspension doesn't revoke it immediately."
                  : undefined
          }
          danger={pendingAction.type === 'delete' || pendingAction.type === 'bulk-delete'}
          confirmLabel={
            pendingAction.type === 'delete' && deletionPreview?.mode === 'hard' ? 'Permanently Delete'
              : pendingAction.type.includes('delete') ? 'Delete'
              : pendingAction.type.includes('suspend') ? 'Suspend' : 'Activate'
          }
          onConfirm={confirmPendingAction}
          onClose={() => { setPendingAction(null); setActionError(''); setDeletionPreview(null) }}
        />
      )}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg shadow-lg max-w-sm">
          {actionError}
        </div>
      )}

      {/* User detail drawer */}
      {(modalLoading || modalUser) && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setModalUser(null)} />
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl flex flex-col">
            {modalLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : modalUser && (
              <>
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-lg font-bold text-violet-600">
                      {modalUser.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">{modalUser.user.email}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <TypeBadge type={modalUser.user.user_type} />
                        <StatusBadge active={modalUser.user.is_active} deletedAt={modalUser.user.deleted_at} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setModalUser(null)} className="p-1 rounded hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="px-6 py-4 space-y-4 flex-1">
                  {/* User details */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Account</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        ['ID', modalUser.user.id],
                        ['Role', modalUser.user.role],
                        ['Email Verified', modalUser.user.email_verified ? 'Yes' : 'No'],
                        ['Joined', fmtDate(modalUser.user.created_at)],
                        ['Last Login', fmtRelative(modalUser.user.last_login_at)],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-gray-800 font-medium text-right max-w-xs truncate">{val}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Profile */}
                  {modalUser.profile && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {modalUser.user.user_type === 'creator' ? 'Creator Profile' : 'Brand Profile'}
                      </h3>
                      <div className="space-y-2 text-sm">
                        {modalUser.user.user_type === 'creator' && (() => {
                          const p = modalUser.profile as Record<string, unknown>
                          return [
                            ['Username', `@${p.username}`],
                            ['Display Name', p.display_name as string],
                            ['Country', p.country as string || '—'],
                            ['Followers', Number(p.total_followers).toLocaleString()],
                            ['Rating', p.avg_rating ? `${Number(p.avg_rating).toFixed(1)} ★` : '—'],
                            ['Completed Deals', String(p.completed_deals)],
                            ['Verification', p.verification_status as string],
                          ].map(([label, val]) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-gray-500">{label}</span>
                              <span className="text-gray-800 font-medium capitalize">{val}</span>
                            </div>
                          ))
                        })()}
                        {modalUser.user.user_type === 'brand' && (() => {
                          const p = modalUser.profile as Record<string, unknown>
                          return [
                            ['Company', p.company_name as string],
                            ['Industry', p.industry as string || '—'],
                            ['Company Size', p.company_size as string || '—'],
                            ['Country', p.country as string || '—'],
                            ['Total Deals', String(p.total_deals)],
                            ['Total Spent', `$${Number(p.total_spent).toLocaleString()}`],
                            ['Verification', p.verification_status as string],
                          ].map(([label, val]) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-gray-500">{label}</span>
                              <span className="text-gray-800 font-medium capitalize">{val}</span>
                            </div>
                          ))
                        })()}
                      </div>
                    </section>
                  )}

                  {/* Recent deals */}
                  {modalUser.deals.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent Deals</h3>
                      <div className="space-y-2">
                        {modalUser.deals.map(d => (
                          <div key={d.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-medium text-gray-700 truncate">{d.title}</p>
                              <p className="text-xs text-gray-400 capitalize">{d.status.replace('_', ' ')}</p>
                            </div>
                            <span className="text-gray-600 font-semibold whitespace-nowrap">${Number(d.amount).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Campaigns (workflow tracker rows) */}
                  {modalUser.workflow.totalRows > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Campaigns ({modalUser.workflow.totalRows})</h3>
                        <Link href={`/admin/campaign-creators?${modalUser.user.user_type === 'creator' ? 'creator_id' : 'brand_id'}=${modalUser.profile?.id}`}
                          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700">
                          View all <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {Object.entries(modalUser.workflow.rowStatusCounts).map(([status, count]) => (
                          <span key={status} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">{status.replace('_', ' ')}: {count}</span>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {modalUser.workflow.rows.map(r => (
                          <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-medium text-gray-700 truncate">{r.campaign_title}</p>
                              <p className="text-xs text-gray-400">{r.other_name}</p>
                            </div>
                            <span className="text-xs text-gray-500 capitalize whitespace-nowrap">{r.status.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Contracts */}
                  {modalUser.contracts.total > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contracts ({modalUser.contracts.total})</h3>
                      <div className="space-y-2">
                        {modalUser.contracts.items.map(c => (
                          <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-medium text-gray-700 truncate">{c.campaign_title} · v{c.version}</p>
                              <p className="text-xs text-gray-400">{c.other_name}</p>
                            </div>
                            <span className="text-xs text-gray-500 capitalize whitespace-nowrap">{c.status.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Payments — totals grouped by currency, never summed across currencies */}
                  {modalUser.payments.total > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Payments ({modalUser.payments.total})</h3>
                        <Link href={`/admin/payments?${modalUser.user.user_type === 'creator' ? 'creator_id' : 'brand_id'}=${modalUser.profile?.id}`}
                          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700">
                          View all <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="space-y-1 mb-2">
                        {Object.entries(modalUser.payments.totals).map(([currency, byStatus]) => (
                          <div key={currency} className="flex flex-wrap gap-1.5">
                            {Object.entries(byStatus).map(([status, amount]) => (
                              <span key={status} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">
                                {status.replace('_', ' ')}: {currency} {amount.toLocaleString()}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {modalUser.payments.items.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-medium text-gray-700 truncate">{p.campaign_title}</p>
                              <p className="text-xs text-gray-400 capitalize">{p.status.replace('_', ' ')}</p>
                            </div>
                            <span className="text-gray-600 font-semibold whitespace-nowrap">{p.currency} {Number(p.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Reports — as reporter or reported */}
                  {modalUser.reports.items.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Reports {modalUser.reports.openCount > 0 && <span className="text-red-500">({modalUser.reports.openCount} open)</span>}
                        </h3>
                        <Link href="/admin/reports" className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700">
                          View all <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {modalUser.reports.items.map(r => (
                          <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-medium text-gray-700 truncate">
                                {r.role === 'reporter' ? 'Reported' : 'Reported by'} {r.counterpart_email}
                              </p>
                              <p className="text-xs text-gray-400 capitalize">{r.category}</p>
                            </div>
                            <span className="text-xs text-gray-500 capitalize whitespace-nowrap">{r.status}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Recent activity */}
                  {modalUser.recentActivity.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent Activity</h3>
                      <div className="space-y-1.5">
                        {modalUser.recentActivity.map(a => (
                          <div key={a.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 capitalize">{a.label.replace(/_/g, ' ')}</span>
                            <span className="text-gray-400 whitespace-nowrap">{fmtRelative(a.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2">
                  <button onClick={() => setPendingAction({ type: modalUser.user.is_active ? 'suspend' : 'activate', userId: modalUser.user.id })}
                    className={`flex-1 min-w-28 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      modalUser.user.is_active
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}>
                    {modalUser.user.is_active ? 'Suspend User' : 'Activate User'}
                  </button>
                  <button onClick={() => { setModalUser(null); openDeleteConfirm(modalUser.user.id) }}
                    className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium">
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsersContent />
    </Suspense>
  )
}
