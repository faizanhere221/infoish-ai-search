import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'
import { classifyImportRows } from '@/lib/outreach/import'
import { IMPORT_MAX_ROWS } from '@/lib/outreach/rules'
import { getOutreachCaller, loadTeam, mapDbError, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const schema = z.object({
  lead_type: z.enum(['creator', 'brand']),
  source: z.string().trim().min(1).max(255),
  rows: z.array(z.record(z.unknown())).min(1).max(IMPORT_MAX_ROWS),
})

interface SkippedRow {
  row: number | null
  reason: string
  lead_id?: string | null
}

// POST /api/admin/outreach/import/commit: { lead_type, source, rows }.
// Re-classifies on the server, then sends every "new" row to
// outreach_import() in one transaction. Duplicates, DNC hits and invalid
// rows are skipped and listed in `skipped`; only an unexpected database
// error rolls the whole import back.
export async function POST(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid import', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { lead_type, source, rows } = parsed.data

    const supabase = createServerSupabase()
    const team = await loadTeam(supabase)
    const teamIds = new Set(team.map((t) => t.user_id))

    const classified = await classifyImportRows(supabase, lead_type, rows)
    const skipped: SkippedRow[] = []
    const toInsert: Record<string, unknown>[] = []

    for (const c of classified) {
      if (c.status !== 'new' || !c.lead) {
        skipped.push({ row: c.row, reason: c.reasons.join('; ') || c.status, lead_id: c.match?.lead_id ?? null })
        continue
      }
      const owner = c.lead.owner_user_id
      if (owner && !teamIds.has(String(owner))) {
        skipped.push({ row: c.row, reason: 'Owner is not a team member' })
        continue
      }
      toInsert.push({ ...c.lead, _row: c.row })
    }

    let inserted = 0
    if (toInsert.length > 0) {
      const { data, error } = await supabase.rpc('outreach_import', {
        p_lead_type: lead_type,
        p_rows: toInsert,
        p_source: source,
      })
      if (error) {
        const mapped = mapDbError(error)
        if (mapped && mapped.code !== 'outreach_duplicate') {
          return NextResponse.json({ error: `${mapped.message} Nothing was imported.` }, { status: mapped.status })
        }
        captureError(error, { route: 'POST /api/admin/outreach/import/commit', rows: toInsert.length })
        return NextResponse.json({ error: 'Import failed and was rolled back. Nothing was imported.' }, { status: 500 })
      }
      const result = data as { inserted: number; skipped: { row: number | null; reason: string; lead_id?: string | null; key?: string }[] }
      inserted = result.inserted
      for (const s of result.skipped ?? []) {
        skipped.push({
          row: s.row,
          reason: s.reason === 'dnc' ? 'Added to the do-not-contact list during import' : 'Added by someone else during import',
          lead_id: s.lead_id ?? null,
        })
      }
    }

    void logActivity({
      userId: caller.userId,
      action: 'outreach_import',
      entityType: `outreach_${lead_type}`,
      details: { source, rows: rows.length, inserted, skipped: skipped.length },
    })

    skipped.sort((a, b) => (a.row ?? 0) - (b.row ?? 0))
    return NextResponse.json({ message: `${inserted} leads imported`, inserted, skipped })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/import/commit' })
    return NextResponse.json({ error: 'Import failed. Nothing was imported.' }, { status: 500 })
  }
}
