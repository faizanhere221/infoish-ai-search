import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { retentionIsLive, runOutreachRetention } from '@/lib/outreach/retention'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/admin/outreach/retention (super admin): a dry run of the daily
// outreach retention job. Returns what it would clear and delete right now,
// changes nothing. `live` says whether the cron applies it
// (OUTREACH_RETENTION_LIVE=1) or only logs these counts.
export async function GET(request: NextRequest) {
  const denied = requireSuperAdmin(request)
  if (denied) {return denied}
  try {
    const supabase = createServerSupabase()
    const result = await runOutreachRetention(supabase, true)
    if (!result.ok) {
      if (result.reason === 'needs_migration') {
        return NextResponse.json(
          { error: 'Run supabase/outreach_retention_migration.sql in the Supabase SQL Editor first.', code: 'outreach_needs_migration' },
          { status: 409 },
        )
      }
      captureError(result.error, { route: 'GET /api/admin/outreach/retention' })
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    return NextResponse.json({ retention: result.counts, live: retentionIsLive() })
  } catch (error) {
    captureError(error, { route: 'GET /api/admin/outreach/retention' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
