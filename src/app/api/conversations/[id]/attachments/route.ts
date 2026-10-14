import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedConversation } from '@/lib/conversations'
import { rateLimit } from '@/lib/rate-limit'

const BUCKET = 'chat-attachments'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_TYPES: Record<string, 'image' | 'file' | 'video'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'application/pdf': 'file',
  'application/msword': 'file',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file',
  'application/vnd.ms-excel': 'file',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'file',
  'application/vnd.ms-powerpoint': 'file',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'file',
  'video/mp4': 'video',
  'application/zip': 'file',
  'application/x-zip-compressed': 'file',
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100)
}

// POST /api/conversations/[id]/attachments — upload a file to be attached to
// a message. Returns the storage path (not a usable URL — the bucket is
// private; the UI resolves a short-lived signed URL via
// GET /api/conversations/[id]/attachments/sign when it needs to render or
// download the file).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const callerUserId = request.headers.get('x-user-id')
    const callerProfileId = request.headers.get('x-profile-id')

    if (!callerUserId || !callerProfileId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { allowed, retryAfterMs } = await rateLimit(`chat-attachment-upload:${callerUserId}`, 20, 5 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const supabase = createServerSupabase()

    const conversation = await loadAuthorizedConversation(supabase, conversationId, callerProfileId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const attachmentType = ALLOWED_TYPES[file.type]
    if (!attachmentType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: images, PDF, Word, Excel, PowerPoint, MP4, ZIP.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be 10MB or smaller' }, { status: 400 })
    }

    const id = crypto.randomUUID()
    const path = `${conversationId}/${id}-${sanitizeFilename(file.name)}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      captureError(uploadError, { route: 'POST /api/conversations/[id]/attachments' })
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    return NextResponse.json({
      attachment: {
        id,
        type: attachmentType,
        path,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      },
    }, { status: 201 })

  } catch (error) {
    captureError(error, { route: 'POST /api/conversations/[id]/attachments' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
