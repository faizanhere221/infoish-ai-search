import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { loadAuthorizedDeliverable } from '@/lib/campaign-creator-auth'

const BUCKET = 'deliverables'
const SIGNED_URL_TTL_SECONDS = 300 // 5 minutes

// GET .../attachment/sign — either party on the row. Returns a short-lived
// signed URL for the deliverable's draft attachment.
export async function GET(request: NextRequest, { params }: { params: { id: string; deliverableId: string } }) {
  try {
    const { id, deliverableId } = params
    const callerProfileId = request.headers.get('x-profile-id')
    const callerUserType = request.headers.get('x-user-type')

    const supabase = createServerSupabase()
    const authorized = await loadAuthorizedDeliverable(supabase, id, deliverableId, callerProfileId, callerUserType)
    if (!authorized) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const path = authorized.deliverable.draft_attachment_path
    if (!path) {
      return NextResponse.json({ error: 'No attachment on this deliverable' }, { status: 404 })
    }

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

    if (error || !data) {
      captureError(error ?? new Error('createSignedUrl returned no data'), {
        route: 'GET .../deliverables/[deliverableId]/attachment/sign',
      })
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({ url: data.signedUrl, expires_in: SIGNED_URL_TTL_SECONDS })
  } catch (error) {
    captureError(error, { route: 'GET .../deliverables/[deliverableId]/attachment/sign' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
