'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, RefreshCw, TrendingUp, Users, DollarSign, MessageSquare } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  period: { from: string; to: string }
  users: {
    registrations_by_day: Record<string, number>
    creator_registrations_by_day: Record<string, number>
    brand_registrations_by_day: Record<string, number>
    total_in_period: number
  }
  deals: {
    by_status: Record<string, number>
    by_day: Record<string, number>
    total_in_period: number
    total_revenue: number
    revenue_by_day: Record<string, number>
  }
  creators: {
    total: number
    verified: number
    avg_followers: number
    avg_engagement_rate: number
    avg_rating: number
  }
  brands: {
    total: number
    verified: number
    top_industries: { name: string; count: number }[]
  }
  engagement: {
    messages_by_day: Record<string, number>
    total_messages_in_period: number
    action_counts: Record<string, number>
  }
}

// ─── Quick presets ─────────────────────────────────────────────────────────────
function presets() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  const today = fmt(now)
  const yesterday = fmt(new Date(now.getTime() - 86400000))

  const y7 = new Date(now); y7.setDate(now.getDate() - 6)
  const y30 = new Date(now); y30.setDate(now.getDate() - 29)

  const monthStart = fmt(new Date(now.getFullYear(), now.getMonth(), 1))
  const lastMonthStart = fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const lastMonthEnd = fmt(new Date(now.getFullYear(), now.getMonth(), 0))
  const yearStart = fmt(new Date(now.getFullYear(), 0, 1))

  return [
    { label: 'Today',       from: today,           to: today },
    { label: 'Yesterday',   from: yesterday,       to: yesterday },
    { label: 'Last 7 days', from: fmt(y7),         to: today },
    { label: 'Last 30 days',from: fmt(y30),        to: today },
    { label: 'This month',  from: monthStart,      to: today },
    { label: 'Last month',  from: lastMonthStart,  to: lastMonthEnd },
    { label: 'This year',   from: yearStart,       to: today },
  ]
}

// ─── Mini chart components ──────────────────────────────────────────────────────
function SparkLine({ data, color = '#8b5cf6' }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div className="h-12" />
  const max = Math.max(...data, 1)
  const w = 200
  const h = 48
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h * 0.9 - 2}`)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BarChart({ data, color = '#8b5cf6' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-28 truncate text-right">{d.label}</span>
          <div className="flex-1 bg-slate-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs text-slate-300 w-8 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  if (total === 0) return <div className="h-32 flex items-center justify-center text-slate-500 text-sm">No data</div>

  let cumAngle = -90
  const r = 40
  const cx = 60
  const cy = 60
  const paths = slices.map(s => {
    const pct = s.value / total
    const startAngle = (cumAngle * Math.PI) / 180
    cumAngle += pct * 360
    const endAngle = (cumAngle * Math.PI) / 180
    const large = pct > 0.5 ? 1 : 0
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    return { ...s, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` }
  })

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-28 h-28 flex-shrink-0">
        {paths.map(p => <path key={p.label} d={p.d} fill={p.color} />)}
        <circle cx={cx} cy={cy} r={22} fill="#1e293b" />
      </svg>
      <div className="space-y-1 min-w-0">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-slate-400 truncate">{s.label}</span>
            <span className="text-slate-300 font-medium ml-auto pl-2">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function sortedDays(map: Record<string, number>) {
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

const DEAL_COLORS: Record<string, string> = {
  pending:    '#f59e0b',
  active:     '#3b82f6',
  completed:  '#10b981',
  cancelled:  '#6b7280',
  rejected:   '#ef4444',
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const PRESETS = presets()
  const [active, setActive]   = useState('Last 30 days')
  const [from, setFrom]       = useState(PRESETS.find(p => p.label === 'Last 30 days')!.from)
  const [to, setTo]           = useState(PRESETS.find(p => p.label === 'Last 30 days')!.to)
  const [custom, setCustom]   = useState(false)
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?from=${from}T00:00:00Z&to=${to}T23:59:59Z`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { fetchData() }, [fetchData])

  function selectPreset(p: typeof PRESETS[0]) {
    setActive(p.label)
    setFrom(p.from)
    setTo(p.to)
    setCustom(false)
  }

  function exportCSV() {
    if (!data) return
    const rows: string[][] = [['Metric', 'Value']]
    rows.push(['Period', `${data.period.from} → ${data.period.to}`])
    rows.push(['New registrations', String(data.users.total_in_period)])
    rows.push(['New deals', String(data.deals.total_in_period)])
    rows.push(['Total revenue', String(data.deals.total_revenue)])
    rows.push(['Messages sent', String(data.engagement.total_messages_in_period)])
    rows.push(['Total creators', String(data.creators.total)])
    rows.push(['Verified creators', String(data.creators.verified)])
    rows.push(['Total brands', String(data.brands.total)])
    rows.push(['Verified brands', String(data.brands.verified)])
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `analytics_${from}_${to}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function printReport() {
    window.print()
  }

  const regDays = data ? sortedDays(data.users.registrations_by_day) : []
  const dealDays = data ? sortedDays(data.deals.by_day) : []
  const msgDays  = data ? sortedDays(data.engagement.messages_by_day) : []
  const revDays  = data ? sortedDays(data.deals.revenue_by_day) : []

  const dealDonut = data
    ? Object.entries(data.deals.by_status).map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value,
        color: DEAL_COLORS[label] ?? '#6b7280',
      }))
    : []

  return (
    <div className="space-y-6 print:bg-white print:text-black">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Platform performance overview</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={printReport} className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Date range */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 print:hidden">
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => selectPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active === p.label && !custom ? 'bg-violet-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => { setCustom(true); setActive('') }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${custom ? 'bg-violet-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
          >
            Custom
          </button>
        </div>
        {custom && (
          <div className="flex gap-3 items-center">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
          </div>
        )}
        {data && (
          <div className="mt-2 text-xs text-slate-500">
            Showing {new Date(data.period.from).toLocaleDateString()} – {new Date(data.period.to).toLocaleDateString()}
          </div>
        )}
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'New Users',   value: fmt(data.users.total_in_period),       icon: <Users className="w-5 h-5" />,      color: 'text-blue-400',   bg: 'bg-blue-500/10' },
              { label: 'New Deals',   value: fmt(data.deals.total_in_period),        icon: <TrendingUp className="w-5 h-5" />, color: 'text-violet-400', bg: 'bg-violet-500/10' },
              { label: 'Revenue',     value: `$${fmt(data.deals.total_revenue)}`,    icon: <DollarSign className="w-5 h-5" />,color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Messages',    value: fmt(data.engagement.total_messages_in_period), icon: <MessageSquare className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map(c => (
              <div key={c.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <div className={`inline-flex p-2 rounded-lg ${c.bg} mb-3`}>
                  <span className={c.color}>{c.icon}</span>
                </div>
                <div className="text-2xl font-bold text-white">{c.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{c.label} in period</div>
              </div>
            ))}
          </div>

          {/* User registrations chart */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">User Registrations</h2>
            {regDays.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-slate-500 text-sm">No registrations in this period</div>
            ) : (
              <>
                <SparkLine data={regDays.map(([, v]) => v)} color="#8b5cf6" />
                <div className="flex gap-4 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Total: {data.users.total_in_period}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Creators: {Object.values(data.users.creator_registrations_by_day).reduce((s, v) => s + v, 0)}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Brands: {Object.values(data.users.brand_registrations_by_day).reduce((s, v) => s + v, 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Deals & Revenue row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Deal status donut */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Deals by Status</h2>
              <DonutChart slices={dealDonut} />
            </div>

            {/* Revenue trend */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Revenue Trend</h2>
              {revDays.length === 0 ? (
                <div className="h-24 flex items-center justify-center text-slate-500 text-sm">No revenue in this period</div>
              ) : (
                <>
                  <SparkLine data={revDays.map(([, v]) => v)} color="#10b981" />
                  <div className="mt-2 text-xs text-slate-400">
                    Total: <span className="text-emerald-400 font-semibold">${data.deals.total_revenue.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Creator & Brand stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Creator Overview</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Creators',  value: data.creators.total.toLocaleString() },
                  { label: 'Verified',        value: data.creators.verified.toLocaleString() },
                  { label: 'Avg Followers',   value: fmt(data.creators.avg_followers) },
                  { label: 'Avg Engagement',  value: `${data.creators.avg_engagement_rate}%` },
                  { label: 'Avg Rating',      value: `${data.creators.avg_rating} ★` },
                  { label: 'Verify Rate',     value: data.creators.total ? `${Math.round((data.creators.verified / data.creators.total) * 100)}%` : '0%' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400">{s.label}</div>
                    <div className="text-lg font-bold text-white mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Top Industries</h2>
              {data.brands.top_industries.length === 0 ? (
                <div className="text-slate-500 text-sm">No data</div>
              ) : (
                <BarChart
                  data={data.brands.top_industries.map(i => ({ label: i.name, value: i.count }))}
                  color="#f59e0b"
                />
              )}
            </div>
          </div>

          {/* Engagement */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Engagement — Messages per Day</h2>
            {msgDays.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-slate-500 text-sm">No messages in this period</div>
            ) : (
              <>
                <SparkLine data={msgDays.map(([, v]) => v)} color="#f59e0b" />
                <div className="mt-2 text-xs text-slate-400">
                  Total messages: <span className="text-amber-400 font-semibold">{data.engagement.total_messages_in_period.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          {/* Action frequency */}
          {Object.keys(data.engagement.action_counts).length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Top Actions</h2>
              <BarChart
                data={Object.entries(data.engagement.action_counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }))}
                color="#8b5cf6"
              />
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
