'use client'

import Link from 'next/link'
import { Users, Calendar, ArrowRight, Eye, XCircle, Pencil } from 'lucide-react'
import type { Campaign } from '@/types/campaigns'
import {
  formatBudget,
  formatDate,
  getDeadlineInfo,
  STATUS_BADGE,
  categoryLabel,
  platformLabel,
} from './utils'

interface CampaignCardProps {
  campaign: Campaign
  variant: 'creator' | 'brand'
  onClose?: (campaignId: string) => void
}

export default function CampaignCard({ campaign, variant, onClose }: CampaignCardProps) {
  if (variant === 'brand') {
    return <BrandCampaignCard campaign={campaign} onClose={onClose} />
  }
  return <CreatorCampaignCard campaign={campaign} />
}

function CreatorCampaignCard({ campaign }: { campaign: Campaign }) {
  const deadline = getDeadlineInfo(campaign.application_deadline)
  const platforms = campaign.platforms || []

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="flex flex-col bg-white rounded-xl border border-gray-200 p-6 hover:border-violet-300 hover:shadow-lg transition-all h-full"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {campaign.brand?.company_name?.charAt(0) || 'B'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {campaign.brand?.company_name || 'Brand'}
          </p>
          {campaign.brand?.industry && (
            <p className="text-xs text-gray-500 truncate">{campaign.brand.industry}</p>
          )}
        </div>
      </div>

      {/* Title + category */}
      <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{campaign.title}</h3>
      <span className="inline-block w-fit mt-2 px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
        {categoryLabel(campaign.category)}
      </span>

      {campaign.description && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
      )}

      {/* Platforms */}
      {platforms.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {platforms.slice(0, 4).map((p) => (
            <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {platformLabel(p)}
            </span>
          ))}
          {platforms.length > 4 && (
            <span className="text-xs text-gray-500">+{platforms.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Budget + deadline */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Budget</p>
          <p className="font-semibold text-gray-900 text-sm">{formatBudget(campaign)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Deadline</p>
          <p
            className={`text-sm font-medium ${
              deadline.isPast ? 'text-gray-400' : deadline.isUrgent ? 'text-amber-600' : 'text-gray-900'
            }`}
          >
            {deadline.label}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="flex items-center gap-1 text-gray-500">
          <Users className="w-4 h-4" />
          {campaign.applications_count} applicant{campaign.applications_count === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1 text-violet-600 font-medium">
          View Details
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}

function BrandCampaignCard({
  campaign,
  onClose,
}: {
  campaign: Campaign
  onClose?: (campaignId: string) => void
}) {
  const status = STATUS_BADGE[campaign.status]

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 p-6 h-full">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{campaign.title}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      <span className="inline-block w-fit mt-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
        {categoryLabel(campaign.category)}
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {campaign.applications_count} applicant{campaign.applications_count === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(campaign.created_at)}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <Eye className="w-4 h-4" />
          View
        </Link>
        {campaign.status === 'draft' && (
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        )}
        {campaign.status === 'published' && onClose && (
          <button
            type="button"
            onClick={() => onClose(campaign.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
          >
            <XCircle className="w-4 h-4" />
            Close
          </button>
        )}
      </div>
    </div>
  )
}
