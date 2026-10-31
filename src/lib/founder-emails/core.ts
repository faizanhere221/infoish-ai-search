import type { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logActivity } from '@/lib/activity'
import { PREFERENCE_CATEGORIES, sendEmail } from '@/lib/email/send'
import { signUnsubscribeToken } from '@/lib/email/unsubscribeToken'
import { renderLayout, paragraph, escapeHtml } from '@/lib/email/templates/layout'

// Shared plumbing for the founder emails: one personal email per account,
// ever, sent in the founder's name with replies going to FOUNDER_REPLY_TO.
// The founder_emails table (supabase/founder_emails_migration.sql) is both
// the queue and the once-ever guard: a row is never deleted, and sending
// first claims the row with a conditional UPDATE so two concurrent saves
// never both send.

export type Supabase = ReturnType<typeof createServerSupabase>

export type FounderEmailKind = 'creator_welcome' | 'brand_welcome'
export const FOUNDER_EMAIL_KINDS: FounderEmailKind[] = ['creator_welcome', 'brand_welcome']

export type FounderEmailStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped'

export interface FounderEmailRow {
  user_id: string
  kind: FounderEmailKind
  status: FounderEmailStatus
  source: 'trigger' | 'backfill'
  attempts: number
  last_error: string | null
  queued_at: string
  claimed_at: string | null
  sent_at: string | null
  admin_notified_at: string | null
}

export const MAX_ATTEMPTS = 3

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'

export interface FounderSender {
  name: string | null
  from: string | undefined
  replyTo: string | null
}

// "Name <address>" using EMAIL_FROM's address, so the founder emails go out
// from the verified sending domain under the founder's name.
export function getFounderSender(): FounderSender {
  const name = process.env.FOUNDER_NAME?.trim() || null
  const replyTo = process.env.FOUNDER_REPLY_TO?.trim() || null
  const configured = process.env.EMAIL_FROM || 'Infoishai <notifications@infoishai.com>'
  const address = configured.match(/<([^>]+)>/)?.[1] ?? configured
  return { name, from: name ? `${name} <${address}>` : undefined, replyTo }
}

// The table may not exist yet if the migration hasn't been run. Callers
// treat that as "feature off" instead of reporting every save to Sentry.
export function isMissingTable(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return code === '42P01' || code === 'PGRST205' || code === '42703'
}

export interface FounderAccount {
  userId: string
  email: string | null
  userType: string
  deletedAt: string | null
  isActive: boolean
  hidden: boolean
  contactedAt: string | null
  preferences: Record<string, boolean>
}

export async function loadFounderAccount(supabase: Supabase, userId: string): Promise<FounderAccount | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, user_type, deleted_at, is_active, email_preferences, founder_contacted_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) {throw error}
  if (!user) {return null}

  let hidden = false
  if (user.user_type === 'creator') {
    const { data: creator } = await supabase.from('creators').select('hidden_from_marketplace').eq('user_id', userId).maybeSingle()
    hidden = !!creator?.hidden_from_marketplace
  }

  return {
    userId: user.id,
    email: user.email,
    userType: user.user_type,
    deletedAt: user.deleted_at,
    isActive: user.is_active,
    hidden,
    contactedAt: user.founder_contacted_at,
    preferences: (user.email_preferences ?? {}) as Record<string, boolean>,
  }
}

// Off when founder_notes is off, or when every other category is off: a
// person who clicked "unsubscribe from all" before founder_notes existed
// has every older category set to false and founder_notes unset.
export function isOptedOutOfFounderNotes(preferences: Record<string, boolean>): boolean {
  if (preferences.founder_notes === false) {return true}
  return PREFERENCE_CATEGORIES.filter((c) => c !== 'founder_notes').every((c) => preferences[c] === false)
}

// Deleted, suspended, or admin-hidden accounts never get a founder email or
// trigger a notice to the founder.
export function isAccountVisible(a: { deletedAt: string | null; isActive: boolean; hidden: boolean }): boolean {
  return a.deletedAt === null && a.isActive && !a.hidden
}

export function founderSkipReason(account: FounderAccount): string | null {
  if (account.deletedAt) {return 'Account deleted'}
  if (!account.isActive) {return 'Account suspended'}
  if (account.hidden) {return 'Hidden from marketplace'}
  if (account.contactedAt) {return 'Marked as contacted'}
  if (!account.email) {return 'No email address'}
  if (isOptedOutOfFounderNotes(account.preferences)) {return 'Opted out of founder emails'}
  return null
}

export function founderUnsubscribeUrl(userId: string): string {
  return `${APP_URL}/api/email/unsubscribe?token=${signUnsubscribeToken(userId, 'founder_notes')}`
}

export async function getFounderRow(supabase: Supabase, userId: string, kind: FounderEmailKind): Promise<FounderEmailRow | null> {
  const { data, error } = await supabase.from('founder_emails').select('*').eq('user_id', userId).eq('kind', kind).maybeSingle()
  if (error) {throw error}
  return (data as FounderEmailRow | null) ?? null
}

// Creates the row if it doesn't exist. Returns true only when this call
// created it, so "first time this account qualified" is a single answer
// even under concurrent saves.
export async function enqueueFounderEmail(
  supabase: Supabase,
  userId: string,
  kind: FounderEmailKind,
  source: 'trigger' | 'backfill'
): Promise<boolean> {
  const { data, error } = await supabase
    .from('founder_emails')
    .upsert({ user_id: userId, kind, source, status: 'pending' }, { onConflict: 'user_id,kind', ignoreDuplicates: true })
    .select('user_id')
  if (error) {throw error}
  return (data ?? []).length > 0
}

// Batch version for the admin backfill. Returns how many rows were new.
export async function enqueueFounderEmails(
  supabase: Supabase,
  userIds: string[],
  kind: FounderEmailKind,
  source: 'trigger' | 'backfill'
): Promise<number> {
  let created = 0
  for (let i = 0; i < userIds.length; i += 200) {
    const { data, error } = await supabase
      .from('founder_emails')
      .upsert(
        userIds.slice(i, i + 200).map((userId) => ({ user_id: userId, kind, source, status: 'pending' })),
        { onConflict: 'user_id,kind', ignoreDuplicates: true }
      )
      .select('user_id')
    if (error) {throw error}
    created += (data ?? []).length
  }
  return created
}

export async function updateFounderRow(
  supabase: Supabase,
  userId: string,
  kind: FounderEmailKind,
  patch: Partial<Omit<FounderEmailRow, 'user_id' | 'kind'>>
): Promise<void> {
  const { error } = await supabase.from('founder_emails').update(patch).eq('user_id', userId).eq('kind', kind)
  if (error) {captureError(error, { context: 'updateFounderRow', userId, kind })}
}

// Takes the row from 'pending' to 'sending'. Postgres runs the conditional
// UPDATE atomically, so of two concurrent callers only one gets the row back.
export async function claimFounderRow(supabase: Supabase, userId: string, kind: FounderEmailKind): Promise<boolean> {
  const { data, error } = await supabase
    .from('founder_emails')
    .update({ status: 'sending', claimed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('kind', kind)
    .eq('status', 'pending')
    .select('user_id')
  if (error) {throw error}
  return (data ?? []).length > 0
}

// Same claim pattern for the one-time notice to the founder.
export async function claimAdminNotice(supabase: Supabase, userId: string, kind: FounderEmailKind): Promise<boolean> {
  const { data, error } = await supabase
    .from('founder_emails')
    .update({ admin_notified_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('kind', kind)
    .is('admin_notified_at', null)
    .select('user_id')
  if (error) {throw error}
  return (data ?? []).length > 0
}

export interface FounderNotice {
  subject: string
  heading: string
  rows: [string, string][]
  linkLabel?: string
  linkUrl?: string
  activityAction: string
}

// Tells the founder about a new signup: an entry in the admin activity log
// (/admin/activity) and an email to FOUNDER_REPLY_TO when it's set.
export async function sendFounderNotice(userId: string, kind: FounderEmailKind, notice: FounderNotice): Promise<void> {
  await logActivity({
    userId,
    action: notice.activityAction,
    entityType: 'user',
    entityId: userId,
    details: Object.fromEntries(notice.rows),
  })

  const to = getFounderSender().replyTo
  if (!to) {return}

  const bodyHtml = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">${notice.rows
    .map(([label, value]) => `<tr><td style="padding: 2px 16px 2px 0; color: #6b7280;">${escapeHtml(label)}</td><td style="padding: 2px 0;">${escapeHtml(value)}</td></tr>`)
    .join('')}</table>`
  const bodyText = notice.rows.map(([label, value]) => `${label}: ${value}`).join('\n')
  const { html, text } = renderLayout({
    preheader: notice.subject,
    heading: notice.heading,
    bodyHtml: bodyHtml + paragraph('Sent by Infoishai to the founder inbox.'),
    bodyText,
    buttonLabel: notice.linkLabel,
    buttonUrl: notice.linkUrl,
  })
  await sendEmail({
    to,
    subject: notice.subject,
    html,
    text,
    category: 'security',
    template: `founder_notice_${kind}`,
    idempotencyKey: `founder_notice:${kind}:${userId}`,
    userId: null,
    deferrable: true,
  })
}

// Personal sign-off used by every founder email.
export function founderSignature(sender: FounderSender): { html: string; text: string } {
  const name = sender.name ? escapeHtml(sender.name) : null
  return {
    html: paragraph(name ? `${name}<br />Founder, Infoishai` : 'Founder, Infoishai'),
    text: sender.name ? `${sender.name}\nFounder, Infoishai` : 'Founder, Infoishai',
  }
}

export function founderIntro(sender: FounderSender): string {
  return sender.name ? `I'm ${sender.name}, the founder of Infoishai.` : "I'm the founder of Infoishai."
}
