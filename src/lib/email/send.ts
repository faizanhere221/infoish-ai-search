import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/db'
import { captureError, captureMessage } from '@/lib/error-tracking'

export type EmailCategory = 'messages' | 'offers' | 'contracts' | 'work' | 'payments' | 'daily_summary' | 'profile_tips' | 'founder_notes' | 'security'

// The categories a user can actually toggle (users.email_preferences) —
// 'security' is excluded on purpose: welcome/verification/password-reset
// emails are never gated by preferences.
export const PREFERENCE_CATEGORIES = ['messages', 'offers', 'contracts', 'work', 'payments', 'daily_summary', 'profile_tips', 'founder_notes'] as const
export type PreferenceCategory = (typeof PREFERENCE_CATEGORIES)[number]

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text: string
  category: EmailCategory
  // Free-form identifier for email_log.template — e.g. 'welcome_creator',
  // 'offer_action', 'message_digest', 'daily_summary'. Not used for
  // routing, just for querying email_log later.
  template: string
  // Never sends twice for the same key (checked against email_log, which
  // has a UNIQUE constraint on it as the hard backstop). Callers build this
  // deterministically — e.g. `notification:${notification.id}` for a
  // single event, `digest:${conversationId}:${hourBucket}` for a digest,
  // `daily_summary:${userId}:${isoDate}` for a summary — so a retry or a
  // duplicate cron tick can never double-send.
  idempotencyKey: string
  userId?: string | null
  // 'security' emails (verification, password reset, welcome) are never
  // deferred regardless of the daily quota — they block or confirm a
  // concrete action the user is waiting on right now. Defaults to true for
  // everything else (notification-driven emails, digests, summaries),
  // meaning they get skipped (and picked up by the next daily summary
  // instead) once the free-plan quota is nearly spent.
  deferrable?: boolean
  // List-Unsubscribe header value, e.g. `<https://.../api/email/unsubscribe?...>`.
  // Omit for security emails — those are never unsubscribable.
  unsubscribeUrl?: string | null
  // Overrides EMAIL_FROM, e.g. the founder emails go out in the founder's
  // name from the same sending address.
  from?: string
  replyTo?: string | null
}

export interface SendEmailResult {
  sent: boolean
  reason?: 'duplicate' | 'deferred' | 'no_api_key' | 'provider_error'
}

const RESEND_URL = 'https://api.resend.com/emails'
const DAILY_QUOTA = 100
const DEFER_THRESHOLD = 90 // leave headroom for security emails, which never defer

async function getTodaysSentCount(supabase: SupabaseClient): Promise<number> {
  const { data } = await supabase
    .from('email_daily_usage')
    .select('sent_count')
    .eq('day', new Date().toISOString().slice(0, 10))
    .maybeSingle()
  return data?.sent_count ?? 0
}

// How many more deferrable emails fit under today's quota before sendEmail()
// starts deferring them. Batch senders cap themselves at this number: a
// deferred send is logged under its idempotency key, so it would never be
// retried.
export async function getDeferrableBudgetRemaining(): Promise<number> {
  const todaysSent = await getTodaysSentCount(createServerSupabase())
  return Math.max(0, DEFER_THRESHOLD - todaysSent)
}

async function logEmail(
  supabase: SupabaseClient,
  params: SendEmailParams & { status: 'sent' | 'skipped' | 'failed' | 'logged_dev'; providerId?: string | null; error?: string | null }
): Promise<void> {
  const { error } = await supabase.from('email_log').insert({
    user_id: params.userId ?? null,
    category: params.category,
    template: params.template,
    status: params.status,
    provider_id: params.providerId ?? null,
    error: params.error ?? null,
    idempotency_key: params.idempotencyKey,
  })
  // 23505 = unique_violation on idempotency_key — someone else (a retry, a
  // race) already logged this exact send. Not a real failure.
  if (error && (error as { code?: string }).code !== '23505') {
    captureError(error, { context: 'logEmail', idempotencyKey: params.idempotencyKey })
  }
}

// Fire-and-forget by design: a failed/skipped email must never fail the
// action that triggered it. Every path here returns normally; callers that
// care can inspect `sent`/`reason`, but none are required to.
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const supabase = createServerSupabase()
  const deferrable = params.deferrable ?? true

  try {
    const { data: existing } = await supabase
      .from('email_log')
      .select('id')
      .eq('idempotency_key', params.idempotencyKey)
      .maybeSingle()
    if (existing) {
      return { sent: false, reason: 'duplicate' }
    }

    if (deferrable) {
      const todaysSent = await getTodaysSentCount(supabase)
      if (todaysSent >= DEFER_THRESHOLD) {
        captureMessage(`Email deferred — daily quota near limit (${todaysSent}/${DAILY_QUOTA}): ${params.template}`, 'warning')
        await logEmail(supabase, { ...params, status: 'skipped', error: `Deferred at ${todaysSent}/${DAILY_QUOTA} sends today` })
        return { sent: false, reason: 'deferred' }
      }
    }

    const headers: Record<string, string> = {}
    if (params.unsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${params.unsubscribeUrl}>`
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
    }

    const apiKey = process.env.RESEND_API_KEY
    const from = params.from || process.env.EMAIL_FROM || 'Infoishai <notifications@infoishai.com>'

    if (!apiKey) {
      // Local dev without a Resend key — log instead of sending so the
      // flow (welcome/verify/reset/notification emails) is still visible
      // and testable without real credentials.
      // eslint-disable-next-line no-console
      console.log(`[email:dev] to=${params.to} subject="${params.subject}" template=${params.template}\n${params.text}`)
      await logEmail(supabase, { ...params, status: 'logged_dev' })
      await supabase.rpc('increment_email_daily_count')
      return { sent: false, reason: 'no_api_key' }
    }

    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo || undefined,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      captureError(new Error(`Resend API error: ${res.status}`), { context: 'sendEmail', body, template: params.template })
      await logEmail(supabase, { ...params, status: 'failed', error: `HTTP ${res.status}: ${body.slice(0, 500)}` })
      return { sent: false, reason: 'provider_error' }
    }

    const data = await res.json().catch(() => ({}))
    await supabase.rpc('increment_email_daily_count')
    await logEmail(supabase, { ...params, status: 'sent', providerId: data?.id ?? null })
    return { sent: true }
  } catch (error) {
    captureError(error, { context: 'sendEmail', template: params.template })
    return { sent: false, reason: 'provider_error' }
  }
}
