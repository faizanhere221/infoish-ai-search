'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MessageSquare,
  DollarSign,
  Calendar,
  User,
  Building2,
  ExternalLink,
  Upload,
  RefreshCw,
  Star,
  Loader2,
  ChevronRight,
  Flag,
  Check,
} from 'lucide-react'
import { DEAL_STATUSES } from '@/utils/constants'
import type { Deal, Deliverable } from '@/types/marketplace'
import DashboardHeader from '@/components/DashboardHeader'

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function StatusBadge({ status }: { status: Deal['status'] }) {
  const statusInfo = DEAL_STATUSES[status] ?? { label: status, bg: 'bg-gray-100', color: 'text-gray-600' }

  const icons: Record<string, React.ElementType> = {
    pending: Clock,
    accepted: CheckCircle,
    declined: XCircle,
    in_progress: RefreshCw,
    delivered: Upload,
    revision: AlertCircle,
    approved: CheckCircle,
    completed: CheckCircle,
    cancelled: XCircle,
    disputed: Flag,
    refunded: DollarSign,
  }

  const Icon = icons[status] || Clock

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
      <Icon className="w-4 h-4" />
      {statusInfo.label}
    </span>
  )
}

function TimelineItem({
  title,
  date,
  isCompleted,
  isActive,
  isFuture,
}: {
  title: string
  date?: string
  isCompleted: boolean
  isActive: boolean
  isFuture: boolean
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isCompleted ? 'bg-emerald-500 text-white' :
          isActive ? 'bg-blue-500 text-white' :
          'bg-gray-200 text-gray-400'
        }`}>
          {isCompleted ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
        </div>
        <div className={`w-0.5 h-full ${isCompleted || isActive ? 'bg-emerald-500' : 'bg-gray-200'}`} />
      </div>
      <div className="pb-6">
        <p className={`font-medium ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>{title}</p>
        {date && <p className="text-sm text-gray-500">{formatDateTime(date)}</p>}
      </div>
    </div>
  )
}

function DeliverableItem({
  deliverable,
  canToggle,
  onToggle,
}: {
  deliverable: Deliverable
  canToggle: boolean
  onToggle: () => void
}) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${
      deliverable.is_completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'
    }`}>
      <button
        onClick={onToggle}
        disabled={!canToggle}
        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
          deliverable.is_completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : canToggle
              ? 'border-gray-300 hover:border-blue-500 cursor-pointer'
              : 'border-gray-200 cursor-not-allowed'
        }`}
      >
        {deliverable.is_completed && <Check className="w-3 h-3" />}
      </button>
      <div className="flex-1">
        <p className={deliverable.is_completed ? 'text-emerald-800' : 'text-gray-900'}>
          {deliverable.description}
        </p>
        {deliverable.completed_at && (
          <p className="text-xs text-emerald-600 mt-1">Completed {formatDateTime(deliverable.completed_at)}</p>
        )}
      </div>
    </div>
  )
}

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string

  const [deal, setDeal] = useState<Deal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')

  const [token, setToken] = useState<string | null>(null)
  const [userType, setUserType] = useState<'creator' | 'brand' | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

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
    setProfile(prof)
    setProfileId(prof?.id as string ?? null)
  }, [router])

  const loadDeal = useCallback(async (authToken: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to load deal')
        return
      }
      const data = await res.json()
      setDeal(data.deal)
    } catch {
      setError('Network error — please try again')
    } finally {
      setIsLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    if (token) loadDeal(token)
  }, [token, loadDeal])

  async function callAction(path: string, body?: Record<string, unknown>) {
    if (!token) return
    setIsUpdating(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/deals/${dealId}/${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error || 'Action failed')
        return
      }
      // Reload deal to get fresh state
      await loadDeal(token)
      setShowRejectModal(false)
      setShowRevisionModal(false)
      setRevisionNote('')
    } catch {
      setActionError('Network error — please try again')
    } finally {
      setIsUpdating(false)
    }
  }

  async function toggleDeliverable(deliverable: Deliverable) {
    if (!deal || !token) return
    const updated = deal.deliverables.map(d =>
      d.id === deliverable.id
        ? { ...d, is_completed: !d.is_completed, completed_at: !d.is_completed ? new Date().toISOString() : undefined }
        : d
    )
    // Optimistic update
    setDeal(prev => prev ? { ...prev, deliverables: updated } : null)

    try {
      await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deliverables: updated }),
      })
    } catch {
      // Revert on failure
      await loadDeal(token)
    }
  }

  if (isLoading || userType === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <Link href="/dashboard/deals" className="text-violet-600 hover:text-violet-700">
            Back to deals
          </Link>
        </div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Deal not found</h2>
          <Link href="/dashboard/deals" className="text-violet-600 hover:text-violet-700">
            Back to deals
          </Link>
        </div>
      </div>
    )
  }

  const isCreator = userType === 'creator'
  const isBrand = userType === 'brand'

  const canAccept = isCreator && deal.creator_id === profileId && deal.status === 'pending'
  const canDecline = isCreator && deal.creator_id === profileId && deal.status === 'pending'
  const canDeliver = isCreator && deal.creator_id === profileId && (deal.status === 'in_progress' || deal.status === 'revision')
  const canApprove = isBrand && deal.brand_id === profileId && deal.status === 'delivered'
  const canRequestRevision = isBrand && deal.brand_id === profileId && deal.status === 'delivered' && (deal.revision_count ?? 0) < (deal.max_revisions ?? 2)
  const canLeaveReview = deal.status === 'completed' && !deal.review

  const timelineSteps = [
    { title: 'Deal Created', date: deal.created_at, status: 'completed' },
    { title: 'Deal Accepted', date: deal.accepted_at, status: deal.accepted_at ? 'completed' : deal.status === 'pending' ? 'active' : 'pending' },
    { title: 'Work Delivered', date: deal.delivered_at, status: deal.delivered_at ? 'completed' : ['in_progress', 'revision'].includes(deal.status) ? 'active' : 'pending' },
    { title: 'Approved & Completed', date: deal.completed_at, status: deal.completed_at ? 'completed' : deal.status === 'delivered' ? 'active' : 'pending' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType={userType} profile={profile} />

      {/* Sub-header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/deals" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="font-semibold text-gray-900">
                  Deal {deal.deal_number ? `#${deal.deal_number}` : ''}
                </h1>
                <p className="text-xs text-gray-500">Created {formatDate(deal.created_at)}</p>
              </div>
            </div>
            <StatusBadge status={deal.status} />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {actionError}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Title & Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{deal.title}</h2>
              {deal.description && (
                <p className="text-gray-600 whitespace-pre-line">{deal.description}</p>
              )}

              {deal.services && deal.services.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {deal.services.map(service => (
                      <span key={service.id} className="px-3 py-1.5 bg-violet-50 text-violet-700 text-sm rounded-lg">
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Deliverables */}
            {deal.deliverables && deal.deliverables.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Deliverables</h3>
                  <span className="text-sm text-gray-500">
                    {deal.deliverables.filter(d => d.is_completed).length} / {deal.deliverables.length} completed
                  </span>
                </div>
                <div className="space-y-3">
                  {deal.deliverables.map(deliverable => (
                    <DeliverableItem
                      key={deliverable.id}
                      deliverable={deliverable}
                      canToggle={canDeliver}
                      onToggle={() => toggleDeliverable(deliverable)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="pl-2">
                {timelineSteps.map((step) => (
                  <TimelineItem
                    key={step.title}
                    title={step.title}
                    date={step.status === 'completed' ? step.date ?? undefined : undefined}
                    isCompleted={step.status === 'completed'}
                    isActive={step.status === 'active'}
                    isFuture={step.status === 'pending'}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {(canAccept || canDecline || canDeliver || canApprove || canRequestRevision) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

                {(canAccept || canDecline) && (
                  <div className="space-y-3">
                    <p className="text-gray-600">Review the deal details and accept to begin working.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => callAction('accept')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Accept Deal
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={isUpdating}
                        className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {canDeliver && (
                  <div className="space-y-3">
                    <p className="text-gray-600">Mark all deliverables as complete, then submit your work for review.</p>
                    <button
                      onClick={() => callAction('deliver')}
                      disabled={isUpdating || (deal.deliverables ?? []).some(d => !d.is_completed)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      Submit Delivery
                    </button>
                    {(deal.deliverables ?? []).some(d => !d.is_completed) && (
                      <p className="text-sm text-amber-600 text-center">Complete all deliverables before submitting</p>
                    )}
                  </div>
                )}

                {(canApprove || canRequestRevision) && (
                  <div className="space-y-3">
                    <p className="text-gray-600">Review the delivered work. Approve to complete the deal.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => callAction('approve')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Approve & Complete
                      </button>
                      {canRequestRevision && (
                        <button
                          onClick={() => setShowRevisionModal(true)}
                          disabled={isUpdating}
                          className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                          Request Revision
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      {deal.revision_count ?? 0} of {deal.max_revisions ?? 2} revisions used
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Leave Review */}
            {canLeaveReview && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Leave a Review</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Share your experience working with {isCreator ? (deal.brand as any)?.company_name : (deal.creator as any)?.display_name}.
                    </p>
                    <Link
                      href={`/dashboard/deals/${deal.id}/review`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
                    >
                      <Star className="w-4 h-4" />
                      Write Review
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Deal Amount</span>
                  <span className="font-medium text-gray-900">{formatCurrency(deal.amount_cents)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Platform Fee (10%)</span>
                  <span className="text-gray-600">-{formatCurrency(deal.platform_fee_cents)}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {isCreator ? 'You Receive' : 'Creator Receives'}
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(deal.creator_payout_cents)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  {deal.status === 'pending' ? (
                    <>
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-700">Awaiting acceptance</span>
                    </>
                  ) : deal.status === 'completed' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-700">Deal completed</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-700">Deal in progress</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Other Party Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{isCreator ? 'Brand' : 'Creator'}</h3>
              <div className="flex items-center gap-3 mb-4">
                {isCreator ? (
                  (deal.brand as any)?.logo_url ? (
                    <Image src={(deal.brand as any).logo_url} alt="" width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                  )
                ) : (
                  (deal.creator as any)?.profile_photo_url ? (
                    <Image src={(deal.creator as any).profile_photo_url} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-violet-600" />
                    </div>
                  )
                )}
                <div>
                  <h4 className="font-medium text-gray-900">
                    {isCreator ? (deal.brand as any)?.company_name : (deal.creator as any)?.display_name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {isCreator ? (deal.brand as any)?.industry : `@${(deal.creator as any)?.username}`}
                  </p>
                </div>
              </div>

              {!isCreator && (deal.creator as any) && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="font-semibold text-gray-900">{((deal.creator as any).avg_rating ?? 0).toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="font-semibold text-gray-900">{(deal.creator as any).total_deals_completed ?? 0}</p>
                    <p className="text-xs text-gray-500">Deals</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Link
                  href={deal.conversation_id ? `/messages/${deal.conversation_id}` : '/messages'}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    Send Message
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                {!isCreator && (deal.creator as any)?.username && (
                  <Link
                    href={`/creators/${(deal.creator as any).username}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                      View Profile
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                )}
              </div>
            </div>

            {/* Deadline */}
            {deal.deadline && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Deadline</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{formatDate(deal.deadline)}</span>
                </div>
                {new Date(deal.deadline) < new Date() && deal.status !== 'completed' && (
                  <p className="text-sm text-red-600 mt-2">Deadline has passed</p>
                )}
              </div>
            )}

            {/* Help */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-3">Having issues with this deal? Contact our support team.</p>
              <Link href="/help" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Decline Modal */}
      {showRejectModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowRejectModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Decline Deal</h3>
              <p className="text-gray-600 mb-4">Are you sure you want to decline this deal? This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => callAction('decline')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Declining...' : 'Decline Deal'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowRevisionModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Revision</h3>
              <p className="text-gray-600 mb-4">Explain what changes you need. The creator will update their work.</p>
              <textarea
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Describe the changes needed..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevisionModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => callAction('revision', { message: revisionNote })}
                  disabled={isUpdating || !revisionNote.trim()}
                  className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50"
                >
                  {isUpdating ? 'Requesting...' : 'Request Revision'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                {(deal.max_revisions ?? 2) - (deal.revision_count ?? 0) - 1} revision{(deal.max_revisions ?? 2) - (deal.revision_count ?? 0) - 1 !== 1 ? 's' : ''} remaining after this
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
