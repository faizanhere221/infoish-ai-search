import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'
import { revalidateCreatorPublicSurfaces } from '@/lib/creators/revalidate'
import { captureError } from '@/lib/error-tracking'
import { parsePrice } from '@/lib/creators/platform-input'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const ServiceSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  // creator_services.content_type is VARCHAR(50) on the live DB — a longer
  // value passed validation here and then failed the insert with a 500.
  content_type: z.string().max(50).optional().nullable(),
  platform: z.string().max(100).optional().nullable(),
  // Accepts 100, "100.50", "$1,000" — same parser as the settings page.
  price: z.unknown().transform((v, ctx) => {
    const price = parsePrice(v)
    if (price === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `"${String(v)}" is not a valid price` })
      return z.NEVER
    }
    return price
  }),
  delivery_days: z.number().int().min(1).max(365).optional(),
  revisions_included: z.number().int().min(0).max(20).optional(),
  is_active: z.boolean().optional(),
})

const UpdateServicesSchema = z.object({
  services: z.array(ServiceSchema).max(20),
})

// PUT - Update creator services
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const parsed = UpdateServicesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: typeof parsed.error.issues[0]?.path[1] === 'number'
            ? `Service #${parsed.error.issues[0].path[1] + 1}: ${parsed.error.issues[0].message}`
            : parsed.error.issues[0]?.message || 'Invalid request body',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Verify ownership
    const callerUserId = request.headers.get('x-user-id')
    const supabase = createServerSupabase()

    const { data: creator } = await supabase
      .from('creators')
      .select('user_id, username')
      .eq('id', id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (creator.user_id !== callerUserId) {
      return NextResponse.json(
        { error: 'You are not authorized to update these services' },
        { status: 403 }
      )
    }

    // Snapshot the current rows, insert the new list, and only then delete the
    // old rows. The previous delete-then-insert wiped every service when the
    // insert failed, and a failed delete was only logged, so the route still
    // returned 200.
    const { data: oldRows, error: oldError } = await supabase
      .from('creator_services')
      .select('id')
      .eq('creator_id', id)

    if (oldError) {
      captureError(oldError, { route: 'PUT /api/creators/[id]/services', step: 'select', creatorId: id })
      return NextResponse.json({ error: 'Failed to save services' }, { status: 500 })
    }
    const oldIds = (oldRows || []).map((r) => r.id as string)

    const { services } = parsed.data
    let savedServices: Record<string, unknown>[] = []
    if (services.length > 0) {
      // One insert gives every row the same NOW() created_at, so reads ordered
      // by created_at came back shuffled. Stagger by 1ms to keep list order.
      const baseTime = Date.now()
      const serviceRecords = services.map((s, index) => ({
        created_at: new Date(baseTime + index).toISOString(),
        creator_id: id,
        title: s.title || 'Untitled Service',
        description: s.description ?? null,
        content_type: s.content_type ?? null,
        platform: s.platform ?? null,
        price: s.price,
        currency: 'USD',
        delivery_days: s.delivery_days ?? 7,
        revisions_included: s.revisions_included ?? 1,
        is_active: s.is_active !== false,
      }))

      const { data, error } = await supabase
        .from('creator_services')
        .insert(serviceRecords)
        .select()

      if (error) {
        captureError(error, { route: 'PUT /api/creators/[id]/services', step: 'insert', creatorId: id })
        return NextResponse.json(
          { error: 'Failed to save services' },
          { status: 500 }
        )
      }

      savedServices = data || []
    }

    if (oldIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('creator_services')
        .delete()
        .in('id', oldIds)
        .eq('creator_id', id)

      if (deleteError) {
        captureError(deleteError, { route: 'PUT /api/creators/[id]/services', step: 'delete', creatorId: id })
        // Roll back the rows just inserted so the creator isn't left with
        // the old and new lists side by side.
        const newIds = savedServices.map((s) => s.id as string)
        if (newIds.length > 0) {
          await supabase.from('creator_services').delete().in('id', newIds).eq('creator_id', id)
        }
        return NextResponse.json({ error: 'Failed to save services' }, { status: 500 })
      }
    }

    revalidateCreatorPublicSurfaces(creator.username)

    return NextResponse.json({ message: 'Services updated successfully', services: savedServices })

  } catch (error) {
    captureError(error, { route: 'PUT /api/creators/[id]/services' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get services for a creator
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServerSupabase()

    const { data: services, error } = await supabase
      .from('creator_services')
      .select('*')
      .eq('creator_id', id)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching services:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      )
    }

    return NextResponse.json({ services: services || [] })

  } catch (error) {
    console.error('Error fetching services:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
