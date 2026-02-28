'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Deal, Deliverable } from '@/types/marketplace'

type DealStatus = 'all' | 'active' | 'completed' | 'cancelled' | Deal['status']

interface UseDealsOptions {
  userId: string
  userType: 'creator' | 'brand'
  status?: DealStatus
  autoFetch?: boolean
}

interface UseDealsReturn {
  deals: Deal[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    active: number
    completed: number
    totalValue: number
    pendingValue: number
  }
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
  filterByStatus: (status: DealStatus) => Promise<void>
}

export function useDeals({ userId, userType, status = 'all', autoFetch = true }: UseDealsOptions): UseDealsReturn {
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<DealStatus>(status)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchDeals = useCallback(async (page = 1, statusFilter = currentStatus) => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        user_id: userId,
        user_type: userType,
        page: page.toString(),
        limit: '20',
      })
      
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const response = await fetch(`/api/deals?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch deals')
      }

      if (page === 1) {
        setDeals(data.deals || [])
      } else {
        setDeals(prev => [...prev, ...data.deals])
      }
      
      setPagination(data.pagination)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [userId, userType, currentStatus])

  useEffect(() => {
    if (autoFetch && userId) {
      fetchDeals()
    }
  }, [autoFetch, userId, fetchDeals])

  const loadMore = useCallback(async () => {
    if (pagination.page >= pagination.totalPages || isLoading) return
    await fetchDeals(pagination.page + 1)
  }, [pagination, isLoading, fetchDeals])

  const filterByStatus = useCallback(async (newStatus: DealStatus) => {
    setCurrentStatus(newStatus)
    await fetchDeals(1, newStatus)
  }, [fetchDeals])

  // Calculate stats
  const stats = {
    active: deals.filter(d => ['pending', 'accepted', 'in_progress', 'delivered', 'revision'].includes(d.status)).length,
    completed: deals.filter(d => d.status === 'completed').length,
    totalValue: deals
      .filter(d => d.status === 'completed')
      .reduce((sum, d) => sum + (userType === 'creator' ? d.creator_payout_cents : d.amount_cents), 0),
    pendingValue: deals
      .filter(d => ['pending', 'accepted', 'in_progress', 'delivered', 'revision'].includes(d.status))
      .reduce((sum, d) => sum + (userType === 'creator' ? d.creator_payout_cents : d.amount_cents), 0),
  }

  return {
    deals,
    isLoading,
    error,
    pagination,
    stats,
    refetch: fetchDeals,
    loadMore,
    filterByStatus,
  }
}

// Hook for single deal
interface UseDealOptions {
  dealId: string
  autoFetch?: boolean
}

interface UseDealReturn {
  deal: Deal | null
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  refetch: () => Promise<void>
  acceptDeal: () => Promise<{ success: boolean; error?: string }>
  declineDeal: () => Promise<{ success: boolean; error?: string }>
  deliverDeal: (message?: string) => Promise<{ success: boolean; error?: string }>
  approveDeal: () => Promise<{ success: boolean; error?: string }>
  requestRevision: (note: string) => Promise<{ success: boolean; error?: string }>
  updateDeliverables: (deliverables: Deliverable[]) => Promise<{ success: boolean; error?: string }>
}

export function useDeal({ dealId, autoFetch = true }: UseDealOptions): UseDealReturn {
  const [deal, setDeal] = useState<Deal | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDeal = useCallback(async () => {
    if (!dealId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/deals/${dealId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch deal')
      }

      setDeal(data.deal)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      setDeal(null)
    } finally {
      setIsLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    if (autoFetch && dealId) {
      fetchDeal()
    }
  }, [autoFetch, dealId, fetchDeal])

  const acceptDeal = useCallback(async () => {
    if (!dealId) return { success: false, error: 'No deal ID' }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/deals/${dealId}/accept`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to accept deal' }
      }

      setDeal(data.deal)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsUpdating(false)
    }
  }, [dealId])

  const declineDeal = useCallback(async () => {
    if (!dealId || !deal) return { success: false, error: 'No deal' }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined' }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to decline deal' }
      }

      setDeal(prev => prev ? { ...prev, status: 'declined' } : null)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsUpdating(false)
    }
  }, [dealId, deal])

  const deliverDeal = useCallback(async (message?: string) => {
    if (!dealId) return { success: false, error: 'No deal ID' }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/deals/${dealId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to deliver deal' }
      }

      setDeal(data.deal)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsUpdating(false)
    }
  }, [dealId])

  const approveDeal = useCallback(async () => {
    if (!dealId) return { success: false, error: 'No deal ID' }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/deals/${dealId}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to approve deal' }
      }

      setDeal(data.deal)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsUpdating(false)
    }
  }, [dealId])

  const requestRevision = useCallback(async (note: string) => {
    if (!dealId || !deal) return { success: false, error: 'No deal' }

    if (deal.revision_count >= deal.max_revisions) {
      return { success: false, error: 'Maximum revisions reached' }
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'revision',
          revision_note: note,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to request revision' }
      }

      setDeal(prev => prev ? { 
        ...prev, 
        status: 'revision',
        revision_count: prev.revision_count + 1,
      } : null)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsUpdating(false)
    }
  }, [dealId, deal])

  const updateDeliverables = useCallback(async (deliverables: Deliverable[]) => {
    if (!dealId) return { success: false, error: 'No deal ID' }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverables }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update deliverables' }
      }

      setDeal(prev => prev ? { ...prev, deliverables } : null)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsUpdating(false)
    }
  }, [dealId])

  return {
    deal,
    isLoading,
    isUpdating,
    error,
    refetch: fetchDeal,
    acceptDeal,
    declineDeal,
    deliverDeal,
    approveDeal,
    requestRevision,
    updateDeliverables,
  }
}

// Hook for creating deals
interface ServiceItem {
  id: string
  platform: string
  type: string
  name: string
  description?: string
  rate: number
  currency: string
  turnaroundDays?: number
  isActive: boolean
}

interface CreateDealData {
  creator_id: string
  brand_id: string
  conversation_id?: string
  title: string
  description?: string
  deliverables?: Deliverable[]
  services?: ServiceItem[]
  amount_cents: number
  deadline?: string
}

export function useCreateDeal() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDeal = useCallback(async (data: CreateDealData) => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to create deal')
        return { success: false, error: result.error }
      }

      return { success: true, deal: result.deal }
    } catch (err) {
      const message = 'Network error'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsCreating(false)
    }
  }, [])

  return {
    createDeal,
    isCreating,
    error,
  }
}

export default useDeals