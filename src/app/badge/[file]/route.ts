import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { isCreatorPublic } from '@/lib/creators/visibility'
import { renderBadgeSvg } from '@/lib/creators/badge'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Usernames are lowercase letters, numbers, dots, dashes, and underscores.
const FILE_PATTERN = /^([a-z0-9._-]{1,64})\.svg$/i

// The CDN caches the badge for an hour and serves a stale copy for up to a
// day while it refreshes, so embeds on busy pages never hit the database
// per view. A creator hidden or deleted drops off within the hour.
const CACHE_OK = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
const CACHE_NOT_FOUND = 'public, max-age=300, s-maxage=300'

function notFound(): NextResponse {
  return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': CACHE_NOT_FOUND } })
}

// GET /badge/[username].svg — public "Find me on Infoishai" badge, only for
// creators whose profile is public (isCreatorPublic). ?theme=dark for the
// dark variant.
export async function GET(request: NextRequest, { params }: { params: { file: string } }) {
  const match = FILE_PATTERN.exec(params.file)
  if (!match) {return notFound()}
  const username = match[1].toLowerCase()

  try {
    const supabase = createServerSupabase()
    const { data: creator } = await supabase
      .from('creators')
      .select('user_id, hidden_from_marketplace')
      .eq('username', username)
      .maybeSingle()
    if (!creator) {return notFound()}

    const { data: owner } = await supabase
      .from('users')
      .select('deleted_at, is_active')
      .eq('id', creator.user_id)
      .maybeSingle()
    if (!isCreatorPublic(owner, creator)) {return notFound()}

    const theme = request.nextUrl.searchParams.get('theme') === 'dark' ? 'dark' : 'light'
    return new NextResponse(renderBadgeSvg(theme), {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': CACHE_OK,
        'X-Content-Type-Options': 'nosniff',
        // Opened directly, the SVG must never run script or load anything.
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      },
    })
  } catch (error) {
    captureError(error, { route: 'GET /badge/[file]' })
    return new NextResponse('Internal server error', { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
