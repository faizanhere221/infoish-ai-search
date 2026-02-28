'use client'

import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Upload,
  DollarSign,
  Flag,
  ArrowRight
} from 'lucide-react'
import { DEAL_STATUSES } from '@/utils/constants'
import type { Deal } from '@/types/marketplace'

interface DealStatusProps {
  deal: Deal
  userType: 'creator' | 'brand'
  compact?: boolean
}

const statusIcons: Record<string, React.ElementType> = {
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

export function DealStatus({ deal, userType, compact = false }: DealStatusProps) {
  const statusInfo = DEAL_STATUSES[deal.status]
  const StatusIcon = statusIcons[deal.status] || Clock

  // Determine action message based on status and user type
  const getActionMessage = (): string | null => {
    if (deal.status === 'pending' && userType === 'creator') {
      return 'Review and accept this deal to begin'
    }
    if (deal.status === 'pending' && userType === 'brand') {
      return 'Waiting for creator to accept'
    }
    if (deal.status === 'in_progress' && userType === 'creator') {
      return 'Complete deliverables and submit'
    }
    if (deal.status === 'in_progress' && userType === 'brand') {
      return 'Creator is working on this'
    }
    if (deal.status === 'delivered' && userType === 'brand') {
      return 'Review and approve to release payment'
    }
    if (deal.status === 'delivered' && userType === 'creator') {
      return 'Waiting for brand approval'
    }
    if (deal.status === 'revision' && userType === 'creator') {
      return 'Revisions requested - update and resubmit'
    }
    if (deal.status === 'revision' && userType === 'brand') {
      return 'Waiting for revised delivery'
    }
    return null
  }

  // Get progress percentage
  const getProgress = (): number => {
    switch (deal.status) {
      case 'pending': return 10
      case 'accepted': return 20
      case 'in_progress': return 40
      case 'delivered': return 70
      case 'revision': return 50
      case 'approved': return 90
      case 'completed': return 100
      default: return 0
    }
  }

  const actionMessage = getActionMessage()
  const progress = getProgress()

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
        <StatusIcon className="w-4 h-4" />
        {statusInfo.label}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusInfo.bg}`}>
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
          </div>
          <div>
            <p className={`font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </p>
            <p className="text-sm text-gray-500">
              Deal #{deal.deal_number}
            </p>
          </div>
        </div>
        
        {/* Progress */}
        {!['completed', 'cancelled', 'declined', 'refunded', 'disputed'].includes(deal.status) && (
          <span className="text-sm text-gray-500">
            {progress}% complete
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {!['completed', 'cancelled', 'declined', 'refunded', 'disputed'].includes(deal.status) && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Action Message */}
      {actionMessage && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <ArrowRight className="w-4 h-4 text-blue-500" />
          {actionMessage}
        </div>
      )}

      {/* Status Timeline Mini */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className={`flex items-center gap-1 ${progress >= 10 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${progress >= 10 ? 'bg-blue-500' : 'bg-gray-300'}`} />
          Created
        </div>
        <div className="flex-1 h-px bg-gray-200 mx-2" />
        <div className={`flex items-center gap-1 ${progress >= 40 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${progress >= 40 ? 'bg-blue-500' : 'bg-gray-300'}`} />
          In Progress
        </div>
        <div className="flex-1 h-px bg-gray-200 mx-2" />
        <div className={`flex items-center gap-1 ${progress >= 70 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${progress >= 70 ? 'bg-blue-500' : 'bg-gray-300'}`} />
          Delivered
        </div>
        <div className="flex-1 h-px bg-gray-200 mx-2" />
        <div className={`flex items-center gap-1 ${progress >= 100 ? 'text-emerald-600' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          Complete
        </div>
      </div>

      {/* Revision Warning */}
      {deal.status === 'revision' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Revision {deal.revision_count} of {deal.max_revisions} used
          </span>
        </div>
      )}
    </div>
  )
}

export default DealStatus