'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, DollarSign, Loader2, MessageSquare, XCircle } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import ApplicationStatusBadge from '@/components/applications/ApplicationStatusBadge'
import { formatBudget, formatDate } from '@/components/campaigns/utils'
import type { Campaign, CampaignApplication } from '@/types/campaigns'

interface Profile {
  id: string
  [key: string]: unknown
}

type ApplicationWithCampaign = CampaignApplication & { campaign: Campaign | null }

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>()
  const applicationId = params.id
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [application, setApplication] = useState<ApplicationWithCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [withdrawing, setWithdrawing] = useState(false)
  const [messaging, setMessaging] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const token = localStorage.getItem('auth_token')

    if (!userStr || !token) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.user_type !== 'creator') {
      router.push('/dashboard/brand')
      return
    }

    setProfile(profileStr ? JSON.parse(profileStr) : null)

    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 404) {
        setLoadError('not_found')
        return
      }
      if (!res.ok) {
        setLoadError('error')
        return
      }
      const data = await res.json()
      setApplication(data.application)
    } catch (err) {
      console.error('Error fetching application:', err)
      setLoadError('error')
    } finally {
      setLoading(false)
    }
  }, [applicationId, router])

  useEffect(() => {
    load()
  }, [load])

  async function handleWithdraw() {
    if (!confirm('Withdraw this application? This cannot be undone.')) return

    setWithdrawing(true)
    setActionError(null)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error || 'Failed to withdraw application')
        return
      }
      router.push('/dashboard/applications')
    } catch {
      setActionError('Network error — please try again')
    } finally {
      setWithdrawing(false)
    }
  }

  async function handleMessageBrand() {
    if (!application?.campaign) return

    setMessaging(true)
    setActionError(null)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          creator_id: application.creator_id,
          brand_id: application.campaign.brand_id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error || 'Failed to start conversation')
        return
      }
      router.push(`/messages/${data.conversation.id}`)
    } catch {
      setActionError('Network error — please try again')
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

  if (loadError || !application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userType="creator" profile={profile} />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Application not found</h1>
          <p className="text-gray-500 mt-1">This application doesn't exist, or you don't have access to it.</p>
          <Link
            href="/dashboard/applications"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Applications
          </Link>
        </main>
      </div>
    )
  }

  const campaign = application.campaign
  const canMessage = application.status === 'shortlisted' || application.status === 'hired'
  const canWithdraw = application.status === 'submitted'

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="creator" profile={profile} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link href="/dashboard/applications" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="font-semibold text-gray-900 truncate">Application Details</h1>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Campaign summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Campaign</p>
          {campaign ? (
            <>
              <Link
                href={`/campaigns/${campaign.id}`}
                className="font-semibold text-gray-900 text-lg hover:text-violet-600"
              >
                {campaign.title}
              </Link>
              <p className="text-sm text-gray-500 mt-1">{campaign.brand?.company_name || 'Brand'}</p>
              <p className="text-sm text-gray-500 mt-2">
                Budget: <span className="font-medium text-gray-900">{formatBudget(campaign)}</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">This campaign is no longer available.</p>
          )}
        </div>

        {/* Application details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Application Status</p>
            <ApplicationStatusBadge status={application.status} className="text-sm px-3 py-1" />
          </div>

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
            <div className="flex items-center gap-2 sm:col-span-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Last updated:</span>
              <span className="font-medium text-gray-900">{formatDate(application.updated_at)}</span>
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

        {actionError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{actionError}</div>
        )}

        {(canMessage || canWithdraw) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {canMessage && (
              <button
                type="button"
                onClick={handleMessageBrand}
                disabled={messaging}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                {messaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                Message Brand
              </button>
            )}
            {canWithdraw && (
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-red-600 rounded-xl font-medium hover:bg-red-50 disabled:opacity-50"
              >
                {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Withdraw Application
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
