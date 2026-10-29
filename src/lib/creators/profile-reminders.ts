import type { createServerSupabase } from '@/lib/db'
import { isCreatorPublic } from '@/lib/creators/visibility'
import { getProfileCompleteness, type CompletenessItem } from '@/lib/profile-completion'
import { getDeferrableBudgetRemaining, sendEmail } from '@/lib/email/send'
import { profileReminderTemplate } from '@/lib/email/templates/profileReminder'
import { signUnsubscribeToken } from '@/lib/email/unsubscribeToken'

type Supabase = ReturnType<typeof createServerSupabase>

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'
const CHUNK = 200

export interface ReminderRecipient {
  userId: string
  email: string
  displayName: string | null
  percentage: number
  missing: CompletenessItem[]
}

export interface ReminderAudience {
  recipients: ReminderRecipient[]
  incomplete: number
  optedOut: number
  alreadySent: number
}

// One-time per creator, ever: email_log's UNIQUE idempotency_key makes a
// second send impossible even if the admin clicks twice.
export const reminderKey = (userId: string) => `profile_reminder:${userId}`

async function inChunks<T>(ids: string[], load: (chunk: string[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = []
  for (let i = 0; i < ids.length; i += CHUNK) {out.push(...(await load(ids.slice(i, i + CHUNK))))}
  return out
}

// Creators who would get the reminder right now: public (not deleted,
// suspended, or admin-hidden), profile not fully complete, opted in to
// profile tips, and never sent it before.
export async function getReminderAudience(supabase: Supabase): Promise<ReminderAudience> {
  const { data: creators, error } = await supabase
    .from('creators')
    .select('id, user_id, display_name, bio, profile_photo_url, niches, country, hidden_from_marketplace')
    .limit(5000)
  if (error) {throw error}
  if (!creators?.length) {return { recipients: [], incomplete: 0, optedOut: 0, alreadySent: 0 }}

  const userIds = creators.map((c) => c.user_id)
  const creatorIds = creators.map((c) => c.id)

  const [users, platforms, services, sentLogs] = await Promise.all([
    inChunks(userIds, async (chunk) => {
      const { data, error: e } = await supabase.from('users').select('id, email, deleted_at, is_active, email_preferences').in('id', chunk)
      if (e) {throw e}
      return data ?? []
    }),
    inChunks(creatorIds, async (chunk) => {
      const { data, error: e } = await supabase.from('creator_platforms').select('creator_id, platform_username').in('creator_id', chunk)
      if (e) {throw e}
      return data ?? []
    }),
    inChunks(creatorIds, async (chunk) => {
      const { data, error: e } = await supabase.from('creator_services').select('creator_id, price, is_active').in('creator_id', chunk)
      if (e) {throw e}
      return data ?? []
    }),
    inChunks(userIds.map(reminderKey), async (chunk) => {
      const { data, error: e } = await supabase.from('email_log').select('idempotency_key').in('idempotency_key', chunk)
      if (e) {throw e}
      return data ?? []
    }),
  ])

  const userById = new Map(users.map((u) => [u.id, u]))
  const sentKeys = new Set(sentLogs.map((l) => l.idempotency_key))
  const audience: ReminderAudience = { recipients: [], incomplete: 0, optedOut: 0, alreadySent: 0 }

  for (const creator of creators) {
    const user = userById.get(creator.user_id)
    if (!user || !isCreatorPublic(user, creator)) {continue}

    const completeness = getProfileCompleteness({
      ...creator,
      creator_platforms: platforms.filter((p) => p.creator_id === creator.id),
      creator_services: services.filter((s) => s.creator_id === creator.id),
    })
    if (completeness.isFullyComplete) {continue}
    audience.incomplete += 1

    const prefs = (user.email_preferences ?? {}) as Record<string, boolean>
    if (!user.email || prefs.profile_tips === false) {
      audience.optedOut += 1
      continue
    }
    if (sentKeys.has(reminderKey(user.id))) {
      audience.alreadySent += 1
      continue
    }

    audience.recipients.push({
      userId: user.id,
      email: user.email,
      displayName: creator.display_name,
      percentage: completeness.percentage,
      // Required items first, so the email leads with what blocks listing.
      missing: [...completeness.missing].sort((a, b) => Number(b.required) - Number(a.required)),
    })
  }

  return audience
}

// Sends to as many recipients as today's email quota allows. Anyone left
// over is still eligible and goes out on the next run.
export async function sendProfileReminders(recipients: ReminderRecipient[]): Promise<{ sent: number; failed: number; leftForLater: number }> {
  const budget = await getDeferrableBudgetRemaining()
  const batch = recipients.slice(0, budget)
  let sent = 0
  let failed = 0

  for (const r of batch) {
    const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?token=${signUnsubscribeToken(r.userId, 'profile_tips')}`
    const template = profileReminderTemplate({
      displayName: r.displayName,
      percentage: r.percentage,
      missing: r.missing.map((m) => ({ label: m.label, required: m.required })),
      settingsUrl: `${APP_URL}${r.missing[0]?.link ?? '/settings'}`,
      manageSettingsUrl: `${APP_URL}/settings?tab=notifications`,
      unsubscribeUrl,
    })
    const result = await sendEmail({
      to: r.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      category: 'profile_tips',
      template: 'profile_reminder',
      idempotencyKey: reminderKey(r.userId),
      userId: r.userId,
      deferrable: true,
      unsubscribeUrl,
    })
    // 'no_api_key' is local dev: logged, not delivered, but still counts as handled.
    if (result.sent || result.reason === 'no_api_key') {sent += 1} else {failed += 1}
  }

  return { sent, failed, leftForLater: recipients.length - batch.length }
}
