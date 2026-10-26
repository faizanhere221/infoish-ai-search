import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string; linkId: string }
}

const UpdateShareLinkSchema = z.object({
  show_charge: z.boolean().optional(),
  show_results: z.boolean().optional(),
  revoked: z.boolean().optional(),
})

// PATCH /api/campaigns/[id]/share-links/[linkId] — toggle show_charge and/or
// revoke (brand owner only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, linkId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = UpdateShareLinkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: campaign } = await supabase.from('campaigns').select('id, brand_id').eq('id', id).single()
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'You are not authorized to manage this campaign' }, { status: 403 })
    }

    const { data: link } = await supabase
      .from('campaign_share_links')
      .select('id')
      .eq('id', linkId)
      .eq('campaign_id', id)
      .single()
    if (!link) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}
    if (parsed.data.show_charge !== undefined) {updates.show_charge = parsed.data.show_charge}
    if (parsed.data.show_results !== undefined) {updates.show_results = parsed.data.show_results}
    if (parsed.data.revoked !== undefined) {updates.revoked_at = parsed.data.revoked ? new Date().toISOString() : null}

    const { data: updated, error } = await supabase
      .from('campaign_share_links')
      .update(updates)
      .eq('id', linkId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'PATCH /api/campaigns/[id]/share-links/[linkId]' })
      return NextResponse.json({ error: 'Failed to update share link' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Updated', share_link: updated })
  } catch (error) {
    captureError(error, { route: 'PATCH /api/campaigns/[id]/share-links/[linkId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
