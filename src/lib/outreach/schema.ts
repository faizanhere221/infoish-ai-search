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
}

export async function outreachFeatures(supabase: Supabase): Promise<OutreachFeatures> {
  const v2 = (await outreachSchemaVersion(supabase)) >= 2
  return { contacts: v2, lists: v2, mailboxWindow: v2 }
}

// PostgREST: function or column not there yet (the migration hasn't run).
export function isMissingSchema(error: { code?: string } | null | undefined): boolean {
  return !!error && ['PGRST202', 'PGRST204', 'PGRST205', '42883', '42703', '42P01'].includes(error.code ?? '')
}

export const NEEDS_MIGRATION = {
  error: 'Run supabase/outreach_contacts_lists_migration.sql in the Supabase SQL Editor first.',
  code: 'outreach_needs_migration',
}
