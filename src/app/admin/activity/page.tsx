'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Download, Filter, User, Shield, FileText, MessageSquare, Star, ChevronLeft, ChevronRight } from 'lucide-react'

interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  users?: { email: string; user_type: string } | null
}

const ACTION_GROUPS = [
  { value: '', label: 'All Actions' },
  { value: 'auth', label: 'Authentication' },
  { value: 'deals', label: 'Deals' },
  { value: 'profile', label: 'Profile' },
  { value: 'admin', label: 'Admin' },
]

const ACTION_META: Record<string, { color: string; icon: string }> = {
  login:              { color: 'bg-emerald-500/20 text-emerald-400', icon: '→' },
  logout:             { color: 'bg-slate-500/20 text-slate-400',    icon: '←' },
  register:           { color: 'bg-blue-500/20 text-blue-400',      icon: '+' },
  deal_created:       { color: 'bg-violet-500/20 text-violet-400',  icon: '$' },
  deal_accepted:      { color: 'bg-emerald-500/20 text-emerald-400', icon: '✓' },
  deal_rejected:      { color: 'bg-red-500/20 text-red-400',        icon: '✗' },
  deal_completed:     { color: 'bg-amber-500/20 text-amber-400',    icon: '★' },
  deal_cancelled:     { color: 'bg-orange-500/20 text-orange-400',  icon: '⊘' },
  profile_updated:    { color: 'bg-cyan-500/20 text-cyan-400',      icon: '✎' },
  creator_verified:   { color: 'bg-emerald-500/20 text-emerald-400', icon: '✓' },
  creator_featured:   { color: 'bg-amber-500/20 text-amber-400',    icon: '★' },
  brand_verified:     { color: 'bg-emerald-500/20 text-emerald-400', icon: '✓' },
  user_suspended:     { color: 'bg-red-500/20 text-red-400',        icon: '⊘' },
  user_activated:     { color: 'bg-emerald-500/20 text-emerald-400', icon: '↑' },
  user_deleted:       { color: 'bg-red-700/20 text-red-500',        icon: '🗑' },
  impersonation:      { color: 'bg-purple-500/20 text-purple-400',  icon: '👤' },
  admin_login:        { color: 'bg-violet-500/20 text-violet-400',  icon: '⚙' },
}

function actionMeta(action: string) {
  return ACTION_META[action] ?? { color: 'bg-slate-500/20 text-slate-400', icon: '•' }
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [missingTable, setMissingTable] = useState(false)

  const [search, setSearch]   = useState('')
  const [group, setGroup]     = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]   = useState('')

  const limit = 50
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchLogs = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) })
      if (search)   params.set('search', search)
      if (group)    params.set('group', group)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo)   params.set('date_to', dateTo)
      const res = await fetch(`/api/admin/activity/logs?${params}`)
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
      setMissingTable(!!data.missing_table)
    } finally {
      setLoading(false)
    }
  }, [page, search, group, dateFrom, dateTo])

  useEffect(() => { fetchLogs(1); setPage(1) }, [search, group, dateFrom, dateTo]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(page) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  function exportCSV() {
    const headers = ['Time', 'User', 'Action', 'Entity', 'IP', 'Details']
    const rows = logs.map(l => [
      new Date(l.created_at).toISOString(),
      l.users?.email ?? l.user_id ?? '',
      l.action,
      l.entity_type ?? '',
      l.ip_address ?? '',
      JSON.stringify(l.details),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time platform activity timeline</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Missing table notice */}
      {missingTable && (
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 text-amber-300 text-sm">
          <strong>Activity logging not active.</strong> Run <code className="bg-black/30 px-1 rounded">supabase/activity_migration.sql</code> in the Supabase SQL Editor to enable activity tracking.
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search email or action..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
            />
          </div>
          <select
            value={group}
            onChange={e => setGroup(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
          >
            {ACTION_GROUPS.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {total.toLocaleString()} events found
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {loading && logs.length === 0 ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          ))
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            {missingTable ? 'Run the migration to start tracking activity.' : 'No activity found for the selected filters.'}
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-700/50" />
            <div className="space-y-1">
              {logs.map(log => {
                const meta = actionMeta(log.action)
                return (
                  <div key={log.id} className="relative flex gap-4 group">
                    {/* Dot */}
                    <div className={`relative z-10 flex-shrink-0 w-8 h-8 mt-3 rounded-full flex items-center justify-center text-xs font-bold border border-slate-700 ${meta.color}`}>
                      <span>{meta.icon}</span>
                    </div>
                    {/* Card */}
                    <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:border-slate-600/50 transition-colors mb-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                              {formatAction(log.action)}
                            </span>
                            {log.users?.email && (
                              <span className="text-slate-300 text-sm font-medium truncate">{log.users.email}</span>
                            )}
                            {log.entity_type && (
                              <span className="text-slate-500 text-xs">{log.entity_type}</span>
                            )}
                          </div>
                          {Object.keys(log.details ?? {}).length > 0 && (
                            <div className="mt-1 text-xs text-slate-500 truncate">
                              {Object.entries(log.details).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-slate-400">{timeAgo(log.created_at)}</div>
                          {log.ip_address && (
                            <div className="text-xs text-slate-600 mt-0.5">{log.ip_address}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages} ({total.toLocaleString()} events)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const p = page <= 4 ? i + 1 : page - 3 + i
              if (p < 1 || p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${p === page ? 'bg-violet-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
