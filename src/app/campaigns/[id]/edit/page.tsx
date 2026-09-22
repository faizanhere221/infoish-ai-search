'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import CampaignWizard, { type CampaignFormData, type CampaignSubmitPayload } from '@/components/campaigns/CampaignWizard'
import type { Campaign } from '@/types/campaigns'

interface Profile {
  id: string
  [key: string]: unknown
}

function campaignToFormData(campaign: Campaign): CampaignFormData {
  const deliverables =
    campaign.deliverables && campaign.deliverables.length > 0
      ? campaign.deliverables.map((d) => ({
          id: d.id,
          platform: d.platform,
          deliverable_type: d.deliverable_type,
          quantity: String(d.quantity),
          description: d.description || '',
        }))
      : [{ id: crypto.randomUUID(), platform: '' as const, deliverable_type: '' as const, quantity: '1', description: '' }]

  return {
    title: campaign.title,
    description: campaign.description || '',
    objective: campaign.objective || '',
    category: campaign.category || '',
    platforms: campaign.platforms || [],
    min_followers: campaign.min_followers ? String(campaign.min_followers) : '',
    target_countries: campaign.target_countries || [],
    deliverables,
    budget_type: campaign.budget_type,
    budget_fixed: campaign.budget_type === 'fixed' && campaign.budget_max !== null && campaign.budget_max !== undefined ? String(campaign.budget_max) : '',
    budget_min: campaign.budget_type === 'range' && campaign.budget_min !== null && campaign.budget_min !== undefined ? String(campaign.budget_min) : '',
    budget_max: campaign.budget_type === 'range' && campaign.budget_max !== null && campaign.budget_max !== undefined ? String(campaign.budget_max) : '',
    currency: campaign.currency,
    application_deadline: campaign.application_deadline ? campaign.application_deadline.split('T')[0] : '',
    campaign_start_date: campaign.campaign_start_date ? campaign.campaign_start_date.split('T')[0] : '',
    campaign_end_date: campaign.campaign_end_date ? campaign.campaign_end_date.split('T')[0] : '',
  }
}

export default function EditCampaignPage() {
  const params = useParams<{ id: string }>()
  const campaignId = params.id
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [initialData, setInitialData] = useState<CampaignFormData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

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
      router.push(`/campaigns/${campaignId}`)
      return
    }
    setProfile(userProfile)

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        router.push('/campaigns')
        return
      }
      const data = await res.json()
      const campaign: Campaign = data.campaign

      if (userProfile?.id !== campaign.brand_id) {
        router.push(`/campaigns/${campaignId}`)
        return
      }

      // Editing is only supported for drafts — a published campaign may
      // already have applications, so changing its terms mid-flight would
      // be misleading to applicants.
      if (campaign.status !== 'draft') {
        router.push(`/campaigns/${campaignId}`)
        return
      }

      setInitialData(campaignToFormData(campaign))
    } catch (err) {
      console.error('Error loading campaign:', err)
      setLoadError('error')
    }
  }, [campaignId, router])

  useEffect(() => {
    load()
  }, [load])

  async function handleSaveDraft(payload: CampaignSubmitPayload) {
    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to save changes' }
      }
      router.push(`/campaigns/${campaignId}?updated=1`)
      return { success: true }
    } catch {
      return { success: false, error: 'Network error — please try again' }
    }
  }

  async function handlePublish(payload: CampaignSubmitPayload) {
    const token = localStorage.getItem('auth_token')
    try {
      const updateRes = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const updateData = await updateRes.json()
      if (!updateRes.ok) {
        return { success: false, error: updateData.error || 'Failed to save changes' }
      }

      const publishRes = await fetch(`/api/campaigns/${campaignId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const publishData = await publishRes.json()
      if (!publishRes.ok) {
        return {
          success: false,
          error: publishData.error || 'Changes were saved, but publishing failed',
        }
      }

      router.push(`/campaigns/${campaignId}?published=1`)
      return { success: true }
    } catch {
      return { success: false, error: 'Network error — please try again' }
    }
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader userType="brand" profile={profile} />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Couldn't load this campaign</h1>
          <Link
            href="/dashboard/campaigns"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Campaigns
          </Link>
        </main>
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="brand" profile={profile} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <Link href={`/campaigns/${campaignId}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="font-semibold text-gray-900">Edit Campaign</h1>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CampaignWizard
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          initialData={initialData}
          saveDraftLabel="Save Changes"
        />
      </main>
    </div>
  )
}
