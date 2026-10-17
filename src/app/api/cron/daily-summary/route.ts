import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { sendEmail } from '@/lib/email/send'
import { dailySummaryTemplate } from '@/lib/email/templates/dailySummary'
import { signUnsubscribeToken } from '@/lib/email/unsubscribeToken'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://infoishai.com'
const USER_BATCH_LIMIT = 200
const MAX_ITEMS_PER_EMAIL = 10

// GET /api/cron/daily-summary — the one cron route on Vercel's own
// schedule (vercel.json; Hobby plan allows once/day). One email per user
// with 'info'-priority notifications from the last 24h plus their current
// overdue counts (payments due past their date, drafts past draft_due) —
// not the 'action' events already covered by immediate email.
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerSupabase()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const today = new Date().toISOString().slice(0, 10)

    const { data: infoNotifications, error } = await supabase
      .from('notifications')
      .select('user_id, title, content')
      .eq('priority', 'info')
      .gte('created_at', since)
      .is('archived_at', null)

    if (error) {
      captureError(error, { route: 'GET /api/cron/daily-summary' })
      return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
    }

    const itemsByUser = new Map<string, { title: string; content: string }[]>()
    for (const n of infoNotifications ?? []) {
      const list = itemsByUser.get(n.user_id) ?? []
      if (list.length < MAX_ITEMS_PER_EMAIL) {list.push({ title: n.title, content: n.content })}
      itemsByUser.set(n.user_id, list)
    }

    const now = new Date()
    const { data: overduePayments } = await supabase
      .from('creator_payments')
      .select('campaign_creator_id')
      .eq('status', 'due')
      .lt('due_date', now.toISOString().slice(0, 10))
    const overdueCampaignCreatorIds = [...new Set((overduePayments ?? []).map((p) => p.campaign_creator_id))]

    const overdueCountByBrandUser = new Map<string, number>()
    if (overdueCampaignCreatorIds.length > 0) {
      const { data: rows } = await supabase
        .from('campaign_creators')
        .select('id, campaign_id')
        .in('id', overdueCampaignCreatorIds)
      const campaignIds = [...new Set((rows ?? []).map((r) => r.campaign_id))]
      const { data: campaigns } = campaignIds.length > 0
        ? await supabase.from('campaigns').select('id, brand_id').in('id', campaignIds)
        : { data: [] }
      const brandIdByCampaign = new Map((campaigns ?? []).map((c) => [c.id, c.brand_id]))

      for (const row of rows ?? []) {
        const brandId = brandIdByCampaign.get(row.campaign_id)
        if (!brandId) {continue}
        const { data: brand } = await supabase.from('brands').select('user_id').eq('id', brandId).single()
        if (!brand?.user_id) {continue}
        overdueCountByBrandUser.set(brand.user_id, (overdueCountByBrandUser.get(brand.user_id) ?? 0) + 1)
      }
    }

    const allUserIds = new Set([...itemsByUser.keys(), ...overdueCountByBrandUser.keys()])
    const userIdsToProcess = [...allUserIds].slice(0, USER_BATCH_LIMIT)

    let sent = 0
    for (const userId of userIdsToProcess) {
      const items = itemsByUser.get(userId) ?? []
      const overdueCount = overdueCountByBrandUser.get(userId) ?? 0
      if (items.length === 0 && overdueCount === 0) {continue}

      const { data: user } = await supabase.from('users').select('email, email_preferences').eq('id', userId).single()
      if (!user?.email) {continue}
      const prefs = (user.email_preferences ?? {}) as Record<string, boolean>
      if (prefs.daily_summary === false) {continue}

      const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?token=${signUnsubscribeToken(userId, 'daily_summary')}`
      const template = dailySummaryTemplate({
        items,
        overdueCount,
        dashboardUrl: `${APP_URL}/dashboard`,
        manageSettingsUrl: `${APP_URL}/settings`,
        unsubscribeUrl,
      })

      const result = await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        category: 'daily_summary',
        template: 'daily_summary',
        idempotencyKey: `daily_summary:${userId}:${today}`,
        userId,
        deferrable: true,
        unsubscribeUrl,
      })
      if (result.sent) {sent += 1}
    }

    return NextResponse.json({ usersConsidered: userIdsToProcess.length, summariesSent: sent })
  } catch (error) {
    captureError(error, { route: 'GET /api/cron/daily-summary' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
