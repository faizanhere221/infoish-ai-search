import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_CATEGORIES,
  PLATFORMS,
  DELIVERABLE_TYPES,
} from '@/types/campaigns'

interface RouteParams {
  params: { id: string }
}

const OBJECTIVE_VALUES = CAMPAIGN_OBJECTIVES.map((o) => o.value) as [string, ...string[]]
const CATEGORY_VALUES = CAMPAIGN_CATEGORIES.map((c) => c.value) as [string, ...string[]]
const PLATFORM_VALUES = PLATFORMS.map((p) => p.value) as [string, ...string[]]
const DELIVERABLE_TYPE_VALUES = DELIVERABLE_TYPES.map((d) => d.value) as [string, ...string[]]

// Status transitions allowed through the generic PUT endpoint. Draft ->
// published is intentionally excluded — that transition goes through
// POST /api/campaigns/[id]/publish, which validates required fields first.
const PUT_ALLOWED_STATUSES = ['draft', 'closed', 'completed', 'cancelled'] as const

const DeliverableSchema = z.object({
  platform: z.enum(PLATFORM_VALUES),
  deliverable_type: z.enum(DELIVERABLE_TYPE_VALUES),
  quantity: z.number().int().min(1).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  deadline: z.string().optional().nullable(),
})

const UpdateCampaignSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  objective: z.enum(OBJECTIVE_VALUES).optional().nullable(),
  category: z.enum(CATEGORY_VALUES).optional().nullable(),
  budget_min: z.number().int().nonnegative().max(1_000_000_000).optional().nullable(),
  budget_max: z.number().int().nonnegative().max(1_000_000_000).optional().nullable(),
  budget_type: z.enum(['fixed', 'range', 'negotiable']).optional(),
  currency: z.string().min(3).max(10).optional(),
  platforms: z.array(z.enum(PLATFORM_VALUES)).max(20).optional(),
  creator_categories: z.array(z.string().max(100)).max(20).optional(),
  min_followers: z.number().int().nonnegative().max(1_000_000_000).optional(),
  target_countries: z.array(z.string().max(100)).max(50).optional(),
  application_deadline: z.string().optional().nullable(),
  campaign_start_date: z.string().optional().nullable(),
  campaign_end_date: z.string().optional().nullable(),
  visibility: z.enum(['public', 'private']).optional(),
  status: z.enum(PUT_ALLOWED_STATUSES).optional(),
  deliverables: z.array(DeliverableSchema).max(20).optional(),
})

// GET /api/campaigns/[id] - Get single campaign
// Published + public campaigns are visible to any authenticated caller.
// Everything else (draft/closed/completed/cancelled, or private) is
// visible only to the owning brand.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    const isOwner = callerUserType === 'brand' && callerProfileId === campaign.brand_id
    const isPubliclyVisible = campaign.status === 'published' && campaign.visibility === 'public'

    if (!isPubliclyVisible && !isOwner) {
      // Don't distinguish "doesn't exist" from "not visible to you"
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const [{ data: brand }, { data: deliverables }] = await Promise.all([
      supabase
        .from('brands')
        .select('id, company_name, logo_url, contact_name, industry')
        .eq('id', campaign.brand_id)
        .single(),
      supabase
        .from('campaign_deliverables')
        .select('*')
        .eq('campaign_id', id),
    ])

    return NextResponse.json({
      campaign: {
        ...campaign,
        brand: brand || null,
        deliverables: deliverables || [],
      },
    })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/campaigns/[id] - Update campaign (owner only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()

    const parsed = UpdateCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: currentCampaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    if (callerUserType !== 'brand' || callerProfileId !== currentCampaign.brand_id) {
      return NextResponse.json({ error: 'You are not authorized to update this campaign' }, { status: 403 })
    }

    // Publishing a draft goes through /publish, which validates required
    // fields first — reject any attempt to set status='published' here.
    if (body.status === 'published') {
      return NextResponse.json(
        { error: "Use POST /api/campaigns/{id}/publish to publish a campaign" },
        { status: 400 }
      )
    }

    const { deliverables, ...fields } = parsed.data

    // zod only includes keys that were present in the request body, so this
    // is a safe partial update — never overwrites fields the caller omitted.
    const updates: Partial<typeof fields> & { updated_at: string } = {
      ...fields,
      updated_at: new Date().toISOString(),
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
    }

    // Replace deliverables wholesale if provided (mirrors the
    // creators/[id]/services PUT pattern: delete-then-insert)
    let savedDeliverables: unknown[] | undefined
    if (deliverables !== undefined) {
      await supabase.from('campaign_deliverables').delete().eq('campaign_id', id)

      if (deliverables.length > 0) {
        const deliverableRecords = deliverables.map((d) => ({
          campaign_id: id,
          platform: d.platform,
          deliverable_type: d.deliverable_type,
          quantity: d.quantity ?? 1,
          description: d.description || null,
          deadline: d.deadline || null,
        }))

        const { data: insertedDeliverables, error: deliverableError } = await supabase
          .from('campaign_deliverables')
          .insert(deliverableRecords)
          .select()

        if (deliverableError) {
          console.error('Error replacing campaign deliverables:', deliverableError.message)
        } else {
          savedDeliverables = insertedDeliverables || []
        }
      } else {
        savedDeliverables = []
      }
    }

    return NextResponse.json({
      message: 'Campaign updated successfully',
      campaign: savedDeliverables !== undefined ? { ...campaign, deliverables: savedDeliverables } : campaign,
    })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/campaigns/[id] - Delete campaign (owner only)
// Drafts are hard-deleted. Anything already published is soft-deleted
// (status='cancelled') so its application history is preserved.
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, brand_id, status')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')
    if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
      return NextResponse.json({ error: 'You are not authorized to delete this campaign' }, { status: 403 })
    }

    if (campaign.status === 'draft') {
      const { error } = await supabase.from('campaigns').delete().eq('id', id)
      if (error) {
        console.error('Error deleting campaign:', error)
        return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
      }
      return NextResponse.json({ message: 'Draft campaign deleted' })
    }

    const { data: cancelled, error } = await supabase
      .from('campaigns')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error cancelling campaign:', error)
      return NextResponse.json({ error: 'Failed to cancel campaign' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Campaign cancelled', campaign: cancelled })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
