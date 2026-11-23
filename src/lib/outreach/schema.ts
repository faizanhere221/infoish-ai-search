import { createServerSupabase } from '@/lib/db'

type Supabase = ReturnType<typeof createServerSupabase>

// Which outreach migrations ran. supabase/outreach_contacts_lists_migration.sql
// adds outreach_schema_version() = 2 (rolling mailbox window, brand
// contacts, lists, Apollo import). Before it runs, routes keep the old
// paths and new features answer 409 "run the migration", never 500.
// One cheap RPC per request; no in-memory cache (serverless).
export async function outreachSchemaVersion(supabase: Supabase): Promise<number> {
  const { data, error } = await supabase.rpc('outreach_schema_version')
  if (error) {return 1}
  return typeof data === 'number' ? data : Number(data) || 1
}

export interface OutreachFeatures {
  contacts: boolean
  lists: boolean
  mailboxWindow: boolean
  // outreach_contact_soft_delete_migration.sql (version 3): removing a
  // contact is a soft delete, restorable by admins
  contactRemoval: boolean
  // outreach_followups_migration.sql (version 4): mailbox webmail URL and
  // the subject / first line on "Mark contacted"
  followUps: boolean
  // outreach_assignment_migration.sql (version 5): assigned_at/by,
  // last_activity_at (stale), outreach_assign_leads(), owner stats, default
  // owner rules
  assignment: boolean
  // outreach_claim_migration.sql (version 6): members "Claim next N"
  claim: boolean
  // outreach_purge_migration.sql (version 8): super admins permanently
  // delete soft-deleted brands so they import again
  purge: boolean
}

export async function outreachFeatures(supabase: Supabase): Promise<OutreachFeatures> {
  const v = await outreachSchemaVersion(supabase)
  return {
    contacts: v >= 2, lists: v >= 2, mailboxWindow: v >= 2, contactRemoval: v >= 3, followUps: v >= 4, assignment: v >= 5, claim: v >= 6, purge: v >= 8,
  }
}

export const NEEDS_PURGE_MIGRATION = {
  error: 'Run supabase/outreach_purge_migration.sql in the Supabase SQL Editor first.',
  code: 'outreach_needs_migration',
}

export const NEEDS_CLAIM_MIGRATION = {
  error: 'Run supabase/outreach_claim_migration.sql in the Supabase SQL Editor first.',
  code: 'outreach_needs_migration',
}

export const NEEDS_ASSIGNMENT_MIGRATION = {
  error: 'Run supabase/outreach_assignment_migration.sql in the Supabase SQL Editor first.',
  code: 'outreach_needs_migration',
}

// PostgREST: function or column not there yet (the migration hasn't run).
export function isMissingSchema(error: { code?: string } | null | undefined): boolean {
  return !!error && ['PGRST202', 'PGRST204', 'PGRST205', '42883', '42703', '42P01'].includes(error.code ?? '')
}

export const NEEDS_FOLLOWUPS_MIGRATION = {
  error: 'Run supabase/outreach_followups_migration.sql in the Supabase SQL Editor first.',
  code: 'outreach_needs_migration',
}

export const NEEDS_MIGRATION = {
  error: 'Run supabase/outreach_contacts_lists_migration.sql in the Supabase SQL Editor first.',
  code: 'outreach_needs_migration',
}
