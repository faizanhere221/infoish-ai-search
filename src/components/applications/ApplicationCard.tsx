import Link from 'next/link'
import { Calendar, DollarSign, ArrowRight } from 'lucide-react'
import type { CampaignApplication } from '@/types/campaigns'
import { formatRelativeDate } from '@/components/campaigns/utils'
import ApplicationStatusBadge from './ApplicationStatusBadge'

interface ApplicationCardProps {
  application: CampaignApplication
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const campaign = application.campaign

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/campaigns/${application.campaign_id}`}
            className="font-semibold text-gray-900 hover:text-violet-600 truncate"
          >
            {campaign?.title || 'Campaign'}
          </Link>
          <ApplicationStatusBadge status={application.status} />
        </div>
        <p className="text-sm text-gray-500 mt-1">{campaign?.brand?.company_name || 'Brand'}</p>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Applied {formatRelativeDate(application.created_at)}
          </span>
          {application.proposed_rate !== null && application.proposed_rate !== undefined && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {application.proposed_rate.toLocaleString()} proposed
            </span>
          )}
        </div>
      </div>

      <Link
        href={`/dashboard/applications/${application.id}`}
        className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
      >
        View
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
