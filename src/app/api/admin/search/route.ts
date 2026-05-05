import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().min(1).max(200),
  types: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      q: searchParams.get('q') ?? '',
      types: searchParams.get('types') ?? undefined,
      limit: searchParams.get('limit') ?? 5,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
    }

    const { q, limit } = parsed.data
    const types = parsed.data.types ? parsed.data.types.split(',') : ['users', 'creators', 'brands', 'deals']

    const supabase = createServerSupabase()
    const results: Record<string, unknown[]> = {}

    await Promise.all([
      types.includes('users') && supabase
        .from('users')
        .select('id, email, user_type, is_active, created_at')
        .ilike('email', `%${q}%`)
        .limit(limit)
        .then(({ data }) => { results.users = data ?? [] }),

      types.includes('creators') && supabase
        .from('creators')
        .select('id, user_id, username, display_name, verification_status, total_followers')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(limit)
        .then(({ data }) => { results.creators = data ?? [] }),

      types.includes('brands') && supabase
        .from('brands')
        .select('id, user_id, company_name, industry, verification_status')
        .or(`company_name.ilike.%${q}%,industry.ilike.%${q}%`)
        .limit(limit)
        .then(({ data }) => { results.brands = data ?? [] }),

      types.includes('deals') && supabase
        .from('deals')
        .select('id, title, status, amount, currency, created_at')
        .ilike('title', `%${q}%`)
        .limit(limit)
        .then(({ data }) => { results.deals = data ?? [] }),
    ])

    const total = Object.values(results).reduce((s, arr) => s + arr.length, 0)
    return NextResponse.json({ results, total, query: q })
  } catch (err) {
    console.error('Admin search error:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
