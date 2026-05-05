import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

const VALID_SORT = new Set(['created_at', 'total_followers', 'avg_rating', 'completed_deals', 'username'])

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const search = searchParams.get('search') ?? ''
    const niche = searchParams.get('niche') ?? ''
    const platform = searchParams.get('platform') ?? ''
    const country = searchParams.get('country') ?? ''
    const minFollowers = searchParams.get('min_followers') ? parseInt(searchParams.get('min_followers')!) : null
    const maxFollowers = searchParams.get('max_followers') ? parseInt(searchParams.get('max_followers')!) : null
    const minRating = searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : null
    const isAvailable = searchParams.get('is_available') ?? ''
    const status = searchParams.get('status') ?? 'all'
    const verificationStatus = searchParams.get('verification_status') ?? ''
    const dateFrom = searchParams.get('date_from') ?? ''
    const dateTo = searchParams.get('date_to') ?? ''
    const sortBy = VALID_SORT.has(searchParams.get('sort_by') ?? '') ? (searchParams.get('sort_by') as string) : 'created_at'
    const sortAsc = searchParams.get('sort_order') === 'asc'

    const emailSearch = search.includes('@') ? search : ''
    const needsUserFilter = status !== 'all' || !!emailSearch

    // Resolve user-level filters into a creator user_id list
    let userIdFilter: string[] | null = null
    if (needsUserFilter) {
      let userQuery = supabase.from('users').select('id').eq('user_type', 'creator')
      if (status === 'active') userQuery = userQuery.eq('is_active', true)
      if (status === 'suspended') userQuery = userQuery.eq('is_active', false)
      if (emailSearch) userQuery = userQuery.ilike('email', `%${emailSearch}%`)

      const { data: matchedUsers } = await userQuery
      userIdFilter = (matchedUsers ?? []).map(u => u.id)
      if (userIdFilter.length === 0) {
        return NextResponse.json({ creators: [], total: 0, page, limit })
      }
    }

    // Resolve platform filter into a creator id list
    let platformCreatorIds: string[] | null = null
    if (platform) {
      const { data: pCreators } = await supabase
        .from('creator_platforms').select('creator_id').eq('platform', platform)
      platformCreatorIds = (pCreators ?? []).map(p => p.creator_id)
      if (platformCreatorIds.length === 0) {
        return NextResponse.json({ creators: [], total: 0, page, limit })
      }
    }

    let query = supabase
      .from('creators')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortAsc })
      .range((page - 1) * limit, page * limit - 1)

    // Creator-level text search (not email)
    if (search && !emailSearch) {
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
    }
    if (niche) query = query.contains('niches', [niche])
    if (country) query = query.eq('country', country)
    if (minFollowers !== null) query = query.gte('total_followers', minFollowers)
    if (maxFollowers !== null) query = query.lte('total_followers', maxFollowers)
    if (minRating !== null) query = query.gte('avg_rating', minRating)
    if (isAvailable === 'true') query = query.eq('is_available', true)
    if (isAvailable === 'false') query = query.eq('is_available', false)
    if (verificationStatus) query = query.eq('verification_status', verificationStatus)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
    if (userIdFilter) query = query.in('user_id', userIdFilter)
    if (platformCreatorIds) query = query.in('id', platformCreatorIds)

    const { data: creators, count, error } = await query
    if (error) throw error

    if (!creators?.length) {
      return NextResponse.json({ creators: [], total: count ?? 0, page, limit })
    }

    // Enrich with user data and platform list
    const userIds = creators.map(c => c.user_id)
    const creatorIds = creators.map(c => c.id)

    const [{ data: users }, { data: platforms }] = await Promise.all([
      supabase.from('users').select('id, email, is_active, last_login_at, role').in('id', userIds),
      supabase.from('creator_platforms').select('creator_id, platform').in('creator_id', creatorIds),
    ])

    const userMap = new Map((users ?? []).map(u => [u.id, u]))
    const platformMap = new Map<string, string[]>()
    for (const p of (platforms ?? [])) {
      const list = platformMap.get(p.creator_id) ?? []
      list.push(p.platform as string)
      platformMap.set(p.creator_id, list)
    }

    const enriched = creators.map(c => ({
      ...c,
      is_featured: c.is_featured ?? false,
      email: userMap.get(c.user_id)?.email ?? '',
      is_active: userMap.get(c.user_id)?.is_active ?? true,
      last_login_at: userMap.get(c.user_id)?.last_login_at ?? null,
      role: userMap.get(c.user_id)?.role ?? 'user',
      platform_list: platformMap.get(c.id) ?? [],
    }))

    return NextResponse.json({ creators: enriched, total: count ?? 0, page, limit })
  } catch (err) {
    console.error('Admin creators error:', err)
    return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 })
  }
}
