'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, Loader2, Pencil, RotateCcw, Search, Star, Trash2, X } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { formatMoney } from '@/components/campaigns/utils'
import type { RosterEntry } from '@/types/campaigns'

interface Profile { id: string; [key: string]: unknown }

export default function RosterPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const authHeader = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const authToken = localStorage.getItem('auth_token')
    if (!userStr || !authToken) {return}

    setToken(authToken)
    setProfile(profileStr ? JSON.parse(profileStr) : null)
    setLoading(true)
    setLoadError(false)

    try {
      const res = await fetch('/api/roster?limit=100', { headers: { Authorization: `Bearer ${authToken}` } })
      if (res.ok) {
        const data = await res.json()
        setRoster(data.roster || [])
      } else {
        setLoadError(true)
      }
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const entry of roster) {for (const tag of entry.tags || []) {set.add(tag)}}
    return [...set]
  }, [roster])

  const filtered = useMemo(() => {
    return roster.filter((entry) => {
      if (tagFilter && !(entry.tags || []).includes(tagFilter)) {return false}
      if (search) {
        const q = search.toLowerCase()
        const name = entry.creator?.display_name?.toLowerCase() || ''
        const username = entry.creator?.username?.toLowerCase() || ''
        if (!name.includes(q) && !username.includes(q)) {return false}
      }
      return true
    })
  }, [roster, search, tagFilter])

  async function removeEntry(id: string) {
    if (!confirm('Remove this creator from your roster?')) {return}
    const res = await fetch(`/api/roster/${id}`, { method: 'DELETE', headers: authHeader() })
    if (res.ok) {setRoster((prev) => prev.filter((r) => r.id !== id))}
  }

  async function saveEntry(id: string, updates: Partial<Pick<RosterEntry, 'typical_payout' | 'typical_charge' | 'currency' | 'notes' | 'tags'>>) {
    const res = await fetch(`/api/roster/${id}`, {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const data = await res.json()
      setRoster((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.roster_entry } : r)))
    }
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="brand" profile={profile} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Creator Roster</h1>
          <p className="text-gray-500 mt-1">Your saved creators, with typical rates for quick campaign adds.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <label htmlFor="roster-search" className="sr-only">Search roster</label>
            <input
              id="roster-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
            />
          </div>
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
              aria-label="Filter by tag"
            >
              <option value="">All tags</option>
              {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          )}
        </div>

        {loadError ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">Couldn&apos;t load your roster</h3>
            <button onClick={load} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg font-medium">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Star className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-gray-900">{roster.length === 0 ? 'No creators saved yet' : 'No creators match this filter'}</h3>
            <p className="text-gray-500 mt-1">
              {roster.length === 0 ? (
                <>Visit a <Link href="/creators" className="text-brand-purple-dark hover:underline">creator&apos;s profile</Link> and click &quot;Save to roster&quot;.</>
              ) : 'Try a different search or tag.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3">Creator</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3 text-right">Followers</th>
                  <th className="p-3 text-right">Avg views</th>
                  <th className="p-3">Performance with you</th>
                  <th className="p-3 text-right">Typical payout</th>
                  <th className="p-3 text-right">Typical charge</th>
                  <th className="p-3">Tags</th>
                  <th className="p-3 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <RosterRow
                    key={entry.id}
                    entry={entry}
                    isEditing={editingId === entry.id}
                    onEdit={() => setEditingId(entry.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onSave={(updates) => saveEntry(entry.id, updates)}
                    onRemove={() => removeEntry(entry.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function RosterRow({
  entry, isEditing, onEdit, onCancelEdit, onSave, onRemove,
}: {
  entry: RosterEntry
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (updates: Partial<Pick<RosterEntry, 'typical_payout' | 'typical_charge' | 'currency' | 'notes' | 'tags'>>) => void
  onRemove: () => void
}) {
  const [payout, setPayout] = useState(entry.typical_payout !== null ? String(entry.typical_payout) : '')
  const [charge, setCharge] = useState(entry.typical_charge !== null ? String(entry.typical_charge) : '')
  const [tagsInput, setTagsInput] = useState((entry.tags || []).join(', '))

  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {entry.creator?.profile_photo_url ? (
              <Image src={entry.creator.profile_photo_url} alt="" width={32} height={32} className="object-cover w-full h-full" />
            ) : (
              <span className="text-xs font-semibold text-brand-purple-dark">{entry.creator?.display_name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div className="min-w-0">
            <Link href={`/creators/${entry.creator?.username}`} className="font-medium text-gray-900 hover:underline truncate block">
              {entry.creator?.display_name}
            </Link>
            <p className="text-xs text-gray-500 truncate">@{entry.creator?.username}</p>
          </div>
        </div>
      </td>
      <td className="p-3 text-gray-600">{entry.creator?.primary_platform || '—'}</td>
      <td className="p-3 text-right text-gray-900">{entry.creator?.total_followers?.toLocaleString() ?? '—'}</td>
      <td className="p-3 text-right text-gray-900">{entry.creator?.avg_views?.toLocaleString() ?? '—'}</td>
      <td className="p-3 text-xs text-gray-600">
        {entry.performance && entry.performance.campaigns_done > 0 ? (
          <div className="space-y-0.5">
            <p>{entry.performance.campaigns_done} campaign{entry.performance.campaigns_done === 1 ? '' : 's'} done</p>
            <p>
              {entry.performance.avg_views !== null ? `${entry.performance.avg_views.toLocaleString()} avg views` : ''}
              {entry.performance.avg_cpm !== null ? ` · ${formatMoney(entry.performance.avg_cpm, entry.currency)} avg CPM` : ''}
            </p>
            {entry.performance.on_time_pct !== null && <p>{entry.performance.on_time_pct.toFixed(0)}% on-time</p>}
          </div>
        ) : (
          <span className="text-gray-300">No history yet</span>
        )}
      </td>
      <td className="p-3 text-right">
        {isEditing ? (
          <input type="number" min="0" value={payout} onChange={(e) => setPayout(e.target.value)} className="w-24 px-2 py-1 border border-gray-200 rounded text-sm text-right" />
        ) : (
          entry.typical_payout !== null ? formatMoney(entry.typical_payout, entry.currency) : '—'
        )}
      </td>
      <td className="p-3 text-right">
        {isEditing ? (
          <input type="number" min="0" value={charge} onChange={(e) => setCharge(e.target.value)} className="w-24 px-2 py-1 border border-gray-200 rounded text-sm text-right" />
        ) : (
          entry.typical_charge !== null ? formatMoney(entry.typical_charge, entry.currency) : '—'
        )}
      </td>
      <td className="p-3">
        {isEditing ? (
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="tag1, tag2" className="w-32 px-2 py-1 border border-gray-200 rounded text-sm" />
        ) : (
          <div className="flex flex-wrap gap-1">
            {(entry.tags || []).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{tag}</span>
            ))}
          </div>
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={() => onSave({
                  typical_payout: payout ? Number(payout) : null,
                  typical_charge: charge ? Number(charge) : null,
                  tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
                })}
                className="p-1.5 text-brand-purple-dark hover:bg-brand-pink/10 rounded-lg"
                aria-label="Save"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={onCancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" aria-label="Cancel">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={onEdit} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label="Edit" title="Edit">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={onRemove} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Remove" title="Remove">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
