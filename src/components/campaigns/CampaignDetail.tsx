'use client'

import Link from 'next/link'
import {
  Calendar,
  Users,
  Target,
  Globe,
  Loader2,
  CheckCircle2,
  Clock,
  Pencil,
  Eye,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import type { Campaign, ApplicationStatus } from '@/types/campaigns'
import ApplicationStatusBadge from '@/components/applications/ApplicationStatusBadge'
import {
  formatBudget,
  formatDate,
  getDeadlineInfo,
  STATUS_BADGE,
  categoryLabel,
  platformLabel,
} from './utils'

export type CampaignViewerRole = 'creator' | 'owner' | 'other'

export interface MyApplicationSummary {
  id: string
  status: ApplicationStatus
}

interface CampaignDetailProps {
  campaign: Campaign
  viewerRole: CampaignViewerRole
  isLoggedIn: boolean
  myApplication: MyApplicationSummary | null
  closing: boolean
  onClose: () => void
}

export default function CampaignDetail({
  campaign,
  viewerRole,
  isLoggedIn,
  myApplication,
  closing,
  onClose,
}: CampaignDetailProps) {
  const status = STATUS_BADGE[campaign.status]
  const deadline = getDeadlineInfo(campaign.application_deadline)
  const deliverables = campaign.deliverables || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
            <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
              {categoryLabel(campaign.category)}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>

          <div className="flex items-center gap-3 mt-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {campaign.brand?.company_name?.charAt(0) || 'B'}
            </div>
            <div>
              <p className="font-medium text-gray-900">{campaign.brand?.company_name || 'Brand'}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Posted {formatDate(campaign.published_at || campaign.created_at)}
              </p>
            </div>
          </div>
        </div>

        {campaign.description && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{campaign.description}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Requirements</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-gray-500">Platforms: </span>
                <span className="text-gray-900 font-medium">
                  {campaign.platforms.length > 0
                    ? campaign.platforms.map((p) => platformLabel(p)).join(', ')
                    : 'Any platform'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-gray-500">Minimum followers: </span>
                <span className="text-gray-900 font-medium">
                  {campaign.min_followers > 0 ? campaign.min_followers.toLocaleString() : 'No minimum'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-gray-500">Target countries: </span>
                <span className="text-gray-900 font-medium">
                  {campaign.target_countries.length > 0 ? campaign.target_countries.join(', ') : 'Any country'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Deliverables</h2>
          {deliverables.length > 0 ? (
            <div className="space-y-3">
              {deliverables.map((d, i) => (
                <div key={d.id} className="flex items-start gap-3 text-sm border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                  <span className="text-gray-400 w-5 shrink-0">{i + 1}.</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {d.quantity}x {d.deliverable_type.replace(/_/g, ' ')} on {platformLabel(d.platform)}
                    </p>
                    {d.description && <p className="text-gray-500 mt-0.5">{d.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No deliverables specified.</p>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Budget & Timeline</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500">Budget</p>
              <p className="text-xl font-bold text-gray-900">{formatBudget(campaign)}</p>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-gray-500">Application Deadline</p>
              <p
                className={`font-medium ${
                  deadline.isPast ? 'text-gray-400' : deadline.isUrgent ? 'text-amber-600' : 'text-gray-900'
                }`}
              >
                {formatDate(campaign.application_deadline)} · {deadline.label}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Campaign Dates</p>
              <p className="text-gray-900 font-medium">
                {formatDate(campaign.campaign_start_date)} – {formatDate(campaign.campaign_end_date)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Users className="w-4 h-4" />
            Application Stats
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {campaign.applications_count} application{campaign.applications_count === 1 ? '' : 's'}
          </p>
          {campaign.hired_count > 0 && (
            <p className="text-sm text-gray-500 mt-1">{campaign.hired_count} hired</p>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          {viewerRole === 'creator' && (
            <CreatorActions campaignId={campaign.id} deadline={deadline} myApplication={myApplication} />
          )}

          {viewerRole === 'owner' && (
            <OwnerActions campaign={campaign} closing={closing} onClose={onClose} />
          )}

          {viewerRole === 'other' && !isLoggedIn && (
            <div className="text-sm text-gray-500">
              <Link href="/login" className="text-violet-600 font-medium hover:text-violet-700">
                Sign in
              </Link>{' '}
              as a creator to apply to this campaign.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CreatorActions({
  campaignId,
  deadline,
  myApplication,
}: {
  campaignId: string
  deadline: ReturnType<typeof getDeadlineInfo>
  myApplication: MyApplicationSummary | null
}) {
  if (myApplication) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-4 py-3 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          Application Submitted
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Status</span>
          <ApplicationStatusBadge status={myApplication.status} />
        </div>
        <Link
          href={`/dashboard/applications/${myApplication.id}`}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          View My Application
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  if (deadline.isPast) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
        <Clock className="w-5 h-5 flex-shrink-0" />
        Applications Closed
      </div>
    )
  }

  return (
    <Link
      href={`/campaigns/${campaignId}/apply`}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700"
    >
      Apply Now
    </Link>
  )
}

function OwnerActions({
  campaign,
  closing,
  onClose,
}: {
  campaign: Campaign
  closing: boolean
  onClose: () => void
}) {
  return (
    <div className="space-y-2">
      {campaign.status === 'draft' && (
        <Link
          href={`/campaigns/${campaign.id}/edit`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
        >
          <Pencil className="w-4 h-4" />
          Edit Campaign
        </Link>
      )}
      <Link
        href={`/dashboard/campaigns/${campaign.id}/applications`}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
      >
        <Eye className="w-4 h-4" />
        View Applications
      </Link>
      {campaign.status === 'published' && (
        <button
          type="button"
          onClick={onClose}
          disabled={closing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
        >
          {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Close Campaign
        </button>
      )}
    </div>
  )
}
