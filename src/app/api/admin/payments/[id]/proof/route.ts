import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'

const BUCKET = 'payment-proofs'
const SIGNED_URL_TTL_SECONDS = 300

// GET /api/admin/payments/[id]/proof — admin viewing proof of payment.
// Logged (no reason needed for a read), same "every admin view of
// sensitive data is logged" requirement as the payment detail GET itself.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabase()
    const { data: payment } = await supabase.from('creator_payments').select('id, proof_path').eq('id', params.id).single()
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    if (!payment.proof_path) {
      return NextResponse.json({ error: 'No proof uploaded for this payment' }, { status: 404 })
    }

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(payment.proof_path, SIGNED_URL_TTL_SECONDS)
    if (error || !data) {
      captureError(error ?? new Error('createSignedUrl returned no data'), { route: 'GET /api/admin/payments/[id]/proof' })
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    void logActivity({
      userId: request.headers.get('x-user-id'),
      action: 'payment_proof_viewed',
      entityType: 'payment',
      entityId: params.id,
      details: {},
    })

    return NextResponse.json({ url: data.signedUrl, expires_in: SIGNED_URL_TTL_SECONDS })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/payments/[id]/proof' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
