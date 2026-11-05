import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'
import { cleanApolloRow, IMPORT_MAX_ROWS } from '@/lib/outreach/rules'
import { isMissingSchema, NEEDS_MIGRATION, outreachFeatures } from '@/lib/outreach/schema'
import { getOutreachCaller, loadTeam, mapDbError, unauthorized } from '@/lib/outreach/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const schema = z.object({
  source: z.string().trim().min(1).max(255),
  rows: z.array(z.record(z.unknown())).min(1).max(IMPORT_MAX_ROWS),
  owner_user_id: z.string().max(255).nullable().optional(), // owner of brands this file creates
  commit: z.boolean(),
})

interface ImportReport {
  existing: { lead_id: string; company: string | null; contacts: number }[]
  created: { lead_id: string; company: string | null; contacts: number }[]
  duplicates: { row: number; email: string | null; lead_id?: string | null; same_as_row?: number }[]
  dnc: { row: number; key: string }[]
  errors: { row: number; reason: string }[]
}

// POST /api/admin/outreach/import/apollo: Apollo contacts export, mapped
// in the browser. commit: false = preview (writes nothing), true = import.
// outreach_import_contacts() matches each row to a brand (domain, then
// website, then exact company name), adds the person as a contact, fills
// only empty brand fields, and creates missing brands with list 'apollo'.
// Same report both ways: contacts per existing brand, new brands,
// duplicate contacts, DNC hits, errors. Commit is one transaction.
export async function POST(request: NextRequest) {
  const caller = getOutreachCaller(request)
  if (!caller) {return unauthorized()}

  try {
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: `Send 1 to ${IMPORT_MAX_ROWS.toLocaleString()} rows`, fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { source, rows, owner_user_id, commit } = parsed.data
    const supabase = createServerSupabase()
    if (!(await outreachFeatures(supabase)).contacts) {return NextResponse.json(NEEDS_MIGRATION, { status: 409 })}

    let owner = owner_user_id || null
    if (owner && !(await loadTeam(supabase)).some((t) => t.user_id === owner)) {
      return NextResponse.json({ error: 'Owner must be a team member' }, { status: 400 })
    }
    if (!caller.isAdmin) {owner = owner ?? caller.userId}

    // Re-check every row on the server; invalid rows are reported, not sent.
    const errors: ImportReport['errors'] = []
    const valid: Record<string, unknown>[] = []
    rows.forEach((raw, i) => {
      const { row, errors: rowErrors } = cleanApolloRow({ ...raw, _row: typeof raw._row === 'number' ? raw._row : i + 2 })
      if (rowErrors.length > 0) {errors.push({ row: row._row, reason: rowErrors.join('; ') })}
      else {valid.push({ ...row, owner_user_id: owner })}
    })

    let report: ImportReport = { existing: [], created: [], duplicates: [], dnc: [], errors: [] }
    if (valid.length > 0) {
      const { data, error } = await supabase.rpc('outreach_import_contacts', {
        p_rows: valid, p_source: source, p_user_id: caller.userId, p_commit: commit,
      })
      if (error) {
        if (isMissingSchema(error)) {return NextResponse.json(NEEDS_MIGRATION, { status: 409 })}
        const mapped = mapDbError(error)
        if (mapped && mapped.code !== 'outreach_duplicate') {
          return NextResponse.json({ error: `${mapped.message}${commit ? ' Nothing was imported.' : ''}` }, { status: mapped.status })
        }
        captureError(error, { route: 'POST /api/admin/outreach/import/apollo', rows: valid.length, commit })
        return NextResponse.json({ error: commit ? 'Import failed and was rolled back. Nothing was imported.' : 'Preview failed' }, { status: 500 })
      }
      report = data as ImportReport
    }
    report.errors = [...errors, ...(report.errors ?? [])].sort((a, b) => a.row - b.row)

    const added = [...report.existing, ...report.created].reduce((n, b) => n + Number(b.contacts), 0)
    const counts = {
      contacts_added: added,
      existing_brands: report.existing.length,
      new_brands: report.created.length,
      duplicates: report.duplicates.length,
      dnc: report.dnc.length,
      errors: report.errors.length,
    }
    if (commit) {
      void logActivity({ userId: caller.userId, action: 'outreach_import', entityType: 'outreach_brand_contacts', details: { source, rows: rows.length, ...counts } })
    }
    return NextResponse.json({
      message: commit ? `${added} contacts imported, ${report.created.length} new brands` : 'Preview ready',
      report,
      counts,
    })
  } catch (err) {
    captureError(err, { route: 'POST /api/admin/outreach/import/apollo' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
