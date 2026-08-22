'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import CampaignWizard, { type CampaignSubmitPayload } from '@/components/campaigns/CampaignWizard'

interface BrandProfile {
  id: string
  company_name: string
  [key: string]: unknown
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('auth_user')
    const profileStr = localStorage.getItem('auth_profile')
    const token = localStorage.getItem('auth_token')

    if (!userStr || !token) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.user_type !== 'brand') {
      router.push('/campaigns')
      return
    }

    setProfile(profileStr ? JSON.parse(profileStr) : null)
    setAuthChecked(true)
  }, [router])

  async function handleSaveDraft(payload: CampaignSubmitPayload) {
    const token = localStorage.getItem('auth_token')

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to save draft' }
      }

      router.push('/campaigns')
      return { success: true }
    } catch {
      return { success: false, error: 'Network error — please try again' }
    }
  }

  async function handlePublish(payload: CampaignSubmitPayload) {
    const token = localStorage.getItem('auth_token')

    try {
      const createRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const createData = await createRes.json()

      if (!createRes.ok) {
        return { success: false, error: createData.error || 'Failed to create campaign' }
      }

      const campaignId = createData.campaign.id

      const publishRes = await fetch(`/api/campaigns/${campaignId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const publishData = await publishRes.json()

      if (!publishRes.ok) {
        return {
          success: false,
          error: publishData.error || 'Campaign was saved as a draft, but publishing failed',
        }
      }

      router.push(`/campaigns/${campaignId}`)
      return { success: true }
    } catch {
      return { success: false, error: 'Network error — please try again' }
    }
  }

  if (!authChecked) {
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
            <Link href="/campaigns" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="font-semibold text-gray-900">Create Campaign</h1>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CampaignWizard onSaveDraft={handleSaveDraft} onPublish={handlePublish} />
      </main>
    </div>
  )
}
