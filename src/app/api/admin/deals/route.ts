import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'

const VALID_SORT = new Set(['created_at', 'updated_at', 'amount', 'status'])

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(request.url)

    const page    = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit   = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
    const search  = searchParams.get('search')  ?? ''
    const status  = searchParams.get('status')  ?? ''
    const dateFrom = searchParams.get('date_from') ?? ''
    const dateTo   = searchParams.get('date_to')   ?? ''
    const sortBy   = VALID_SORT.has(searchParams.get('sort_by') ?? '') ? searchParams.get('sort_by')! : 'created_at'
    const sortAsc  = searchParams.get('sort_order') === 'asc'

    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortAsc })
      .range((page - 1) * limit, page * limit - 1)

    if (status)   query = query.eq('status', status)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59')
    if (search)   query = query.ilike('title', `%${search}%`)

    const { data: deals, count, error } = await query
    if (error) throw error

    if (!deals?.length) {
      return NextResponse.json({ deals: [], total: 0, page, limit })
    }

    // Enrich with brand/creator names
    const brandIds   = [...new Set(deals.map(d => d.brand_id).filter(Boolean))]
    const creatorIds = [...new Set(deals.map(d => d.creator_id).filter(Boolean))]

    const [{ data: brands }, { data: creators }] = await Promise.all([
      supabase.from('brands').select('id, company_name').in('id', brandIds),
      supabase.from('creators').select('id, username, display_name').in('id', creatorIds),
    ])

    const brandMap   = new Map((brands   ?? []).map(b => [b.id, b]))
    const creatorMap = new Map((creators ?? []).map(c => [c.id, c]))

    const enriched = deals.map(d => ({
      ...d,
      brand_name:    brandMap.get(d.brand_id)?.company_name ?? '',
      creator_name:  creatorMap.get(d.creator_id)?.display_name ?? creatorMap.get(d.creator_id)?.username ?? '',
    }))

    return NextResponse.json({ deals: enriched, total: count ?? 0, page, limit })
  } catch (err) {
    console.error('Admin deals error:', err)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}
