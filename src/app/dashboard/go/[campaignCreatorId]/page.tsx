import { cookies, headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { jwtVerify } from 'jose'
import { createServerSupabase } from '@/lib/db'
import { loadAuthorizedCampaignCreatorRow } from '@/lib/campaign-creator-auth'

interface PageProps {
  params: { campaignCreatorId: string }
  searchParams: { tab?: string }
}

// Universal deep-link target for chat message cards and notifications,
// neither of which knows the campaign id or the viewer's own role at write
// time (they only ever store the campaign_creators row id). A server
// component (not client-rendered) so a stranger probing a row id they are
// not party to gets a real 404 — not a 200 shell that only reveals the
// answer after a client-side fetch. Verifies the JWT itself, the same way
// the /admin/* middleware check does, since ordinary page routes don't get
// trusted headers injected (only /api and /admin do — see src/middleware.ts).
// Forwards to:
//   brand:   /dashboard/campaigns/<campaignId>/tracker?row=<id>&tab=<tab>
//   creator: /dashboard/my-campaigns/<id>?tab=<tab>
export default async function CampaignCreatorGoPage({ params, searchParams }: PageProps) {
  const tab = searchParams.tab || 'offer'
  const secret = process.env.JWT_SECRET

  const authHeader = headers().get('authorization')
  const cookieToken = cookies().get('auth_token')?.value
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

  if (!token || !secret) {notFound()}

  let userType = ''
  let profileId = ''
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    userType = String(payload.userType ?? '')
    profileId = String(payload.profileId ?? '')
  } catch {
    notFound()
  }

  const supabase = createServerSupabase()
  const authorized = await loadAuthorizedCampaignCreatorRow(supabase, params.campaignCreatorId, profileId, userType)
  if (!authorized) {notFound()}

  if (authorized.actorType === 'brand') {
    redirect(`/dashboard/campaigns/${authorized.row.campaign_id}/tracker?row=${params.campaignCreatorId}&tab=${tab}`)
  }
  redirect(`/dashboard/my-campaigns/${params.campaignCreatorId}?tab=${tab}`)
}
