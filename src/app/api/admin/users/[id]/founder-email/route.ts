import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/db'
import { captureError } from '@/lib/error-tracking'
import { logAdminAction, requireReason } from '@/lib/admin-action'
import type { FounderEmailKind } from '@/lib/founder-emails'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// Which founder email an account type gets.
const KIND_BY_USER_TYPE: Partial<Record<string, FounderEmailKind>> = {
  creator: 'creator_welcome',
}

const ContactedSchema = z.object({ contacted: z.boolean() })

function isAdmin(request: NextRequest): boolean {
  const role = request.headers.get('x-user-role')
  return role === 'admin' || role === 'super_admin'
}

function isMissingMigration(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return code === '42P01' || code === 'PGRST205' || code === '42703'
}

// GET /api/admin/users/[id]/founder-email — the account's founder email
// status for the admin drawers: queued/sent/skipped and when, plus the
// "contacted" flag.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const supabase = createServerSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, user_type, founder_contacted_at')
      .eq('id', params.id)
      .maybeSingle()
    if (error) {
      if (isMissingMigration(error)) {return NextResponse.json({ founderEmail: null, missing_table: true })}
      throw error
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const kind = KIND_BY_USER_TYPE[user.user_type] ?? null
    const { data: row, error: rowError } = kind
      ? await supabase
        .from('founder_emails')
        .select('kind, status, source, attempts, last_error, queued_at, sent_at')
        .eq('user_id', user.id)
        .eq('kind', kind)
        .maybeSingle()
      : { data: null, error: null }
    if (rowError) {
      if (isMissingMigration(rowError)) {return NextResponse.json({ founderEmail: null, missing_table: true })}
      throw rowError
    }

    return NextResponse.json({
      founderEmail: { kind, contacted_at: user.founder_contacted_at, row: row ?? null },
    })
  } catch (error) {
    captureError(error, { route: 'GET /api/admin/users/[id]/founder-email' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/users/[id]/founder-email — marks (or unmarks) the
// account as already contacted by the founder, which excludes it from the
// founder emails. Body: { contacted, reason }.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await request.json().catch(() => ({}))
    const reasonCheck = requireReason(body)
    if (!reasonCheck.ok) {
      return NextResponse.json({ error: reasonCheck.error }, { status: 400 })
    }
    const parsed = ContactedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const adminId = request.headers.get('x-user-id')
    const supabase = createServerSupabase()
    const { data: before } = await supabase.from('users').select('id, founder_contacted_at').eq('id', params.id).maybeSingle()
    if (!before) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const contactedAt = parsed.data.contacted ? before.founder_contacted_at ?? new Date().toISOString() : null
    const { error } = await supabase
      .from('users')
      .update({ founder_contacted_at: contactedAt, founder_contacted_by: parsed.data.contacted ? adminId : null })
      .eq('id', params.id)
    if (error) {
      if (isMissingMigration(error)) {
        return NextResponse.json({ error: 'Run supabase/founder_emails_migration.sql first' }, { status: 503 })
      }
      throw error
    }

    logAdminAction({
      request,
      adminId,
      action: parsed.data.contacted ? 'founder_contacted_marked' : 'founder_contacted_cleared',
      targetType: 'user',
      targetId: params.id,
      reason: reasonCheck.reason,
      before: { founder_contacted_at: before.founder_contacted_at },
      after: { founder_contacted_at: contactedAt },
    })

    return NextResponse.json({ message: 'Updated', contacted_at: contactedAt })
  } catch (error) {
    captureError(error, { route: 'PATCH /api/admin/users/[id]/founder-email' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
