import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_CATEGORIES,
  PLATFORMS,
  DELIVERABLE_TYPES,
} from '@/types/campaigns'

const OBJECTIVE_VALUES = CAMPAIGN_OBJECTIVES.map((o) => o.value) as [string, ...string[]]
const CATEGORY_VALUES = CAMPAIGN_CATEGORIES.map((c) => c.value) as [string, ...string[]]
const PLATFORM_VALUES = PLATFORMS.map((p) => p.value) as [string, ...string[]]
const DELIVERABLE_TYPE_VALUES = DELIVERABLE_TYPES.map((d) => d.value) as [string, ...string[]]

const DeliverableSchema = z.object({
  platform: z.enum(PLATFORM_VALUES),
  deliverable_type: z.enum(DELIVERABLE_TYPE_VALUES),
  quantity: z.number().int().min(1).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  deadline: z.string().optional().nullable(),
})

const CreateCampaignSchema = z.object({
  title: z.string().min(3).max(255),
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
  deliverables: z.array(DeliverableSchema).max(20).optional(),
})

// GET - List campaigns
// Brands: their own campaigns (any status). Creators (and anyone else
// authenticated): published + public campaigns only.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()

    let query = supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (callerUserType === 'brand' && callerProfileId) {
      // Brands see only their own campaigns, in any status
      query = query.eq('brand_id', callerProfileId)
      if (status) {
        query = query.eq('status', status)
      }
    } else {
      // Everyone else sees only published, public campaigns
      query = query.eq('status', 'published').eq('visibility', 'public')
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (platform) {
      query = query.contains('platforms', [platform])
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: campaigns, error, count } = await query

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ campaigns: [], total: count ?? 0, limit, offset })
    }

    // Fetch brand summaries for these campaigns
    const brandIds = [...new Set(campaigns.map((c) => c.brand_id).filter(Boolean))]
    let brands: { id: string; company_name: string; logo_url: string | null; contact_name: string | null; industry: string | null }[] = []

    if (brandIds.length > 0) {
      const { data } = await supabase
        .from('brands')
        .select('id, company_name, logo_url, contact_name, industry')
        .in('id', brandIds)
      brands = data || []
    }

    const campaignsWithRelations = campaigns.map((campaign) => ({
      ...campaign,
      brand: brands.find((b) => b.id === campaign.brand_id) || null,
    }))

    return NextResponse.json({
      campaigns: campaignsWithRelations,
      total: count ?? campaignsWithRelations.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Campaigns fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create campaign (brands only). Always created as a draft.
export async function POST(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'brand' || !callerProfileId) {
      return NextResponse.json({ error: 'Only brands can create campaigns' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = CreateCampaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      objective,
      category,
      budget_min,
      budget_max,
      budget_type,
      currency,
      platforms,
      creator_categories,
      min_followers,
      target_countries,
      application_deadline,
      campaign_start_date,
      campaign_end_date,
      visibility,
      deliverables,
    } = parsed.data

    const supabase = createServerSupabase()

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        brand_id: callerProfileId, // derived from the authenticated session, never trusted from the body
        title,
        description: description || null,
        objective: objective || null,
        category: category || null,
        budget_min: budget_min ?? null,
        budget_max: budget_max ?? null,
        budget_type: budget_type || 'range',
        currency: currency || 'USD',
        platforms: platforms || [],
        creator_categories: creator_categories || [],
        min_followers: min_followers ?? 0,
        target_countries: target_countries || [],
        application_deadline: application_deadline || null,
        campaign_start_date: campaign_start_date || null,
        campaign_end_date: campaign_end_date || null,
        visibility: visibility || 'public',
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    // Add deliverables if provided (best-effort — mirrors creators/route.ts
    // POST behaviour for creator_platforms: don't fail campaign creation if
    // this secondary insert has a problem, just log it)
    let savedDeliverables: unknown[] = []
    if (deliverables && deliverables.length > 0) {
      const deliverableRecords = deliverables.map((d) => ({
        campaign_id: campaign.id,
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
        console.error('Error adding campaign deliverables:', deliverableError.message)
      } else {
        savedDeliverables = insertedDeliverables || []
      }
    }

    return NextResponse.json(
      {
        message: 'Campaign created successfully',
        campaign: { ...campaign, deliverables: savedDeliverables },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Campaign creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
