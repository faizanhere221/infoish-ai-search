import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedPayment } from '@/lib/campaign-creator-auth'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const BUCKET = 'payment-proofs'
const SIGNED_URL_TTL_SECONDS = 300

interface RouteParams {
  params: { id: string; paymentId: string }
}

// GET .../payments/[paymentId]/proof/sign — either party on the row.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, paymentId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedPayment(supabase, id, paymentId, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const path = authorized.payment.proof_path
    if (!path) {
      return NextResponse.json({ error: 'No proof uploaded for this payment' }, { status: 404 })
    }

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
    if (error || !data) {
      captureError(error ?? new Error('createSignedUrl returned no data'), { route: 'GET .../payments/[paymentId]/proof/sign' })
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({ url: data.signedUrl, expires_in: SIGNED_URL_TTL_SECONDS })
  } catch (error) {
    captureError(error, { route: 'GET .../payments/[paymentId]/proof/sign' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
