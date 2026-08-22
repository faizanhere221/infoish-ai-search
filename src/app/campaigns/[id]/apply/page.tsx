'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import ApplicationForm, { type ApplicationFormValues } from '@/components/applications/ApplicationForm'
import { formatBudget, formatDate, getDeadlineInfo } from '@/components/campaigns/utils'
import type { Campaign } from '@/types/campaigns'

interface Profile {
  id: string
  [key: string]: unknown
}

export default function ApplyToCampaignPage() {
  const params = useParams<{ id: string }>()
  const campaignId = params.id
  const router = useRouter()

  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const checkAccessAndLoad = useCallback(async () => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const token = localStorage.getItem('auth_token')

    if (!userStr || !token) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.user_type !== 'creator') {
      router.push(`/campaigns/${campaignId}`)
      return
    }

    const campaignRes = await fetch(`/api/campaigns/${campaignId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!campaignRes.ok) {
      router.push('/campaigns')
      return
    }
    const campaignData = await campaignRes.json()
    const loadedCampaign: Campaign = campaignData.campaign

    const deadline = getDeadlineInfo(loadedCampaign.application_deadline)
    if (deadline.isPast) {
      router.push(`/campaigns/${campaignId}`)
      return
    }

    const applicationRes = await fetch(`/api/applications?campaign_id=${campaignId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (applicationRes.ok) {
      const applicationData = await applicationRes.json()
      if (applicationData.applications?.length > 0) {
        router.push(`/campaigns/${campaignId}`)
        return
      }
    }

    setProfile(profileStr ? JSON.parse(profileStr) : null)
    setCampaign(loadedCampaign)
    setReady(true)
  }, [campaignId, router])

  useEffect(() => {
    checkAccessAndLoad()
  }, [checkAccessAndLoad])

  async function handleSubmit(values: ApplicationFormValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/campaigns/${campaignId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      })
      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit application')
        return
      }

      router.push(`/campaigns/${campaignId}?applied=1`)
    } catch {
      setSubmitError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="creator" profile={profile} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link href={`/campaigns/${campaignId}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="font-semibold text-gray-900 truncate">Apply to Campaign</h1>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 text-lg">{campaign.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{campaign.brand?.company_name || 'Brand'}</p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <span className="text-gray-500">
              Budget: <span className="font-medium text-gray-900">{formatBudget(campaign)}</span>
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <Calendar className="w-4 h-4" />
              Deadline: <span className="font-medium text-gray-900">{formatDate(campaign.application_deadline)}</span>
            </span>
          </div>
        </div>

        <ApplicationForm
          campaign={campaign}
          submitting={submitting}
          submitError={submitError}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  )
}
