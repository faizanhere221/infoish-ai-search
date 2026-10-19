import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'

// GET /api/admin/overview — Phase 7B's new admin-dashboard tiles: campaign
// workflow health that the pre-existing /api/admin/stats (legacy
// users/deals KPIs) never covered. Read-only, no logging needed (viewing
// aggregate counts isn't "sensitive data" the way a payout detail is).
export async function GET() {
  try {
    const supabase = createServerSupabase()

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const todayDate = todayStart.slice(0, 10)

    const [
      signups7Res,
      signups30Res,
      activeCampaignsRes,
      trackerRowsRes,
      offersPendingRes,
      contractsWaitingRes,
      deliverablesRes,
      paymentsRes,
      emailUsageRes,
      emailFailedRes,
    ] = await Promise.all([
      supabase.from('users').select('user_type').gte('created_at', sevenDaysAgo),
      supabase.from('users').select('user_type').gte('created_at', thirtyDaysAgo),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('campaign_creators').select('status'),
      supabase.from('campaign_offers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('campaign_contracts').select('id', { count: 'exact', head: true }).in('status', ['sent', 'signed_by_creator', 'signed_by_brand']),
      supabase.from('creator_deliverables').select('draft_due, publish_due, status').not('status', 'in', '(posted,completed)'),
      supabase.from('creator_payments').select('status, currency, due_date').in('status', ['due', 'disputed']),
      supabase.from('email_daily_usage').select('sent_count').eq('day', todayDate).maybeSingle(),
      supabase.from('email_log').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', todayStart),
    ])

    const byType = (rows: { user_type: string }[] | null) => {
      const out: Record<string, number> = { creator: 0, brand: 0 }
      for (const r of rows ?? []) {
        if (r.user_type === 'creator' || r.user_type === 'brand') {out[r.user_type]++}
      }
      return out
    }

    const trackerByStatus: Record<string, number> = {}
    for (const row of trackerRowsRes.data ?? []) {
      trackerByStatus[row.status] = (trackerByStatus[row.status] ?? 0) + 1
    }

    const today = now.toISOString().slice(0, 10)
    let deliverablesOverdue = 0
    for (const d of deliverablesRes.data ?? []) {
      const dueDate = d.publish_due ?? d.draft_due
      if (dueDate && dueDate < today) {deliverablesOverdue++}
    }

    // Grouped per currency, never summed across currencies — a count of
    // "5 USD + 3 EUR = 8" is meaningless since they're different money.
    const paymentsByCurrency: Record<string, { due: number; overdue: number; disputed: number }> = {}
    for (const p of paymentsRes.data ?? []) {
      const bucket = paymentsByCurrency[p.currency] ?? (paymentsByCurrency[p.currency] = { due: 0, overdue: 0, disputed: 0 })
      if (p.status === 'disputed') {bucket.disputed++}
      else if (p.status === 'due') {
        bucket.due++
        if (p.due_date && p.due_date < today) {bucket.overdue++}
      }
    }

    return NextResponse.json({
      signups: {
        last7: (signups7Res.data ?? []).length,
        last7ByType: byType(signups7Res.data),
        last30: (signups30Res.data ?? []).length,
        last30ByType: byType(signups30Res.data),
      },
      activeCampaigns: activeCampaignsRes.count ?? 0,
      trackerByStatus,
      offersPending: offersPendingRes.count ?? 0,
      contractsWaitingSignature: contractsWaitingRes.count ?? 0,
      deliverablesOverdue,
      paymentsByCurrency,
      email: {
        sentToday: emailUsageRes.data?.sent_count ?? 0,
        dailyLimit: 100,
        failedToday: emailFailedRes.count ?? 0,
      },
    })
  } catch (err) {
    captureError(err, { route: 'GET /api/admin/overview' })
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 })
  }
}
