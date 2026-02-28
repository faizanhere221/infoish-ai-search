'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CreatorProfile, Service, PortfolioItem, Review } from '@/types/marketplace'

interface UseCreatorOptions {
  username?: string
  id?: string
  autoFetch?: boolean
}

interface UseCreatorReturn {
  creator: CreatorProfile | null
  reviews: Review[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateServices: (services: Service[]) => Promise<{ success: boolean; error?: string }>
  updatePortfolio: (items: PortfolioItem[]) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: Partial<CreatorProfile>) => Promise<{ success: boolean; error?: string }>
}

export function useCreator({ username, id, autoFetch = true }: UseCreatorOptions = {}): UseCreatorReturn {
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCreator = useCallback(async () => {
    const identifier = username || id
    if (!identifier) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/creators/${identifier}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch creator')
      }

      setCreator(data.creator)
      setReviews(data.reviews || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      setCreator(null)
    } finally {
      setIsLoading(false)
    }
  }, [username, id])

  useEffect(() => {
    if (autoFetch && (username || id)) {
      fetchCreator()
    }
  }, [autoFetch, username, id, fetchCreator])

  const updateServices = useCallback(async (services: Service[]) => {
    if (!creator) return { success: false, error: 'No creator loaded' }

    try {
      const response = await fetch(`/api/creators/${creator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update services' }
      }

      setCreator(data.creator)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }, [creator])

  const updatePortfolio = useCallback(async (items: PortfolioItem[]) => {
    if (!creator) return { success: false, error: 'No creator loaded' }

    try {
      const response = await fetch(`/api/creators/${creator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio_items: items }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update portfolio' }
      }

      setCreator(data.creator)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }, [creator])

  const updateProfile = useCallback(async (profileData: Partial<CreatorProfile>) => {
    if (!creator) return { success: false, error: 'No creator loaded' }

    try {
      const response = await fetch(`/api/creators/${creator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update profile' }
      }

      setCreator(data.creator)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }, [creator])

  return {
    creator,
    reviews,
    isLoading,
    error,
    refetch: fetchCreator,
    updateServices,
    updatePortfolio,
    updateProfile,
  }
}

// Hook for searching creators
interface SearchFilters {
  search?: string
  niches?: string[]
  platforms?: string[]
  countries?: string[]
  minRating?: number
  priceMin?: number
  priceMax?: number
  verified?: boolean
  sort?: string
}

interface UseCreatorSearchReturn {
  creators: CreatorProfile[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  search: (filters: SearchFilters, page?: number) => Promise<void>
  loadMore: () => Promise<void>
  reset: () => void
}

export function useCreatorSearch(initialLimit = 20): UseCreatorSearchReturn {
  const [creators, setCreators] = useState<CreatorProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  })

  const search = useCallback(async (newFilters: SearchFilters, page = 1) => {
    setIsLoading(true)
    setError(null)
    setFilters(newFilters)

    try {
      const params = new URLSearchParams()
      
      if (newFilters.search) params.set('search', newFilters.search)
      if (newFilters.niches?.length) params.set('niches', newFilters.niches.join(','))
      if (newFilters.platforms?.length) params.set('platforms', newFilters.platforms.join(','))
      if (newFilters.countries?.length) params.set('countries', newFilters.countries.join(','))
      if (newFilters.minRating) params.set('minRating', newFilters.minRating.toString())
      if (newFilters.priceMin) params.set('priceMin', newFilters.priceMin.toString())
      if (newFilters.priceMax) params.set('priceMax', newFilters.priceMax.toString())
      if (newFilters.verified) params.set('verified', 'true')
      if (newFilters.sort) params.set('sort', newFilters.sort)
      params.set('page', page.toString())
      params.set('limit', initialLimit.toString())

      const response = await fetch(`/api/creators?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      if (page === 1) {
        setCreators(data.creators)
      } else {
        setCreators(prev => [...prev, ...data.creators])
      }
      
      setPagination(data.pagination)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [initialLimit])

  const loadMore = useCallback(async () => {
    if (pagination.page >= pagination.totalPages || isLoading) return
    await search(filters, pagination.page + 1)
  }, [pagination, isLoading, search, filters])

  const reset = useCallback(() => {
    setCreators([])
    setFilters({})
    setPagination({
      page: 1,
      limit: initialLimit,
      total: 0,
      totalPages: 0,
    })
    setError(null)
  }, [initialLimit])

  return {
    creators,
    isLoading,
    error,
    pagination,
    search,
    loadMore,
    reset,
  }
}

export default useCreator