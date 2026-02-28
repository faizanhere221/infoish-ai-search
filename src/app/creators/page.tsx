'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  MapPin,
  Star,
  Users,
  CheckCircle,
  Sparkles,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Heart,
  MessageSquare,
  Clock,
  DollarSign,
  Globe,
  Award
} from 'lucide-react'
import { NICHES, PLATFORMS, COUNTRIES, LANGUAGES } from '@/utils/constants'

interface Creator {
  id: string
  username: string
  display_name: string
  bio: string | null
  profile_photo_url: string | null
  country: string | null
  city: string | null
  niches: string[]
  languages: string[]
  verification_status: string
  total_followers: number
  completed_deals: number
  total_reviews: number
  avg_rating: number | null
  is_available: boolean
  min_budget: number | null
  response_time: string | null
  created_at: string
  creator_platforms: {
    platform: string
    followers: number
    platform_username: string | null
  }[]
  creator_services: {
    price: number
    is_active: boolean
  }[]
}

type SortOption = 'relevance' | 'rating' | 'price_low' | 'price_high' | 'followers' | 'newest'

const PLATFORM_NAMES: Record<string, string> = {
  twitter: 'Twitter/X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  newsletter: 'Newsletter',
  podcast: 'Podcast',
  tiktok: 'TikTok',
  instagram: 'Instagram',
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
  DE: 'Germany',
  NL: 'Netherlands',
  IN: 'India',
  PK: 'Pakistan',
  SG: 'Singapore',
}

const PRICE_RANGES = [
  { id: 'under_500', label: 'Under $500', min: 0, max: 500 },
  { id: '500_1000', label: '$500 - $1,000', min: 500, max: 1000 },
  { id: '1000_2500', label: '$1,000 - $2,500', min: 1000, max: 2500 },
  { id: '2500_5000', label: '$2,500 - $5,000', min: 2500, max: 5000 },
  { id: 'over_5000', label: '$5,000+', min: 5000, max: Infinity },
]

const FOLLOWER_RANGES = [
  { id: 'micro', label: '1K - 10K (Micro)', min: 1000, max: 10000 },
  { id: 'small', label: '10K - 50K (Small)', min: 10000, max: 50000 },
  { id: 'mid', label: '50K - 100K (Mid)', min: 50000, max: 100000 },
  { id: 'large', label: '100K - 500K (Large)', min: 100000, max: 500000 },
  { id: 'mega', label: '500K+ (Mega)', min: 500000, max: Infinity },
]

const RATING_OPTIONS = [
  { id: '4.5', label: '4.5+ Stars', value: 4.5 },
  { id: '4', label: '4+ Stars', value: 4 },
  { id: '3.5', label: '3.5+ Stars', value: 3.5 },
  { id: '3', label: '3+ Stars', value: 3 },
]

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'followers', label: 'Most Followers' },
  { id: 'newest', label: 'Newest' },
]

export default function CreatorsPage() {
  const router = useRouter()
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNiches, setSelectedNiches] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null)
  const [selectedFollowerRange, setSelectedFollowerRange] = useState<string | null>(null)
  const [selectedRating, setSelectedRating] = useState<string | null>(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('relevance')

  // UI State
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    niche: true,
    platform: true,
    price: false,
    followers: false,
    rating: false,
    country: false,
    language: false,
    verification: false,
  })

  useEffect(() => {
    checkAuth()
    fetchCreators()
  }, [])

  const checkAuth = () => {
    const userStr = localStorage.getItem('auth_user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setIsLoggedIn(true)
      setUserType(user.user_type)
    }
  }

  const fetchCreators = async () => {
    try {
      const res = await fetch('/api/creators')
      if (res.ok) {
        const data = await res.json()
        setCreators(data.creators || [])
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching creators:', err)
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleNiche = (niche: string) => {
    setSelectedNiches(prev =>
      prev.includes(niche)
        ? prev.filter(n => n !== niche)
        : [...prev, niche]
    )
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    )
  }

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedNiches([])
    setSelectedPlatforms([])
    setSelectedCountries([])
    setSelectedLanguages([])
    setSelectedPriceRange(null)
    setSelectedFollowerRange(null)
    setSelectedRating(null)
    setVerifiedOnly(false)
    setAvailableOnly(false)
  }

  const activeFilterCount =
    selectedNiches.length +
    selectedPlatforms.length +
    selectedCountries.length +
    selectedLanguages.length +
    (selectedPriceRange ? 1 : 0) +
    (selectedFollowerRange ? 1 : 0) +
    (selectedRating ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (availableOnly ? 1 : 0)

  // Get min price for a creator
  const getMinPrice = (creator: Creator): number | null => {
    const activeServices = creator.creator_services?.filter(s => s.is_active) || []
    if (activeServices.length === 0) return creator.min_budget || null
    return Math.min(...activeServices.map(s => s.price))
  }

  // Filter creators
  const filteredCreators = creators.filter(creator => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        creator.display_name?.toLowerCase().includes(query) ||
        creator.username?.toLowerCase().includes(query) ||
        creator.bio?.toLowerCase().includes(query) ||
        creator.niches?.some(n => n.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }

    // Niche filter
    if (selectedNiches.length > 0) {
      const hasNiche = selectedNiches.some(niche =>
        creator.niches?.includes(niche)
      )
      if (!hasNiche) return false
    }

    // Platform filter
    if (selectedPlatforms.length > 0) {
      const hasPlatform = selectedPlatforms.some(platform =>
        creator.creator_platforms?.some(p => p.platform === platform)
      )
      if (!hasPlatform) return false
    }

    // Country filter
    if (selectedCountries.length > 0) {
      if (!creator.country || !selectedCountries.includes(creator.country)) {
        return false
      }
    }

    // Language filter
    if (selectedLanguages.length > 0) {
      const hasLanguage = selectedLanguages.some(lang =>
        creator.languages?.includes(lang)
      )
      if (!hasLanguage) return false
    }

    // Price range filter
    if (selectedPriceRange) {
      const range = PRICE_RANGES.find(r => r.id === selectedPriceRange)
      if (range) {
        const minPrice = getMinPrice(creator)
        if (minPrice === null || minPrice < range.min || minPrice > range.max) {
          return false
        }
      }
    }

    // Follower range filter
    if (selectedFollowerRange) {
      const range = FOLLOWER_RANGES.find(r => r.id === selectedFollowerRange)
      if (range) {
        if (creator.total_followers < range.min || creator.total_followers > range.max) {
          return false
        }
      }
    }

    // Rating filter
    if (selectedRating) {
      const option = RATING_OPTIONS.find(r => r.id === selectedRating)
      if (option) {
        if (!creator.avg_rating || creator.avg_rating < option.value) {
          return false
        }
      }
    }

    // Verified only filter
    if (verifiedOnly && creator.verification_status !== 'verified') {
      return false
    }

    // Available only filter
    if (availableOnly && !creator.is_available) {
      return false
    }

    return true
  })

  // Sort creators
  const sortedCreators = [...filteredCreators].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.avg_rating || 0) - (a.avg_rating || 0)
      case 'price_low':
        return (getMinPrice(a) || Infinity) - (getMinPrice(b) || Infinity)
      case 'price_high':
        return (getMinPrice(b) || 0) - (getMinPrice(a) || 0)
      case 'followers':
        return b.total_followers - a.total_followers
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        // Relevance: prioritize verified, then by completed deals
        const aScore = (a.verification_status === 'verified' ? 1000 : 0) + a.completed_deals
        const bScore = (b.verification_status === 'verified' ? 1000 : 0) + b.completed_deals
        return bScore - aScore
    }
  })

  const formatFollowers = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Infoishai</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/creators" className="text-violet-600 font-medium">
                  Find Creators
                </Link>
                {isLoggedIn && (
                  <Link
                    href={userType === 'brand' ? '/dashboard/brand' : '/dashboard/creator'}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                )}
                {isLoggedIn && (
                  <Link href="/messages" className="text-gray-600 hover:text-gray-900">
                    Messages
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Link
                  href={userType === 'brand' ? '/dashboard/brand' : '/dashboard/creator'}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators by name, niche, or keyword..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              />
            </div>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Active filters:</span>
            {selectedNiches.map(niche => (
              <button
                key={niche}
                onClick={() => toggleNiche(niche)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm hover:bg-violet-200"
              >
                {niche}
                <X className="w-3 h-3" />
              </button>
            ))}
            {selectedPlatforms.map(platform => (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
              >
                {PLATFORM_NAMES[platform] || platform}
                <X className="w-3 h-3" />
              </button>
            ))}
            {selectedCountries.map(country => (
              <button
                key={country}
                onClick={() => toggleCountry(country)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm hover:bg-emerald-200"
              >
                {COUNTRY_NAMES[country] || country}
                <X className="w-3 h-3" />
              </button>
            ))}
            {selectedPriceRange && (
              <button
                onClick={() => setSelectedPriceRange(null)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm hover:bg-amber-200"
              >
                {PRICE_RANGES.find(r => r.id === selectedPriceRange)?.label}
                <X className="w-3 h-3" />
              </button>
            )}
            {verifiedOnly && (
              <button
                onClick={() => setVerifiedOnly(false)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
              >
                Verified Only
                <X className="w-3 h-3" />
              </button>
            )}
            {availableOnly && (
              <button
                onClick={() => setAvailableOnly(false)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm hover:bg-emerald-200"
              >
                Available Only
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:w-72 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-violet-600 hover:text-violet-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Niche Filter */}
              <FilterSection
                title="Niche"
                icon={<Sparkles className="w-4 h-4" />}
                expanded={expandedSections.niche}
                onToggle={() => toggleSection('niche')}
              >
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {NICHES.map((niche) => (
                    <label key={niche} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedNiches.includes(niche)}
                        onChange={() => toggleNiche(niche)}
                        className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-600">{niche}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Platform Filter */}
              <FilterSection
                title="Platform"
                icon={<Globe className="w-4 h-4" />}
                expanded={expandedSections.platform}
                onToggle={() => toggleSection('platform')}
              >
                <div className="space-y-2">
                  {PLATFORMS.map((platform) => (
                    <label key={platform.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform.id)}
                        onChange={() => togglePlatform(platform.id)}
                        className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-600">{platform.name}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Price Range Filter */}
              <FilterSection
                title="Price Range"
                icon={<DollarSign className="w-4 h-4" />}
                expanded={expandedSections.price}
                onToggle={() => toggleSection('price')}
              >
                <div className="space-y-2">
                  {PRICE_RANGES.map((range) => (
                    <label key={range.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priceRange"
                        checked={selectedPriceRange === range.id}
                        onChange={() => setSelectedPriceRange(range.id)}
                        className="w-4 h-4 text-violet-600 border-gray-300 focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-600">{range.label}</span>
                    </label>
                  ))}
                  {selectedPriceRange && (
                    <button
                      onClick={() => setSelectedPriceRange(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </FilterSection>

              {/* Followers Filter */}
              <FilterSection
                title="Followers"
                icon={<Users className="w-4 h-4" />}
                expanded={expandedSections.followers}
                onToggle={() => toggleSection('followers')}
              >
                <div className="space-y-2">
                  {FOLLOWER_RANGES.map((range) => (
                    <label key={range.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="followerRange"
                        checked={selectedFollowerRange === range.id}
                        onChange={() => setSelectedFollowerRange(range.id)}
                        className="w-4 h-4 text-violet-600 border-gray-300 focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-600">{range.label}</span>
                    </label>
                  ))}
                  {selectedFollowerRange && (
                    <button
                      onClick={() => setSelectedFollowerRange(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </FilterSection>

              {/* Rating Filter */}
              <FilterSection
                title="Minimum Rating"
                icon={<Star className="w-4 h-4" />}
                expanded={expandedSections.rating}
                onToggle={() => toggleSection('rating')}
              >
                <div className="space-y-2">
                  {RATING_OPTIONS.map((option) => (
                    <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedRating === option.id}
                        onChange={() => setSelectedRating(option.id)}
                        className="w-4 h-4 text-violet-600 border-gray-300 focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        {option.label}
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      </span>
                    </label>
                  ))}
                  {selectedRating && (
                    <button
                      onClick={() => setSelectedRating(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </FilterSection>

              {/* Country Filter */}
              <FilterSection
                title="Country"
                icon={<MapPin className="w-4 h-4" />}
                expanded={expandedSections.country}
                onToggle={() => toggleSection('country')}
              >
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {COUNTRIES.map((country) => (
                    <label key={country.code} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCountries.includes(country.code)}
                        onChange={() => toggleCountry(country.code)}
                        className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-600">{country.name}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Language Filter */}
              <FilterSection
                title="Language"
                icon={<MessageSquare className="w-4 h-4" />}
                expanded={expandedSections.language}
                onToggle={() => toggleSection('language')}
              >
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {LANGUAGES.map((lang) => (
                    <label key={lang.code} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang.code)}
                        onChange={() => toggleLanguage(lang.code)}
                        className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                      />
                      <span className="text-sm text-gray-600">{lang.name}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Verification Filter */}
              <FilterSection
                title="Verification"
                icon={<CheckCircle className="w-4 h-4" />}
                expanded={expandedSections.verification}
                onToggle={() => toggleSection('verification')}
              >
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-600">Verified creators only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={(e) => setAvailableOnly(e.target.checked)}
                      className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-600">Available for work only</span>
                  </label>
                </div>
              </FilterSection>
            </div>
          </aside>

          {/* Creators Grid */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{sortedCreators.length}</span> creators found
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : sortedCreators.length > 0 ? (
              <div className="space-y-4">
                {sortedCreators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Users className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="mt-4 font-semibold text-gray-900">No creators found</h3>
                <p className="text-gray-500 mt-1">
                  {creators.length === 0
                    ? "No creators have signed up yet. Be the first!"
                    : "Try adjusting your filters or search query"
                  }
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-4 py-2 text-violet-600 hover:bg-violet-50 rounded-lg font-medium"
                  >
                    Clear all filters
                  </button>
                )}
                {creators.length === 0 && (
                  <Link
                    href="/signup/creator"
                    className="mt-4 inline-block px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
                  >
                    Become a Creator
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

// Filter Section Component
function FilterSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon}
          {title}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expanded && <div className="mt-3">{children}</div>}
    </div>
  )
}

// Creator Card Component
function CreatorCard({ creator }: { creator: Creator }) {
  const formatFollowers = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getMinPrice = (): number | null => {
    const activeServices = creator.creator_services?.filter(s => s.is_active) || []
    if (activeServices.length === 0) return creator.min_budget || null
    return Math.min(...activeServices.map(s => s.price))
  }

  const minPrice = getMinPrice()
  const platforms = creator.creator_platforms || []

  return (
    <Link
      href={`/creators/${creator.username}`}
      className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-violet-300 hover:shadow-lg transition-all"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {creator.profile_photo_url ? (
            <img
              src={creator.profile_photo_url}
              alt={creator.display_name}
              className="w-20 h-20 rounded-xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {creator.display_name?.charAt(0) || 'U'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-lg">{creator.display_name}</h3>
                {creator.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
                {creator.is_available && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    Available
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">@{creator.username}</p>
              {(creator.city || creator.country) && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {[creator.city, creator.country ? COUNTRY_NAMES[creator.country] || creator.country : null].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Price */}
            {minPrice && (
              <div className="text-right">
                <p className="text-xs text-gray-500">From</p>
                <p className="text-xl font-bold text-gray-900">${minPrice.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className="mt-3 text-gray-600 line-clamp-2">{creator.bio}</p>
          )}

          {/* Niches */}
          {creator.niches && creator.niches.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {creator.niches.slice(0, 3).map((niche) => (
                <span
                  key={niche}
                  className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium"
                >
                  {niche}
                </span>
              ))}
              {creator.niches.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  +{creator.niches.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-gray-900">
                {creator.avg_rating ? creator.avg_rating.toFixed(1) : 'New'}
              </span>
              {creator.total_reviews > 0 && (
                <span className="text-sm text-gray-500">({creator.total_reviews})</span>
              )}
            </div>

            {/* Followers */}
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{formatFollowers(creator.total_followers)} followers</span>
            </div>

            {/* Completed Deals */}
            {creator.completed_deals > 0 && (
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{creator.completed_deals} deals completed</span>
              </div>
            )}
          </div>

          {/* Platforms */}
          {platforms.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-500">Active on:</span>
              {platforms.slice(0, 4).map((p) => (
                <span key={p.platform} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {PLATFORM_NAMES[p.platform] || p.platform}
                </span>
              ))}
              {platforms.length > 4 && (
                <span className="text-xs text-gray-500">+{platforms.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}