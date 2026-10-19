import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedCampaignCreatorRow } from '@/lib/campaign-creator-auth'
import { recordCampaignCreatorAction } from '@/lib/campaign-creator-events'
import { voidContractOnTermsChange } from '@/lib/contracts/lifecycle'
import { getUserIdFromCreator } from '@/lib/notifications'
import { DELIVERABLE_FORMATS } from '@/types/campaigns'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

const FORMAT_VALUES = DELIVERABLE_FORMATS.map((f) => f.value) as [string, ...string[]]

const CreateDeliverableSchema = z.object({
  title: z.string().min(1).max(255),
  platform: z.string().max(50).optional().nullable(),
  format: z.enum(FORMAT_VALUES).optional().nullable(),
  draft_due: z.string().optional().nullable(),
  publish_due: z.string().optional().nullable(),
  revisions_allowed: z.number().int().min(0).max(20).optional(),
})

// GET /api/campaign-creators/[id]/deliverables — either party on the row.
// No stripping needed — deliverables never carry payout/charge/notes.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: deliverables, error } = await supabase
      .from('creator_deliverables')
      .select('*')
      .eq('campaign_creator_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      captureError(error, { route: 'GET /api/campaign-creators/[id]/deliverables' })
      return NextResponse.json({ error: 'Failed to fetch deliverables' }, { status: 500 })
    }

    return NextResponse.json({ deliverables: deliverables || [] })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaign-creators/[id]/deliverables' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaign-creators/[id]/deliverables — brand owner only. Manually
// add a deliverable beyond the one an accepted offer creates automatically.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = CreateDeliverableSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedCampaignCreatorRow(supabase, id, callerProfileId, callerUserType)
    if (!authorized || !callerUserId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (authorized.actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can add deliverables' }, { status: 403 })
    }

    const { data: deliverable, error } = await supabase
      .from('creator_deliverables')
      .insert({
        campaign_creator_id: id,
        title: parsed.data.title,
        platform: parsed.data.platform || null,
        format: parsed.data.format || null,
        draft_due: parsed.data.draft_due || null,
        publish_due: parsed.data.publish_due || null,
        revisions_allowed: parsed.data.revisions_allowed ?? 2,
      })
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST /api/campaign-creators/[id]/deliverables' })
      return NextResponse.json({ error: 'Failed to create deliverable' }, { status: 500 })
    }

    const recipientUserId = await getUserIdFromCreator(supabase, authorized.row.creator_id)
    await recordCampaignCreatorAction(supabase, {
      campaignCreatorId: id,
      creatorId: authorized.row.creator_id,
      brandId: authorized.row.brand_id,
      actorUserId: callerUserId,
      actorType: 'brand',
      eventType: 'deliverable_added',
      payload: { deliverable_id: deliverable.id, title: deliverable.title },
      systemMessage: `📋 New deliverable added: "${deliverable.title}"`,
      notification: { recipientUserId },
    })

    await voidContractOnTermsChange(supabase, {
      campaignCreatorId: id,
      creatorId: authorized.row.creator_id,
      brandId: authorized.row.brand_id,
      actorUserId: callerUserId,
      reason: 'a deliverable was added',
      recipientUserId,
    })

    return NextResponse.json({ message: 'Deliverable added', deliverable }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST /api/campaign-creators/[id]/deliverables' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
