import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

const CreateShareLinkSchema = z.object({
  show_charge: z.boolean().optional(),
})

async function requireOwner(
  supabase: ReturnType<typeof createServerSupabase>,
  campaignId: string,
  callerProfileId: string | null,
  callerUserType: string | null
) {
  const { data: campaign } = await supabase.from('campaigns').select('id, brand_id').eq('id', campaignId).single()
  if (!campaign) {return { campaign: null, error: NextResponse.json({ error: 'Campaign not found' }, { status: 404 }) }}
  if (callerUserType !== 'brand' || callerProfileId !== campaign.brand_id) {
    return { campaign: null, error: NextResponse.json({ error: 'You are not authorized to manage this campaign' }, { status: 403 }) }
  }
  return { campaign, error: null }
}

// GET /api/campaigns/[id]/share-links — brand owner only
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const { error: authError } = await requireOwner(supabase, id, callerProfileId, callerUserType)
    if (authError) {return authError}

    const { data: links, error } = await supabase
      .from('campaign_share_links')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      captureError(error, { route: 'GET /api/campaigns/[id]/share-links' })
      return NextResponse.json({ error: 'Failed to fetch share links' }, { status: 500 })
    }

    return NextResponse.json({ share_links: links || [] })
  } catch (error) {
    captureError(error, { route: 'GET /api/campaigns/[id]/share-links' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaigns/[id]/share-links — create a new link (brand owner only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json().catch(() => ({}))
    const parsed = CreateShareLinkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const { error: authError } = await requireOwner(supabase, id, callerProfileId, callerUserType)
    if (authError) {return authError}

    const token = randomBytes(32).toString('base64url')

    const { data: link, error } = await supabase
      .from('campaign_share_links')
      .insert({
        campaign_id: id,
        token,
        show_charge: parsed.data.show_charge ?? true,
      })
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST /api/campaigns/[id]/share-links' })
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Share link created', share_link: link }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST /api/campaigns/[id]/share-links' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
