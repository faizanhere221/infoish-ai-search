import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { contactName, emailDomain, validateContactFields } from '@/lib/outreach/rules'
import { mapDbError, matchKeys, type OutreachCaller } from '@/lib/outreach/server'
import { NEEDS_MIGRATION, outreachFeatures } from '@/lib/outreach/schema'
import type { BrandContact, ContactSummary } from '@/lib/outreach/types'

type Supabase = ReturnType<typeof createServerSupabase>

export interface ContactOutcome {
  status: number
  body: Record<string, unknown>
}

// Brand contacts (outreach_contacts_lists_migration.sql). Several people
// per brand; the primary one is copied onto the brand's old contact
// columns by the database. Status and dates move through actions.

export async function loadContacts(supabase: Supabase, leadId: string): Promise<BrandContact[]> {
  const { data, error } = await supabase
    .from('outreach_brand_contacts')
    .select('*')
    .eq('lead_id', leadId)
    .order('is_primary', { ascending: false })
    .order('created_at')
    .order('id')
  if (error) {throw error}
  return (data ?? []) as BrandContact[]
}

// Adds `contacts: {count, primary}` to brand rows of a page.
export async function withContactSummaries<T extends { lead_id: string }>(supabase: Supabase, leads: T[]): Promise<(T & { contacts: ContactSummary })[]> {
  if (leads.length === 0) {return []}
  const { data, error } = await supabase
    .from('outreach_brand_contacts')
    .select('id, lead_id, first_name, last_name, title, email, status, is_primary, created_at')
    .in('lead_id', leads.map((l) => l.lead_id))
    .order('is_primary', { ascending: false })
    .order('created_at')
  if (error) {throw error}
  const byLead = new Map<string, typeof data>()
  for (const c of data ?? []) {
    const list = byLead.get(c.lead_id as string) ?? []
    list.push(c)
    byLead.set(c.lead_id as string, list)
  }
  return leads.map((l) => {
    const list = byLead.get(l.lead_id) ?? []
    const p = list[0]
    return {
      ...l,
      contacts: {
        count: list.length,
        primary: p ? { id: p.id as string, name: contactName(p), title: (p.title as string) ?? null, email: (p.email as string) ?? null, status: p.status as string } : null,
      },
    }
  })
}

function fail(status: number, field: string | null, message: string): ContactOutcome {
  return { status, body: { error: message, ...(field ? { fields: { [field]: [message] } } : {}) } }
}

// Add (contactId null) or edit one contact. The same rules as lead keys:
// an email another lead or contact holds → 409 naming it; on the DNC list → 409.
export async function saveContact(
  supabase: Supabase,
  caller: OutreachCaller,
  leadId: string,
  contactId: string | null,
  body: unknown,
  route: string,
): Promise<ContactOutcome> {
  if (!(await outreachFeatures(supabase)).contacts) {return { status: 409, body: NEEDS_MIGRATION }}
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
    return { status: 400, body: { error: 'Send the contact fields' } }
  }
  const { values, errors } = validateContactFields(body as Record<string, unknown>, contactId !== null)
  const errorFields = Object.keys(errors)
  if (errorFields.length > 0) {
    return { status: 400, body: { error: errors[errorFields[0]], fields: Object.fromEntries(errorFields.map((f) => [f, [errors[f]]])) } }
  }

  const email = typeof values.email === 'string' ? values.email : null
  if (email) {
    const domain = emailDomain(email)
    const hits = await matchKeys(supabase, [{ type: 'email', value: email }, ...(domain ? [{ type: 'domain', value: domain }] : [])])
    const dup = hits.duplicates.get(`email:${email}`)
    if (dup && !(dup.lead_type === 'brand' && dup.lead_id === leadId)) {
      return fail(409, 'email', dup.deleted ? `Previously deleted: ${dup.lead_id}` : `Already used by ${dup.lead_id}${dup.owner_name ? `, owned by ${dup.owner_name}` : ''}`)
    }
    if (hits.dnc.size > 0) {return fail(409, 'email', 'This email is on the do-not-contact list.')}
  }

  const { data, error } = await supabase.rpc('outreach_contact_save', {
    p_lead_id: leadId, p_contact_id: contactId, p_user_id: caller.userId, p_fields: values,
  })
  if (error) {
    const mapped = mapDbError(error)
    if (mapped) {
      const message = mapped.code === 'outreach_duplicate'
        ? `Already used by ${String(mapped.detail ?? '').split(':')[0] || 'another contact'}`
        : mapped.message
      return fail(mapped.status, mapped.code === 'outreach_duplicate' || mapped.code === 'outreach_dnc' ? 'email' : null, message)
    }
    captureError(error, { route })
    return { status: 500, body: { error: 'Failed to save the contact' } }
  }
  return { status: contactId ? 200 : 201, body: { message: contactId ? 'Contact saved' : 'Contact added', contact: data } }
}

export async function deleteContact(supabase: Supabase, caller: OutreachCaller, leadId: string, contactId: string, route: string): Promise<ContactOutcome> {
  if (!(await outreachFeatures(supabase)).contacts) {return { status: 409, body: NEEDS_MIGRATION }}
  const { error } = await supabase.rpc('outreach_contact_delete', { p_lead_id: leadId, p_contact_id: contactId, p_user_id: caller.userId })
  if (error) {
    const mapped = mapDbError(error)
    if (mapped) {return { status: mapped.status, body: { error: mapped.message } }}
    captureError(error, { route })
    return { status: 500, body: { error: 'Failed to remove the contact' } }
  }
  return { status: 200, body: { message: 'Contact removed' } }
}
