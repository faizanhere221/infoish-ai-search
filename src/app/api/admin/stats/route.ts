import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

export async function GET() {
  try {
    const supabase = createServerSupabase()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const [
      totalUsersRes,
      totalCreatorsRes,
      totalBrandsRes,
      activeTodayRes,
      usersLastWeekRes,
      usersPrevWeekRes,
      dealsRes,
      recentUsersRes,
      creatorsNichesRes,
      platformsRes,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('creators').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_login_at', todayStart),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
      supabase.from('deals').select('status, amount, currency, created_at, completed_at, updated_at'),
      supabase.from('users').select('created_at').gte('created_at', thirtyDaysAgo).order('created_at'),
      supabase.from('creators').select('niches').not('niches', 'eq', '{}'),
      supabase.from('creator_platforms').select('platform'),
    ])

    // ── Deal stats ────────────────────────────────────────────────────────────
    const dealsByStatus: Record<string, number> = {
      pending: 0, accepted: 0, paid: 0, in_progress: 0,
      delivered: 0, revision: 0, completed: 0, cancelled: 0, disputed: 0,
    }
    let totalRevenue = 0
    const revenueByDay: Record<string, number> = {}

    for (const deal of (dealsRes.data ?? [])) {
      const s = deal.status as string
      dealsByStatus[s] = (dealsByStatus[s] ?? 0) + 1
      if (deal.status === 'completed') {
        const amt = Number(deal.amount) || 0
        totalRevenue += amt
        const day = (deal.completed_at ?? deal.updated_at ?? deal.created_at)?.split('T')[0]
        if (day) revenueByDay[day] = (revenueByDay[day] ?? 0) + amt
      }
    }

    // ── Registration trend (all 30 days, including zeros) ────────────────────
    const registrationByDay: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
      registrationByDay[d.toISOString().split('T')[0]] = 0
    }
    for (const u of (recentUsersRes.data ?? [])) {
      const day = u.created_at?.split('T')[0]
      if (day && day in registrationByDay) registrationByDay[day]++
    }

    // ── Revenue trend (all 30 days) ───────────────────────────────────────────
    const revenueTrendMap: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
      revenueTrendMap[d.toISOString().split('T')[0]] = 0
    }
    for (const [day, amt] of Object.entries(revenueByDay)) {
      if (day in revenueTrendMap) revenueTrendMap[day] = amt
    }

    // ── Top niches ────────────────────────────────────────────────────────────
    const nicheCounts: Record<string, number> = {}
    for (const c of (creatorsNichesRes.data ?? [])) {
      for (const niche of (c.niches ?? [])) {
        nicheCounts[niche as string] = (nicheCounts[niche as string] ?? 0) + 1
      }
    }
    const topNiches = Object.entries(nicheCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    // ── Platform distribution ─────────────────────────────────────────────────
    const platformCounts: Record<string, number> = {}
    for (const p of (platformsRes.data ?? [])) {
      const pl = p.platform as string
      platformCounts[pl] = (platformCounts[pl] ?? 0) + 1
    }
    const platformDist = Object.entries(platformCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([platform, count]) => ({ platform, count }))

    // ── % change from prior week ──────────────────────────────────────────────
    const thisWeek = usersLastWeekRes.count ?? 0
    const prevWeek = usersPrevWeekRes.count ?? 0
    const usersChange = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : (thisWeek > 0 ? 100 : 0)

    return NextResponse.json({
      overview: {
        totalUsers: totalUsersRes.count ?? 0,
        totalCreators: totalCreatorsRes.count ?? 0,
        totalBrands: totalBrandsRes.count ?? 0,
        totalDeals: dealsRes.data?.length ?? 0,
        totalRevenue,
        activeToday: activeTodayRes.count ?? 0,
        usersChange,
      },
      dealsByStatus,
      registrationTrend: Object.entries(registrationByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
      revenueTrend: Object.entries(revenueTrendMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({ date, amount })),
      topNiches,
      platformDist,
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
