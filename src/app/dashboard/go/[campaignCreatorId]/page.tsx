'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Universal deep-link target for chat message cards and notifications,
// neither of which knows the campaign id or the viewer's own role at write
// time (they only ever store the campaign_creators row id). Looks both up,
// then forwards to the real destination:
//   brand:   /dashboard/campaigns/<campaignId>/tracker?row=<id>&tab=<tab>
//   creator: /dashboard/my-campaigns/<id>?tab=<tab>
export default function CampaignCreatorGoPage() {
  const params = useParams<{ campaignCreatorId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab') || 'offer'
    const userStr = localStorage.getItem('auth_user')
    const token = localStorage.getItem('auth_token')
    if (!userStr || !token) {
      router.replace('/login')
      return
    }
    const user = JSON.parse(userStr)

    fetch(`/api/campaign-creators/${params.campaignCreatorId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) {throw new Error('not found')}
        const data = await res.json()
        if (user.user_type === 'brand') {
          router.replace(`/dashboard/campaigns/${data.campaign_creator.campaign_id}/tracker?row=${params.campaignCreatorId}&tab=${tab}`)
        } else {
          router.replace(`/dashboard/my-campaigns/${params.campaignCreatorId}?tab=${tab}`)
        }
      })
      .catch(() => setError(true))
  }, [params.campaignCreatorId, searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">This isn&apos;t available anymore.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
    </div>
  )
}
