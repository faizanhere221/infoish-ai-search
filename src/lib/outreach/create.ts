import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { leadKeys, previouslyLabel, validateLeadUpdates, type LeadType } from '@/lib/outreach/rules'
import { findDuplicates, leadTable, loadTeam, mapDbError, type OutreachCaller } from '@/lib/outreach/server'
import type { OutreachLead } from '@/lib/outreach/types'

type Supabase = ReturnType<typeof createServerSupabase>

export type CreateOutcome =
  | { ok: true; lead: OutreachLead }
  | { ok: false; status: number; body: Record<string, unknown> }

// Adds one lead by hand. Used by POST /leads/[type] and by the Database's
// "add directly", so both follow the same rules: per-field validation (as
// edits), a key to catch duplicates, members own what they add, and a 409
// with `duplicates` when the email/URL/domain is taken ("Previously
// deleted: C-0123" when the holder was deleted).
export async function createLead(
  supabase: Supabase,
  caller: OutreachCaller,
  leadType: LeadType,
  body: unknown,
  route: string,
): Promise<CreateOutcome> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, status: 400, body: { error: 'Send the lead fields' } }
  }
  const { values, errors } = validateLeadUpdates(leadType, body as Record<string, unknown>)
  const errorFields = Object.keys(errors)
  if (errorFields.length > 0) {
    return {
      ok: false,
      status: 400,
      body: { error: errors[errorFields[0]], fields: Object.fromEntries(errorFields.map((f) => [f, [errors[f]]])) },
    }
  }
  const fields = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null)) as Record<string, unknown>
  // Members add leads for themselves; only admins pick another owner.
  if (!caller.isAdmin) {fields.owner_user_id = caller.userId}

  const keys = leadKeys(leadType, fields)
  if (keys.length === 0) {
    const need = leadType === 'creator' ? 'a profile URL or email' : 'a domain, website or email'
    return { ok: false, status: 400, body: { error: `Add ${need} so duplicates are caught.` } }
  }

  const team = await loadTeam(supabase)
  if (fields.owner_user_id && !team.some((t) => t.user_id === fields.owner_user_id)) {
    return { ok: false, status: 400, body: { error: 'Owner must be a team member' } }
  }

  const duplicates = await findDuplicates(supabase, keys)
  if (duplicates.size > 0) {
    const list = [...duplicates.values()]
    const gone = list.map(previouslyLabel).find(Boolean)
    return {
      ok: false,
      status: 409,
      body: { error: gone ?? 'Already exists', duplicates: list },
    }
  }

  const { data, error } = await supabase
    .from(leadTable(leadType))
    .insert({ ...fields, owner_user_id: fields.owner_user_id ?? caller.userId, source: fields.source ?? 'manual' })
    .select('*')
    .single()

  if (error) {
    const mapped = mapDbError(error)
    if (mapped) {
      const dupes = mapped.code === 'outreach_duplicate' ? [...(await findDuplicates(supabase, keys)).values()] : undefined
      return { ok: false, status: mapped.status, body: { error: mapped.message, duplicates: dupes } }
    }
    captureError(error, { route })
    return { ok: false, status: 500, body: { error: 'Failed to add lead' } }
  }
  return { ok: true, lead: data as OutreachLead }
}
