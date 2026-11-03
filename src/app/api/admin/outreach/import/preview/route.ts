import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { classifyImportRows } from '@/lib/outreach/import'
import { IMPORT_MAX_ROWS } from '@/lib/outreach/rules'
import { getOutreachCaller, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const schema = z.object({
  lead_type: z.enum(['creator', 'brand']),
  rows: z.array(z.record(z.unknown())).min(1).max(IMPORT_MAX_ROWS),
})

// POST /api/admin/outreach/import/preview: { lead_type, rows } where rows
// are already mapped in the browser. Returns one classification per row
// (new / duplicate / dnc / error) and the counts. Writes nothing.
export async function POST(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: `Send 1 to ${IMPORT_MAX_ROWS.toLocaleString()} rows`, fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const supabase = createServerSupabase()
    const rows = await classifyImportRows(supabase, parsed.data.lead_type, parsed.data.rows)
    const counts = { new: 0, duplicate: 0, dnc: 0, error: 0 }
    for (const r of rows) {counts[r.status] += 1}

    return NextResponse.json({ rows: rows.map(({ lead: _lead, ...r }) => r), counts })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/import/preview' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
