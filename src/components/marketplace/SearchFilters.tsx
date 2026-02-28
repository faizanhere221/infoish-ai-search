'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronDown,
  Star,
  CheckCircle
} from 'lucide-react'
import { NICHES, PLATFORMS } from '@/utils/constants'

interface FilterState {
  search: string
  niches: string[]
  platforms: string[]
  countries: string[]
  minRating: number | null
  priceMin: number | null
  priceMax: number | null
  verified: boolean
  sort: string
}

interface SearchFiltersProps {
  onFilterChange: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
  showMobileToggle?: boolean
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'followers', label: 'Most Followers' },
  { value: 'newest', label: 'Newest' },
]

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'PK', name: 'Pakistan' },
]

const RATING_OPTIONS = [
  { value: 4.5, label: '4.5+ Stars' },
  { value: 4.0, label: '4.0+ Stars' },
  { value: 3.5, label: '3.5+ Stars' },
  { value: 3.0, label: '3.0+ Stars' },
]

const PRICE_RANGES = [
  { min: null, max: 100, label: 'Under $100' },
  { min: 100, max: 500, label: '$100 - $500' },
  { min: 500, max: 1000, label: '$500 - $1,000' },
  { min: 1000, max: 5000, label: '$1,000 - $5,000' },
  { min: 5000, max: null, label: '$5,000+' },
]

export function SearchFilters({
  onFilterChange,
  initialFilters = {},
  showMobileToggle = true,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    niches: [],
    platforms: [],
    countries: [],
    minRating: null,
    priceMin: null,
    priceMax: null,
    verified: false,
    sort: 'relevance',
    ...initialFilters,
  })

  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('niches')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, onFilterChange])

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (key: 'niches' | 'platforms' | 'countries', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      niches: [],
      platforms: [],
      countries: [],
      minRating: null,
      priceMin: null,
      priceMax: null,
      verified: false,
      sort: 'relevance',
    })
  }

  const activeFilterCount = 
    filters.niches.length +
    filters.platforms.length +
    filters.countries.length +
    (filters.minRating ? 1 : 0) +
    (filters.priceMin || filters.priceMax ? 1 : 0) +
    (filters.verified ? 1 : 0)

  const FilterSection = ({ 
    title, 
    id, 
    children 
  }: { 
    title: string
    id: string
    children: React.ReactNode 
  }) => (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
          expandedSection === id ? 'rotate-180' : ''
        }`} />
      </button>
      {expandedSection === id && (
        <div className="pb-4">
          {children}
        </div>
      )}
    </div>
  )

  const FiltersContent = () => (
    <div className="space-y-1">
      {/* Verified Only */}
      <div className="py-3 border-b border-gray-100">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.verified}
            onChange={(e) => updateFilter('verified', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-900">Verified Only</span>
          </span>
        </label>
      </div>

      {/* Niches */}
      <FilterSection title="Niche" id="niches">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {NICHES.map((niche: string) => (
            <label key={niche} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.niches.includes(niche)}
                onChange={() => toggleArrayFilter('niches', niche)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{niche}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Platforms */}
      <FilterSection title="Platform" id="platforms">
        <div className="space-y-2">
          {PLATFORMS.map(platform => (
            <label key={platform.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.platforms.includes(platform.id)}
                onChange={() => toggleArrayFilter('platforms', platform.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-lg">{platform.icon}</span>
              <span className="text-sm text-gray-700">{platform.name}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Minimum Rating" id="rating">
        <div className="space-y-2">
          {RATING_OPTIONS.map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === option.value}
                onChange={() => updateFilter('minRating', option.value)}
                className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1 text-sm text-gray-700">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {option.label}
              </span>
            </label>
          ))}
          {filters.minRating && (
            <button
              onClick={() => updateFilter('minRating', null)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear rating filter
            </button>
          )}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" id="price">
        <div className="space-y-2">
          {PRICE_RANGES.map((range, index) => (
            <label key={index} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="price"
                checked={filters.priceMin === range.min && filters.priceMax === range.max}
                onChange={() => {
                  updateFilter('priceMin', range.min)
                  updateFilter('priceMax', range.max)
                }}
                className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{range.label}</span>
            </label>
          ))}
          {(filters.priceMin || filters.priceMax) && (
            <button
              onClick={() => {
                updateFilter('priceMin', null)
                updateFilter('priceMax', null)
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear price filter
            </button>
          )}
        </div>
      </FilterSection>

      {/* Country */}
      <FilterSection title="Country" id="countries">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {COUNTRIES.map(country => (
            <label key={country.code} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.countries.includes(country.code)}
                onChange={() => toggleArrayFilter('countries', country.code)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{country.name}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  )

  return (
    <div>
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search creators by name, niche, or skill..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort Dropdown */}
        <select
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Mobile Filter Toggle */}
        {showMobileToggle && (
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Active Filters Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.verified && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full">
              Verified
              <button onClick={() => updateFilter('verified', false)}>
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          {filters.niches.map(niche => (
            <span key={niche} className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-700 text-sm rounded-full">
              {niche}
              <button onClick={() => toggleArrayFilter('niches', niche)}>
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
          {filters.platforms.map(platform => (
            <span key={platform} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm rounded-full">
              {PLATFORMS.find(p => p.id === platform)?.name || platform}
              <button onClick={() => toggleArrayFilter('platforms', platform)}>
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
          {filters.minRating && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm rounded-full">
              {filters.minRating}+ Stars
              <button onClick={() => updateFilter('minRating', null)}>
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          {(filters.priceMin || filters.priceMax) && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-full">
              {filters.priceMin ? `$${filters.priceMin}` : '$0'} - {filters.priceMax ? `$${filters.priceMax}` : '∞'}
              <button onClick={() => { updateFilter('priceMin', null); updateFilter('priceMax', null) }}>
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 px-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Desktop Sidebar Filters */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all
            </button>
          )}
        </div>
        <FiltersContent />
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-50 lg:hidden overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FiltersContent />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                Show Results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SearchFilters