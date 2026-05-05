'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, UserSquare, Building2, Handshake, DollarSign, Activity,
  RefreshCw, TrendingUp, TrendingDown, Minus, UserPlus, MessageSquare,
  CheckCircle2, Clock, AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Overview {
  totalUsers: number
  totalCreators: number
  totalBrands: number
  totalDeals: number
  totalRevenue: number
  activeToday: number
  usersChange: number
}

interface DashboardStats {
  overview: Overview
  dealsByStatus: Record<string, number>
  registrationTrend: { date: string; count: number }[]
  revenueTrend: { date: string; amount: number }[]
  topNiches: { name: string; count: number }[]
  platformDist: { platform: string; count: number }[]
}

interface ActivityItem {
  id: string
  type: 'registration' | 'deal' | 'message'
  message: string
  detail: string
  timestamp: string
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({
  data,
  color = '#8b5cf6',
}: {
  data: { date: string; value: number }[]
  color?: string
}) {
  if (!data.length) {
    return (
      <div className="h-28 flex items-center justify-center text-gray-400 text-sm">
        No data yet
      </div>
    )
  }

  const W = 500, H = 110
  const pL = 6, pR = 6, pT = 8, pB = 26
  const cW = W - pL - pR
  const cH = H - pT - pB
  const maxVal = Math.max(...data.map(d => d.value), 1)

  const toX = (i: number) =>
    pL + (data.length > 1 ? (i / (data.length - 1)) * cW : cW / 2)
  const toY = (v: number) => pT + cH - (v / maxVal) * cH

  const linePoints = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')
  const areaPoints = [
    `${toX(0)},${pT + cH}`,
    ...data.map((d, i) => `${toX(i)},${toY(d.value)}`),
    `${toX(data.length - 1)},${pT + cH}`,
  ].join(' ')

  const every = Math.max(1, Math.ceil(data.length / 7))
  const gradId = `lg-${color.replace('#', '')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line
          key={f}
          x1={pL} y1={pT + cH * (1 - f)}
          x2={W - pR} y2={pT + cH * (1 - f)}
          stroke="#f3f4f6" strokeWidth="1"
        />
      ))}
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) =>
        i % every === 0 ? (
          <text
            key={i}
            x={toX(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize="9"
            fill="#9ca3af"
          >
            {d.date.slice(5)}
          </text>
        ) : null
      )}
    </svg>
  )
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-gray-400 text-sm">
        No deals yet
      </div>
    )
  }

  const cx = 60, cy = 60, outerR = 52, innerR = 30
  let angle = -Math.PI / 2

  const paths = slices
    .filter(s => s.value > 0)
    .map(s => {
      const sweep = (s.value / total) * 2 * Math.PI
      const a0 = angle
      angle += sweep
      const a1 = angle
      const large = sweep > Math.PI ? 1 : 0
      const cos0 = Math.cos(a0), sin0 = Math.sin(a0)
      const cos1 = Math.cos(a1), sin1 = Math.sin(a1)
      const d = [
        `M ${cx + innerR * cos0} ${cy + innerR * sin0}`,
        `L ${cx + outerR * cos0} ${cy + outerR * sin0}`,
        `A ${outerR} ${outerR} 0 ${large} 1 ${cx + outerR * cos1} ${cy + outerR * sin1}`,
        `L ${cx + innerR * cos1} ${cy + innerR * sin1}`,
        `A ${innerR} ${innerR} 0 ${large} 0 ${cx + innerR * cos0} ${cy + innerR * sin0}`,
        'Z',
      ].join(' ')
      return { ...s, d }
    })

  return (
    <svg viewBox="0 0 120 120" className="w-full max-h-36">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} />
      ))}
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">
        {total}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="8" fill="#9ca3af">
        total deals
      </text>
    </svg>
  )
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────

function BarChart({ data, color = '#8b5cf6' }: { data: { label: string; value: number }[]; color?: string }) {
  if (!data.length) {
    return <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
  }
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-28 text-xs text-gray-500 truncate text-right flex-shrink-0">
            {d.label}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-3.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="w-6 text-xs text-gray-500 text-right flex-shrink-0">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  change,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconBg: string
  change?: number
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 ml-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {change > 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : change < 0 ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span
            className={`text-xs font-medium ${
              change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            {change > 0 ? '+' : ''}{change}% vs last week
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Activity Icon ────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  if (type === 'registration') {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <UserPlus className="w-4 h-4 text-blue-600" />
      </div>
    )
  }
  if (type === 'deal') {
    return (
      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
        <Handshake className="w-4 h-4 text-violet-600" />
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
      <MessageSquare className="w-4 h-4 text-gray-500" />
    </div>
  )
}

// ─── Deal status colours ──────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  paid: '#06b6d4',
  in_progress: '#6366f1',
  delivered: '#8b5cf6',
  revision: '#f97316',
  completed: '#10b981',
  cancelled: '#6b7280',
  disputed: '#ef4444',
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity'),
      ])

      if (statsRes.status === 401 || statsRes.status === 403) {
        router.push('/admin/login')
        return
      }

      const [statsData, activityData] = await Promise.all([
        statsRes.json(),
        activityRes.json(),
      ])

      if (statsRes.ok) setStats(statsData)
      else setError(statsData.error ?? 'Failed to load stats')

      if (activityRes.ok) setActivities(activityData.activities ?? [])
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const { overview, dealsByStatus } = stats

  const dealSlices = Object.entries(dealsByStatus)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ label, value, color: STATUS_COLORS[label] ?? '#9ca3af' }))

  const registrationData = stats.registrationTrend.map(d => ({ date: d.date, value: d.count }))
  const revenueData = stats.revenueTrend.map(d => ({ date: d.date, value: d.amount }))
  const nicheData = stats.topNiches.map(d => ({ label: d.name, value: d.count }))
  const platformData = stats.platformDist.map(d => ({ label: d.platform, value: d.count }))

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">{dateStr}</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Users"
          value={overview.totalUsers.toLocaleString()}
          icon={Users}
          iconBg="bg-blue-500"
          change={overview.usersChange}
        />
        <StatCard
          label="Creators"
          value={overview.totalCreators.toLocaleString()}
          icon={UserSquare}
          iconBg="bg-violet-500"
        />
        <StatCard
          label="Brands"
          value={overview.totalBrands.toLocaleString()}
          icon={Building2}
          iconBg="bg-indigo-500"
        />
        <StatCard
          label="Total Deals"
          value={overview.totalDeals.toLocaleString()}
          sub={`${dealsByStatus.completed ?? 0} completed`}
          icon={Handshake}
          iconBg="bg-amber-500"
        />
        <StatCard
          label="Revenue"
          value={`$${overview.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          sub="Completed deals"
          icon={DollarSign}
          iconBg="bg-emerald-500"
        />
        <StatCard
          label="Active Today"
          value={overview.activeToday.toLocaleString()}
          icon={Activity}
          iconBg="bg-rose-500"
        />
      </div>

      {/* Registration trend + Deal status */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">User Registration Trend</h2>
              <p className="text-gray-400 text-xs mt-0.5">Last 30 days</p>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {registrationData.reduce((s, d) => s + d.value, 0)}
            </span>
          </div>
          <LineChart data={registrationData} color="#3b82f6" />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-1">Deals by Status</h2>
          <p className="text-gray-400 text-xs mb-3">Current distribution</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <DonutChart slices={dealSlices} />
            </div>
            <div className="space-y-1.5 flex-shrink-0">
              {dealSlices.slice(0, 7).map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-gray-500 capitalize">{s.label.replace('_', ' ')}</span>
                  <span className="text-xs font-semibold text-gray-700 ml-1">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top niches + Platform distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-1">Top Niches</h2>
          <p className="text-gray-400 text-xs mb-4">Creator categories by count</p>
          <BarChart data={nicheData} color="#8b5cf6" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-1">Platform Distribution</h2>
          <p className="text-gray-400 text-xs mb-4">Creator platforms by usage</p>
          <BarChart data={platformData} color="#06b6d4" />
        </div>
      </div>

      {/* Revenue trend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Revenue Trend</h2>
            <p className="text-gray-400 text-xs mt-0.5">Completed deal revenue — last 30 days</p>
          </div>
          <span className="text-2xl font-bold text-emerald-600">
            ${overview.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
        <LineChart data={revenueData} color="#10b981" />
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-4">Recent Activity</h2>

        {activities.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No recent activity</div>
        ) : (
          <div className="space-y-3">
            {activities.map(a => (
              <div key={a.id} className="flex items-start gap-3">
                <ActivityIcon type={a.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">{a.message}</p>
                  <p className="text-xs text-gray-400 truncate">{a.detail}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(a.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-300">
                    {new Date(a.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deal status breakdown table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-4">Deal Status Breakdown</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {Object.entries(dealsByStatus).map(([status, count]) => (
            <div
              key={status}
              className="text-center p-3 rounded-lg border border-gray-100 bg-gray-50"
            >
              <div
                className="w-3 h-3 rounded-full mx-auto mb-1.5"
                style={{ backgroundColor: STATUS_COLORS[status] ?? '#9ca3af' }}
              />
              <p className="text-xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500 capitalize mt-0.5">
                {status.replace('_', ' ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
