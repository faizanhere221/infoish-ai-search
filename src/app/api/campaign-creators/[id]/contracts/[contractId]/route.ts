import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedContract } from '@/lib/campaign-creator-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string; contractId: string }
}

const UpdateContractSchema = z.object({
  special_terms: z.string().max(4000).optional().nullable(),
  payment_terms_days: z.number().int().min(1).max(365).optional(),
  kill_fee_percent: z.number().min(0).max(100).optional(),
})

// PUT /api/campaign-creators/[id]/contracts/[contractId] — brand only,
// draft-only. The template, deliverables, and fee aren't editable here —
// only the terms this contract itself controls.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, contractId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const body = await request.json()
    const parsed = UpdateContractSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedContract(supabase, id, contractId, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (authorized.actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can edit a contract' }, { status: 403 })
    }
    if (authorized.contract.status !== 'draft') {
      return NextResponse.json({ error: 'Only a draft contract can be edited' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('campaign_contracts')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      captureError(error, { route: 'PUT /api/campaign-creators/[id]/contracts/[contractId]' })
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Updated', contract: updated })
  } catch (error) {
    captureError(error, { route: 'PUT /api/campaign-creators/[id]/contracts/[contractId]' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
