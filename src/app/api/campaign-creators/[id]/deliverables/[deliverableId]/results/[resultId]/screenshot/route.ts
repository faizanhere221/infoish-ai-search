import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
import { rateLimit } from '@/lib/rate-limit'

interface RouteParams {
  params: { id: string; deliverableId: string; resultId: string }
}

const BUCKET = 'deliverables'
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100)
}

// POST .../results/[resultId]/screenshot — either party on the row. Same
// private-bucket/size/type pattern as the deliverable draft attachment.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId, resultId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { allowed, retryAfterMs } = await rateLimit(`results-screenshot-upload:${callerUserId}`, 20, 5 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedDeliverable(supabase, id, deliverableId, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: result } = await supabase
      .from('deliverable_results')
      .select('id, entered_by')
      .eq('id', resultId)
      .eq('deliverable_id', deliverableId)
      .single()

    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (authorized.actorType !== 'brand' && result.entered_by !== authorized.actorType) {
      return NextResponse.json({ error: 'You can only attach a screenshot to results you entered' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Allowed: JPEG, PNG, GIF, WebP.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be 10MB or smaller' }, { status: 400 })
    }

    const path = `results/${resultId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      captureError(uploadError, { route: 'POST .../results/[resultId]/screenshot' })
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from('deliverable_results')
      .update({ screenshot_path: path, updated_at: new Date().toISOString() })
      .eq('id', resultId)

    if (updateError) {
      captureError(updateError, { route: 'POST .../results/[resultId]/screenshot' })
      return NextResponse.json({ error: 'Failed to save file reference' }, { status: 500 })
    }

    return NextResponse.json({ path }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST .../results/[resultId]/screenshot' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET .../results/[resultId]/screenshot — either party, signed URL.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId, resultId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedDeliverable(supabase, id, deliverableId, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: result } = await supabase
      .from('deliverable_results')
      .select('screenshot_path')
      .eq('id', resultId)
      .eq('deliverable_id', deliverableId)
      .single()

    if (!result?.screenshot_path) {
      return NextResponse.json({ error: 'No screenshot on this result' }, { status: 404 })
    }

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(result.screenshot_path, 300)
    if (error || !data) {
      captureError(error ?? new Error('createSignedUrl returned no data'), { route: 'GET .../results/[resultId]/screenshot' })
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({ url: data.signedUrl, expires_in: 300 })
  } catch (error) {
    captureError(error, { route: 'GET .../results/[resultId]/screenshot' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
