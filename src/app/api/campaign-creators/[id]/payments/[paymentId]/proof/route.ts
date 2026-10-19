import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedPayment } from '@/lib/campaign-creator-auth'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string; paymentId: string }
}

const BUCKET = 'payment-proofs'
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'])

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100)
}

// POST .../payments/[paymentId]/proof — brand only. Same private-bucket
// pattern as deliverable draft attachments: upload now, resolve later via
// the signed-URL endpoint after a membership check. Uploading doesn't
// itself mark the payment paid — pass the returned path to
// .../mark-paid's proof_path.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, paymentId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { allowed, retryAfterMs } = await rateLimit(`payment-proof-upload:${callerUserId}`, 20, 5 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedPayment(supabase, id, paymentId, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (authorized.actorType !== 'brand') {
      return NextResponse.json({ error: 'Only the brand can upload proof of payment' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Allowed: images, PDF.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be 10MB or smaller' }, { status: 400 })
    }

    const path = `${paymentId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      captureError(uploadError, { route: 'POST .../payments/[paymentId]/proof' })
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    return NextResponse.json({ path, name: file.name, size: file.size, mimeType: file.type }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST .../payments/[paymentId]/proof' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
