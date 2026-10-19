import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export const dynamic = 'force-dynamic'

const BUCKET = 'payment-proofs'

// GET /api/uploads/payment-proofs/[filename]?dealId=<uuid>
//
// Serves a payment-proof file from the private Supabase Storage bucket
// instead of the old public/uploads/payment-proofs/ static path (which
// served these with no auth at all). Requires:
//  - a valid JWT (x-user-id / x-profile-id / x-user-role set by middleware)
//  - either the admin role, or the caller being the brand or creator on the
//    deal the proof belongs to (?dealId=...)
//
// NOTE: nothing in this codebase currently writes to this bucket or links a
// deal to a proof filename — there's no live upload flow today. This route
// establishes the correct access-control shape for whenever that flow is
// built; until then it will 403/404 for any real request.
export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  const userId = request.headers.get('x-user-id')
  const profileId = request.headers.get('x-profile-id')
  const role = request.headers.get('x-user-role')

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const isAdmin = role === 'admin' || role === 'super_admin'
  const dealId = request.nextUrl.searchParams.get('dealId')

  if (!isAdmin) {
    if (!dealId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createServerSupabase()
    const { data: deal } = await supabase
      .from('deals')
      .select('creator_id, brand_id')
      .eq('id', dealId)
      .single()

    const isParty = !!deal && (deal.creator_id === profileId || deal.brand_id === profileId)
    if (!isParty) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Reject path traversal — filename must be a bare name, no slashes.
  const filename = params.filename
  if (!filename || filename.includes('/') || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  const supabase = createServerSupabase()
  const { data, error } = await supabase.storage.from(BUCKET).download(filename)

  if (error || !data) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const arrayBuffer = await data.arrayBuffer()
  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      'Cache-Control': 'private, no-store',
    },
  })
}
