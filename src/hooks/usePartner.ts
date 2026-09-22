'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReferralPartner } from '@/types/referral'

interface UsePartnerResult {
  partner: ReferralPartner | null
  isPartner: boolean
  isLoading: boolean
  error: string | null
}

/** Fetches the current user's referral_partners record, if any. */
export function usePartner(): UsePartnerResult {
  const [partner, setPartner] = useState<ReferralPartner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPartner = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const token = localStorage.getItem('auth_token')
    if (!token) {
      setPartner(null)
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/referral/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Not a partner is an expected, non-error outcome (most users aren't).
      if (res.status === 403) {
        setPartner(null)
        setIsLoading(false)
        return
      }

      if (!res.ok) {
        setError('Failed to load partner status')
        setPartner(null)
        setIsLoading(false)
        return
      }

      const data = await res.json()
      setPartner(data.partner ?? null)
    } catch (err) {
      console.error('usePartner fetch error:', err)
      setError('Failed to load partner status')
      setPartner(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPartner()
  }, [fetchPartner])

  return { partner, isPartner: Boolean(partner), isLoading, error }
}
