'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BrandProfile, CreatorProfile } from '@/types/marketplace'

interface UseBrandOptions {
  userId?: string
  brandId?: string
  autoFetch?: boolean
}

interface UseBrandReturn {
  brand: BrandProfile | null
  savedCreators: CreatorProfile[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateProfile: (data: Partial<BrandProfile>) => Promise<{ success: boolean; error?: string }>
  saveCreator: (creatorId: string) => Promise<{ success: boolean; error?: string }>
  unsaveCreator: (creatorId: string) => Promise<{ success: boolean; error?: string }>
  isCreatorSaved: (creatorId: string) => boolean
}

export function useBrand({ userId, brandId, autoFetch = true }: UseBrandOptions = {}): UseBrandReturn {
  const [brand, setBrand] = useState<BrandProfile | null>(null)
  const [savedCreators, setSavedCreators] = useState<CreatorProfile[]>([])
  const [savedCreatorIds, setSavedCreatorIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBrand = useCallback(async () => {
    if (!userId && !brandId) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (userId) params.set('user_id', userId)
      if (brandId) params.set('id', brandId)

      const response = await fetch(`/api/brands?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch brand')
      }

      setBrand(data.brand)
      
      // Load saved creators from localStorage for now
      // In production, this would be stored in the database
      const saved = localStorage.getItem(`saved_creators_${data.brand.id}`)
      if (saved) {
        const ids = JSON.parse(saved)
        setSavedCreatorIds(new Set(ids))
        // Fetch creator details
        // This would be a batch API call in production
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      setBrand(null)
    } finally {
      setIsLoading(false)
    }
  }, [userId, brandId])

  useEffect(() => {
    if (autoFetch && (userId || brandId)) {
      fetchBrand()
    }
  }, [autoFetch, userId, brandId, fetchBrand])

  const updateProfile = useCallback(async (profileData: Partial<BrandProfile>) => {
    if (!brand) return { success: false, error: 'No brand loaded' }

    try {
      const response = await fetch('/api/brands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: brand.id, ...profileData }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update profile' }
      }

      setBrand(data.brand)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }, [brand])

  const saveCreator = useCallback(async (creatorId: string) => {
    if (!brand) return { success: false, error: 'No brand loaded' }

    try {
      // Add to local state
      const newIds = new Set(savedCreatorIds)
      newIds.add(creatorId)
      setSavedCreatorIds(newIds)
      
      // Persist to localStorage
      localStorage.setItem(`saved_creators_${brand.id}`, JSON.stringify([...newIds]))

      // In production, you'd save to database:
      // await fetch('/api/brands/saved-creators', {
      //   method: 'POST',
      //   body: JSON.stringify({ brand_id: brand.id, creator_id: creatorId }),
      // })

      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to save creator' }
    }
  }, [brand, savedCreatorIds])

  const unsaveCreator = useCallback(async (creatorId: string) => {
    if (!brand) return { success: false, error: 'No brand loaded' }

    try {
      // Remove from local state
      const newIds = new Set(savedCreatorIds)
      newIds.delete(creatorId)
      setSavedCreatorIds(newIds)
      
      // Persist to localStorage
      localStorage.setItem(`saved_creators_${brand.id}`, JSON.stringify([...newIds]))

      // In production, you'd delete from database
      // await fetch('/api/brands/saved-creators', {
      //   method: 'DELETE',
      //   body: JSON.stringify({ brand_id: brand.id, creator_id: creatorId }),
      // })

      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to unsave creator' }
    }
  }, [brand, savedCreatorIds])

  const isCreatorSaved = useCallback((creatorId: string) => {
    return savedCreatorIds.has(creatorId)
  }, [savedCreatorIds])

  return {
    brand,
    savedCreators,
    isLoading,
    error,
    refetch: fetchBrand,
    updateProfile,
    saveCreator,
    unsaveCreator,
    isCreatorSaved,
  }
}

// Hook for brand dashboard stats
interface BrandStats {
  totalSpent: number
  totalDeals: number
  activeDeals: number
  completedDeals: number
  savedCreatorsCount: number
}

export function useBrandStats(brandId?: string) {
  const [stats, setStats] = useState<BrandStats>({
    totalSpent: 0,
    totalDeals: 0,
    activeDeals: 0,
    completedDeals: 0,
    savedCreatorsCount: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!brandId) return

    const fetchStats = async () => {
      setIsLoading(true)
      try {
        // Fetch deals for stats
        const response = await fetch(`/api/deals?brand_id=${brandId}&user_type=brand`)
        const data = await response.json()

        if (response.ok) {
          interface DealData {
            id: string
            status: string
            amount_cents: number
          }
          
          const deals = (data.deals || []) as DealData[]
          const activeStatuses = ['pending', 'accepted', 'in_progress', 'delivered', 'revision']
          
          setStats({
            totalSpent: deals
              .filter((d: DealData) => d.status === 'completed')
              .reduce((sum: number, d: DealData) => sum + d.amount_cents, 0),
            totalDeals: deals.length,
            activeDeals: deals.filter((d: DealData) => activeStatuses.includes(d.status)).length,
            completedDeals: deals.filter((d: DealData) => d.status === 'completed').length,
            savedCreatorsCount: JSON.parse(localStorage.getItem(`saved_creators_${brandId}`) || '[]').length,
          })
        }
      } catch (err) {
        console.error('Error fetching brand stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [brandId])

  return { stats, isLoading }
}

export default useBrand