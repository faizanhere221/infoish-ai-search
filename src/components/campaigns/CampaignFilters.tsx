'use client'

import { Search, X } from 'lucide-react'
import { CAMPAIGN_CATEGORIES, PLATFORMS } from '@/types/campaigns'
import type { CampaignCategory, Platform } from '@/types/campaigns'

export interface CampaignFilterState {
  search: string
  category: CampaignCategory | ''
  platforms: Platform[]
  budgetMin: string
  budgetMax: string
}

export const EMPTY_FILTERS: CampaignFilterState = {
  search: '',
  category: '',
  platforms: [],
  budgetMin: '',
  budgetMax: '',
}

interface CampaignFiltersProps {
  filters: CampaignFilterState
  onChange: (filters: CampaignFilterState) => void
}

export default function CampaignFilters({ filters, onChange }: CampaignFiltersProps) {
  function update<K extends keyof CampaignFilterState>(field: K, value: CampaignFilterState[K]) {
    onChange({ ...filters, [field]: value })
  }

  function togglePlatform(platform: Platform) {
    update(
      'platforms',
      filters.platforms.includes(platform)
        ? filters.platforms.filter((p) => p !== platform)
        : [...filters.platforms, platform]
    )
  }

  const activeCount =
    (filters.category ? 1 : 0) +
    filters.platforms.length +
    (filters.budgetMin ? 1 : 0) +
    (filters.budgetMax ? 1 : 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Search campaigns by title or description..."
            className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <select
          value={filters.category}
          onChange={(e) => update('category', e.target.value as CampaignCategory | '')}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All Categories</option>
          {CAMPAIGN_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={filters.budgetMin}
            onChange={(e) => update('budgetMin', e.target.value)}
            placeholder="Min $"
            className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min={0}
            value={filters.budgetMax}
            onChange={(e) => update('budgetMax', e.target.value)}
            placeholder="Max $"
            className="w-24 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {PLATFORMS.map((p) => {
          const selected = filters.platforms.includes(p.value)
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => togglePlatform(p.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selected
                  ? 'bg-violet-50 border-violet-300 text-violet-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
