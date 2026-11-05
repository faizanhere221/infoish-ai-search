import { createServerSupabase } from '@/lib/db'
import { loadContacts, saveContact } from '@/lib/outreach/contacts'
import {
  dncKeys, leadKeys, LIST_LABELS, listsFor, previouslyLabel, splitName, STATUS_LABELS, validateLeadUpdates, type LeadKey, type LeadType,
} from '@/lib/outreach/rules'
import { NEEDS_MIGRATION, outreachFeatures } from '@/lib/outreach/schema'
import { findDncHits, findDuplicates, leadTable, loadTeam, type OutreachCaller, withDncFlags } from '@/lib/outreach/server'
import type { OutreachLead } from '@/lib/outreach/types'

type Supabase = ReturnType<typeof createServerSupabase>

export interface EditOutcome {
  status: number
  body: Record<string, unknown>
}

const KEY_FIELDS = ['email', 'profile_url', 'domain', 'website'] as const

function fieldError(status: number, field: string, message: string): EditOutcome {
  return { status, body: { error: message, fields: { [field]: [message] } } }
}

// Which form field a duplicate/DNC key belongs to.
function fieldForKey(key: LeadKey | { type: string }, values: Record<string, unknown>): string {
  if (key.type === 'email') {return 'email'}
  if (key.type === 'profile_url') {return 'profile_url'}
  return 'domain' in values ? 'domain' : 'website'
}

// Edits one lead (inline cell or edit panel). Every rule failure comes back
// as a 4xx with a message and the field it belongs to, never a 500:
//   400 invalid value / not editable, 403 owner change by a non-admin,
//   404 unknown lead, 409 key already used by another lead or on the DNC list.
// The write itself is outreach_edit_lead() (one transaction: lock, update
// only changed fields, log an 'edited' activity row with old → new).
const CONTACT_FIELD_MAP: Record<string, string> = { contact_name: 'first_name', role: 'title', email: 'email', linkedin: 'linkedin' }

export async function editLead(
  supabase: Supabase,
  caller: OutreachCaller,
  leadType: LeadType,
  leadId: string,
  body: unknown,
): Promise<EditOutcome> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { status: 400, body: { error: 'Send the fields to change' } }
  }
  const rest = { ...(body as Record<string, unknown>) }
  const hasList = 'list' in rest
  const contactKeys = leadType === 'brand' ? Object.keys(CONTACT_FIELD_MAP).filter((k) => k in rest) : []
  if (!hasList && contactKeys.length === 0) {return editLeadFields(supabase, caller, leadType, leadId, rest)}

  // list and brand contact fields need outreach_contacts_lists_migration.sql.
  const features = await outreachFeatures(supabase)

  if (hasList) {
    const list = rest.list
    delete rest.list
    if (!features.lists) {return { status: 409, body: NEEDS_MIGRATION }}
    if (!caller.isAdmin) {return fieldError(403, 'list', 'Only admins change the list')}
    if (typeof list !== 'string' || !listsFor(leadType).includes(list)) {
      return fieldError(400, 'list', `Pick one of: ${listsFor(leadType).map((l) => LIST_LABELS[l]).join(', ')}`)
    }
    const { error } = await supabase.rpc('outreach_set_list', { p_lead_type: leadType, p_lead_ids: [leadId], p_list: list, p_user_id: caller.userId })
    if (error) {
      if (error.message === 'outreach_deleted') {return { status: 409, body: { error: 'This lead was deleted. Restore it before you edit it.' } }}
      throw error
    }
  }

  // A brand's contact_name / role / email / linkedin are a copy of its
  // primary contact once contacts exist: edits go to that contact.
  if (contactKeys.length > 0 && features.contacts) {
    const fields: Record<string, unknown> = {}
    for (const k of contactKeys) {
      if (k === 'contact_name') {Object.assign(fields, splitName(rest[k]))}
      else {fields[CONTACT_FIELD_MAP[k]] = rest[k] ?? null}
      delete rest[k]
    }
    const contacts = await loadContacts(supabase, leadId, { softDelete: features.contactRemoval })
    const primary = contacts.find((c) => c.is_primary) ?? contacts[0]
    const empty = Object.values(fields).every((v) => v === null || v === '')
    if (primary || !empty) {
      const out = await saveContact(supabase, caller, leadId, primary?.id ?? null, fields, 'PATCH /api/admin/outreach/leads/[leadId]')
      if (out.status >= 400) {
        // Report errors on the brand field the user typed in.
        const back: Record<string, string> = { first_name: 'contact_name', last_name: 'contact_name', title: 'role', email: 'email', linkedin: 'linkedin' }
        const errs = (out.body.fields ?? {}) as Record<string, string[]>
        return { status: out.status, body: { ...out.body, fields: Object.fromEntries(Object.entries(errs).map(([k, v]) => [back[k] ?? k, v])) } }
      }
    }
  }

  if (Object.keys(rest).length > 0) {return editLeadFields(supabase, caller, leadType, leadId, rest)}
  const { data, error } = await supabase.from(leadTable(leadType)).select('*').eq('lead_id', leadId).maybeSingle()
  if (error) {throw error}
  if (!data) {return { status: 404, body: { error: 'Lead not found' } }}
  const [lead] = await withDncFlags(supabase, [data as OutreachLead])
  return { status: 200, body: { lead, changed: true } }
}

async function editLeadFields(
  supabase: Supabase,
  caller: OutreachCaller,
  leadType: LeadType,
  leadId: string,
  body: Record<string, unknown>,
): Promise<EditOutcome> {
  const { values, errors } = validateLeadUpdates(leadType, body)
  const errorFields = Object.keys(errors)
  if (errorFields.length > 0) {
    return {
      status: 400,
      body: { error: errors[errorFields[0]], fields: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, [v]])) },
    }
  }
  if (Object.keys(values).length === 0) {return { status: 400, body: { error: 'Nothing to update' } }}

  const { data: existing, error: loadError } = await supabase
    .from(leadTable(leadType)).select('*').eq('lead_id', leadId).maybeSingle()
  if (loadError) {throw loadError}
  if (!existing) {return { status: 404, body: { error: 'Lead not found' } }}
  const current = existing as OutreachLead & Record<string, unknown>
  if (current.deleted_at) {
    return { status: 409, body: { error: 'This lead was deleted. Restore it before you edit it.' } }
  }

  if ('owner_user_id' in values && values.owner_user_id !== current.owner_user_id) {
    if (!caller.isAdmin) {return fieldError(403, 'owner_user_id', 'Only admins change the owner')}
    if (values.owner_user_id) {
      const team = await loadTeam(supabase)
      if (!team.some((t) => t.user_id === values.owner_user_id)) {
        return fieldError(400, 'owner_user_id', 'Owner must be a team member')
      }
    }
  }

  // Keys this edit changes. Only those are checked, so an opted-out lead's
  // notes stay editable.
  const merged = { ...current, ...values }
  const changedKeyFields = KEY_FIELDS.filter((f) => f in values && values[f] !== current[f])
  if (changedKeyFields.length > 0) {
    const before = new Set(leadKeys(leadType, current).map((k) => `${k.type}:${k.value}`))
    const newKeys = leadKeys(leadType, merged).filter((k) => !before.has(`${k.type}:${k.value}`))

    const dupes = [...(await findDuplicates(supabase, newKeys)).values()].filter((d) => d.lead_id !== leadId)
    if (dupes.length > 0) {
      const d = dupes[0]
      const field = fieldForKey({ type: d.key_type }, values)
      const gone = previouslyLabel(d)
      if (gone) {
        const message = gone
        return { status: 409, body: { error: message, fields: { [field]: [message] }, duplicates: dupes } }
      }
      const owner = d.owner_name ? `, owned by ${d.owner_name}` : ', no owner'
      const status = d.status ? `, status ${STATUS_LABELS[d.status] ?? d.status}` : ''
      return {
        status: 409,
        body: { error: `Already used by ${d.lead_id}${owner}${status}`, fields: { [field]: [`Already used by ${d.lead_id}${owner}`] }, duplicates: dupes },
      }
    }

    const changedOnly = Object.fromEntries(changedKeyFields.map((f) => [f, merged[f]]))
    if ('website' in changedOnly && !('domain' in changedOnly) && leadType === 'brand' && current.domain) {
      delete changedOnly.website // the brand's domain key comes from `domain`, not the website
    }
    const dncCandidates = dncKeys(leadType, changedOnly)
    const dncHits = await findDncHits(supabase, dncCandidates)
    const hit = dncCandidates.find((k) => dncHits.has(`${k.type}:${k.value}`))
    if (hit) {
      const field = hit.type === 'domain' && 'email' in changedOnly && !('domain' in changedOnly) && !('website' in changedOnly) ? 'email' : fieldForKey(hit, values)
      return fieldError(409, field, `${hit.value} is on the do-not-contact list`)
    }
  }

  const { data, error } = await supabase.rpc('outreach_edit_lead', {
    p_lead_type: leadType,
    p_lead_id: leadId,
    p_user_id: caller.userId,
    p_updates: values,
  })
  if (error) {
    // Lost a race with another edit/import between the checks and the write.
    const firstKeyField = changedKeyFields[0] ?? 'email'
    if (error.message === 'outreach_dnc') {return fieldError(409, firstKeyField, 'On the do-not-contact list')}
    if (error.code === '23505' || error.message === 'outreach_duplicate') {
      const other = typeof error.details === 'string' ? error.details.split(':')[0] : ''
      return fieldError(409, firstKeyField, other && /^[CB]-\d+$/.test(other) ? `Already used by ${other}` : 'Already used by another lead')
    }
    if (error.code === '23503') {
      return fieldError(400, 'mailbox_id' in values ? 'mailbox_id' : 'owner_user_id', 'This mailbox or owner no longer exists')
    }
    if (error.message === 'outreach_not_found') {return { status: 404, body: { error: 'Lead not found' } }}
    if (error.message === 'outreach_deleted') {return { status: 409, body: { error: 'This lead was deleted. Restore it before you edit it.' } }}
    if (error.message === 'outreach_bad_field') {
      return fieldError(400, String(error.details ?? 'field'), 'This field is not editable')
    }
    throw error
  }

  const result = data as { changed: boolean; lead: OutreachLead; changes: Record<string, unknown> }
  const [lead] = await withDncFlags(supabase, [result.lead])
  return { status: 200, body: { lead, changed: result.changed, changes: result.changes } }
}
