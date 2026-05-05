'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Users, UserSquare, Building2, Handshake, Download } from 'lucide-react'
import Link from 'next/link'

type EntityType = 'all' | 'users' | 'creators' | 'brands' | 'deals'

interface SearchResults {
  users?: { id: string; email: string; user_type: string; is_active: boolean }[]
  creators?: { id: string; username: string; display_name: string; verification_status: string; total_followers: number }[]
  brands?: { id: string; company_name: string; industry: string; verification_status: string }[]
  deals?: { id: string; title: string; status: string; amount: number; currency: string }[]
  total: number
  query: string
}

const ENTITY_TABS: { key: EntityType; label: string; icon: React.ReactNode }[] = [
  { key: 'all',      label: 'All',      icon: <Search className="w-4 h-4" /> },
  { key: 'users',    label: 'Users',    icon: <Users className="w-4 h-4" /> },
  { key: 'creators', label: 'Creators', icon: <UserSquare className="w-4 h-4" /> },
  { key: 'brands',   label: 'Brands',   icon: <Building2 className="w-4 h-4" /> },
  { key: 'deals',    label: 'Deals',    icon: <Handshake className="w-4 h-4" /> },
]

const STATUS_COLORS: Record<string, string> = {
  verified:   'bg-emerald-500/20 text-emerald-400',
  unverified: 'bg-slate-500/20 text-slate-400',
  pending:    'bg-amber-500/20 text-amber-400',
  active:     'bg-emerald-500/20 text-emerald-400',
  completed:  'bg-blue-500/20 text-blue-400',
  cancelled:  'bg-red-500/20 text-red-400',
  rejected:   'bg-red-500/20 text-red-400',
}

function badge(text: string) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[text] ?? 'bg-slate-500/20 text-slate-400'}`}>
      {text}
    </span>
  )
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [q, setQ]             = useState(searchParams.get('q') ?? '')
  const [type, setType]       = useState<EntityType>((searchParams.get('type') as EntityType) ?? 'all')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  const doSearch = useCallback(async (query: string, entityType: EntityType) => {
    if (query.trim().length < 2) return
    setLoading(true)
    try {
      const types = entityType === 'all' ? '' : entityType
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}&limit=20${types ? `&types=${types}` : ''}`)
      const data = await res.json()
      setResults(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initial = searchParams.get('q')
    if (initial) doSearch(initial, type)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    router.replace(`/admin/search?q=${encodeURIComponent(q)}&type=${type}`)
    doSearch(q, type)
  }

  function exportCSV() {
    if (!results) return
    const allRows: string[][] = [['Type', 'ID', 'Name / Email', 'Status / Type']]
    results.users?.forEach(u => allRows.push(['user', u.id, u.email, u.user_type]))
    results.creators?.forEach(c => allRows.push(['creator', c.id, c.display_name || c.username, c.verification_status]))
    results.brands?.forEach(b => allRows.push(['brand', b.id, b.company_name, b.industry]))
    results.deals?.forEach(d => allRows.push(['deal', d.id, d.title, d.status]))
    const csv = allRows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `search_${q}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Advanced Search</h1>
        <p className="text-slate-400 text-sm mt-1">Search across all platform entities</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email, name, title…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 text-base"
            />
          </div>
          <button type="submit" className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors">
            Search
          </button>
        </div>

        {/* Entity type tabs */}
        <div className="flex gap-2 flex-wrap">
          {ENTITY_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setType(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${type === tab.key ? 'bg-violet-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : results ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              {results.total} result{results.total !== 1 ? 's' : ''} for &quot;<span className="text-white">{results.query}</span>&quot;
            </p>
            {results.total > 0 && (
              <button onClick={exportCSV} className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
          </div>

          {/* Users */}
          {results.users && results.users.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Users ({results.users.length})
              </h2>
              <div className="space-y-1">
                {results.users.map(u => (
                  <Link key={u.id} href="/admin/users" className="flex items-center gap-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                      {u.email[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm">{u.email}</div>
                      <div className="text-slate-500 text-xs">{u.user_type}</div>
                    </div>
                    {badge(u.is_active ? 'active' : 'suspended')}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Creators */}
          {results.creators && results.creators.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserSquare className="w-4 h-4" /> Creators ({results.creators.length})
              </h2>
              <div className="space-y-1">
                {results.creators.map(c => (
                  <Link key={c.id} href="/admin/creators" className="flex items-center gap-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400">
                      {(c.display_name || c.username)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm">{c.display_name || c.username}</div>
                      <div className="text-slate-500 text-xs">@{c.username} · {fmt(c.total_followers)} followers</div>
                    </div>
                    {badge(c.verification_status)}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Brands */}
          {results.brands && results.brands.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Brands ({results.brands.length})
              </h2>
              <div className="space-y-1">
                {results.brands.map(b => (
                  <Link key={b.id} href="/admin/brands" className="flex items-center gap-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-400">
                      {b.company_name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm">{b.company_name}</div>
                      <div className="text-slate-500 text-xs">{b.industry}</div>
                    </div>
                    {badge(b.verification_status)}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Deals */}
          {results.deals && results.deals.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Handshake className="w-4 h-4" /> Deals ({results.deals.length})
              </h2>
              <div className="space-y-1">
                {results.deals.map(d => (
                  <div key={d.id} className="flex items-center gap-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                      $
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm">{d.title}</div>
                      <div className="text-slate-500 text-xs">{d.amount} {d.currency}</div>
                    </div>
                    {badge(d.status)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.total === 0 && (
            <div className="text-center py-16 text-slate-500">
              No results found for &quot;{results.query}&quot;
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-600">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Enter at least 2 characters to search</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
