'use client'

import Link from 'next/link'
import { AlertTriangle, Calendar, Eye, Loader2, Lock, Pencil, RotateCcw, Table2, Users, XCircle } from 'lucide-react'
import type { Campaign } from '@/types/campaigns'
import { STATUS_BADGE, categoryLabel, formatRelativeDate } from './utils'

interface CampaignManagementCardProps {
  campaign: Campaign
  onClose: (campaignId: string) => void
  onReopen: (campaignId: string) => void
  pending: boolean
  overdueCount?: number
}

export default function CampaignManagementCard({ campaign, onClose, onReopen, pending, overdueCount = 0 }: CampaignManagementCardProps) {
  const status = STATUS_BADGE[campaign.status]

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 p-6 h-full">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{campaign.title}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
          {categoryLabel(campaign.category)}
        </span>
        {campaign.visibility === 'private' && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            <Lock className="w-3 h-3" /> Private
          </span>
        )}
        {campaign.client_name && (
          <span className="px-2 py-1 bg-brand-pink/10 text-brand-purple-dark rounded-full text-xs font-medium">
            Client: {campaign.client_name}
          </span>
        )}
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <AlertTriangle className="w-3 h-3" /> {overdueCount} overdue
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div>
          <p className="text-gray-500">Applications</p>
          <p className="font-semibold text-gray-900">{campaign.applications_count}</p>
        </div>
        <div>
          <p className="text-gray-500">Hired</p>
          <p className="font-semibold text-gray-900">{campaign.hired_count}</p>
        </div>
      </div>

      <p className="flex items-center gap-1 mt-3 text-sm text-gray-500">
        <Calendar className="w-4 h-4" />
        Created {formatRelativeDate(campaign.created_at)}
      </p>

      <div className="flex-1" />

      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <Eye className="w-4 h-4" />
          View
        </Link>

        {campaign.status === 'draft' && (
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        )}

        <Link
          href={`/dashboard/campaigns/${campaign.id}/applications`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <Users className="w-4 h-4" />
          Applications
        </Link>

        <Link
          href={`/dashboard/campaigns/${campaign.id}/tracker`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <Table2 className="w-4 h-4" />
          Tracker
        </Link>

        {campaign.status === 'published' && (
          <button
            type="button"
            onClick={() => onClose(campaign.id)}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Close
          </button>
        )}

        {campaign.status === 'closed' && (
          <button
            type="button"
            onClick={() => onReopen(campaign.id)}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-violet-600 rounded-lg text-sm font-medium hover:bg-violet-50 disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Reopen
          </button>
        )}
      </div>
    </div>
  )
}
