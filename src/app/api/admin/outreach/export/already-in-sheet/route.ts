import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { getOutreachCaller, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET: already_in_sheet.txt, every normalised email, profile URL and domain
// from both lead tables and the DNC list, one per line, sorted. Feed it to
// the lead-finding scripts so they skip what's already here.
export async function GET(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase.rpc('outreach_all_keys')
    if (error) {
      captureError(error, { route: 'GET /api/admin/outreach/export/already-in-sheet' })
      return NextResponse.json({ error: 'Failed to build the file' }, { status: 500 })
    }
    const text = typeof data === 'string' ? data : ''
    return new NextResponse(text ? `${text}\n` : '', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="already_in_sheet.txt"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/outreach/export/already-in-sheet' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
