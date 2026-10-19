import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { PREFERENCE_CATEGORIES } from '@/lib/email/send'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const DEFAULT_PREFERENCES: Record<string, boolean> = {
  messages: true,
  offers: true,
  contracts: true,
  work: true,
  payments: true,
  daily_summary: true,
}

const UpdateSchema = z.object(
  Object.fromEntries(PREFERENCE_CATEGORIES.map((cat) => [cat, z.boolean().optional()]))
)

// GET /api/account/email-preferences — the authenticated user's own
// per-category email settings.
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const supabase = createServerSupabase()
  const { data: user, error } = await supabase.from('users').select('email_preferences').eq('id', userId).single()
  if (error || !user) {
    captureError(error ?? new Error('user not found'), { route: 'GET /api/account/email-preferences' })
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
  }

  return NextResponse.json({ preferences: { ...DEFAULT_PREFERENCES, ...(user.email_preferences ?? {}) } })
}

// PATCH /api/account/email-preferences — update one or more categories.
// { messages: false, offers: true }
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = createServerSupabase()
  const { data: user } = await supabase.from('users').select('email_preferences').eq('id', userId).single()
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const updated = { ...DEFAULT_PREFERENCES, ...(user.email_preferences ?? {}), ...parsed.data }
  const { error } = await supabase.from('users').update({ email_preferences: updated }).eq('id', userId)
  if (error) {
    captureError(error, { route: 'PATCH /api/account/email-preferences' })
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }

  return NextResponse.json({ preferences: updated })
}
