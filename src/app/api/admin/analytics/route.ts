import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)

    const now   = new Date()
    const from  = searchParams.get('from') ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const to    = searchParams.get('to')   ?? now.toISOString()

    const [
      { data: userRows },
      { data: creatorRows },
      { data: brandRows },
      { data: dealRows },
      { data: msgRows },
      { data: activityRows },
    ] = await Promise.all([
      supabase.from('users').select('created_at, user_type').gte('created_at', from).lte('created_at', to),
      supabase.from('creators').select('id, total_followers, avg_engagement_rate, completed_deals, avg_rating, verification_status').limit(1000),
      supabase.from('brands').select('id, industry, total_spend, verification_status').limit(1000),
      supabase.from('deals').select('id, status, amount, currency, created_at, updated_at').gte('created_at', from).lte('created_at', to),
      supabase.from('messages').select('created_at').gte('created_at', from).lte('created_at', to),
      supabase.from('activity_logs').select('action, created_at').gte('created_at', from).lte('created_at', to).limit(5000),
    ])

    // --- User registrations by day ---
    const regByDay = buildDayMap(userRows ?? [], r => r.created_at)
    const creatorRegByDay = buildDayMap(
      (userRows ?? []).filter(r => r.user_type === 'creator'),
      r => r.created_at
    )
    const brandRegByDay = buildDayMap(
      (userRows ?? []).filter(r => r.user_type === 'brand'),
      r => r.created_at
    )

    // --- Deal metrics ---
    const dealsByStatus: Record<string, number> = {}
    let totalRevenue = 0
    const revenueByDay: Record<string, number> = {}
    const dealsByDay = buildDayMap(dealRows ?? [], r => r.created_at)

    for (const d of (dealRows ?? [])) {
      dealsByStatus[d.status] = (dealsByStatus[d.status] ?? 0) + 1
      if (d.status === 'completed' && d.amount) {
        totalRevenue += Number(d.amount)
        const day = d.updated_at?.slice(0, 10) ?? d.created_at?.slice(0, 10)
        if (day) revenueByDay[day] = (revenueByDay[day] ?? 0) + Number(d.amount)
      }
    }

    // --- Creator stats ---
    const totalCreators = (creatorRows ?? []).length
    const verifiedCreators = (creatorRows ?? []).filter(c => c.verification_status === 'verified').length
    const avgFollowers = totalCreators
      ? Math.round((creatorRows ?? []).reduce((s, c) => s + (c.total_followers ?? 0), 0) / totalCreators)
      : 0
    const avgEngagement = totalCreators
      ? parseFloat(((creatorRows ?? []).reduce((s, c) => s + (c.avg_engagement_rate ?? 0), 0) / totalCreators).toFixed(2))
      : 0
    const avgRating = totalCreators
      ? parseFloat(((creatorRows ?? []).reduce((s, c) => s + (c.avg_rating ?? 0), 0) / totalCreators).toFixed(2))
      : 0

    // --- Brand stats ---
    const totalBrands = (brandRows ?? []).length
    const verifiedBrands = (brandRows ?? []).filter(b => b.verification_status === 'verified').length
    const industryBreakdown: Record<string, number> = {}
    for (const b of (brandRows ?? [])) {
      if (b.industry) industryBreakdown[b.industry] = (industryBreakdown[b.industry] ?? 0) + 1
    }
    const topIndustries = Object.entries(industryBreakdown)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, count]) => ({ name, count }))

    // --- Messages ---
    const msgsByDay = buildDayMap(msgRows ?? [], r => r.created_at)

    // --- Activity actions ---
    const actionCounts: Record<string, number> = {}
    for (const a of (activityRows ?? [])) {
      actionCounts[a.action] = (actionCounts[a.action] ?? 0) + 1
    }

    return NextResponse.json({
      period: { from, to },
      users: {
        registrations_by_day: regByDay,
        creator_registrations_by_day: creatorRegByDay,
        brand_registrations_by_day: brandRegByDay,
        total_in_period: (userRows ?? []).length,
      },
      deals: {
        by_status: dealsByStatus,
        by_day: dealsByDay,
        total_in_period: (dealRows ?? []).length,
        total_revenue: totalRevenue,
        revenue_by_day: revenueByDay,
      },
      creators: {
        total: totalCreators,
        verified: verifiedCreators,
        avg_followers: avgFollowers,
        avg_engagement_rate: avgEngagement,
        avg_rating: avgRating,
      },
      brands: {
        total: totalBrands,
        verified: verifiedBrands,
        top_industries: topIndustries,
      },
      engagement: {
        messages_by_day: msgsByDay,
        total_messages_in_period: (msgRows ?? []).length,
        action_counts: actionCounts,
      },
    })
  } catch (err) {
    console.error('Admin analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

function buildDayMap<T>(rows: T[], getDate: (r: T) => string): Record<string, number> {
  const map: Record<string, number> = {}
  for (const r of rows) {
    const day = getDate(r)?.slice(0, 10)
    if (day) map[day] = (map[day] ?? 0) + 1
  }
  return map
}
