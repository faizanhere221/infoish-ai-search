'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { Deal } from '@/types/marketplace'

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hovered || value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string

  const [deal, setDeal] = useState<Deal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const [token, setToken] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [userType, setUserType] = useState<'creator' | 'brand' | null>(null)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [communicationRating, setCommunicationRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [wasOnTime, setWasOnTime] = useState<boolean | null>(null)
  const [wouldWorkAgain, setWouldWorkAgain] = useState<boolean | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const storedToken = localStorage.getItem('auth_token')

    if (!userStr || !storedToken) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    const prof = profileStr ? JSON.parse(profileStr) : null

    setToken(storedToken)
    setUserType(user.user_type)
    setProfileId(prof?.id ?? null)
  }, [router])

  useEffect(() => {
    if (!token) return
    async function loadDeal() {
      try {
        const res = await fetch(`/api/deals/${dealId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          setError('Deal not found')
          setIsLoading(false)
          return
        }
        const data = await res.json()
        const d: Deal = data.deal

        if (d.status !== 'completed') {
          setError('You can only review completed deals')
          setIsLoading(false)
          return
        }

        if (d.review) {
          setError('You have already reviewed this deal')
          setIsLoading(false)
          return
        }

        setDeal(d)
      } catch {
        setError('Failed to load deal')
      } finally {
        setIsLoading(false)
      }
    }
    loadDeal()
  }, [token, dealId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deal || !token || !profileId || !userType) return

    if (rating === 0) {
      setError('Please select an overall rating')
      return
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters in your review')
      return
    }

    const revieweeId = userType === 'brand' ? deal.creator_id : deal.brand_id

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deal_id: deal.id,
          reviewer_id: profileId,
          reviewee_id: revieweeId,
          rating,
          comment: comment.trim(),
          communication_rating: communicationRating || null,
          quality_rating: qualityRating || null,
          was_on_time: wasOnTime,
          would_work_again: wouldWorkAgain,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit review')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error — please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || userType === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Review submitted</h2>
          <p className="text-gray-500 mb-6">Thank you for your feedback.</p>
          <Link
            href={`/dashboard/deals/${dealId}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
          >
            Back to Deal
          </Link>
        </div>
      </div>
    )
  }

  if (error && !deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{error}</h2>
          <Link href={`/dashboard/deals/${dealId}`} className="text-violet-600 hover:text-violet-700">
            Back to deal
          </Link>
        </div>
      </div>
    )
  }

  const otherPartyName =
    userType === 'brand'
      ? (deal?.creator as any)?.display_name ?? 'the creator'
      : (deal?.brand as any)?.company_name ?? 'the brand'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link href={`/dashboard/deals/${dealId}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="font-semibold text-gray-900">Leave a Review</h1>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-gray-500 mb-6">
            Share your experience working with <span className="font-medium text-gray-900">{otherPartyName}</span> on{' '}
            <span className="font-medium text-gray-900">&ldquo;{deal?.title}&rdquo;</span>.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <StarRating value={rating} onChange={setRating} label="Overall Rating *" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe your experience in detail..."
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/2000</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-4">Additional Ratings (optional)</p>
              <div className="space-y-4">
                <StarRating value={communicationRating} onChange={setCommunicationRating} label="Communication" />
                <StarRating value={qualityRating} onChange={setQualityRating} label="Quality of Work" />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Was the work delivered on time?</p>
                <div className="flex gap-3">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setWasOnTime(val)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        wasOnTime === val
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Would you work with them again?</p>
                <div className="flex gap-3">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setWouldWorkAgain(val)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        wouldWorkAgain === val
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Link
                href={`/dashboard/deals/${dealId}`}
                className="flex-1 text-center px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                  <><Star className="w-5 h-5" /> Submit Review</>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
