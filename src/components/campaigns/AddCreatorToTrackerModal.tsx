'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Search, Loader2, Star } from 'lucide-react'
import type { RosterEntry } from '@/types/campaigns'

interface PickerCreator {
  id: string
  username: string
  display_name: string
  profile_photo_url: string | null
  total_followers: number
}

interface AddCreatorToTrackerModalProps {
  roster: RosterEntry[]
  existingCreatorIds: string[]
  token: string | null
  onClose: () => void
  onAdd: (params: {
    creator_id: string
    planned_date: string | null
    payout_amount: number | null
    charge_amount: number | null
    currency: string
  }) => Promise<void>
}

export function AddCreatorToTrackerModal({ roster, existingCreatorIds, token, onClose, onAdd }: AddCreatorToTrackerModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PickerCreator[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null)
  const [plannedDate, setPlannedDate] = useState('')
  const [payout, setPayout] = useState('')
  const [charge, setCharge] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/creators?search=${encodeURIComponent(query)}&limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          setResults(data.creators || [])
        }
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, token])

  const rosterMatches = roster.filter((r) => {
    if (existingCreatorIds.includes(r.creator_id)) {return false}
    if (!query.trim()) {return true}
    const name = r.creator?.display_name?.toLowerCase() || ''
    const username = r.creator?.username?.toLowerCase() || ''
    return name.includes(query.toLowerCase()) || username.includes(query.toLowerCase())
  })

  const marketplaceMatches = results.filter((c) => !existingCreatorIds.includes(c.id) && !roster.some((r) => r.creator_id === c.id))

  function selectFromRoster(entry: RosterEntry) {
    setSelected({ id: entry.creator_id, name: entry.creator?.display_name || entry.creator?.username || 'Creator' })
    setPayout(entry.typical_payout !== null ? String(entry.typical_payout) : '')
    setCharge(entry.typical_charge !== null ? String(entry.typical_charge) : '')
    setCurrency(entry.currency || 'USD')
  }

  function selectFromMarketplace(creator: PickerCreator) {
    setSelected({ id: creator.id, name: creator.display_name })
    setPayout('')
    setCharge('')
    setCurrency('USD')
  }

  async function handleSubmit() {
    if (!selected) {return}
    setSubmitting(true)
    try {
      await onAdd({
        creator_id: selected.id,
        planned_date: plannedDate || null,
        payout_amount: payout ? Number(payout) : null,
        charge_amount: charge ? Number(charge) : null,
        currency,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Add creator to campaign">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Add creator</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!selected ? (
          <>
            <div className="p-4 border-b border-gray-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                <label htmlFor="creator-picker-search" className="sr-only">Search your roster or the marketplace</label>
                <input
                  id="creator-picker-search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your roster or the marketplace…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {rosterMatches.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Your roster</p>
                  {rosterMatches.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => selectFromRoster(entry)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {entry.creator?.profile_photo_url ? (
                          <Image src={entry.creator.profile_photo_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                        ) : (
                          <Star className="w-4 h-4 text-brand-purple-dark" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{entry.creator?.display_name}</p>
                        <p className="text-xs text-gray-500 truncate">@{entry.creator?.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.trim() && (
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Marketplace</p>
                  {searching ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : marketplaceMatches.length > 0 ? (
                    marketplaceMatches.map((creator) => (
                      <button
                        key={creator.id}
                        onClick={() => selectFromMarketplace(creator)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {creator.profile_photo_url ? (
                            <Image src={creator.profile_photo_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                          ) : (
                            <span className="text-sm font-semibold text-gray-500">{creator.display_name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{creator.display_name}</p>
                          <p className="text-xs text-gray-500 truncate">@{creator.username} · {creator.total_followers.toLocaleString()} followers</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 px-2 py-4 text-center">No creators found</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Adding <span className="font-semibold text-gray-900">{selected.name}</span></p>
              <button onClick={() => setSelected(null)} className="text-sm text-brand-purple-dark hover:underline">Change</button>
            </div>

            <div>
              <label htmlFor="planned-date" className="block text-sm font-medium text-gray-700 mb-1">Planned date</label>
              <input
                id="planned-date"
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="payout-amount" className="block text-sm font-medium text-gray-700 mb-1">Payout to creator</label>
                <input
                  id="payout-amount"
                  type="number"
                  min="0"
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
              </div>
              <div>
                <label htmlFor="charge-amount" className="block text-sm font-medium text-gray-700 mb-1">Charge to client</label>
                <input
                  id="charge-amount"
                  type="number"
                  min="0"
                  value={charge}
                  onChange={(e) => setCharge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">The creator only ever sees the payout amount. Charge and profit stay internal.</p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Adding…' : 'Add to campaign'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddCreatorToTrackerModal
