'use client'

import Link from 'next/link'
import { Calendar, DollarSign, Eye, Loader2, MessageSquare, Star, ThumbsDown, Users } from 'lucide-react'
import type { ApplicationStatus, CampaignApplication } from '@/types/campaigns'
import { formatRelativeDate, platformLabel } from '@/components/campaigns/utils'
import ApplicationStatusBadge from './ApplicationStatusBadge'

interface ApplicantCardProps {
  application: CampaignApplication
  campaignId: string
  actionPending: boolean
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void
  onMessage: (applicationId: string) => void
}

function formatFollowers(num: number): string {
  if (num >= 1000000) {return (num / 1000000).toFixed(1) + 'M'}
  if (num >= 1000) {return (num / 1000).toFixed(1) + 'K'}
  return num.toString()
}

export default function ApplicantCard({
  application,
  campaignId,
  actionPending,
  onStatusChange,
  onMessage,
}: ApplicantCardProps) {
  const creator = application.creator
  const canShortlist = application.status === 'submitted' || application.status === 'viewed'
  const canHire = application.status === 'shortlisted'
  const canReject = application.status !== 'hired' && application.status !== 'rejected'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {creator?.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.profile_photo_url}
              alt={creator.display_name}
              className="w-14 h-14 rounded-xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
              {creator?.display_name?.charAt(0) || 'C'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-gray-900">{creator?.display_name || 'Creator'}</p>
              <p className="text-sm text-gray-500">@{creator?.username || 'unknown'}</p>
            </div>
            <ApplicationStatusBadge status={application.status} />
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {formatFollowers(creator?.total_followers || 0)} followers
            </span>
            {application.proposed_rate !== null && application.proposed_rate !== undefined && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {application.proposed_rate.toLocaleString()} proposed
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Applied {formatRelativeDate(application.created_at)}
            </span>
          </div>

          {creator?.platforms && creator.platforms.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {creator.platforms.slice(0, 4).map((p) => (
                <span key={p.platform} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {platformLabel(p.platform)} · {formatFollowers(p.followers)}
                </span>
              ))}
              {creator.platforms.length > 4 && (
                <span className="text-xs text-gray-500">+{creator.platforms.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        <Link
          href={`/dashboard/campaigns/${campaignId}/applications/${application.id}`}
          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <Eye className="w-4 h-4" />
          View
        </Link>

        {canShortlist && (
          <button
            type="button"
            onClick={() => onStatusChange(application.id, 'shortlisted')}
            disabled={actionPending}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50 disabled:opacity-50"
          >
            {actionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            Shortlist
          </button>
        )}

        {canHire && (
          <button
            type="button"
            onClick={() => onStatusChange(application.id, 'hired')}
            disabled={actionPending}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {actionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            Hire
          </button>
        )}

        {canReject && (
          <button
            type="button"
            onClick={() => onStatusChange(application.id, 'rejected')}
            disabled={actionPending}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
          >
            {actionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
            Reject
          </button>
        )}

        <button
          type="button"
          onClick={() => onMessage(application.id)}
          disabled={actionPending}
          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <MessageSquare className="w-4 h-4" />
          Message
        </button>
      </div>
    </div>
  )
}
