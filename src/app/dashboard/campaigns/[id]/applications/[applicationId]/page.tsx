'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Loader2,
  MessageSquare,
  Star,
  ThumbsDown,
  Users,
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import ApplicationStatusBadge from '@/components/applications/ApplicationStatusBadge'
import { formatDate, platformLabel } from '@/components/campaigns/utils'
import type { ApplicationStatus, Campaign, CampaignApplication } from '@/types/campaigns'

interface Profile {
  id: string
  [key: string]: unknown
}

function formatFollowers(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export default function ApplicantDetailPage() {
  const params = useParams<{ id: string; applicationId: string }>()
  const campaignId = params.id
  const applicationId = params.applicationId
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [application, setApplication] = useState<CampaignApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [actionPending, setActionPending] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const markedViewed = useRef(false)

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const token = localStorage.getItem('auth_token')

    if (!userStr || !token) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    const userProfile = profileStr ? JSON.parse(profileStr) : null

    if (user.user_type !== 'brand') {
      router.push('/campaigns')
      return
    }
    setProfile(userProfile)

    try {
      const campaignRes = await fetch(`/api/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!campaignRes.ok) {
        router.push('/campaigns')
        return
      }
      const campaignData = await campaignRes.json()
      const loadedCampaign: Campaign = campaignData.campaign

      if (userProfile?.id !== loadedCampaign.brand_id) {
        router.push('/campaigns')
        return
      }
      setCampaign(loadedCampaign)

      const appsRes = await fetch(`/api/campaigns/${campaignId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!appsRes.ok) {
        setNotFound(true)
        return
      }
      const appsData = await appsRes.json()
      const found: CampaignApplication | undefined = (appsData.applications || []).find(
        (a: CampaignApplication) => a.id === applicationId
      )

      if (!found) {
        setNotFound(true)
        return
      }
      setApplication(found)

      // submitted -> viewed happens automatically the first time a brand
      // opens the applicant's detail view
      if (found.status === 'submitted' && !markedViewed.current) {
        markedViewed.current = true
        const viewRes = await fetch(`/api/campaigns/${campaignId}/applications/${applicationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'viewed' }),
        })
        if (viewRes.ok) {
          const viewData = await viewRes.json()
          setApplication(viewData.application)
        }
      }
    } catch (err) {
      console.error('Error loading applicant:', err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [campaignId, applicationId, router])

  useEffect(() => {
    load()
  }, [load])

  async function updateStatus(status: ApplicationStatus, successMessage: string) {
    setActionPending(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/campaigns/${campaignId}/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        setApplication(data.application)
        showToast(successMessage)
      }
    } catch (err) {
      console.error('Error updating application status:', err)
    } finally {
      setActionPending(false)
    }
  }

  async function handleMessage() {
    setMessaging(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/campaigns/${campaignId}/applications/${applicationId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/messages/${data.conversation_id}`)
      }
    } catch (err) {
      console.error('Error starting conversation:', err)
    } finally {
      setMessaging(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (notFound || !application || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userType="brand" profile={profile} />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Application not found</h1>
          <Link
            href={`/dashboard/campaigns/${campaignId}/applications`}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </Link>
        </main>
      </div>
    )
  }

  const creator = application.creator
  const canShortlist = application.status === 'submitted' || application.status === 'viewed'
  const canHire = application.status === 'shortlisted'
  const canReject = application.status !== 'hired' && application.status !== 'rejected'

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="brand" profile={profile} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link
              href={`/dashboard/campaigns/${campaignId}/applications`}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="font-semibold text-gray-900 truncate">Applicant Details</h1>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Creator profile */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            {creator?.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.profile_photo_url}
                alt={creator.display_name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {creator?.display_name?.charAt(0) || 'C'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-lg">{creator?.display_name || 'Creator'}</p>
                <ApplicationStatusBadge status={application.status} />
              </div>
              <p className="text-sm text-gray-500">@{creator?.username || 'unknown'}</p>
              {creator?.username && (
                <Link
                  href={`/creators/${creator.username}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 mt-1"
                >
                  View Public Profile
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {creator?.bio && <p className="mt-4 text-sm text-gray-600">{creator.bio}</p>}

          {creator?.niches && creator.niches.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {creator.niches.map((niche) => (
                <span key={niche} className="px-2 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                  {niche}
                </span>
              ))}
            </div>
          )}

          {creator?.platforms && creator.platforms.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Platforms
              </p>
              <div className="flex flex-wrap gap-2">
                {creator.platforms.map((p) => (
                  <span key={p.platform} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                    {platformLabel(p.platform)}: <span className="font-medium">{formatFollowers(p.followers)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Application details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">Application</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Proposed rate:</span>
              <span className="font-medium text-gray-900">
                {application.proposed_rate != null ? `$${application.proposed_rate.toLocaleString()}` : 'Not specified'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Applied:</span>
              <span className="font-medium text-gray-900">{formatDate(application.created_at)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1.5">Cover Message</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                {application.cover_message || '—'}
              </p>
            </div>
            {application.pitch && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Pitch</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                  {application.pitch}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {canShortlist && (
            <button
              type="button"
              onClick={() => updateStatus('shortlisted', 'Applicant shortlisted')}
              disabled={actionPending}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-amber-200 text-amber-700 rounded-lg font-medium hover:bg-amber-50 disabled:opacity-50"
            >
              {actionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
              Shortlist
            </button>
          )}
          {canHire && (
            <button
              type="button"
              onClick={() => updateStatus('hired', 'Applicant hired')}
              disabled={actionPending}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {actionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
              Hire
            </button>
          )}
          {canReject && (
            <button
              type="button"
              onClick={() => updateStatus('rejected', 'Application rejected')}
              disabled={actionPending}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
            >
              {actionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
              Reject
            </button>
          )}
          <button
            type="button"
            onClick={handleMessage}
            disabled={messaging}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {messaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            Message Creator
          </button>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
