import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { encryptPayoutDetails, buildMaskedPreview } from '@/lib/payments/crypto'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

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

const CreatePayoutMethodSchema = z.object({
  method: z.enum(['wise', 'payoneer', 'bank_transfer', 'paypal', 'other']),
  account_holder_name: z.string().min(1).max(255),
  currency: z.string().min(3).max(10).optional(),
  is_default: z.boolean().optional(),
  details: DetailsSchema,
}).superRefine((data, ctx) => {
  if (['wise', 'payoneer', 'paypal'].includes(data.method) && !data.details.email) {
    ctx.addIssue({ code: 'custom', path: ['details', 'email'], message: 'Email is required for this method' })
  }
  if (data.method === 'bank_transfer') {
    if (!data.details.bank_name) {ctx.addIssue({ code: 'custom', path: ['details', 'bank_name'], message: 'Bank name is required' })}
    if (!data.details.iban && !data.details.account_number) {
      ctx.addIssue({ code: 'custom', path: ['details', 'iban'], message: 'IBAN or account number is required' })
    }
    if (!data.details.swift && !data.details.routing_number) {
      ctx.addIssue({ code: 'custom', path: ['details', 'swift'], message: 'SWIFT or routing number is required' })
    }
    if (!data.details.country) {ctx.addIssue({ code: 'custom', path: ['details', 'country'], message: 'Country is required' })}
  }
})

// Explicit field list — never the encrypted blob, so list endpoints can
// never leak account details even if a column is added later.
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

// GET /api/payout-methods — the authenticated creator's own methods, masked.
export async function GET(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators have payout methods' }, { status: 403 })
    }

    const supabase = createServerSupabase()
    const { data: methods, error } = await supabase
      .from('payout_methods')
      .select('*')
      .eq('creator_id', callerProfileId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      captureError(error, { route: 'GET /api/payout-methods' })
      return NextResponse.json({ error: 'Failed to fetch payout methods' }, { status: 500 })
    }

    return NextResponse.json({ payout_methods: (methods || []).map(toPublicPayoutMethod) })
  } catch (error) {
    captureError(error, { route: 'GET /api/payout-methods' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payout-methods — creator only. Encrypts details before storage.
export async function POST(request: NextRequest) {
  try {
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    if (callerUserType !== 'creator' || !callerProfileId) {
      return NextResponse.json({ error: 'Only creators have payout methods' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = CreatePayoutMethodSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()

    const { ciphertext, keyVersion } = encryptPayoutDetails(parsed.data.details)
    const maskedPreview = buildMaskedPreview(parsed.data.method, parsed.data.details)

    // Setting this one as default means clearing any existing default first
    // — the partial unique index would otherwise reject the insert.
    if (parsed.data.is_default) {
      await supabase.from('payout_methods').update({ is_default: false }).eq('creator_id', callerProfileId).eq('is_default', true)
    }

    const { data: created, error } = await supabase
      .from('payout_methods')
      .insert({
        creator_id: callerProfileId,
        method: parsed.data.method,
        account_holder_name: parsed.data.account_holder_name,
        details_encrypted: ciphertext,
        key_version: keyVersion,
        masked_preview: maskedPreview,
        currency: parsed.data.currency || 'USD',
        is_default: parsed.data.is_default ?? false,
      })
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'POST /api/payout-methods' })
      return NextResponse.json({ error: 'Failed to add payout method' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Payout method added', payout_method: toPublicPayoutMethod(created) }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST /api/payout-methods' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
