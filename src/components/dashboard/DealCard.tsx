import Link from 'next/link'
import Image from 'next/image'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { DEAL_STATUSES } from '@/utils/constants'
import type { Deal } from '@/types/marketplace'

interface DealCardProps {
  deal: Deal
  viewAs: 'creator' | 'brand'
}

// Helper to format currency
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export default function DealCard({ deal, viewAs }: DealCardProps) {
  const statusInfo = DEAL_STATUSES[deal.status]
  
  // Get status icon
  const StatusIcon = deal.status === 'completed' ? CheckCircle 
    : deal.status === 'cancelled' || deal.status === 'declined' ? XCircle 
    : deal.status === 'pending' ? Clock 
    : deal.status === 'delivered' ? AlertCircle
    : CheckCircle

  // Determine if action is needed
  const needsAction = (viewAs === 'creator' && deal.status === 'pending') ||
                      (viewAs === 'brand' && deal.status === 'delivered')

  // Get the other party's info
  const otherParty = viewAs === 'creator' ? deal.brand : deal.creator
  const displayAmount = viewAs === 'creator' ? deal.creator_payout_cents : deal.amount_cents

  return (
    <Link 
      href={`/dashboard/deals/${deal.id}`}
      className={`block bg-white rounded-xl p-5 border transition-all ${
        needsAction 
          ? 'border-blue-200 hover:border-blue-300 hover:shadow-md bg-blue-50/30' 
          : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar/Logo */}
          {viewAs === 'creator' && deal.brand?.logo_url ? (
            <Image
              src={deal.brand.logo_url}
              alt={deal.brand.company_name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg object-cover"
              unoptimized
            />
          ) : viewAs === 'brand' && deal.creator?.profile_photo_url ? (
            <Image
              src={deal.creator.profile_photo_url}
              alt={deal.creator.display_name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className={`w-10 h-10 ${viewAs === 'creator' ? 'rounded-lg' : 'rounded-full'} bg-gray-100 flex items-center justify-center`}>
              <span className="text-lg font-bold text-gray-400">
                {viewAs === 'creator' 
                  ? deal.brand?.company_name?.[0] 
                  : deal.creator?.display_name?.[0] || '?'
                }
              </span>
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">
                {viewAs === 'creator' ? deal.brand?.company_name : deal.creator?.display_name}
              </h4>
              {viewAs === 'brand' && deal.creator?.is_verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
            </div>
            <p className="text-sm text-gray-500">
              {viewAs === 'creator' 
                ? `Deal #${deal.deal_number}` 
                : `@${deal.creator?.username}`
              }
            </p>
          </div>
        </div>
        
        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {statusInfo.label}
        </span>
      </div>
      
      {/* Deal title */}
      <h3 className="font-medium text-gray-900 mb-2">{deal.title}</h3>
      
      {/* Bottom row */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-900">
          {formatCurrency(displayAmount)}
        </span>
        
        {needsAction ? (
          <span className="text-blue-600 font-medium">Action required</span>
        ) : deal.deadline && (
          <span className="text-gray-500 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Due {new Date(deal.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  )
}