'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Download, ChevronUp, ChevronDown, ChevronsUpDown,
  Eye, UserX, UserCheck, Trash2, X, RefreshCw, LogIn,
  ChevronLeft, ChevronRight, Shield, User, Building2,
  Filter, AlertTriangle, CheckSquare,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  email: string
  user_type: 'creator' | 'brand' | 'admin'
  role: string
  is_active: boolean
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtRelative(d: string | null) {
  if (!d) return 'Never'
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}

function StatusBadge({ active }: { active: boolean }) {
  return active
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Suspended</span>
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'creator') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700"><User className="w-3 h-3" />Creator</span>
  if (type === 'brand') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Building2 className="w-3 h-3" />Brand</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Shield className="w-3 h-3" />Admin</span>
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'super_admin') return <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">Super Admin</span>
  if (role === 'admin') return <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">Admin</span>
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
  if (totalPages <= 1) return null
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

export default function AdminUsersPage() {
  const router = useRouter()

  // Data state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filter state
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Sort + pagination
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Modal
  const [modalUser, setModalUser] = useState<UserDetail | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Action states
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        sort_by: sortField, sort_order: sortDir,
      })
      if (search) params.set('search', search)
      if (filterType !== 'all') params.set('type', filterType)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterRole !== 'all') params.set('role', filterRole)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, sortField, sortDir, search, filterType, filterStatus, filterRole, dateFrom, dateTo, router])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
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

  const toggleStatus = async (userId: string, currentActive: boolean) => {
    setActionLoading(a => ({ ...a, [userId]: true }))
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentActive }),
    })
    setUsers(u => u.map(x => x.id === userId ? { ...x, is_active: !currentActive } : x))
    if (modalUser?.user.id === userId) {
      setModalUser(m => m ? { ...m, user: { ...m.user, is_active: !currentActive } } : m)
    }
    setActionLoading(a => ({ ...a, [userId]: false }))
  }

  const deleteUser = async (userId: string) => {
    setActionLoading(a => ({ ...a, [userId]: true }))
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    setUsers(u => u.filter(x => x.id !== userId))
    setTotal(t => t - 1)
    setConfirmDelete(null)
    if (modalUser?.user.id === userId) setModalUser(null)
    setActionLoading(a => ({ ...a, [userId]: false }))
  }

  const impersonate = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}/impersonate`, { method: 'POST' })
    const data = await res.json()
    if (data.token && data.dashboardPath) {
      // Store token in sessionStorage and open in new tab
      const url = `${window.location.origin}${data.dashboardPath}?impersonate=${data.token}`
      window.open(url, '_blank')
    }
  }

  const bulkAction = async (action: 'activate' | 'suspend' | 'delete') => {
    const ids = Array.from(selected)
    if (action === 'delete') {
      await Promise.all(ids.map(id => fetch(`/api/admin/users/${id}`, { method: 'DELETE' })))
      setUsers(u => u.filter(x => !selected.has(x.id)))
      setTotal(t => t - ids.length)
    } else {
      const isActive = action === 'activate'
      await Promise.all(ids.map(id => fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      })))
      setUsers(u => u.map(x => selected.has(x.id) ? { ...x, is_active: isActive } : x))
    }
    setSelected(new Set())
  }

  const exportCsv = () => {
    const headers = ['ID', 'Email', 'Type', 'Name', 'Username', 'Role', 'Status', 'Verified', 'Created', 'Last Active']
    const rows = users.map(u => [
      u.id, u.email, u.user_type, u.profile_name, u.profile_username,
      u.role, u.is_active ? 'Active' : 'Suspended',
      u.email_verified ? 'Yes' : 'No',
      fmtDate(u.created_at), fmtDate(u.last_login_at),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === users.length) setSelected(new Set())
    else setSelected(new Set(users.map(u => u.id)))
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
              placeholder="Search by email…"
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
          </select>
          <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
          {(search || filterType !== 'all' || filterStatus !== 'all' || filterRole !== 'all' || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setFilterType('all'); setFilterStatus('all'); setFilterRole('all'); setDateFrom(''); setDateTo(''); setPage(1) }}
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
          <button onClick={() => bulkAction('activate')} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Activate</button>
          <button onClick={() => bulkAction('suspend')} className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700">Suspend</button>
          <button onClick={() => bulkAction('delete')} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
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
                    <td className="px-4 py-3"><StatusBadge active={u.is_active} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{fmtRelative(u.last_login_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(u.id)} title="View details"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleStatus(u.id, u.is_active)} disabled={!!actionLoading[u.id]}
                          title={u.is_active ? 'Suspend' : 'Activate'}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors">
                          {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setConfirmDelete(u.id)} title="Delete"
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

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              All data associated with this user (deals, messages, profile) will be permanently deleted.
            </p>
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
                        <StatusBadge active={modalUser.user.is_active} />
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
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2">
                  <button onClick={() => toggleStatus(modalUser.user.id, modalUser.user.is_active)}
                    className={`flex-1 min-w-28 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      modalUser.user.is_active
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}>
                    {modalUser.user.is_active ? 'Suspend User' : 'Activate User'}
                  </button>
                  {(modalUser.user.user_type === 'creator' || modalUser.user.user_type === 'brand') && (
                    <button onClick={() => impersonate(modalUser.user.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 rounded-lg text-sm font-medium">
                      <LogIn className="w-4 h-4" /> Impersonate
                    </button>
                  )}
                  <button onClick={() => { setModalUser(null); setConfirmDelete(modalUser.user.id) }}
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
