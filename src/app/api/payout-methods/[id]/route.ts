import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { encryptPayoutDetails, buildMaskedPreview } from '@/lib/payments/crypto'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

const DetailsSchema = z.object({
  email: z.string().email().max(255).optional(),
  bank_name: z.string().max(255).optional(),
  iban: z.string().max(100).optional(),
  account_number: z.string().max(100).optional(),
  swift: z.string().max(50).optional(),
  routing_number: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
})

const UpdatePayoutMethodSchema = z.object({
  account_holder_name: z.string().min(1).max(255).optional(),
  currency: z.string().min(3).max(10).optional(),
  is_default: z.boolean().optional(),
  details: DetailsSchema.optional(),
})

function toPublicPayoutMethod(row: Record<string, unknown>) {
  return {
    id: row.id,
    method: row.method,
    account_holder_name: row.account_holder_name,
    masked_preview: row.masked_preview,
    currency: row.currency,
    is_default: row.is_default,
    created_at: row.created_at,
  }
}

async function loadOwnMethod(supabase: ReturnType<typeof createServerSupabase>, id: string, creatorId: string) {
  const { data } = await supabase.from('payout_methods').select('*').eq('id', id).eq('creator_id', creatorId).single()
  return data
}

// PUT /api/payout-methods/[id] — creator owner only.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators have payout methods' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = UpdatePayoutMethodSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const existing = await loadOwnMethod(supabase, id, callerProfileId)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (parsed.data.account_holder_name !== undefined) {updates.account_holder_name = parsed.data.account_holder_name}
    if (parsed.data.currency !== undefined) {updates.currency = parsed.data.currency}
    if (parsed.data.details) {
      updates.details_encrypted = encryptPayoutDetails(parsed.data.details)
      updates.masked_preview = buildMaskedPreview(existing.method, parsed.data.details)
    }

    if (parsed.data.is_default) {
      await supabase.from('payout_methods').update({ is_default: false }).eq('creator_id', callerProfileId).eq('is_default', true)
      updates.is_default = true
    } else if (parsed.data.is_default === false) {
      updates.is_default = false
    }

    const { data: updated, error } = await supabase
      .from('payout_methods')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'PUT /api/payout-methods/[id]' })
      return NextResponse.json({ error: 'Failed to update payout method' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Updated', payout_method: toPublicPayoutMethod(updated) })
  } catch (error) {
    captureError(error, { route: 'PUT /api/payout-methods/[id]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payout-methods/[id] — creator owner only.
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators have payout methods' }, { status: 403 })
    }

    const supabase = createServerSupabase()
    const existing = await loadOwnMethod(supabase, id, callerProfileId)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { error } = await supabase.from('payout_methods').delete().eq('id', id)
    if (error) {
      captureError(error, { route: 'DELETE /api/payout-methods/[id]' })
      return NextResponse.json({ error: 'Failed to remove payout method' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Removed' })
  } catch (error) {
    captureError(error, { route: 'DELETE /api/payout-methods/[id]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
