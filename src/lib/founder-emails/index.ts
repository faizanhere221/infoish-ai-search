import { captureError } from '@/lib/error-tracking'
import { getDeferrableBudgetRemaining, sendEmail } from '@/lib/email/send'
import {
  MAX_ATTEMPTS,
  claimAdminNotice,
  claimFounderRow,
  enqueueFounderEmail,
  enqueueFounderEmails,
  founderSkipReason,
  founderUnsubscribeUrl,
  getFounderRow,
  getFounderSender,
  isAccountVisible,
  isMissingTable,
  loadFounderAccount,
  sendFounderNotice,
  updateFounderRow,
  type FounderEmailKind,
  type FounderEmailRow,
  type FounderNotice,
  type Supabase,
} from './core'
import {
  SAMPLE_CREATOR_WELCOME,
  creatorQualifiedNotice,
  creatorWelcomeTemplate,
  getCreatorFollowerThreshold,
  getCreatorWelcomeAudience,
  loadCreatorWelcome,
  type FounderAudience,
} from './creator'
import { SAMPLE_BRAND_WELCOME, brandSignupNotice, brandWelcomeTemplate, getBrandWelcomeAudience, loadBrandWelcome } from './brand'

export { FOUNDER_EMAIL_KINDS, type FounderEmailKind, type FounderEmailRow } from './core'

// Orchestration for the founder emails: the triggers called from the save
// routes, the send path (shared by triggers, the admin backfill, and the
// daily cron), and the admin test send.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'
const MANAGE_SETTINGS_URL = `${APP_URL}/settings?tab=notifications`
// A row stuck in 'sending' this long means its sender died mid-send.
const STALE_CLAIM_MS = 60 * 60 * 1000
// The cron leaves a just-queued brand row alone for this long, so a brand
// still on the signup form gets the email with their company details.
const BRAND_PROFILE_GRACE_MS = 10 * 60 * 1000

const TEMPLATE_NAMES: Record<FounderEmailKind, string> = {
  creator_welcome: 'founder_creator_welcome',
  brand_welcome: 'founder_brand_welcome',
}

type BuiltEmail = { subject: string; html: string; text: string }

// The email exactly as `userId` would receive it, or null when the account
// no longer has the profile the email is about.
async function buildForUser(
  supabase: Supabase,
  kind: FounderEmailKind,
  userId: string,
  unsubscribeUrl: string
): Promise<BuiltEmail | null> {
  const sender = getFounderSender()
  const footer = { manageSettingsUrl: MANAGE_SETTINGS_URL, unsubscribeUrl }
  switch (kind) {
    case 'creator_welcome': {
      const creator = await loadCreatorWelcome(supabase, userId, await getCreatorFollowerThreshold(supabase))
      return creator ? creatorWelcomeTemplate(creator.data, sender, footer) : null
    }
    case 'brand_welcome': {
      const brand = await loadBrandWelcome(supabase, userId)
      return brand ? brandWelcomeTemplate(brand, sender, footer) : null
    }
  }
}

async function noticeFor(supabase: Supabase, kind: FounderEmailKind, userId: string): Promise<FounderNotice | null> {
  switch (kind) {
    case 'creator_welcome': {
      const threshold = await getCreatorFollowerThreshold(supabase)
      const creator = await loadCreatorWelcome(supabase, userId, threshold)
      return creator ? creatorQualifiedNotice(creator.data, threshold) : null
    }
    case 'brand_welcome': {
      const brand = await loadBrandWelcome(supabase, userId)
      return brand ? brandSignupNotice(brand, userId) : null
    }
  }
}

function sampleEmail(kind: FounderEmailKind, unsubscribeUrl: string): BuiltEmail {
  const sender = getFounderSender()
  const footer = { manageSettingsUrl: MANAGE_SETTINGS_URL, unsubscribeUrl }
  switch (kind) {
    case 'creator_welcome':
      return creatorWelcomeTemplate(SAMPLE_CREATOR_WELCOME, sender, footer)
    case 'brand_welcome':
      return brandWelcomeTemplate(SAMPLE_BRAND_WELCOME, sender, footer)
  }
}

export type ProcessResult = 'sent' | 'deferred' | 'skipped' | 'failed' | 'retry' | 'busy' | 'none'

// Sends one queued founder email if the account is still eligible and
// today's quota has room. Over quota, the row stays 'pending' and the next
// daily-summary cron run picks it up. Never throws.
export async function processFounderEmail(supabase: Supabase, userId: string, kind: FounderEmailKind): Promise<ProcessResult> {
  try {
    const row = await getFounderRow(supabase, userId, kind)
    if (!row) {return 'none'}
    const account = await loadFounderAccount(supabase, userId)

    // The founder hears about every new signup once, whether or not the
    // account ends up getting the email. Backfilled rows are old accounts.
    if (row.source === 'trigger' && !row.admin_notified_at && account && isAccountVisible(account)) {
      if (await claimAdminNotice(supabase, userId, kind)) {
        const notice = await noticeFor(supabase, kind, userId)
        if (notice) {await sendFounderNotice(userId, kind, notice)}
      }
    }

    if (row.status !== 'pending') {return 'none'}

    const skip = account ? founderSkipReason(account) : 'Account not found'
    if (skip) {
      await updateFounderRow(supabase, userId, kind, { status: 'skipped', last_error: skip })
      return 'skipped'
    }

    if ((await getDeferrableBudgetRemaining()) <= 0) {return 'deferred'}
    if (!(await claimFounderRow(supabase, userId, kind))) {return 'busy'}

    const unsubscribeUrl = founderUnsubscribeUrl(userId)
    const email = await buildForUser(supabase, kind, userId, unsubscribeUrl)
    if (!email || !account?.email) {
      await updateFounderRow(supabase, userId, kind, { status: 'skipped', last_error: 'Profile not found' })
      return 'skipped'
    }

    const attempt = row.attempts + 1
    const sender = getFounderSender()
    // The budget was checked above, so send as non-deferrable: a deferred
    // send would be logged under its key and never retried.
    const result = await sendEmail({
      to: account.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      category: 'founder_notes',
      template: TEMPLATE_NAMES[kind],
      idempotencyKey: attemptKey(kind, userId, attempt),
      userId,
      deferrable: false,
      unsubscribeUrl,
      from: sender.from,
      replyTo: sender.replyTo,
    })

    // 'no_api_key' is local dev: logged, not delivered, but handled.
    if (result.sent || result.reason === 'no_api_key' || (result.reason === 'duplicate' && (await attemptWasSent(supabase, kind, userId, attempt)))) {
      await updateFounderRow(supabase, userId, kind, { status: 'sent', sent_at: new Date().toISOString(), attempts: attempt, last_error: null })
      return 'sent'
    }

    const gaveUp = attempt >= MAX_ATTEMPTS
    await updateFounderRow(supabase, userId, kind, {
      status: gaveUp ? 'failed' : 'pending',
      attempts: attempt,
      last_error: `Send attempt ${attempt} failed (${result.reason ?? 'unknown'})`,
    })
    return gaveUp ? 'failed' : 'retry'
  } catch (error) {
    if (!isMissingTable(error)) {captureError(error, { context: 'processFounderEmail', userId, kind })}
    return 'none'
  }
}

function attemptKey(kind: FounderEmailKind, userId: string, attempt: number): string {
  return `founder_${kind}:${userId}:${attempt}`
}

async function attemptWasSent(supabase: Supabase, kind: FounderEmailKind, userId: string, attempt: number): Promise<boolean> {
  const { data } = await supabase
    .from('email_log')
    .select('status')
    .eq('idempotency_key', attemptKey(kind, userId, attempt))
    .maybeSingle()
  return data?.status === 'sent' || data?.status === 'logged_dev'
}

// Called after every save that can change a creator's completeness or
// follower total. Queues the welcome the first time the creator qualifies,
// then tries to send it. Never throws: a founder email must never fail
// the save that triggered it.
export async function onCreatorProfileSaved(supabase: Supabase, userId: string | null | undefined): Promise<void> {
  if (!userId) {return}
  try {
    // Already sent, skipped, or in flight: nothing a save changes.
    const existing = await getFounderRow(supabase, userId, 'creator_welcome')
    if (existing && existing.status !== 'pending') {return}

    const threshold = await getCreatorFollowerThreshold(supabase)
    const creator = await loadCreatorWelcome(supabase, userId, threshold)
    if (!creator?.qualifies) {return}
    await enqueueFounderEmail(supabase, userId, 'creator_welcome', 'trigger')
    await processFounderEmail(supabase, userId, 'creator_welcome')
  } catch (error) {
    if (!isMissingTable(error)) {captureError(error, { context: 'onCreatorProfileSaved', userId })}
  }
}

// Called right after a brand account is created. Only queues: the signup
// form saves the company profile next, and onBrandProfileCreated sends
// then, with the company details in the email. Never throws.
export async function onBrandRegistered(supabase: Supabase, userId: string): Promise<void> {
  try {
    await enqueueFounderEmail(supabase, userId, 'brand_welcome', 'trigger')
  } catch (error) {
    if (!isMissingTable(error)) {captureError(error, { context: 'onBrandRegistered', userId })}
  }
}

// Called after a brand saves its company profile for the first time: sends
// the founder the signup notice and the brand its welcome. Never throws.
export async function onBrandProfileCreated(supabase: Supabase, userId: string): Promise<void> {
  await processFounderEmail(supabase, userId, 'brand_welcome')
}

// The daily-summary cron's pass over the queue: rows deferred by the quota,
// rows whose last attempt failed, and claims left behind by a sender that
// died mid-send. Stops once today's quota is spent.
export async function processPendingFounderEmails(supabase: Supabase): Promise<Record<ProcessResult, number>> {
  const counts: Record<ProcessResult, number> = { sent: 0, deferred: 0, skipped: 0, failed: 0, retry: 0, busy: 0, none: 0 }
  try {
    const staleBefore = new Date(Date.now() - STALE_CLAIM_MS).toISOString()
    const { data: stale } = await supabase.from('founder_emails').select('*').eq('status', 'sending').lt('claimed_at', staleBefore)
    for (const row of (stale ?? []) as FounderEmailRow[]) {
      const sent = await attemptWasSent(supabase, row.kind, row.user_id, row.attempts + 1)
      await updateFounderRow(
        supabase,
        row.user_id,
        row.kind,
        sent ? { status: 'sent', sent_at: new Date().toISOString(), attempts: row.attempts + 1 } : { status: 'pending' }
      )
    }

    const { data: pending, error } = await supabase
      .from('founder_emails')
      .select('user_id, kind, queued_at')
      .eq('status', 'pending')
      .order('queued_at', { ascending: true })
      .limit(200)
    if (error) {throw error}

    const graceCutoff = Date.now() - BRAND_PROFILE_GRACE_MS
    for (const row of pending ?? []) {
      if (row.kind === 'brand_welcome' && new Date(row.queued_at).getTime() > graceCutoff) {continue}
      const result = await processFounderEmail(supabase, row.user_id, row.kind as FounderEmailKind)
      counts[result] += 1
      if (result === 'deferred') {break}
    }
  } catch (error) {
    if (!isMissingTable(error)) {captureError(error, { context: 'processPendingFounderEmails' })}
  }
  return counts
}

// Accounts the admin "send to existing" button would reach right now.
export async function getFounderAudience(supabase: Supabase, kind: FounderEmailKind): Promise<FounderAudience> {
  switch (kind) {
    case 'creator_welcome':
      return getCreatorWelcomeAudience(supabase)
    case 'brand_welcome':
      return getBrandWelcomeAudience(supabase)
  }
}

// Admin "send to existing": queues every account in the audience, then
// sends as many as today's quota allows. The rest stay queued for the cron.
export async function backfillFounderEmails(
  supabase: Supabase,
  kind: FounderEmailKind,
  userIds: string[]
): Promise<{ queued: number; sent: number; skipped: number; failed: number; leftForLater: number }> {
  const queued = await enqueueFounderEmails(supabase, userIds, kind, 'backfill')

  let sent = 0
  let skipped = 0
  let failed = 0
  let processed = 0
  for (const userId of userIds) {
    const result = await processFounderEmail(supabase, userId, kind)
    if (result === 'deferred') {break}
    processed += 1
    if (result === 'sent') {sent += 1} else if (result === 'skipped') {skipped += 1} else if (result === 'failed' || result === 'retry') {failed += 1}
  }
  return { queued, sent, skipped, failed, leftForLater: userIds.length - processed }
}

// One copy to an admin's own inbox: the email as `targetUserId` would get
// it, or a sample when no account is given. Never touches the target's
// founder_emails row, so the real email still goes out later.
export async function sendFounderTest(
  supabase: Supabase,
  kind: FounderEmailKind,
  admin: { userId: string; email: string },
  targetUserId: string | null
): Promise<{ sent: boolean; reason?: string; notFound?: boolean }> {
  const unsubscribeUrl = founderUnsubscribeUrl(admin.userId)
  const sender = getFounderSender()
  let email: BuiltEmail | null
  if (targetUserId) {
    email = await buildForUser(supabase, kind, targetUserId, unsubscribeUrl)
    if (!email) {return { sent: false, notFound: true }}
  } else {
    email = sampleEmail(kind, unsubscribeUrl)
  }

  const result = await sendEmail({
    to: admin.email,
    subject: `[Test] ${email.subject}`,
    html: email.html,
    text: email.text,
    category: 'founder_notes',
    template: `${TEMPLATE_NAMES[kind]}_test`,
    idempotencyKey: `founder_test:${kind}:${admin.userId}:${Date.now()}`,
    userId: admin.userId,
    // An admin waiting on a test should never have it silently deferred.
    deferrable: false,
    unsubscribeUrl,
    from: sender.from,
    replyTo: sender.replyTo,
  })
  return { sent: result.sent || result.reason === 'no_api_key', reason: result.reason }
}
