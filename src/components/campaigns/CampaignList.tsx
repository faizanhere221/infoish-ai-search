'use client'

import type { ReactNode } from 'react'
import { Megaphone } from 'lucide-react'
import type { Campaign } from '@/types/campaigns'
import CampaignCard from './CampaignCard'

interface CampaignListProps {
  campaigns: Campaign[]
  variant: 'creator' | 'brand'
  loading: boolean
  onClose?: (campaignId: string) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
}

export default function CampaignList({
  campaigns,
  variant,
  loading,
  onClose,
  emptyTitle = 'No campaigns found',
  emptyDescription = 'Try adjusting your filters or check back later.',
  emptyAction,
}: CampaignListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CampaignCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Megaphone className="w-12 h-12 text-gray-300 mx-auto" />
        <h3 className="mt-4 font-semibold text-gray-900">{emptyTitle}</h3>
        <p className="text-gray-500 mt-1">{emptyDescription}</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} variant={variant} onClose={onClose} />
      ))}
    </div>
  )
}

function CampaignCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-4/5 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
      <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-16 bg-gray-100 rounded" />
        <div className="h-5 w-16 bg-gray-100 rounded" />
      </div>
      <div className="h-16 border-t border-gray-100" />
    </div>
  )
}
