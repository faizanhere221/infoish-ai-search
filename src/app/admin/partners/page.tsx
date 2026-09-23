'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, Search, X, ChevronLeft, ChevronRight, AlertCircle, AlertTriangle } from 'lucide-react'
import PartnerTable, { type AdminPartnerRow } from '@/components/admin/PartnerTable'
import PartnerStats from '@/components/admin/PartnerStats'
import AddPartnerModal from '@/components/admin/AddPartnerModal'

interface Summary {
  total_partners: number
  active_partners: number
  total_referrals: number
  total_paid_cents: number
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

export default function AdminPartnersPage() {
  const router = useRouter()

  const [partners, setPartners] = useState<AdminPartnerRow[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<AdminPartnerRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPartners = useCallback(async (isRefresh = false) => {
    if (isRefresh) {setRefreshing(true)} else {setLoading(true)}
    setError(false)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', sort_by: sortField, sort_order: sortDir })
      if (search) {params.set('search', search)}
      if (filterStatus !== 'all') {params.set('status', filterStatus)}

      const res = await fetch(`/api/admin/partners?${params}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      if (!res.ok) {throw new Error('Failed to load partners')}
      const data = await res.json()
      setPartners(data.partners ?? [])
      setTotal(data.total ?? 0)
      setSummary(data.summary ?? null)
    } catch (err) {
      console.error('Error fetching partners:', err)
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, sortField, sortDir, search, filterStatus, router])

  useEffect(() => { fetchPartners() }, [fetchPartners])

  const handleSort = (field: string) => {
    if (sortField === field) {setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} else {
      setSortField(field)
      setSortDir('desc')
    }
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setFilterStatus('all')
    setPage(1)
  }

  const hasFilters = Boolean(search || filterStatus !== 'all')

  const handleConfirmDelete = async () => {
    if (!confirmDelete) {return}
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/partners/${confirmDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        setConfirmDelete(null)
        fetchPartners(true)
      }
    } catch (err) {
      console.error('Error deactivating partner:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Referral Partners</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString()} total partners</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchPartners(true)} disabled={refreshing} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Partner
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {summary && (
        <PartnerStats
          totalPartners={summary.total_partners}
          activePartners={summary.active_partners}
          totalReferrals={summary.total_referrals}
          totalPaidCents={summary.total_paid_cents}
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, or code…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="deactivated">Deactivated</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {error ? (
          <div className="py-20 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-gray-700 font-medium mb-1">Couldn&apos;t load partners</p>
            <p className="text-sm text-gray-400 mb-4">Something went wrong fetching this data.</p>
            <button
              onClick={() => fetchPartners()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : (
          <>
            <PartnerTable
              partners={partners}
              isLoading={loading}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              hasFilters={hasFilters}
              onDelete={(partner) => setConfirmDelete(partner)}
            />
            <Pagination page={page} total={total} limit={20} onPage={setPage} />
          </>
        )}
      </div>

      {showAddModal && (
        <AddPartnerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchPartners(true)
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Deactivate {confirmDelete.name}?</h3>
                <p className="text-sm text-gray-500">Their referral link will stop working. History is kept.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
