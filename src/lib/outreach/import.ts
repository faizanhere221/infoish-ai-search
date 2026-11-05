import { createServerSupabase } from '@/lib/db'
import { dncKeys, IMPORT_MAX_ROWS, leadKeys, previouslyLabel, type LeadType } from '@/lib/outreach/rules'
import { brandFieldsSchema, creatorFieldsSchema } from '@/lib/outreach/schemas'
import { matchKeys } from '@/lib/outreach/server'
import type { DuplicateMatch } from '@/lib/outreach/types'

type Supabase = ReturnType<typeof createServerSupabase>

export type ImportRowStatus = 'new' | 'duplicate' | 'dnc' | 'error'

export interface ClassifiedRow {
  row: number
  status: ImportRowStatus
  reasons: string[]
  match?: DuplicateMatch
  duplicateOfRow?: number
  lead?: Record<string, unknown>
}

// Validates and classifies mapped import rows the same way the preview and
// the commit do: invalid → error, existing lead or earlier row in the file →
// duplicate, DNC hit → dnc, else new. outreach_import() repeats the
// duplicate/DNC checks inside its transaction, so this is the readable
// report, not the only guard.
export async function classifyImportRows(
  supabase: Supabase,
  leadType: LeadType,
  rows: unknown[],
): Promise<ClassifiedRow[]> {
  if (rows.length > IMPORT_MAX_ROWS) {throw new Error('too many rows')}
  const schema = leadType === 'creator' ? creatorFieldsSchema : brandFieldsSchema

  const parsedRows = rows.map((raw, i) => {
    const rowNumber = typeof (raw as { _row?: unknown })?._row === 'number' ? (raw as { _row: number })._row : i + 2
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      const reasons = Object.entries(parsed.error.flatten().fieldErrors).map(([f, msgs]) => `${f}: ${(msgs ?? []).join(', ')}`)
      return { row: rowNumber, lead: null, reasons }
    }
    const lead = parsed.data as Record<string, unknown>
    if (leadKeys(leadType, lead).length === 0) {
      return { row: rowNumber, lead: null, reasons: [leadType === 'creator' ? 'Needs a profile URL or an email' : 'Needs a domain, website or email'] }
    }
    return { row: rowNumber, lead, reasons: [] as string[] }
  })

  const allKeys = parsedRows.flatMap((r) => (r.lead ? dncKeys(leadType, r.lead) : []))
  const matches = await matchKeys(supabase, allKeys)

  const seen = new Map<string, number>() // key → first row holding it in this file
  return parsedRows.map((r): ClassifiedRow => {
    if (!r.lead) {return { row: r.row, status: 'error', reasons: r.reasons }}
    const keys = leadKeys(leadType, r.lead)

    for (const k of keys) {
      const match = matches.duplicates.get(`${k.type}:${k.value}`)
      if (match) {
        return {
          row: r.row, status: 'duplicate', match,
          reasons: [previouslyLabel(match) ?? `Already exists: ${match.lead_id}${match.owner_name ? `, owned by ${match.owner_name}` : ''}${match.status ? `, status ${match.status}` : ''}`],
        }
      }
    }
    for (const k of keys) {
      const first = seen.get(`${k.type}:${k.value}`)
      if (first !== undefined) {
        return { row: r.row, status: 'duplicate', duplicateOfRow: first, reasons: [`Same ${k.type.replace('_', ' ')} as row ${first} in this file`] }
      }
    }
    const dncHit = dncKeys(leadType, r.lead).find((k) => matches.dnc.has(`${k.type}:${k.value}`))
    if (dncHit) {
      return { row: r.row, status: 'dnc', reasons: [`On the do-not-contact list (${dncHit.type.replace('_', ' ')}: ${dncHit.value})`] }
    }
    for (const k of keys) {seen.set(`${k.type}:${k.value}`, r.row)}
    return { row: r.row, status: 'new', reasons: [], lead: r.lead }
  })
}
