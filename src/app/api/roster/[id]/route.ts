import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface RouteParams {
  params: { id: string }
}

const UpdateRosterSchema = z.object({
  notes: z.string().max(2000).optional().nullable(),
  typical_payout: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  typical_charge: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  currency: z.string().min(3).max(10).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
})

// PUT /api/roster/[id] — owner only
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = UpdateRosterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { data: entry } = await supabase.from('saved_creators').select('id, brand_id').eq('id', id).single()
    if (!entry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (callerUserType !== 'brand' || callerProfileId !== entry.brand_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: updated, error } = await supabase
      .from('saved_creators')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'PUT /api/roster/[id]' })
      return NextResponse.json({ error: 'Failed to update roster entry' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Updated', roster_entry: updated })
  } catch (error) {
    captureError(error, { route: 'PUT /api/roster/[id]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/roster/[id] — owner only
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()

    const { data: entry } = await supabase.from('saved_creators').select('id, brand_id').eq('id', id).single()
    if (!entry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (callerUserType !== 'brand' || callerProfileId !== entry.brand_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase.from('saved_creators').delete().eq('id', id)
    if (error) {
      captureError(error, { route: 'DELETE /api/roster/[id]' })
      return NextResponse.json({ error: 'Failed to remove from roster' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Removed from roster' })
  } catch (error) {
    captureError(error, { route: 'DELETE /api/roster/[id]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
