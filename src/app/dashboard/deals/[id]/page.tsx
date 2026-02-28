'use client'

import { useState, useEffect } from 'react'
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
  FileText,
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
  Download,
  Flag,
  Check,
  X
} from 'lucide-react'
import { DEAL_STATUSES } from '@/utils/constants'
import type { Deal, CreatorProfile, BrandProfile, Deliverable } from '@/types/marketplace'

// Helper to format currency
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// Helper to format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Helper to format datetime
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Status Badge Component
function StatusBadge({ status }: { status: Deal['status'] }) {
  const statusInfo = DEAL_STATUSES[status]
  
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

// Timeline Item Component
function TimelineItem({ 
  title, 
  date, 
  isCompleted, 
  isActive,
  isFuture 
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
          {isCompleted ? (
            <Check className="w-4 h-4" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-current" />
          )}
        </div>
        <div className={`w-0.5 h-full ${isCompleted || isActive ? 'bg-emerald-500' : 'bg-gray-200'}`} />
      </div>
      <div className="pb-6">
        <p className={`font-medium ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>
          {title}
        </p>
        {date && (
          <p className="text-sm text-gray-500">{formatDateTime(date)}</p>
        )}
      </div>
    </div>
  )
}

// Deliverable Item Component
function DeliverableItem({ 
  deliverable, 
  canToggle, 
  onToggle 
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
          <p className="text-xs text-emerald-600 mt-1">
            Completed {formatDateTime(deliverable.completed_at)}
          </p>
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
  const [isUpdating, setIsUpdating] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')
  
  // Mock: In real app, this would come from auth context
  const [userType] = useState<'creator' | 'brand'>('brand')
  const currentUserId = userType === 'brand' ? 'b1' : 'c1'
  
  useEffect(() => {
    loadDeal()
  }, [dealId])
  
  async function loadDeal() {
    setIsLoading(true)
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockCreator: CreatorProfile = {
        id: 'c1',
        user_id: 'u1',
        username: 'johntechdev',
        display_name: 'John Tech',
        email: 'john@example.com',
        bio: 'Tech content creator',
        profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        country: 'US',
        city: 'San Francisco',
        languages: ['English'],
        niches: ['AI & Machine Learning'],
        social_accounts: {
          twitter: { handle: '@johntechdev', url: '', followers: 45000, verified: true },
          youtube: { handle: 'JohnTech', url: '', followers: 12000, subscribers: 12000, verified: false },
        },
        services: [],
        portfolio_items: [],
        stripe_onboarded: true,
        status: 'approved',
        is_verified: true,
        is_featured: false,
        is_founding_creator: true,
        avg_rating: 4.9,
        total_reviews: 15,
        total_deals_completed: 12,
        total_earnings: 0,
        response_rate: 95,
        avg_response_time_hours: 2,
        profile_views: 1250,
        created_at: '2024-01-15',
        updated_at: '2024-02-01',
      }
      
      const mockBrand: BrandProfile = {
        id: 'b1',
        user_id: 'bu1',
        company_name: 'TechStartup Inc',
        email: 'hello@techstartup.com',
        website: 'https://techstartup.com',
        logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=TechStartup',
        description: 'Building the next generation of AI-powered developer tools',
        industry: 'AI/ML',
        company_size: '11-50',
        country: 'US',
        contact_name: 'Sarah Johnson',
        contact_role: 'Marketing Lead',
        total_spent: 500000,
        total_deals: 5,
        created_at: '2024-01-01',
        updated_at: '2024-02-01',
      }
      
      setDeal({
        id: dealId,
        deal_number: 1234,
        conversation_id: 'conv1',
        creator_id: 'c1',
        brand_id: 'b1',
        title: 'YouTube Integration - AI Code Assistant',
        description: 'Create a 60-90 second integration in an upcoming YouTube video featuring our AI code assistant. The integration should include a live demo showing the code completion feature and explain why developers would find it useful.',
        deliverables: [
          { id: 'd1', description: 'Natural integration in video (60-90 seconds)', is_completed: true, completed_at: '2026-02-10T14:00:00Z' },
          { id: 'd2', description: 'Product demo with screen recording', is_completed: true, completed_at: '2026-02-10T14:00:00Z' },
          { id: 'd3', description: 'Call-to-action with tracking link', is_completed: false },
        ],
        services: [
          { id: 's1', platform: 'youtube', type: 'integration', name: 'YouTube Integration', description: '', rate: 2500, currency: 'USD', turnaroundDays: 14, isActive: true },
        ],
        amount_cents: 250000,
        platform_fee_cents: 25000,
        creator_payout_cents: 225000,
        currency: 'USD',
        stripe_payment_intent_id: 'pi_xxx',
        status: 'delivered',
        deadline: '2026-02-20T23:59:59Z',
        accepted_at: '2026-02-02T10:00:00Z',
        delivered_at: '2026-02-15T09:30:00Z',
        revision_count: 0,
        max_revisions: 2,
        created_at: '2026-02-01T14:30:00Z',
        updated_at: '2026-02-15T09:30:00Z',
        creator: mockCreator,
        brand: mockBrand,
      })
      
    } catch (error) {
      console.error('Error loading deal:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  async function updateDealStatus(newStatus: Deal['status']) {
    if (!deal) return
    setIsUpdating(true)
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setDeal(prev => prev ? { ...prev, status: newStatus } : null)
      
      // Close modals
      setShowRejectModal(false)
      setShowRevisionModal(false)
      setRevisionNote('')
      
    } catch (error) {
      console.error('Error updating deal:', error)
    } finally {
      setIsUpdating(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Deal not found</h2>
          <Link href="/dashboard/deals" className="text-blue-600 hover:text-blue-700">
            Back to deals
          </Link>
        </div>
      </div>
    )
  }
  
  const isCreator = userType === 'creator'
  const isBrand = userType === 'brand'
  const otherParty = isCreator ? deal.brand : deal.creator
  
  // Determine what actions are available
  const canAccept = isCreator && deal.status === 'pending'
  const canDecline = isCreator && deal.status === 'pending'
  const canDeliver = isCreator && deal.status === 'in_progress'
  const canApprove = isBrand && deal.status === 'delivered'
  const canRequestRevision = isBrand && deal.status === 'delivered' && deal.revision_count < deal.max_revisions
  const canLeaveReview = (deal.status === 'completed') && !deal.review
  
  // Build timeline
  const timelineSteps = [
    { title: 'Deal Created', date: deal.created_at, status: 'completed' },
    { title: 'Deal Accepted', date: deal.accepted_at, status: deal.accepted_at ? 'completed' : deal.status === 'pending' ? 'active' : 'pending' },
    { title: 'Payment Received', date: deal.accepted_at, status: deal.accepted_at ? 'completed' : 'pending' },
    { title: 'Work Delivered', date: deal.delivered_at, status: deal.delivered_at ? 'completed' : ['in_progress', 'revision'].includes(deal.status) ? 'active' : 'pending' },
    { title: 'Approved & Completed', date: deal.completed_at, status: deal.completed_at ? 'completed' : deal.status === 'delivered' ? 'active' : 'pending' },
  ]
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/deals" 
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="font-semibold text-gray-900">Deal #{deal.deal_number}</h1>
                <p className="text-sm text-gray-500">
                  Created {formatDate(deal.created_at)}
                </p>
              </div>
            </div>
            <StatusBadge status={deal.status} />
          </div>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Title & Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{deal.title}</h2>
              {deal.description && (
                <p className="text-gray-600 whitespace-pre-line">{deal.description}</p>
              )}
              
              {/* Services */}
              {deal.services.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {deal.services.map(service => (
                      <span 
                        key={service.id}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg"
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Deliverables */}
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
                    canToggle={isCreator && deal.status === 'in_progress'}
                    onToggle={() => {
                      // Toggle deliverable completion
                      setDeal(prev => {
                        if (!prev) return null
                        return {
                          ...prev,
                          deliverables: prev.deliverables.map(d => 
                            d.id === deliverable.id 
                              ? { ...d, is_completed: !d.is_completed, completed_at: !d.is_completed ? new Date().toISOString() : undefined }
                              : d
                          )
                        }
                      })
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="pl-2">
                {timelineSteps.map((step, index) => (
                  <TimelineItem
                    key={step.title}
                    title={step.title}
                    date={step.status === 'completed' ? step.date : undefined}
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
                
                {/* Creator Actions */}
                {canAccept && (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      Review the deal details and accept to begin working.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateDealStatus('in_progress')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Accept Deal
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
                
                {canDeliver && (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      Mark all deliverables as complete, then submit your work for review.
                    </p>
                    <button
                      onClick={() => updateDealStatus('delivered')}
                      disabled={isUpdating || deal.deliverables.some(d => !d.is_completed)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      Submit Delivery
                    </button>
                    {deal.deliverables.some(d => !d.is_completed) && (
                      <p className="text-sm text-amber-600 text-center">
                        Complete all deliverables before submitting
                      </p>
                    )}
                  </div>
                )}
                
                {/* Brand Actions */}
                {canApprove && (
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      Review the delivered work. Approve to release payment to the creator.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateDealStatus('completed')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Approve & Release Payment
                      </button>
                      {canRequestRevision && (
                        <button
                          onClick={() => setShowRevisionModal(true)}
                          className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                        >
                          Request Revision
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      {deal.revision_count} of {deal.max_revisions} revisions used
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
                      Share your experience working with {isCreator ? deal.brand?.company_name : deal.creator?.display_name}.
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
              
              {/* Payment Status */}
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
                      <span className="text-emerald-700">Payment released</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-700">Payment secured in escrow</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Other Party Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {isCreator ? 'Brand' : 'Creator'}
              </h3>
              <div className="flex items-center gap-3 mb-4">
                {isCreator ? (
                  deal.brand?.logo_url ? (
                    <Image src={deal.brand.logo_url} alt="" width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                  )
                ) : (
                  deal.creator?.profile_photo_url ? (
                    <Image src={deal.creator.profile_photo_url} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-violet-600" />
                    </div>
                  )
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">
                      {isCreator ? deal.brand?.company_name : deal.creator?.display_name}
                    </h4>
                    {!isCreator && deal.creator?.is_verified && (
                      <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {isCreator ? deal.brand?.industry : `@${deal.creator?.username}`}
                  </p>
                </div>
              </div>
              
              {!isCreator && deal.creator && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="font-semibold text-gray-900">{deal.creator.avg_rating.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="font-semibold text-gray-900">{deal.creator.total_deals_completed}</p>
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
                {!isCreator && (
                  <Link
                    href={`/creators/${deal.creator?.username}`}
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
              <p className="text-sm text-gray-600 mb-3">
                Having issues with this deal? Contact our support team.
              </p>
              <Link
                href="/support"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      {/* Reject Modal */}
      {showRejectModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowRejectModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Decline Deal</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to decline this deal? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateDealStatus('declined')}
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
              <p className="text-gray-600 mb-4">
                Explain what changes you need. The creator will update their work accordingly.
              </p>
              <textarea
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Describe the changes needed..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRevisionModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateDealStatus('revision')}
                  disabled={isUpdating || !revisionNote.trim()}
                  className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50"
                >
                  {isUpdating ? 'Requesting...' : 'Request Revision'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                {deal.max_revisions - deal.revision_count - 1} revision{deal.max_revisions - deal.revision_count - 1 !== 1 ? 's' : ''} remaining after this
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}