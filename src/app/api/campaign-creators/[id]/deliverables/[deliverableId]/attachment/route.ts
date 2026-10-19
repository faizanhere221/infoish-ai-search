import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string; deliverableId: string }
}

const BUCKET = 'deliverables'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB — same cap as chat-attachments

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4',
  'application/zip',
  'application/x-zip-compressed',
])

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100)
}

// POST .../attachment — creator only (it's their draft file). Same
// approach as chat-attachments: private bucket, size/type limits, rate
// limited, returns a storage path (not a usable URL — resolved via the
// sign endpoint after a membership check).
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserId = request.headers.get('x-user-id')
    const callerUserType = request.headers.get('x-user-type')

    if (!callerUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { allowed, retryAfterMs } = await rateLimit(`deliverable-attachment-upload:${callerUserId}`, 20, 5 * 60 * 1000)
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
    if (authorized.actorType !== 'creator') {
      return NextResponse.json({ error: 'Only the creator can upload a draft file' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: images, PDF, Word, Excel, PowerPoint, MP4, ZIP.' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be 10MB or smaller' }, { status: 400 })
    }

    const path = `${deliverableId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      captureError(uploadError, { route: 'POST .../deliverables/[deliverableId]/attachment' })
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from('creator_deliverables')
      .update({ draft_attachment_path: path, updated_at: new Date().toISOString() })
      .eq('id', deliverableId)

    if (updateError) {
      captureError(updateError, { route: 'POST .../deliverables/[deliverableId]/attachment' })
      return NextResponse.json({ error: 'Failed to save file reference' }, { status: 500 })
    }

    return NextResponse.json({ path, name: file.name, size: file.size, mimeType: file.type }, { status: 201 })
  } catch (error) {
    captureError(error, { route: 'POST .../deliverables/[deliverableId]/attachment' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
